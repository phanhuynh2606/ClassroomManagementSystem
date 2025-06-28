import React, { memo, useState, useCallback } from 'react';
import { Card, Avatar, Typography, Tag, Space, Input, Button, Dropdown, message, Modal } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  PaperClipOutlined, 
  SendOutlined,
  BellOutlined,
  BookOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  MoreOutlined,
  PushpinOutlined,
  EditOutlined,
  DeleteOutlined,
  CommentOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import 'react-quill/dist/quill.snow.css';
import CommentInput from './CommentInput';
import VideoPlayerModal from './VideoPlayerModal';
import VideoRefreshButton from './VideoRefreshButton';
import dayjs from 'dayjs';

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

  /* Google Classroom style comment input */
  .comment-input .ant-input {
    border: none !important;
    border-bottom: 1px solid #dadce0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 8px 0 !important;
    font-size: 14px !important;
  }
  
  .comment-input .ant-input:focus {
    border-bottom: 2px solid #4285f4 !important;
    box-shadow: none !important;
  }
  
  .comment-input .ant-input::placeholder {
    color: #5f6368 !important;
  }

  /* Comment bubble styling */
  .comment-bubble {
    background: #f8f9fa !important;
    border-radius: 18px !important;
    padding: 12px 16px !important;
    position: relative !important;
    transition: background-color 0.2s ease !important;
  }
  
  .comment-bubble:hover {
    background: #f1f3f4 !important;
  }

  /* Comment actions styling */
  .comment-actions {
    opacity: 0 !important;
    transition: opacity 0.2s ease !important;
  }
  
  .comment-item:hover .comment-actions {
    opacity: 1 !important;
  }
  
  /* Line clamp utility */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* Aspect ratio utility for older browsers */
  .aspect-video {
    aspect-ratio: 16 / 9;
  }
  
  @supports not (aspect-ratio: 16 / 9) {
    .aspect-video {
      position: relative;
      padding-bottom: 56.25%; /* 16:9 */
      height: 0;
    }
    .aspect-video > * {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }
`;

const StreamItem = ({ 
  item, 
  formatTimeAgo,
  onPin,
  onEdit,
  onDelete,
  onAddComment,
  onDeleteComment,
  userRole = 'teacher',
  currentUserId,
  classroomSettings = {},
  // New props for video tracking
  classroomId,
  streamItemId
}) => {
  const [submittingComment, setSubmittingComment] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [updatedAttachments, setUpdatedAttachments] = useState(null);
  const { user } = useSelector((state) => state.auth);
  // Check if current user can edit/delete this post
  const canEditDelete = useCallback(() => {
    return user?.role === 'admin' || 
           user?._id === item.author._id || 
           (user?.role === 'teacher' && (item.type === 'announcement' || item.type === 'student_post'));
  }, [user, item]);

  // Check if current user can pin posts
  const canPin = useCallback(() => {
    return user?.role === 'teacher' || user?.role === 'admin';
  }, [user]);


  const getType = useCallback(() => {
    if (item.type === 'announcement') {
      return 'Announcement';
    } else if (item.type === 'student_post') {
      return 'Student Post';
    } else if (item.type === 'assignment') {
      return 'Assignment';
    } else if (item.type === 'material') {
      return 'Material';
    } else if (item.type === 'activity') {
      return 'Activity';
    }
    return 'Post';
  }, [item]);

  const handleCommentSubmit = useCallback(async (content) => {
    // Check if commenting is allowed for students
    if (userRole === 'student' && classroomSettings.allowStudentComment === false) {
      message.warning('Comments are disabled by the teacher for this classroom');
      return;
    }

    // Check if onAddComment is null (means commenting not allowed)
    if (!onAddComment) {
      message.warning('You do not have permission to comment on this post');
      return;
    }

    setSubmittingComment(true);
    try {
      await onAddComment(item._id, content);
      message.success('Comment added successfully');
    } catch (error) {
      message.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  }, [onAddComment, item._id, userRole, classroomSettings]);

  const handleReplyComment = useCallback((commentId) => {
    // TODO: Implement reply functionality
    message.info('Reply functionality will be available soon');
  }, []);

  const handleEditComment = useCallback((commentId, currentContent) => {
    // TODO: Implement edit comment functionality
    message.info('Edit comment functionality will be available soon');
  }, []);

  const handleDeleteComment = useCallback((commentId) => {
    Modal.confirm({
      title: 'Delete Comment',
      content: 'Are you sure you want to delete this comment?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Call delete comment API
          if (onDeleteComment) {
            await onDeleteComment(item._id, commentId);
            message.success('Comment deleted successfully');
          }
        } catch (error) {
          console.error('Error deleting comment:', error);
          message.error('Failed to delete comment');
        }
      }
    });
  }, [item._id, onDeleteComment]);

  // Video modal handlers
  const handleVideoClick = useCallback((attachment) => {
    if (attachment.type === "video/youtube" || attachment.type === "video") {
      setSelectedVideo({
        title: attachment.name || attachment.title,
        embedUrl: attachment.metadata?.embedUrl || attachment.embedUrl,
        url: attachment.url,
        duration: attachment.duration,
        channel: attachment.channel,
        viewCount: attachment.viewCount,
        thumbnail: attachment.thumbnail,
        type: attachment.type, // Pass type to modal
        uploadedByUser: attachment.uploadedByUser,
        metadata: attachment.metadata
      });
      setVideoModalVisible(true);
    } else {
      // For non-video attachments, open normally
      window.open(attachment.url, '_blank');
    }
  }, []);

  const handleVideoModalClose = useCallback(() => {
    setVideoModalVisible(false);
    setSelectedVideo(null);
  }, []);

  // Handle duration update from refresh
  const handleDurationUpdate = useCallback((attachmentId, updatedVideoInfo) => {
    setUpdatedAttachments(prev => ({
      ...prev,
      [attachmentId]: {
        ...updatedVideoInfo,
        duration: updatedVideoInfo.duration,
        thumbnail: updatedVideoInfo.thumbnail,
        // Keep original attachment properties
        id: attachmentId,
        type: "video"
      }
    }));
    message.success(`Duration updated: ${updatedVideoInfo.duration}`);
  }, []);

  // Action menu items
  const actionMenuItems = [
    ...(canPin() ? [{
      key: 'pin',
      icon: <PushpinOutlined />,
      label: item.pinned ? 'Unpin' : 'Pin',
      onClick: () => onPin(item._id)
    }] : []),
    ...(canEditDelete() ? [{
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => onEdit(item._id)
    }] : []),
    ...(canEditDelete() ? [{
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: () => onDelete(item._id)
    }] : [])
  ];

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
      case 'student_post':
        return <MessageOutlined className="text-green-600" />;
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
      case 'student_post':
        return 'green';
      default:
        return 'blue';
    }
  };

  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow ${item.pinned ? 'border-l-4 border-l-yellow-400 bg-yellow-50' : ''}`}>
      <style>{htmlContentStyles}</style>
      <div className="flex gap-4">
        <Avatar 
          icon={item.author?.image ? undefined : <UserOutlined />}
          src={item?.author?.image}
          size={40}
        />
        
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-0">
            <div className="flex items-center gap-3">
              <Space>
                {item.pinned && <PushpinOutlined className="text-yellow-500" />}
                {getTypeIcon(item.type)}
                <Text strong className="text-gray-800">
                  {item.author.fullName || "Anonymous"}
                </Text>
                <Tag color={getTypeColor(item.type)} className="capitalize">
                  {getType(item.type)}
                </Tag>
              </Space>
            </div>
            <div className="flex items-center gap-2">
              <Text type="secondary" className="text-sm">
                {formatTimeAgo(item.createdAt)}
              </Text>
              {actionMenuItems.length > 0 && (
                <Dropdown
                  menu={{ items: actionMenuItems }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Button 
                    type="text" 
                    icon={<MoreOutlined />} 
                    size="small"
                    className="hover:bg-gray-100"
                  />
                </Dropdown>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mb-4">

              {item.createdAt &&(
              <div className="flex items-center gap-2 mr-3">
                  <Text type="secondary" className="text-sm" style={{marginRight: '2px',marginTop: '3px'}}>
                    <ClockCircleOutlined className="mr-1" />
                  {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
                </Text>
              </div>
              )}
            {item.title && (
              <Title level={4} className="mb-1 mt-1 text-gray-800" style={{marginBottom: '2px',marginTop: '3px'}}>
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

          {/* Attachments - Google Classroom Style */}
          {item.attachments && item.attachments.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {item.attachments.map((attachment, index) => {
                  // Use updated attachment data if available
                  const attachmentData = updatedAttachments?.[attachment.id] || attachment;
                  
                  return (
                  <div 
                    key={index}
                    className="relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleVideoClick(attachmentData)}
                  >
                    {attachmentData.type === "video/youtube" || attachmentData.type === "video" ? (
                      <>
                        {/* YouTube Video Card */}
                        <div className="relative aspect-video bg-black">
                          <img
                            src={attachmentData.thumbnail}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                            {attachmentData.duration}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              attachmentData.type === "video/youtube" 
                                ? "bg-red-600" 
                                : "bg-blue-600"
                            }`}>
                              {attachmentData.type === "video/youtube" ? (
                                <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                              ) : (
                                <span className="text-white text-xl">🎬</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Video type badge */}
                          <div className="absolute top-2 left-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              attachmentData.type === "video/youtube"
                                ? "bg-red-500 text-white"
                                : "bg-blue-500 text-white"
                            }`}>
                              {attachmentData.type === "video/youtube" ? "YouTube" : "Upload"}
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Text className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                                {attachmentData.name}
                              </Text>
                              <Text type="secondary" className="text-xs mt-1 block">
                                {attachmentData.type === "video/youtube" ? (
                                  <>
                                    <span className="text-red-500">📺</span> YouTube video • {attachmentData.duration}
                                  </>
                                ) : (
                                  <>
                                    <span className="text-blue-500">🎬</span> Uploaded video • {attachmentData.duration}
                                    {attachmentData.duration === "Processing..." && (
                                      <span className="text-orange-500"> (Processing...)</span>
                                    )}
                                  </>
                                )}
                              </Text>
                            </div>
                            {/* Show refresh button only for uploaded videos that are processing */}
                            {attachmentData.type === "video" && 
                             attachmentData.duration === "Processing..." && 
                             attachmentData.metadata?.youtubeVideoId && (
                              <VideoRefreshButton
                                videoId={attachmentData.metadata.youtubeVideoId}
                                onDurationUpdate={(updatedInfo) => handleDurationUpdate(attachmentData.id, updatedInfo)}
                                size="small"
                              />
                            )}
                          </div>
                        </div>
                      </>
                    ) : attachmentData.type === "link" ? (
                      <>
                        {/* Link Card */}
                        <div className="aspect-video bg-gray-100 flex items-center justify-center border-b">
                          <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                            <LinkOutlined className="text-white text-2xl" />
                          </div>
                        </div>
                        <div className="p-3">
                          <Text className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                            {attachmentData.title || attachmentData.name || "Link"}
                          </Text>
                          <Text type="secondary" className="text-xs mt-1 block truncate">
                            {attachmentData.url}
                          </Text>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* File Card */}
                        <div className="aspect-video bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center border-b">
                          <div className="text-center">
                            <PaperClipOutlined className="text-white text-3xl mb-2" />
                            <div className="text-white text-xs font-medium uppercase tracking-wide">
                              {attachmentData.name?.split('.').pop() || 'FILE'}
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <Text className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                            {attachmentData.name}
                          </Text>
                          <Text type="secondary" className="text-xs mt-1 block">
                            {attachmentData.size}
                          </Text>
                        </div>
                      </>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-4">
            {/* Comments count */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
              <CommentOutlined className="text-gray-600 text-base" />
              <Text className="text-sm font-medium text-gray-700">
                {item.commentsCount || 0} class comment{(item.commentsCount || 0) !== 1 ? 's' : ''}
              </Text>
            </div>

            {/* Existing Comments */}
            {item.comments && item.comments.length > 0 && (
              <div className="space-y-4 mb-4">
                {item.comments.map((comment) => (
                  <div key={comment.id || comment._id} className="flex gap-3 comment-item">
                    <Avatar 
                      size="default" 
                      icon={<UserOutlined />}
                      src={comment.author?.image || comment.authorImage}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="comment-bubble">
                        <div className="flex items-center gap-2 mb-2">
                          <Text strong className="text-sm font-medium text-gray-900">
                            {comment.author?.fullName || comment.authorName || "Anonymous"}
                          </Text>
                          <Text type="secondary" className="text-xs text-gray-500">
                            {formatTimeAgo(comment.createdAt)}
                          </Text>
                        </div>
                        <div 
                          className="text-sm text-gray-800 leading-relaxed html-content"
                          dangerouslySetInnerHTML={{ __html: comment.content }}
                        />
                      </div>
                      
                                             {/* Comment actions - show on hover */}
                       <div className="flex items-center gap-4 mt-2 ml-4 comment-actions">
                                                  <Button 
                           type="text" 
                           size="small"
                           className="text-xs font-medium text-gray-500 hover:text-blue-600 p-0 h-auto border-0 shadow-none"
                           onClick={() => handleReplyComment(comment.id || comment._id)}
                         >
                           Reply
                         </Button>
                         {(user?._id === comment.author?._id || user?.role === 'admin') && (
                           <>
                             <Button 
                               type="text" 
                               size="small"
                               className="text-xs font-medium text-gray-500 hover:text-blue-600 p-0 h-auto border-0 shadow-none"
                               onClick={() => handleEditComment(comment.id || comment._id, comment.content)}
                             >
                               Edit
                             </Button>
                             <Button 
                               type="text" 
                               size="small"
                               className="text-xs font-medium text-gray-500 hover:text-red-600 p-0 h-auto border-0 shadow-none"
                               onClick={() => handleDeleteComment(comment.id || comment._id)}
                             >
                               Delete
                             </Button>
                           </>
                         )}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Show more comments if needed */}
            {item.commentsCount > (item.comments?.length || 0) && (
              <div className="mt-4 text-center">
                <Button 
                  type="text" 
                  size="small"
                  className="text-blue-600 hover:text-blue-800 font-medium border-0 shadow-none"
                >
                  View {item.commentsCount - (item.comments?.length || 0)} more comment{item.commentsCount - (item.comments?.length || 0) > 1 ? 's' : ''}
                </Button>
              </div>
            )}

            {/* Add comment form - conditionally visible based on permissions */}
            <div className="mt-4">
              {userRole === 'student' && classroomSettings.allowStudentComment === false ? (
                // Show disabled state for students when comments are disabled
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <CommentOutlined />
                    <Text type="secondary" className="text-sm">
                      Comments are disabled by the teacher for this classroom
                    </Text>
                  </div>
                </div>
              ) : !onAddComment ? (
                // Show generic no permission message
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <CommentOutlined />
                    <Text type="secondary" className="text-sm">
                      You do not have permission to comment on this post
                    </Text>
                  </div>
                </div>
              ) : (
                // Show normal comment input
                <CommentInput
                  onSubmit={handleCommentSubmit}
                  loading={submittingComment}
                  placeholder="Add a class comment..."
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Video Player Modal */}
      <VideoPlayerModal
        visible={videoModalVisible}
        onCancel={handleVideoModalClose}
        videoData={selectedVideo}
        classroomId={classroomId}
        streamItemId={streamItemId || item._id}
      />
    </Card>
  );
};

export default memo(StreamItem); 