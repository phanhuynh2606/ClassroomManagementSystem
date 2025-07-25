import React from 'react';
import { List, Avatar, Typography, Badge, Empty, Spin } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

const { Text } = Typography;

const ChatList = ({ 
  chats, 
  selectedChat, 
  onChatSelect, 
  loading, 
  user 
}) => {
  
  const getChatDisplayName = (chat) => {
    if (!chat) return 'Conversation';
    
    if (chat.type === 'classroom') {
      return chat.classroom?.name || 'Classroom Chat';
    } else {
      // For private chats, show the other participant's name
      const otherParticipant = chat.participants?.find(p => p._id !== user._id);
      return otherParticipant?.fullName || otherParticipant?.email || 'Private Chat';
    }
  };

  const getChatAvatar = (chat) => {
    if (!chat) {
      return (
        <Avatar 
          size={40} 
          style={{ backgroundColor: '#999' }}
        >
          ?
        </Avatar>
      );
    }
    
    if (chat.type === 'classroom') {
      return (
        <Avatar 
          size={40} 
          style={{ backgroundColor: '#52c41a' }}
        >
          🏫
        </Avatar>
      );
    } else {
      const otherParticipant = chat.participants?.find(p => p._id !== user._id);
      const displayName = otherParticipant?.fullName || otherParticipant?.email || 'U';
      return (
        <Avatar 
          size={40} 
          src={otherParticipant?.image}
          style={{ backgroundColor: '#1890ff' }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Avatar>
      );
    }
  };

  const getLastMessagePreview = (chat) => {
    if (!chat || !chat.lastMessage) return 'No messages yet';
    
    const message = chat.lastMessage;
    if (!message) return 'No messages yet';
    
    const senderName = message.sender?._id === user._id ? 'You' : (message.sender?.fullName || message.sender?.email || 'User');
    const messageContent = message.content || '';
    
    // Remove unread text from preview - we'll show it separately
    if (message.type === 'text') {
      const truncatedContent = messageContent.length > 30 ? `${messageContent.substring(0, 30)}...` : messageContent;
      return `${senderName}: ${truncatedContent}`;
    } else if (message.type === 'file') {
      return `${senderName}: sent a file`;
    } else if (message.type === 'image') {
      return `${senderName}: sent an image`;
    } else {
      return `${senderName}: sent a message`;
    }
  };

  const getUnreadCount = (chat) => {
    return chat.unreadCount || 0;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {chats.length > 0 && (
          <>
            <div style={{ 
              padding: '8px 16px', 
              borderBottom: '1px solid #f0f0f0',
              backgroundColor: '#fafafa'
            }}>
              <Text strong style={{ fontSize: '12px', color: '#666' }}>
                Hội Thoại ({chats.length})
              </Text>
            </div>
            <List
              dataSource={chats}
              renderItem={(chat) => (
                <List.Item
                  key={chat._id}
                  onClick={() => onChatSelect(chat)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    backgroundColor: selectedChat?._id === chat._id ? '#e6f7ff' : 'transparent',
                    borderLeft: selectedChat?._id === chat._id ? '3px solid #1890ff' : '3px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                  className="chat-list-item"
                >
                  <List.Item.Meta
                    avatar={getChatAvatar(chat)}
                    title={
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%'
                      }}>
                        <Text strong style={{ 
                          fontSize: '14px',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginRight: '8px'
                        }}>
                          {getChatDisplayName(chat)}
                        </Text>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          flexShrink: 0
                        }}>
                          {chat.type === 'classroom' && (
                            <Badge 
                              count="Class"
                              style={{ 
                                backgroundColor: '#52c41a', 
                                fontSize: '9px',
                                borderRadius: '10px',
                                padding: '2px 6px',
                                lineHeight: '1.2'
                              }}
                            />
                          )}
                          {getUnreadCount(chat) > 0 && (
                            <Badge 
                              count={getUnreadCount(chat) > 99 ? '99+' : getUnreadCount(chat)}
                              style={{ 
                                backgroundColor: '#ff4d4f',
                                fontSize: '10px',
                                borderRadius: '10px',
                                minWidth: '18px',
                                height: '18px',
                                lineHeight: '18px',
                                padding: '0 6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            />
                          )}
                        </div>
                      </div>
                    }
                    description={
                      <div>
                        <Text 
                          style={{ 
                            fontSize: '12px', 
                            color: getUnreadCount(chat) > 0 ? '#1890ff' : '#666',
                            fontWeight: getUnreadCount(chat) > 0 ? '500' : 'normal',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px'
                          }}
                        >
                          {getLastMessagePreview(chat)}
                        </Text>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          {chat.lastMessageAt && (
                            <Text style={{ fontSize: '11px', color: '#999' }}>
                              {formatDistanceToNow(new Date(chat.lastMessageAt), { 
                                addSuffix: true,
                                locale: enUS
                              })}
                            </Text>
                          )}
                          {getUnreadCount(chat) > 0 && (
                            <Text style={{ 
                              fontSize: '11px', 
                              color: '#1890ff',
                              fontWeight: '600',
                              marginLeft: '8px'
                            }}>
                              {getUnreadCount(chat)} new message{getUnreadCount(chat) > 1 ? 's' : ''}
                            </Text>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="small" />
          </div>
        )}

        {/* Empty State */}
        {!loading && chats.length === 0 && (
          <Empty 
            description={
              <div style={{ textAlign: 'center' }}>
                <div>Chưa có hội thoại nào</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Bạn sẽ thấy các hội thoại ở đây khi có tin nhắn mới
                </div>
              </div>
            }
            style={{ marginBottom: '16px' }}
          />
        )}
      </div>
    </div>
  );
};

export default ChatList; 