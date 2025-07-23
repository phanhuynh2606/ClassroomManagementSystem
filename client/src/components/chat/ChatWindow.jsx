import React, { useState, useEffect, useRef } from 'react';
import { Layout, Input, Button, Avatar, List, Typography, Divider, Empty, Spin } from 'antd';
import { SendOutlined, SmileOutlined, PaperClipOutlined, MoreOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import chatAPI from '../../services/api/chat.api';
import io from 'socket.io-client';
import ChatList from './ChatList';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import useUnreadCount from '../../hooks/useUnreadCount';
import './ChatWindow.css';

const { Sider, Content } = Layout;
const { Text } = Typography;

const ChatWindow = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showChatList, setShowChatList] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const previousChatIdRef = useRef(null);
  const { user, token } = useSelector(state => state.auth);
  const { decreaseUnreadChatsCount, refreshUnreadChatsCount } = useUnreadCount();

  // Helper function to sort chats by latest message
  const sortChatsByLatestMessage = (chatsArray) => {
    return [...chatsArray].sort((a, b) => {
      const aTime = new Date(a.lastMessageAt || a.createdAt || 0);
      const bTime = new Date(b.lastMessageAt || b.createdAt || 0);
      return bTime - aTime; // Newest first
    });
  };

  // Helper function to check if sorting is needed
  const needsSorting = (chatsArray, updatedChatId) => {
    if (chatsArray.length <= 1) return false;
    
    // Find the position of the updated chat
    const updatedIndex = chatsArray.findIndex(c => c._id === updatedChatId);
    if (updatedIndex <= 0) return false; // Already at top or not found
    
    // Check if the updated chat should be at the top
    const updatedChat = chatsArray[updatedIndex];
    const topChat = chatsArray[0];
    
    const updatedTime = new Date(updatedChat.lastMessageAt || updatedChat.createdAt || 0);
    const topTime = new Date(topChat.lastMessageAt || topChat.createdAt || 0);
    
    return updatedTime > topTime;
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      if (!mobile) {
        setShowChatList(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (token && user._id) {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      
      console.log('🔌 Attempting to connect to socket server:', serverUrl);
      
      const newSocket = io(serverUrl, {
        auth: { token },
        query: { role: user.role }, // Add role to query params
        forceNew: true
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        if (error.message.includes('expired') || error.message.includes('Authentication error')) {
          console.log('🔄 Attempting to reconnect...');
          setTimeout(() => {
            newSocket.connect();
          }, 1000);
        }
      });

      // Add debugging for room events
      newSocket.on('joined-chat', (data) => {
        console.log('🚪✅ Successfully joined chat room:', data);
      });

      newSocket.on('left-chat', (data) => {
        console.log('🚪👋 Successfully left chat room:', data);
      });

      newSocket.on('room-error', (error) => {
        console.error('🚪❌ Room error:', error);
      });

      newSocket.on('new-message', async (message) => {
        console.log('📨 Received new message:', {
          messageId: message._id,
          chatId: message.chat,
          sender: message.sender?.fullName,
          senderRole: message.sender?.role,
          content: message.content?.substring(0, 50) + '...',
          selectedChatId: selectedChat?._id,
          isForCurrentChat: selectedChat && selectedChat._id === message.chat,
          chatType: selectedChat?.type,
          userRole: user.role
        });

        try {
          // Check if this message is for the currently selected chat
          const isCurrentChat = selectedChat && selectedChat._id === message.chat;
          
          // Always update messages if this message is for the current chat
          // This ensures real-time updates for admin-teacher, teacher-student, etc.
          if (isCurrentChat) {
            console.log('✅ Adding new message to current chat');
            
            // Update messages state with new message
            setMessages(prev => {
              // Skip if message already exists
              if (prev.some(m => m._id === message._id)) {
                console.log('⚠️ Message already exists, skipping');
                return prev;
              }

              // Add new message and sort by createdAt
              const updated = [...prev, message].sort((a, b) => 
                new Date(a.createdAt) - new Date(b.createdAt)
              );
              
              console.log(`📝 Updated messages array: ${updated.length} messages`);
              return updated;
            });

            // Auto mark as read for messages from others
            if (message.sender._id !== user._id) {
              console.log('👁️ Auto-marking message as read');
              try {
                await markMessageAsRead(message._id);
              } catch (error) {
                console.error('Error marking message as read:', error);
              }
            }

            // Scroll to bottom after adding new message
            setTimeout(() => {
              scrollToBottom();
              console.log('⬇️ Scrolled to bottom after new message');
            }, 100);
          } else {
            console.log('📬 Message for different chat, updating chat list only');
          }

          // Always update chat list to show latest message
          updateChatLastMessage(message);

          // If message is not from current user, update notifications
          if (message.sender._id !== user._id) {
            // Show notification if chat is not currently selected
            if (!selectedChat || selectedChat._id !== message.chat) {
              if (Notification.permission === 'granted') {
                const senderName = message.sender.fullName || message.sender.email || 'User';
                const notificationTitle = `New message from ${senderName}`;
                const notificationBody = message.type === 'text' 
                  ? (message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content)
                  : `Sent a ${message.type}`;

                new Notification(notificationTitle, {
                  body: notificationBody,
                  icon: '/logo.png',
                  tag: `chat-${message.chat}`,
                  requireInteraction: false
                });
              }

              // Update unread count
              setChats(prev => prev.map(chat => 
                chat._id === message.chat
                  ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 }
                  : chat
              ));
            }
          }

          // Refresh chat list to ensure correct ordering
          if (!selectedChat || selectedChat._id !== message.chat) {
            const chatResponse = await chatAPI.getUserChats();
            const sortedChats = sortChatsByLatestMessage(chatResponse.data.chats);
            setChats(sortedChats);
          }

        } catch (error) {
          console.error('Error processing new message:', error);
        }
        
        // Always update chat list for proper ordering and unread counts
        updateChatLastMessage(message);

        if (message.sender._id !== user._id) {
          console.log('📬 Processing incoming message from other user');
          // If user is currently in this chat, mark the message as read automatically
          if (selectedChat && selectedChat._id === message.chat) {
            console.log('👁️ Auto-marking message as read (user is in chat)');
            setTimeout(async () => {
              try {
                await chatAPI.markMessageAsRead(message._id);
              } catch (error) {
                console.error('Error auto-marking message as read:', error);
              }
            }, 500); // Small delay to ensure message is saved
          }

          if (Notification.permission === 'granted' && (!selectedChat || selectedChat._id !== message.chat)) {
            console.log('🔔 Showing browser notification');
            const senderName = message.sender.fullName || message.sender.email || 'User';
            const notificationTitle = `New message from ${senderName}`;
            
            let notificationBody = '';
            if (message.type === 'text') {
              notificationBody = message.content.length > 50 ? 
                `${message.content.substring(0, 50)}...` : 
                message.content;
            } else if (message.type === 'file') {
              notificationBody = 'Sent a file';
            } else if (message.type === 'image') {
              notificationBody = 'Sent an image';
            } else {
              notificationBody = 'Sent a message';
            }

            const notification = new Notification(notificationTitle, {
              body: notificationBody,
              icon: '/logo.png',
              tag: `chat-${message.chat}`,
              requireInteraction: false
            });

            notification.onclick = () => {
              window.focus();
              notification.close();
              if (!selectedChat || selectedChat._id !== message.chat) {
                const chatToSelect = chats.find(c => c._id === message.chat);
                if (chatToSelect) {
                  setSelectedChat(chatToSelect);
                }
              }
            };

            setTimeout(() => {
              notification.close();
            }, 5000);
          }

          setChats(prev => {
            const updated = prev.map(chat => 
              chat._id === message.chat 
                ? { 
                    ...chat, 
                    unreadCount: (!selectedChat || selectedChat._id !== message.chat) 
                      ? (chat.unreadCount || 0) + 1 
                      : chat.unreadCount 
                  }
                : chat
            );
            
            // Only sort if the updated chat needs to move to the top
            if (needsSorting(updated, message.chat)) {
              console.log('🔄 Sorting chats after new message');
              return sortChatsByLatestMessage(updated);
            }
            return updated;
          });
        } else {
          console.log('📤 Processing own message');
          // If it's my own message, check if sorting is needed
          setChats(prev => {
            if (needsSorting(prev, selectedChat?._id)) {
              console.log('🔄 Sorting chats after own message');
              return sortChatsByLatestMessage(prev);
            }
            return prev;
          });
        }
      });

      newSocket.on('message-reaction', ({ messageId, userId, emoji }) => {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, reactions: updateMessageReaction(msg.reactions, userId, emoji) }
            : msg
        ));
      });

      newSocket.on('user-typing-in-chat', ({ userId, userName, isTyping }) => {
        if (userId !== user._id) {
          setTypingUsers(prev => {
            if (isTyping) {
              const userObj = { id: userId, name: userName };
              return [...prev.filter(u => u.id !== userId), userObj];
            } else {
              return prev.filter(u => u.id !== userId);
            }
          });
        }
      });

      newSocket.on('message-read-update', ({ messageId, userId }) => {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, readBy: [...msg.readBy, { user: userId, readAt: new Date() }] }
            : msg
        ));
      });

      // Test event for debugging
      newSocket.on('test-message', (data) => {
        console.log('🧪 Received test message:', data);
      });

      setSocket(newSocket);

      return () => {
        console.log('🧹 Cleaning up socket connection');
        newSocket.close();
      };
    }
  }, [token, user._id]);

  useEffect(() => {
    fetchUserChats();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleChatChange = async () => {
      try {
        // Leave previous chat room if exists
        if (previousChatIdRef.current) {
          console.log(`👋 Leaving chat room: ${previousChatIdRef.current}`);
          socket.emit('leave-chat', previousChatIdRef.current);
          
          // Also leave classroom room if previous chat was a classroom chat
          const previousChat = chats.find(c => c._id === previousChatIdRef.current);
          if (previousChat?.type === 'classroom' && previousChat.classroom?._id) {
            const previousClassroomRoom = `classroom_${previousChat.classroom._id}`;
            console.log(`👋 Also leaving previous classroom room: ${previousClassroomRoom}`);
            socket.emit('leave-chat', previousClassroomRoom);
          }
        }

        // Handle new chat selection
        if (selectedChat) {
          console.log(`🚪 Joining chat room: ${selectedChat._id}, type: ${selectedChat.type}, userRole: ${user.role}`);
          console.log(`📋 Chat participants:`, selectedChat.participants?.map(p => ({ id: p._id, name: p.fullName, role: p.role })));
          
          // Join the main chat room - this is crucial for all chat communication
          socket.emit('join-chat', selectedChat._id);
          previousChatIdRef.current = selectedChat._id;
          
          console.log(`✅ Successfully joined main chat room: ${selectedChat._id}`);

          // For classroom chats, join additional classroom room for group messages
          if (selectedChat.type === 'classroom' && selectedChat.classroom?._id) {
            const classroomRoom = `classroom_${selectedChat.classroom._id}`;
            console.log(`🏫 Joining classroom room: ${classroomRoom} for classroom: ${selectedChat.classroom.name}`);
            socket.emit('join-chat', classroomRoom);
            console.log(`✅ Successfully joined classroom room: ${classroomRoom}`);
          }

          // Fetch initial messages
          console.log('📥 Fetching messages for new chat');
          await fetchChatMessages(selectedChat._id);
        } else {
          previousChatIdRef.current = null;
        }
      } catch (error) {
        console.error('Error handling chat change:', error);
      }
    };

    handleChatChange();

    // Cleanup: leave chat rooms when unmounting or changing chats
    return () => {
      if (previousChatIdRef.current) {
        console.log(`👋 Cleanup: leaving main chat room ${previousChatIdRef.current}`);
        socket.emit('leave-chat', previousChatIdRef.current);
        
        // Leave classroom room if applicable
        if (selectedChat?.type === 'classroom' && selectedChat.classroom?._id) {
          const classroomRoom = `classroom_${selectedChat.classroom._id}`;
          console.log(`👋 Cleanup: leaving classroom room ${classroomRoom}`);
          socket.emit('leave-chat', classroomRoom);
        }
      }
    };
  }, [selectedChat, socket]);

  // Auto mark as read and fetch messages when user is active in chat
  useEffect(() => {
    let markAsReadTimer;
    
    const updateChat = async () => {
      if (selectedChat) {
        try {
          // Fetch latest messages immediately when switching chats
          const latestMessages = await fetchChatMessages(selectedChat._id);
          if (latestMessages) {
            setMessages(latestMessages);
          }

          // Mark as read after a short delay
          markAsReadTimer = setTimeout(async () => {
            await markChatAsReadIfNeeded(selectedChat._id);
          }, 1000);
        } catch (error) {
          console.error('Error updating chat:', error);
        }
      }
    };

    updateChat();

    return () => {
      if (markAsReadTimer) {
        clearTimeout(markAsReadTimer);
      }
    };
  }, [selectedChat]); // Only re-run when selectedChat changes

  // Message read status management
  const markMessageAsRead = async (messageId) => {
    try {
      await chatAPI.markMessageAsRead(messageId);
      console.log(`✅ Marked message ${messageId} as read`);
    } catch (error) {
      console.error(`❌ Error marking message ${messageId} as read:`, error);
    }
  };

  useEffect(() => {
    if (!selectedChat || !messages.length || !user?._id) return;

    const checkAndMarkUnreadMessages = async () => {
      try {
        // Find unread messages not from current user
        const unreadMessages = messages.filter(msg => {
          if (!msg?.sender || msg.sender._id === user._id) return false;
          const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
          return !readBy.some(read => 
            read?.user && 
            (read.user === user._id || read.user.toString() === user._id)
          );
        });

        if (unreadMessages.length > 0) {
          console.log(`📬 Found ${unreadMessages.length} unread messages`);
          for (const msg of unreadMessages) {
            await markMessageAsRead(msg._id);
          }
        }
      } catch (error) {
        console.error('❌ Error processing unread messages:', error);
      }
    };

    const timer = setTimeout(checkAndMarkUnreadMessages, 1000);
    return () => clearTimeout(timer);
  }, [selectedChat?._id, messages, user?._id]);

  const fetchUserChats = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getUserChats();
      const sortedChats = sortChatsByLatestMessage(response.data.chats);
      setChats(sortedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (chatId) => {
    if (!chatId) return;
    
    try {
      setMessagesLoading(true);
      console.log(`📥 Fetching messages for chat ${chatId}`);
      
      const response = await chatAPI.getChatMessages(chatId);
      const sortedMessages = response.data.messages.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      setMessages(sortedMessages);
      console.log(`✅ Loaded ${sortedMessages.length} messages`);

      // Find messages that haven't been read by current user
      const unreadMessages = sortedMessages.filter(msg => 
        msg.sender._id !== user._id && 
        !(msg.readBy || []).some(read => 
          read?.user && (read.user === user._id || read.user.toString() === user._id)
        )
      );

      if (unreadMessages.length > 0) {
        console.log(`📬 Found ${unreadMessages.length} unread messages`);
        try {
          // Try to mark whole chat as read first
          await chatAPI.markChatAsRead(chatId);
          console.log('✅ Marked entire chat as read');
          
          // Update chat's unread count
          setChats(prev => prev.map(chat => 
            chat._id === chatId 
              ? { ...chat, unreadCount: 0 }
              : chat
          ));

          // Update global unread count if needed
          const currentChat = chats.find(c => c._id === chatId);
          if (currentChat?.unreadCount > 0) {
            decreaseUnreadChatsCount(1);
            setTimeout(refreshUnreadChatsCount, 200);
          }
        } catch (error) {
          console.error('Error marking chat as read, falling back to individual messages:', error);
          // Fall back to marking individual messages as read
          for (const message of unreadMessages) {
            try {
              await markMessageAsRead(message._id);
            } catch (markError) {
              console.error(`Error marking message ${message._id} as read:`, markError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (messageData) => {
    if (!selectedChat) return;

    try {
      console.log('📤 Sending message to chat:', selectedChat._id);
      const response = await chatAPI.sendMessage(selectedChat._id, messageData);
      
      // Update messages immediately with the new message
      if (response.data.message) {
        setMessages(prev => {
          const newMessage = response.data.message;
          // Skip if message somehow already exists
          if (prev.some(m => m._id === newMessage._id)) {
            return prev;
          }
          // Add new message and sort
          return [...prev, newMessage].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
        });

        // Scroll to bottom after sending
        setTimeout(scrollToBottom, 100);
      }
      
      // Mark chat as read
      await markChatAsReadIfNeeded(selectedChat._id);
    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to show an error notification to the user here
    }
  };

  // Helper function to mark chat as read if there are unread messages
  const markChatAsReadIfNeeded = async (chatId) => {
    try {
      const currentChat = chats.find(c => c._id === chatId);
      if (currentChat && (currentChat.unreadCount || 0) > 0) {
        await chatAPI.markChatAsRead(chatId);
        
        // Update local state
        setChats(prev => prev.map(chat => 
          chat._id === chatId 
            ? { ...chat, unreadCount: 0 }
            : chat
        ));

        decreaseUnreadChatsCount(1);
        
        setTimeout(() => {
          refreshUnreadChatsCount();
        }, 200);
      }
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const handleTyping = (isTyping) => {
    if (selectedChat && socket) {
      socket.emit('typing-in-chat', {
        chatId: selectedChat._id,
        isTyping
      });
    }
  };

  const updateChatLastMessage = (message) => {
    setChats(prev => {
      // Find existing chat
      const existingChat = prev.find(chat => chat._id === message.chat);
      if (!existingChat) return prev;

      // Update chat with new message
      const updated = prev.map(chat => 
        chat._id === message.chat 
          ? { 
              ...chat, 
              lastMessage: {
                ...message,
                sender: message.sender
              }, 
              lastMessageAt: message.createdAt,
              // Update unread count for messages from others
              unreadCount: message.sender._id !== user._id && 
                          (!selectedChat || selectedChat._id !== message.chat)
                          ? (chat.unreadCount || 0) + 1 
                          : chat.unreadCount 
            }
          : chat
      );
      
      // Sort chats if needed
      return needsSorting(updated, message.chat) 
        ? sortChatsByLatestMessage(updated) 
        : updated;
    });

    // Refresh unread count after a short delay
    if (message.sender._id !== user._id) {
      setTimeout(() => {
        refreshUnreadChatsCount();
      }, 200);
    }
  };

  const updateMessageReaction = (reactions, userId, emoji) => {
    const existingReaction = reactions.find(r => r.user === userId);
    if (existingReaction) {
      return reactions.map(r => 
        r.user === userId ? { ...r, emoji } : r
      );
    } else {
      return [...reactions, { user: userId, emoji }];
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChatDisplayName = (chat) => {
    if (!chat) return 'Unknown Chat';
    
    if (chat.type === 'classroom') {
      return chat.classroom?.name || 'Classroom Chat';
    } else {
      const otherParticipant = chat.participants?.find(p => p._id !== user._id);
      return otherParticipant?.fullName || otherParticipant?.email || 'Private Chat';
    }
  };

    const handleChatSelect = async (chat) => {
      setSelectedChat(chat);
      if (isMobile) {
        setShowChatList(false);
      }
      
      // Room joining is handled by handleChatChange useEffect
      // No need for special admin logic here
    };  const handleBackToList = () => {
    setShowChatList(true);
    if (isMobile) {
      setSelectedChat(null);
    }
  };

  return (
    <div className="chat-window">
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ 
          width: '300px', 
          backgroundColor: '#fff',
          borderRight: '1px solid #f0f0f0',
          height: '100%',
          overflow: 'hidden',
          display: showChatList ? 'block' : 'none'
        }}>
          <div style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
            <Text strong style={{ fontSize: '18px', marginLeft: '16px' }}>
              💬 Chat
            </Text>
          </div>
          <ChatList 
            chats={chats}
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
            loading={loading}
            user={user}
          />
        </div>

        <div style={{ 
          flex: 1, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#fff',
          width: showChatList ? 'calc(100% - 300px)' : '100%'
        }}>
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Button 
                    type="text" 
                    onClick={handleBackToList}
                    style={{ 
                      marginRight: '8px',
                      display: isMobile ? 'inline-block' : 'none'
                    }}
                  >
                    ←
                  </Button>
                  <Avatar 
                    size={40} 
                    style={{ backgroundColor: '#1890ff', marginRight: '12px' }}
                  >
                    {selectedChat.type === 'classroom' ? '🏫' : '👤'}
                  </Avatar>
                  <div>
                    <Text strong style={{ fontSize: '16px' }}>
                      {getChatDisplayName(selectedChat)}
                    </Text>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {selectedChat.type === 'classroom' 
                        ? `${selectedChat.members?.filter(m => m?.isActive).length || selectedChat.participants?.length || 0} members`
                        : 'Private chat'
                      }
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button 
                    type="text" 
                    size="small"
                    onClick={() => {
                      if (socket) {
                        console.log('🧪 Sending test message...');
                        socket.emit('test-message', { message: 'Test from client', timestamp: Date.now() });
                      } else {
                        console.log('❌ No socket connection');
                      }
                    }}
                  >
                    Test
                  </Button>
                  <Button 
                    type="text" 
                    onClick={() => setShowChatList(!showChatList)}
                    style={{ 
                      display: !isMobile ? 'inline-block' : 'none'
                    }}
                  >
                    {showChatList ? '📋' : '💬'}
                  </Button>
                  <Button type="text" icon={<MoreOutlined />} />
                </div>
              </div>

              <div className="messages-area">
                {messagesLoading ? (
                  <div className="chat-loading">
                    <Spin size="large" />
                  </div>
                ) : messages.length === 0 ? (
                  <Empty 
                    description="No messages yet"
                    style={{ marginTop: '50px' }}
                  />
                ) : (
                  <div>
                    {messages.map((message, index) => {
                      const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id;
                      const isConsecutive = index > 0 && messages[index - 1].sender._id === message.sender._id;
                      
                      return (
                      <MessageItem 
                        key={message._id}
                        message={message}
                        isOwn={message.sender._id === user._id}
                          showAvatar={showAvatar}
                          isConsecutive={isConsecutive}
                        user={user}
                        onReaction={(emoji) => chatAPI.addReaction(message._id, emoji)}
                      />
                      );
                    })}
                    <TypingIndicator typingUsers={typingUsers} />
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="message-input-area">
                <MessageInput 
                  onSendMessage={handleSendMessage}
                  onTyping={handleTyping}
                  disabled={messagesLoading}
                />
              </div>
            </>
          ) : (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <Empty 
                description="Select a conversation to start chatting"
                style={{ fontSize: '16px' }}
              />
              {!showChatList && (
                <Button 
                  type="primary" 
                  onClick={() => setShowChatList(true)}
                  style={{ marginTop: '16px' }}
                >
                  Show chat list
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow; 