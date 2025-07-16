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
        forceNew: true
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully:', newSocket.id);
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

      newSocket.on('new-message', (message) => {
        console.log('📨 Received new message:', {
          messageId: message._id,
          chatId: message.chat,
          sender: message.sender?.fullName,
          content: message.content?.substring(0, 50) + '...',
          selectedChatId: selectedChat?._id,
          isForCurrentChat: selectedChat && selectedChat._id === message.chat
        });
        
        // Only add message to current chat's messages if it belongs to the selected chat
        if (selectedChat && selectedChat._id === message.chat) {
          console.log('✅ Adding message to current chat messages');
          setMessages(prev => [...prev, message]);
        } else {
          console.log('ℹ️ Message is for different chat, updating chat list only');
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
    if (selectedChat && socket) {
      // Leave previous chat room if there was one
      if (previousChatIdRef.current && previousChatIdRef.current !== selectedChat._id) {
        socket.emit('leave-chat', previousChatIdRef.current);
      }
      
      // Join new chat room
      socket.emit('join-chat', selectedChat._id);
      previousChatIdRef.current = selectedChat._id;
      
      fetchChatMessages(selectedChat._id);
    }

    // Cleanup function to leave chat room when component unmounts or selectedChat changes
    return () => {
      if (socket && previousChatIdRef.current) {
        socket.emit('leave-chat', previousChatIdRef.current);
      }
    };
  }, [selectedChat, socket]);

  // Auto mark as read when user is active in chat with unread messages
  useEffect(() => {
    let markAsReadTimer;
    
    if (selectedChat) {
      // Mark as read after a short delay when user enters a chat with unread messages
      markAsReadTimer = setTimeout(async () => {
        await markChatAsReadIfNeeded(selectedChat._id);
      }, 1000); // 1 second delay to ensure user is actively viewing
    }

    return () => {
      if (markAsReadTimer) {
        clearTimeout(markAsReadTimer);
      }
    };
  }, [selectedChat, chats]); // Re-run when selectedChat or chats change

  // Mark messages as read when user scrolls to bottom or is actively viewing
  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      const unreadMessages = messages.filter(msg => 
        msg.sender._id !== user._id && 
        !msg.readBy.some(read => read.user === user._id)
      );

      if (unreadMessages.length > 0) {
        // Mark recent unread messages as read with a delay
        const markTimer = setTimeout(async () => {
          for (const message of unreadMessages.slice(-3)) { // Mark last 3 unread messages
            try {
              await chatAPI.markMessageAsRead(message._id);
            } catch (error) {
              console.error('Error marking message as read:', error);
            }
          }
        }, 2000); // 2 second delay

        return () => clearTimeout(markTimer);
      }
    }
  }, [messages, selectedChat, user._id]);

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
    try {
      setMessagesLoading(true);
      const response = await chatAPI.getChatMessages(chatId);
      setMessages(response.data.messages);

      const unreadMessages = response.data.messages.filter(msg => 
        msg.sender._id !== user._id && 
        !msg.readBy.some(read => read.user === user._id)
      );

      if (unreadMessages.length > 0) {
        try {
          await chatAPI.markChatAsRead(chatId);
          
          // Update unread count without re-sorting since we're not changing lastMessageAt
          setChats(prev => prev.map(chat => 
            chat._id === chatId 
              ? { ...chat, unreadCount: 0 }
              : chat
          ));

          const currentChat = chats.find(c => c._id === chatId);
          if (currentChat && (currentChat.unreadCount || 0) > 0) {
            decreaseUnreadChatsCount(1);
          }

          setTimeout(() => {
            refreshUnreadChatsCount();
          }, 200);
          
        } catch (error) {
          for (const message of unreadMessages) {
            try {
              await chatAPI.markMessageAsRead(message._id);
            } catch (markError) {
              console.error('Error marking message as read:', markError);
            }
          }
        }

        // Remove this line that causes chat list to reload
        // setTimeout(() => {
        //   fetchUserChats();
        // }, 300);
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
      await chatAPI.sendMessage(selectedChat._id, messageData);
      
      // Mark chat as read when sending a message (since user is actively in the chat)
      await markChatAsReadIfNeeded(selectedChat._id);
    } catch (error) {
      console.error('Error sending message:', error);
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
      const updated = prev.map(chat => 
        chat._id === message.chat 
          ? { 
              ...chat, 
              lastMessage: {
                ...message,
                sender: message.sender
              }, 
              lastMessageAt: message.createdAt 
            }
          : chat
      );
      
      // Only sort if the updated chat needs to move to the top
      if (needsSorting(updated, message.chat)) {
        return sortChatsByLatestMessage(updated);
      }
      return updated;
    });
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

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    if (isMobile) {
      setShowChatList(false);
    }
  };

  const handleBackToList = () => {
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