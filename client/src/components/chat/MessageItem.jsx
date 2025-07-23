import React, { useState, useEffect } from 'react';
import { Avatar, Typography, Button, Dropdown, Menu } from 'antd';
import { SmileOutlined, EyeOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

const { Text } = Typography;

const MessageItem = ({ message, isOwn, showAvatar, user, onReaction, isConsecutive = false }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const formatMessageTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true,
        locale: enUS
      });
    } catch (error) {
      return '';
    }
  };

  const getMessageStyle = () => {
    if (isOwn) {
      return {
        backgroundColor: '#1890ff',
        color: 'white',
        marginLeft: 'auto',
        marginRight: '0px',
        borderRadius: '18px 18px 4px 18px',
        maxWidth: '100%'
      };
    } else {
      return {
        backgroundColor: 'white',
        color: '#333',
        marginLeft: '0px',
        marginRight: 'auto',
        borderRadius: '18px 18px 18px 4px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        maxWidth: '100%'
      };
    }
  };

  const handleReaction = (emoji) => {
    onReaction(emoji);
    setShowReactions(false);
  };

  const reactionMenu = (
    <Menu>
      <Menu.Item onClick={() => handleReaction('👍')}>👍</Menu.Item>
      <Menu.Item onClick={() => handleReaction('❤️')}>❤️</Menu.Item>
      <Menu.Item onClick={() => handleReaction('😂')}>😂</Menu.Item>
      <Menu.Item onClick={() => handleReaction('😮')}>😮</Menu.Item>
      <Menu.Item onClick={() => handleReaction('😢')}>😢</Menu.Item>
      <Menu.Item onClick={() => handleReaction('😡')}>😡</Menu.Item>
    </Menu>
  );



  return (
    <div 
      className={`message-item ${isConsecutive ? 'same-sender' : 'different-sender'}`}
      style={{ 
      display: 'flex', 
      flexDirection: isOwn ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
        marginBottom: isConsecutive ? '4px' : '12px',
        padding: '0 12px',
        width: '100%'
    }}>
      {/* Avatar for other users */}
      {!isOwn && (
      <div style={{ 
        width: '40px', 
        display: 'flex', 
          justifyContent: 'center',
          marginRight: '8px',
          flexShrink: 0
      }}>
          {showAvatar && (
          <Avatar 
            size={32} 
            src={message.sender?.image}
            style={{ backgroundColor: '#1890ff' }}
          >
            {message.sender?.fullName?.charAt(0).toUpperCase()}
          </Avatar>
        )}
      </div>
      )}

      {/* Message Content */}
      <div style={{ 
        maxWidth: isOwn ? '75%' : 'calc(100% - 48px)', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start',
        width: '100%'
      }}>
        {/* Sender Name and Time */}
        {showAvatar && !isOwn && (
          <div style={{ 
            marginBottom: '4px', 
            marginLeft: '0px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Text style={{ 
              fontSize: '12px', 
              fontWeight: 'bold',
              color: '#666'
            }}>
              {message.sender?.fullName}
            </Text>
            <Text style={{ 
              fontSize: '11px', 
              color: '#999'
            }}>
              {formatMessageTime(message.createdAt)}
            </Text>
          </div>
        )}

        {/* Message Bubble */}
        <div
          style={{
            ...getMessageStyle(),
            padding: '8px 12px',
            maxWidth: '100%',
            wordBreak: 'break-word',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={() => {
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              setHoverTimeout(null);
            }
            setShowReactions(true);
          }}
          onMouseLeave={() => {
            const timeout = setTimeout(() => {
              setShowReactions(false);
            }, 200);
            setHoverTimeout(timeout);
          }}
        >
          {/* Message Content */}
          <div style={{ flex: 1 }}>
            {message.type === 'text' && (
              <Text style={{ color: isOwn ? 'white' : '#333' }}>
                {message.content}
              </Text>
            )}
            
            {message.type === 'file' && (
              <div>
                <Text style={{ color: isOwn ? 'white' : '#333' }}>
                  📎 {message.file?.name || 'File attachment'}
                </Text>
              </div>
            )}
            
            {message.type === 'image' && (
              <div>
                <img 
                  src={message.file?.url} 
                  alt="Image" 
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '200px',
                    borderRadius: '8px'
                  }}
                />
              </div>
            )}

            {message.type === 'system' && (
              <Text style={{ 
                color: '#666',
                fontStyle: 'italic',
                fontSize: '12px'
              }}>
                {message.content}
              </Text>
            )}
          </div>

          {/* Message Actions */}
          {showReactions && (
            <div 
              style={{ 
              position: 'absolute',
              right: isOwn ? 'auto' : '-30px',
              left: isOwn ? '-30px' : 'auto',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10
              }}
              onMouseEnter={() => {
                if (hoverTimeout) {
                  clearTimeout(hoverTimeout);
                  setHoverTimeout(null);
                }
                setShowReactions(true);
              }}
              onMouseLeave={() => {
                const timeout = setTimeout(() => {
                  setShowReactions(false);
                }, 200);
                setHoverTimeout(timeout);
              }}
            >
                <Dropdown overlay={reactionMenu} trigger={['click']}>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<SmileOutlined />}
                    style={{ 
                      backgroundColor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #d9d9d9'
                    }}
                  />
                </Dropdown>
            </div>
          )}
        </div>

        {/* Message Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div style={{ 
            display: 'flex', 
            gap: '4px', 
            marginTop: '4px',
            marginLeft: '0px',
            marginRight: '0px',
            justifyContent: isOwn ? 'flex-end' : 'flex-start'
          }}>
            {message.reactions.map((reaction, index) => (
              <span 
                key={index}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '12px',
                  padding: '2px 6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                {reaction.emoji}
                <Text style={{ fontSize: '10px', color: '#666' }}>
                  {reaction.count || 1}
                </Text>
              </span>
            ))}
          </div>
        )}

        {/* Time for own messages */}
        {isOwn && (
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '2px',
            marginRight: '0px',
            justifyContent: 'flex-end'
          }}>
            <Text style={{ 
              fontSize: '11px', 
              color: '#999'
            }}>
              {formatMessageTime(message.createdAt)}
            </Text>
            {message.readBy && message.readBy.length > 0 && (
              <EyeOutlined style={{ fontSize: '10px', color: '#999' }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem; 