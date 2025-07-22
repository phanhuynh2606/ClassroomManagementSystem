import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useSelector(state => state.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    // Create socket connection
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    const newSocket = io(serverUrl, {
      auth: { token },
      forceNew: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error);
      setIsConnected(false);
      
      // Handle token-related errors
      if (error.message.includes('expired') || error.message.includes('Authentication')) {
        console.log('🔄 Token expired, may need to refresh');
        // You can emit a custom event here if needed
        window.dispatchEvent(new CustomEvent('socketAuthError'));
      }
    });

    // Handle token refresh from server
    newSocket.on('token:refresh', ({ token: newToken }) => {
      console.log('🔄 Received new token from server');
      localStorage.setItem('token', newToken);
      // Update socket auth
      newSocket.auth.token = newToken;
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.removeAllListeners();
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
      socketRef.current = null;
    };
  }, [user, token]);

  return {
    socket,
    isConnected
  };
};

export default useSocket; 