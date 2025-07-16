import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { getValidToken, logTokenStatus, clearExpiredToken } from '../utils/tokenUtils';

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { token, user } = useSelector(state => state.auth);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (socket) {
      console.log('🧹 Cleaning up socket connection');
      socket.removeAllListeners();
      socket.close();
      setSocket(null);
      setConnected(false);
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
  }, [socket]);

  // Connect to socket
  const connect = useCallback(() => {
    // Clear any expired tokens first
    clearExpiredToken();
    
    // Get valid token
    const currentToken = getValidToken();
    
    if (!currentToken || !user) {
      console.log('❌ No valid token or user available for socket connection');
      logTokenStatus('🔍');
      return;
    }

    // Log token status before connecting
    logTokenStatus('🔄 Before socket connection');

    // Cleanup existing connection
    cleanup();

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    console.log('🔄 Creating new socket connection with fresh valid token');
    
    const newSocket = io(serverUrl, {
      auth: { token: currentToken },
      forceNew: true,
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully:', newSocket.id);
      setConnected(true);
      reconnectAttempts.current = 0; // Reset attempts on successful connection
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
      
      // Only attempt reconnection for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        attemptReconnection();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
      setConnected(false);
      
      // Handle different types of errors
      if (error.message.includes('expired') || error.message.includes('Authentication error') || error.message.includes('JWT')) {
        console.log('🔄 JWT authentication failed, waiting for token refresh...');
        // Don't reconnect immediately for auth errors - wait for token refresh
        scheduleReconnection(2000); // Wait 2 seconds for token refresh
      } else {
        attemptReconnection();
      }
    });

    setSocket(newSocket);
    return newSocket;
  }, [user, cleanup]);

  // Attempt reconnection with exponential backoff
  const attemptReconnection = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Max 30 seconds
    reconnectAttempts.current++;
    
    console.log(`🔄 Attempting reconnection ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms`);
    
    scheduleReconnection(delay);
  }, []);

  // Schedule reconnection
  const scheduleReconnection = useCallback((delay) => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    reconnectTimeout.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  // Force reconnection (useful when token is refreshed)
  const forceReconnect = useCallback(() => {
    console.log('🔄 Force reconnecting socket with fresh token');
    reconnectAttempts.current = 0; // Reset attempts
    connect();
  }, [connect]);

  // Initialize socket connection
  useEffect(() => {
    const currentToken = getValidToken();
    if (currentToken && user) {
      connect();
    } else {
      console.log('🚫 Not connecting socket - no valid token or user');
      logTokenStatus('🚫');
      cleanup();
    }

    return cleanup;
  }, [user, connect, cleanup]);

  // Also listen for token changes in Redux store as fallback
  useEffect(() => {
    if (token && user && !connected) {
      // Only reconnect if we have token but not connected
      const currentToken = getValidToken();
      if (currentToken && currentToken !== token) {
        console.log('🔄 Token mismatch detected, reconnecting...');
        logTokenStatus('🔄 Before mismatch reconnect');
        connect();
      }
    }
  }, [token, user, connected, connect]);

  // Listen for token refresh events from axios interceptor
  useEffect(() => {
    const handleTokenRefresh = () => {
      console.log('🔄 Token refreshed, reconnecting socket...');
      // Small delay to ensure token is updated in Redux store
      setTimeout(() => {
        forceReconnect();
      }, 100);
    };

    // Listen for custom token refresh event
    window.addEventListener('tokenRefreshed', handleTokenRefresh);

    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefresh);
    };
  }, [forceReconnect]);

  return {
    socket,
    connected,
    forceReconnect,
    cleanup
  };
};

export default useSocket; 