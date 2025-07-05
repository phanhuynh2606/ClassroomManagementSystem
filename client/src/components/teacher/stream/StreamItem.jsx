import React, { memo, useState, useCallback } from 'react';
import { Card, Avatar, Typography, Tag, Space, Input, Button, Dropdown, message, Modal, Tooltip } from 'antd';
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
  LinkOutlined,
  TrophyOutlined,
  YoutubeFilled,
  DownloadOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import CommentInput from './CommentInput';
import VideoPlayerModal from './VideoPlayerModal';
import VideoRefreshButton from './VideoRefreshButton';
import dayjs from 'dayjs';
import { formatFileSize, downloadStreamAttachment, getBrowserInfo } from '../../../utils/fileUtils';
import { MdAttachFile } from 'react-icons/md';
import { fixVietnameseEncoding } from '../../../utils/convertStr';
import { HtmlContent } from '../../common';

const { Text, Title } = Typography;

// CSS styles for non-HTML content (keeping only the styles specific to StreamItem)
const streamItemStyles = `
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
    margin-left: 10px!important;
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
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const { user, token } = useSelector((state) => state.auth);
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

  // Enhanced attachment click handler with secure download
  const handleAttachmentClick = useCallback(async (attachment, index) => {
    if (attachment.type === "video/youtube" || attachment.type === "video") {
      // Handle video attachments
      setSelectedVideo({
        title: attachment.name || attachment.title,
        embedUrl: attachment.metadata?.embedUrl || attachment.embedUrl,
        url: attachment.url,
        duration: attachment.duration,
        channel: attachment.channel,
        viewCount: attachment.viewCount,
        thumbnail: attachment.thumbnail,
        type: attachment.type,
        uploadedByUser: attachment.uploadedByUser,
        metadata: attachment.metadata
      });
      setVideoModalVisible(true);
    } else if (attachment.type === "link") {
      // Handle link attachments
      window.open(attachment.url, '_blank', 'noopener,noreferrer');
    } else {
      // Handle file attachments with secure download using utility function
      const fileId = `${item._id}-${index}`;
      
      if (downloadingFiles.has(fileId)) {
        message.warning('Download already in progress...');
        return;
      }

      setDownloadingFiles(prev => new Set(prev).add(fileId));

      try {
        await downloadStreamAttachment(
          item._id,
          index,
          attachment.name,
          attachment
        );
      } catch (error) {
        // Error handling is done by the utility function
        message.error('Download failed');
        console.error('Download failed:', error);
      } finally {
        setDownloadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }
  }, [item._id, token, downloadingFiles]);

  // Update the legacy handleVideoClick to use new handler
  const handleVideoClick = useCallback((attachment) => {
    const index = item.attachments.findIndex(att => att === attachment);
    handleAttachmentClick(attachment, index);
  }, [item.attachments, handleAttachmentClick]);

  // Video modal handlers
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

  // Get download tooltip for file attachments
  const getDownloadTooltip = useCallback((attachment, index) => {
    const fileId = `${item._id}-${index}`;
    const isDownloading = downloadingFiles.has(fileId);
    const { browserName, isModernBrowser } = getBrowserInfo();
    
    if (isDownloading) {
      return 'Downloading...';
    }
    
    if (!isModernBrowser) {
      return `Your browser (${browserName}) has limited download support. File might open in a new tab instead of downloading.`;
    }
    
    if (browserName === 'Edge') {
      return `✅ Edge - Will download directly to your Downloads folder`;
    }
    
    return `✅ ${browserName} - Will download directly to your Downloads folder`;
  }, [item._id, downloadingFiles]);

  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow ${item.pinned ? 'border-l-4 border-l-yellow-400 bg-yellow-50' : ''}`}>
      <style>{streamItemStyles}</style>
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
          <div className="mb-4 overflow-hidden">

              {item.createdAt &&(
              <div className="flex items-center gap-2 mr-3">
                  <Text type="secondary" className="text-sm" style={{marginRight: '2px',marginTop: '3px'}}>
                    <ClockCircleOutlined className="mr-1" />
                  {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
                </Text>
              </div>
              )}
            {item.title && (
              <HtmlContent 
              content={item.content}
              className="text-gray-700"
              ellipsis={true}
              maxLines={100}
            />
            )}

            
            {/* Assignment specific info */}
            {item.type === 'assignment' && (
              <div className="mt-3 p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    {item.dueDate && (
                      <Text className="text-red-700">
                        <CalendarOutlined className="mr-2" />
                        Due: {new Date(item.dueDate).toLocaleString()}
                      </Text>
                    )}
                                         {item.totalPoints && (
                       <Text className="text-red-700">
                         <TrophyOutlined className="mr-2" />
                         {item.totalPoints} points
                       </Text>
                     )}
                  </div>
                  <Button 
                    type="primary"
                    size="small"
                    onClick={() => {
                      if (userRole === 'student') {
                        window.open(`/student/classrooms/${classroomId}/assignments/${item.resourceId}`, '_blank');
                      } else {
                        window.open(`/teacher/classroom/${classroomId}/assignment/${item.resourceId}`, '_blank');
                      }
                    }}
                  >
                    {userRole === 'student' ? 'View Assignment' : 'Manage'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Attachments - Google Classroom Style with Secure Download */}
          {item.attachments && item.attachments.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {item.attachments.map((attachment, index) => {
                  // Use updated attachment data if available
                  const attachmentData = updatedAttachments?.[attachment.id] || attachment;
                  const fileId = `${item._id}-${index}`;
                  const isDownloading = downloadingFiles.has(fileId);
                  
                  return (
                  <Tooltip
                    key={index}
                    title={attachmentData.type === 'file' ? getDownloadTooltip(attachmentData, index) : undefined}
                    placement="top"
                  >
                    <div 
                      className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                        isDownloading ? 'opacity-75 cursor-wait' : 'cursor-pointer'
                      }`}
                      onClick={() => !isDownloading && handleAttachmentClick(attachmentData, index)}
                    >
                      {attachmentData.type === "video/youtube" || attachmentData.type === "video" ? (
                        <>
                          {/* YouTube Video Card */}
                          <div className="relative h-16 bg-black">
                            <img
                              src={attachmentData.thumbnail}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                              {attachmentData.duration}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                attachmentData.type === "video/youtube" 
                                  ? "bg-red-600" 
                                  : "bg-blue-600"
                              }`}>
                                {attachmentData.type === "video/youtube" ? (
                                  <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1"></div>
                                ) : (
                                  <span className="text-white text-sm">🎬</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Video type badge */}
                            <div className="absolute top-1 left-1">
                              <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                                attachmentData.type === "video/youtube"
                                  ? "bg-red-500 text-white"
                                  : "bg-blue-500 text-white"
                              }`}>
                                {attachmentData.type === "video/youtube" ? "YT" : "UP"}
                              </span>
                            </div>
                          </div>
                          <div className="p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <Text className="text-xs font-medium text-gray-900 line-clamp-1 leading-tight">
                                  {attachmentData.name}
                                </Text>
                                <Text type="secondary" className="text-xs mt-1 block">
                                  {attachmentData.type === "video/youtube" ? (
                                    <> <YoutubeFilled className="mr-1 text-red-500" color="red"/> {attachmentData.duration}</>
                                  ) : (
                                    <>🎬 {attachmentData.duration}</>
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
                          <div className="h-20 bg-gray-100 flex items-center justify-center border-b">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                              <LinkOutlined className="text-white text-lg" />
                            </div>
                          </div>
                          <div className="p-2">
                            <Text className="text-xs font-medium text-gray-900 line-clamp-1 leading-tight">
                              {attachmentData.title || attachmentData.name || "Link"}
                            </Text>
                            <Text type="secondary" className="text-xs mt-1 block truncate">
                              {attachmentData.url}
                            </Text>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* File Card with Secure Download */}
                          <div className="h-20 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center border-b relative">
                            <div className="text-center">
                              <PaperClipOutlined className="text-white text-xl mb-1" />
                              <div className="text-white text-xs font-medium uppercase tracking-wide">
                                {fixVietnameseEncoding(attachmentData.name?.split('.').pop()) || 'FILE'}
                              </div>
                            </div>
                            
                            {/* Download indicator */}
                            {isDownloading && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                            
                            {/* Download icon overlay */}
                            {!isDownloading && (
                              <div className="absolute top-1 right-1">
                                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                  <DownloadOutlined className="text-white text-xs" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <Text className="text-xs font-medium text-gray-900 line-clamp-1 leading-tight">
                              {fixVietnameseEncoding(attachmentData.name)}
                            </Text>
                            <Text type="secondary" className="text-xs mt-1 flex items-center gap-1">
                              <MdAttachFile/> {formatFileSize(null, attachmentData)}
                              {isDownloading && <span className="text-blue-600">Downloading...</span>}
                            </Text>
                          </div>
                        </>
                      )}
                    </div>
                  </Tooltip>
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
                        <HtmlContent 
                          content={comment.content}
                          className="text-sm text-gray-800 leading-relaxed"
                        />
                      </div>
                      
                      {/* Comment actions - show on hover */}
                      <div className="flex items-center gap-4 mt-0 mb-0 comment-actions">
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