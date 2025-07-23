import React, { useState, useRef } from 'react';
import { Input, Button, Space } from 'antd';
import { SendOutlined, SmileOutlined } from '@ant-design/icons';
import EmojiPicker from 'emoji-picker-react';
import './MessageInput.css';

const { TextArea } = Input;

const MessageInput = ({ onSendMessage, onTyping, disabled }) => {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageText(value);
    
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (messageText.trim() === '') return;

    const messageData = {
      content: messageText.trim(),
      type: 'text'
    };

    onSendMessage(messageData);
    
    setMessageText('');
    setIsTyping(false);
    onTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };



  return (
    <div style={{ 
      backgroundColor: '#f8f9fa',
      borderTop: '2px solid #e8e8e8',
      padding: '16px',
      position: 'relative',
      boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)'
    }}>
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: '20px',
          zIndex: 1000,
          marginBottom: '8px'
        }}>
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}



      {/* Message Input */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <TextArea
            ref={inputRef}
            value={messageText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={disabled}
            style={{
              resize: 'none',
              borderRadius: '22px',
              paddingRight: '16px',
              paddingLeft: '16px',
              paddingTop: '12px',
              paddingBottom: '12px',
              fontSize: '15px',
              lineHeight: '1.4',
              border: '2px solid #e1e5e9',
              backgroundColor: '#ffffff',
              color: '#333',
              transition: 'all 0.2s ease',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
            className="message-input-textarea"
          />
        </div>
        
        <Space size="middle">
          {/* Emoji Picker Button */}
          <Button 
            type="text" 
            icon={<SmileOutlined />}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            style={{ 
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: '#666',
              backgroundColor: '#f5f5f5',
              border: '1px solid #e1e5e9',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e9ecef';
              e.target.style.color = '#495057';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f5f5f5';
              e.target.style.color = '#666';
            }}
          />

          {/* Send Button */}
          <Button 
            type="primary" 
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={disabled || messageText.trim() === ''}
            style={{ 
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              backgroundColor: '#1890ff',
              borderColor: '#1890ff',
              boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)',
              transition: 'all 0.2s ease'
            }}
          />
        </Space>
      </div>
    </div>
  );
};

export default MessageInput; 