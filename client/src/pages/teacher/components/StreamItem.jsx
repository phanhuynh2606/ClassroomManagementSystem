import React, { memo } from 'react';
import { Card, Avatar, Typography, Tag, Space, Input } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  PaperClipOutlined, 
  SendOutlined,
  BellOutlined,
  BookOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  MessageOutlined
} from '@ant-design/icons';
import 'react-quill/dist/quill.snow.css';

const { Text, Title } = Typography;

// CSS styles for HTML content
const htmlContentStyles = `
  .html-content * {
    font-family: inherit !important;
  }
  .html-content h1, .html-content h2, .html-content h3 {
    margin: 16px 0 8px 0 !important;
    font-weight: 600 !important;
    color: #262626 !important;
    line-height: 1.4 !important;
  }
  .html-content h1 { font-size: 24px !important; }
  .html-content h2 { font-size: 20px !important; }
  .html-content h3 { font-size: 16px !important; }
  .html-content p {
    margin: 8px 0 !important;
    line-height: 1.6 !important;
    color: inherit !important;
  }
  .html-content strong {
    font-weight: 600 !important;
  }
  .html-content em {
    font-style: italic !important;
  }
  .html-content u {
    text-decoration: underline !important;
  }
  
  /* ReactQuill List Styles */
  .html-content ol, .html-content ul {
    padding-left: 1.5em !important;
    margin: 8px 0 !important;
  }
  
  .html-content li {
    display: list-item !important;
    margin: 4px 0 !important;
    line-height: 1.6 !important;
    padding-left: 0.2em !important;
  }
  
  /* ReactQuill specific list handling */
  .html-content li[data-list="bullet"] {
    list-style-type: disc !important;
  }
  
  .html-content li[data-list="ordered"] {
    list-style-type: decimal !important;
  }
  
  .html-content li[data-list="bullet"]:before {
    content: none !important;
  }
  
  .html-content li[data-list="ordered"]:before {
    content: none !important;
  }
  
  // /* For regular ul/ol tags */
  // .html-content ul li {
  //   list-style-type: disc !important;
  // }
  
  // .html-content ol li {
  //   list-style-type: decimal !important;
  // }
  
  .html-content a {
    color: #1890ff !important;
    text-decoration: none !important;
  }
  .html-content a:hover {
    text-decoration: underline !important;
  }
  .html-content blockquote {
    margin: 16px 0 !important;
    padding: 12px 16px !important;
    background: #f6f6f6 !important;
    border-left: 4px solid #d9d9d9 !important;
    font-style: italic !important;
  }
  .html-content code {
    background: #f6f6f6 !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
    font-family: 'Courier New', monospace !important;
  }
  .html-content .ql-align-center {
    text-align: center !important;
  }
  .html-content .ql-align-right {
    text-align: right !important;
  }
  .html-content .ql-align-justify {
    text-align: justify !important;
  }
  .html-content .ql-indent-1 {
    margin-left: 3em !important;
  }
  .html-content .ql-indent-2 {
    margin-left: 6em !important;
  }
  .html-content .ql-indent-3 {
    margin-left: 9em !important;
  }
  .html-content .ql-font-serif {
    font-family: Georgia, serif !important;
  }
  .html-content .ql-font-monospace {
    font-family: 'Courier New', monospace !important;
  }
  .html-content .ql-size-small {
    font-size: 0.75em !important;
  }
  .html-content .ql-size-large {
    font-size: 1.5em !important;
  }
  .html-content .ql-size-huge {
    font-size: 2.5em !important;
  }
  /* Support for warning/error colors */
  .html-content .ql-color-red {
    color: #e74c3c !important;
  }
  .html-content .ql-color-orange {
    color: #f39c12 !important;
  }
  .html-content .ql-color-yellow {
    color: #f1c40f !important;
  }
  .html-content .ql-color-green {
    color: #27ae60 !important;
  }
  .html-content .ql-color-blue {
    color: #3498db !important;
  }
  .html-content .ql-bg-red {
    background-color: #ffebee !important;
  }
  .html-content .ql-bg-yellow {
    background-color: #fff9c4 !important;
  }
`;

const StreamItem = ({ item, formatTimeAgo }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'announcement':
        return <BellOutlined className="text-blue-500" />;
      case 'assignment':
        return <BookOutlined className="text-red-500" />;
      case 'material':
        return <FileTextOutlined className="text-green-500" />;
      case 'activity':
        return <ClockCircleOutlined className="text-gray-500" />;
      default:
        return <MessageOutlined className="text-blue-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'announcement':
        return 'blue';
      case 'assignment':
        return 'red';
      case 'material':
        return 'green';
      case 'activity':
        return 'default';
      default:
        return 'blue';
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <style>{htmlContentStyles}</style>
      <div className="flex gap-4">
        <Avatar 
          icon={item.author.avatar ? undefined : <UserOutlined />}
          src={item.author.avatar}
          size={40}
        />
        
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Space>
                {getTypeIcon(item.type)}
                <Text strong className="text-gray-800">
                  {item.author.name}
                </Text>
                <Tag color={getTypeColor(item.type)} className="capitalize">
                  {item.type}
                </Tag>
              </Space>
            </div>
            <Text type="secondary" className="text-sm">
              {formatTimeAgo(item.createdAt)}
            </Text>
          </div>

          {/* Content */}
          <div className="mb-4">
            {item.title && (
              <Title level={4} className="mb-2 text-gray-800">
                {item.title}
              </Title>
            )}
            {item.content && (
              <div 
                className="text-gray-700 html-content ql-editor"
                dangerouslySetInnerHTML={{ __html: item.content }}
                style={{ 
                  fontSize: '16px',
                  lineHeight: '1.6',
                  whiteSpace: 'normal',
                  border: 'none',
                  padding: 0
                }}
              />
            )}
            
            {/* Due date for assignments */}
            {item.type === 'assignment' && item.dueDate && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                <Text className="text-red-700">
                  <CalendarOutlined className="mr-2" />
                  Due: {new Date(item.dueDate).toLocaleString()}
                </Text>
              </div>
            )}
          </div>

          {/* Attachments */}
          {item.attachments && item.attachments.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {item.attachments.map((attachment, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100"
                  >
                    <PaperClipOutlined className="text-gray-500" />
                    <div>
                      <Text className="text-sm font-medium">
                        {attachment.name}
                      </Text>
                      <br />
                      <Text type="secondary" className="text-xs">
                        {attachment.size}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {item.comments && item.comments.length > 0 && (
            <div className="border-t pt-4">
              <Text type="secondary" className="text-sm mb-3 block">
                {item.comments.length} comment{item.comments.length > 1 ? 's' : ''}
              </Text>
              
              <div className="space-y-3">
                {item.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar size="small" icon={<UserOutlined />} />
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <Text strong className="text-sm">
                          {comment.author}
                        </Text>
                        <br />
                        <Text className="text-sm">
                          {comment.content}
                        </Text>
                      </div>
                      <Text type="secondary" className="text-xs mt-1">
                        {formatTimeAgo(comment.createdAt)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add comment */}
              <div className="flex gap-3 mt-4">
                <Avatar size="small" icon={<UserOutlined />} />
                <Input 
                  placeholder="Add a comment..."
                  className="flex-1"
                  suffix={<SendOutlined className="text-gray-400 cursor-pointer hover:text-blue-500" />}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default memo(StreamItem); 