import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { message, notification as antdNotification } from 'antd';

// Initial state
const initialState = {
  notifications: [],
  loading: false,
  error: null,
  page: 1,
  hasMore: true
};

// Actions
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  ADD_NOTIFICATIONS: 'ADD_NOTIFICATIONS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_PAGE: 'SET_PAGE',
  SET_HAS_MORE: 'SET_HAS_MORE'
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_NOTIFICATIONS:
      return { 
        ...state, 
        notifications: action.payload,
        loading: false,
        error: null
      };
    
    case ACTIONS.ADD_NOTIFICATION:
      // Add new notification to the beginning of the list
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
    
    case ACTIONS.ADD_NOTIFICATIONS:
      // Add more notifications (for pagination)
      return {
        ...state,
        notifications: [...state.notifications, ...action.payload],
        loading: false
      };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ACTIONS.SET_PAGE:
      return { ...state, page: action.payload };
    
    case ACTIONS.SET_HAS_MORE:
      return { ...state, hasMore: action.payload };
    
    default:
      return state;
  }
};

// Create contexts
const NotificationContext = createContext();
const NotificationDispatchContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { socket } = useSocket();

  // Listen for new notifications from socket
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (data) => {
        const { notification } = data;
        
        // Add notification to state
        dispatch({
          type: ACTIONS.ADD_NOTIFICATION,
          payload: notification
        });

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.content.length > 100 
              ? `${notification.content.substring(0, 100)}...`
              : notification.content,
            icon: '/logo.png',
            tag: `notification-${notification._id}`,
            requireInteraction: false
          });
        }

        // Show Ant Design notification
        const notificationType = notification.priority === 'urgent' ? 'error' : 
                                notification.priority === 'high' ? 'warning' : 'info';
        
        antdNotification[notificationType]({
          message: notification.title,
          description: notification.content.length > 150 
            ? `${notification.content.substring(0, 150)}...`
            : notification.content,
          placement: 'topRight',
          duration: 6,
        });
      };

      socket.on('newNotification', handleNewNotification);

      return () => {
        socket.off('newNotification', handleNewNotification);
      };
    }
  }, [socket]);

  // Context value
  const value = {
    notifications: state.notifications,
    loading: state.loading,
    error: state.error,
    page: state.page,
    hasMore: state.hasMore,

    // Actions
    setNotifications: (notifications) => {
      dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: notifications });
    },

    addNotification: (notification) => {
      dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification });
    },

    addNotifications: (notifications) => {
      dispatch({ type: ACTIONS.ADD_NOTIFICATIONS, payload: notifications });
    },

    setLoading: (loading) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
    },

    setError: (error) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error });
    },

    clearError: () => {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    },

    setPage: (page) => {
      dispatch({ type: ACTIONS.SET_PAGE, payload: page });
    },

    setHasMore: (hasMore) => {
      dispatch({ type: ACTIONS.SET_HAS_MORE, payload: hasMore });
    }
  };

  return (
    <NotificationContext.Provider value={value}>
      <NotificationDispatchContext.Provider value={dispatch}>
        {children}
      </NotificationDispatchContext.Provider>
    </NotificationContext.Provider>
  );
};

// Custom hooks
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const useNotificationDispatch = () => {
  const context = useContext(NotificationDispatchContext);
  if (!context) {
    throw new Error('useNotificationDispatch must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext; 