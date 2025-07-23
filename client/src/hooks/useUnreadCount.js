import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import chatAPI from '../services/api/chat.api';
import io from 'socket.io-client';

const useUnreadCount = () => {
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const { user, token } = useSelector(state => state.auth);
  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);

  const fetchUnreadChatsCount = useCallback(async () => {
    if (!user || !token) return;
    
    try {
      const response = await chatAPI.getUserChats();
      const chats = response.data.chats;
      const unreadChatsCount = chats.filter(chat => (chat.unreadCount || 0) > 0).length;
      setUnreadChatsCount(unreadChatsCount);
    } catch (error) {
      console.error('Error fetching unread chats count:', error);
    }
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;

    fetchUnreadChatsCount();

    if (!socketRef.current && !isConnectedRef.current) {
      socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        isConnectedRef.current = true;
        fetchUnreadChatsCount();
      });

      socketRef.current.on('disconnect', () => {
        isConnectedRef.current = false;
      });

      socketRef.current.on('new-message', (message) => {
        if (message.sender._id !== user._id) {
          setTimeout(() => {
            fetchUnreadChatsCount();
          }, 100);
        }
      });

      socketRef.current.on('message-read-update', (data) => {
        fetchUnreadChatsCount();
      });

      socketRef.current.on('chat-opened', (data) => {
        fetchUnreadChatsCount();
      });

      socketRef.current.on('unread-count-update', (data) => {
        if (data.userId === user._id) {
          setUnreadChatsCount(data.unreadChatsCount || 0);
        }
      });

      socketRef.current.on('chat-marked-as-read', (data) => {
        if (data.unreadChatsCount !== undefined) {
          setUnreadChatsCount(data.unreadChatsCount);
        }
        setTimeout(() => {
          fetchUnreadChatsCount();
        }, 100);
      });
    }

    return () => {
      // Don't close socket on every effect cleanup, only on component unmount
    };
  }, [user, token, fetchUnreadChatsCount]);

  // Cleanup socket on component unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        isConnectedRef.current = false;
      }
    };
  }, []);

  const decreaseUnreadChatsCount = useCallback((amount = 1) => {
    setUnreadChatsCount(prev => {
      const newCount = Math.max(0, prev - amount);
      return newCount;
    });
  }, []);

  const resetUnreadChatsCount = useCallback(() => {
    setUnreadChatsCount(0);
  }, []);

  const refreshUnreadChatsCount = useCallback(() => {
    fetchUnreadChatsCount();
  }, [fetchUnreadChatsCount]);

  return {
    unreadChatsCount,
    decreaseUnreadChatsCount,
    resetUnreadChatsCount,
    refreshUnreadChatsCount,
    // Backward compatibility
    totalUnreadCount: unreadChatsCount,
    decreaseUnreadCount: decreaseUnreadChatsCount,
    resetUnreadCount: resetUnreadChatsCount,
    refreshUnreadCount: refreshUnreadChatsCount
  };
};

export default useUnreadCount; 