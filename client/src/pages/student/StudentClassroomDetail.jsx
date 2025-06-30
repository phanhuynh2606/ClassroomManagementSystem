// StudentClassroomDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  message,
  Spin,
  List,
  Tag,
  Space,
  Popconfirm,
  Tabs,
  Timeline,
  Badge,
  Empty,
  Tooltip,
  Avatar,
  Form
} from 'antd';
import { useSelector } from 'react-redux';
import {
  BookOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  NotificationOutlined,
  CalendarOutlined,
  TrophyOutlined,
  DownloadOutlined,
  LinkOutlined,
  FilePdfOutlined,
  FileExclamationOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import classroomAPI from '../../services/api/classroom.api';
import streamAPI from '../../services/api/stream.api';
import StudentAssignmentList from '../student/StudentAssignmentList';
import StudentQuizList from '../student/StudentQuizList';
import {
  StreamHeader,
  StreamItem,
  StreamSidebar,
  StreamEmptyState,
  AnnouncementEditor,
} from '../../components/teacher/stream';
import ClassroomPermissionStatus from '../../components/student/ClassroomPermissionStatus';

const { Title, Text } = Typography;

const StudentClassroomDetail = () => {  
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [classroom, setClassroom] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const location = useLocation();
  const [streamPosts, setStreamPosts] = useState([]);
  const [streamLoading, setStreamLoading] = useState(false);
  
  // Pagination state
  const [streamPagination, setStreamPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [loadingMoreStream, setLoadingMoreStream] = useState(false);
  
  // AnnouncementEditor states
  const [showEditor, setShowEditor] = useState(false);
  const [richTextContent, setRichTextContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('all_students');
  const [attachments, setAttachments] = useState([]);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [announcementForm] = Form.useForm();
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
  }, [location.hash]);
  useEffect(() => {
    if (classroomId) {
      fetchClassroomDetails();
    }
  }, [classroomId]);

  const fetchClassroomDetails = async () => {
    setLoading(true);
    try {
      const classroomResponse = await classroomAPI.getDetail(classroomId);
      const classData = classroomResponse.data.data || classroomResponse.data;

      classData.upcomingEvents = classData.upcomingEvents?.length > 0 ? classData.upcomingEvents : [
        {
          id: 'event1',
          title: 'Quiz: Functions & Loops',
          type: 'quiz',
          dueDate: new Date(Date.now() + 2 * 86400000),
        }
      ];

      setClassroom(classData);

      try {
        const materialsResponse = await classroomAPI.getMaterials(classroomId);
        setMaterials(materialsResponse.data.data || materialsResponse.data || []);
      } catch (error) {
        console.log('Cannot fetch materials:', error);
      }
    } catch (error) {
      message.error('Failed to fetch classroom details');
      navigate('/student/classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClassroom = async () => {
    try {
      await classroomAPI.leaveClassroom(classroomId);
      message.success(`Successfully left ${classroom.name}`);
      navigate('/student/classrooms');
    } catch (error) {
      message.error('Failed to leave classroom');
    }
  };

  // Fetch stream posts data
  const fetchStreamData = async (page = 1, append = false) => {
    if (!classroomId) return;
    
    if (!append) setStreamLoading(true);
    
    try {
      const response = await streamAPI.getClassroomStream(classroomId, {
        page: page,
        limit: 20,
      });
      
      // Handle different response structures
      let data, items, pagination;
      if (response.success || response.data) {
        data = response.data?.data || response.data;
        items = data?.items || data || [];
        pagination = data?.pagination || {
          currentPage: page,
          totalPages: 1,
          totalItems: items.length,
          itemsPerPage: 20
        };
      } else {
        items = [];
        pagination = {
          currentPage: page,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 20
        };
      }
      
      // Extra safety check - if not array, make it empty array
      if (!Array.isArray(items)) {
        console.warn('Stream data is not an array:', items);
        items = [];
      }
      
      if (append) {
        // Append new items for Load More
        setStreamPosts(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return [...prevArray, ...items];
        });
      } else {
        // Replace items for initial load
        setStreamPosts(items);
      }
      
      setStreamPagination(pagination);
    } catch (error) {
      console.error('Error fetching stream data:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Always ensure streamPosts is an array
      if (!append) {
        setStreamPosts([]);
      }
      
      // Only show error message if it's not a 404 (empty stream)
      if (error.response?.status !== 404) {
        message.error(`Failed to load classroom stream: ${error.message}`);
      }
    } finally {
      if (!append) setStreamLoading(false);
    }
  };

  const handleLoadMoreStream = async () => {
    if (streamPagination.currentPage >= streamPagination.totalPages) return;
    
    setLoadingMoreStream(true);
    try {
      await fetchStreamData(streamPagination.currentPage + 1, true);
    } catch (error) {
      console.error("Error loading more stream data:", error);
      message.error("Failed to load more posts");
    } finally {
      setLoadingMoreStream(false);
    }
  };

  useEffect(() => {
    if (classroomId) {
      fetchStreamData();
    }
  }, [classroomId]);

  const formatTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  };

  const handleCopyClassCode = () => {
    navigator.clipboard.writeText(classroom?.code || 'pc5z4c4l');
    message.success('Class code copied!');
  };

  // Check if students can comment based on classroom settings
  const canStudentComment = () => {
    return classroom?.settings?.allowStudentComment !== false; // Default to true if not specified
  };

  // Check if students can post based on classroom settings  
  const canStudentPost = () => {
    return classroom?.settings?.allowStudentPost === true; // Default to false for posts
  };

  // Handle adding comments (students can comment if allowed)
  const handleAddComment = async (postId, commentText) => {
    // Check permission first
    if (!canStudentComment()) {
      message.warning('Comments are disabled by the teacher for this classroom');
      return;
    }

    try {
      
      // Call API to add comment
      const response = await streamAPI.addComment(postId, commentText);
      const newComment = response.data?.data || response.data;
      
      
      // Update local state with the new comment from server
      setStreamPosts(prevPosts => {
        // Ensure prevPosts is an array
        if (!Array.isArray(prevPosts)) {
          console.warn('prevPosts is not an array:', prevPosts);
          return [];
        }
        
        return prevPosts.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                comments: [...(post.comments || []), newComment],
                commentsCount: (post.commentsCount || 0) + 1 
              }
            : post
        );
      });

      message.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error('Failed to add comment. Please try again.');
    }
  };

  // Students cannot edit/delete posts or pin them
  const handlePin = () => {
    message.info('Only teachers and admins can pin posts');
  };
  
  const handleEdit = () => {
    message.info('Only teachers and admins can edit posts');
  };
  
  const handleDelete = () => {
    message.info('Only teachers and admins can delete posts');
  };

  // Handle delete comment (students can delete their own comments)
  const handleDeleteComment = async (postId, commentId) => {
    try {
      
      await streamAPI.deleteComment(postId, commentId);
      
      // Update local state
      setStreamPosts(prevPosts => {
        // Ensure prevPosts is an array
        if (!Array.isArray(prevPosts)) {
          console.warn('prevPosts is not an array:', prevPosts);
          return [];
        }
        
        return prevPosts.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                comments: (post.comments || []).filter(comment => comment._id !== commentId),
                commentsCount: Math.max((post.commentsCount || 0) - 1, 0)
              }
            : post
        );
      });

      message.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      message.error('Failed to delete comment. Please try again.');
    }
  };

  // Handle student post creation
  const handlePostAnnouncement = async (values) => {
    if (!canStudentPost()) {
      message.warning('Posts are disabled by the teacher for this classroom');
      return;
    }

    // Strip HTML to check for actual text content
    const stripHtml = (html) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };
    
    const plainContent = stripHtml(richTextContent);
    
    if (!plainContent.trim() && attachments.length === 0) {
      message.warning('Please enter some content or add attachments');
      return;
    }

    setPostingAnnouncement(true);
    try {
      // Extract title from content
      const title = plainContent.length > 50 
        ? plainContent.substring(0, 50) + '...' 
        : plainContent || 'Student Post';

      const postData = {
        title: title,
        content: richTextContent,
        description: plainContent.substring(0, 200), // Add description
        classroomId: classroomId,
        targetAudience: 'all_students', // Students can only post to all
        attachments: attachments,
        type: 'student_post',
        category: 'post', // Add category
        visibility: 'classroom' // Add visibility
      };
      
      // Use createAnnouncement for now (backend will differentiate by type)
      const response = await streamAPI.createAnnouncement(classroomId, postData);
      
      // Handle different response structures
      if (response.data?.success || response.success || response.status === 200 || response.status === 201) {
        const newPost = response.data?.data || response.data;
        
        // Add new post to the beginning of the stream
        if (newPost) {
          // Ensure the post has required fields for display
          const postToAdd = {
            _id: newPost._id || Date.now().toString(),
            content: newPost.content || richTextContent,
            author: newPost.author || {
              _id: user?._id || 'unknown',
              fullName: user?.fullName || 'Student',
              image: user?.image || null
            },
            attachments: newPost.attachments || attachments,
            type: 'student_post',
            createdAt: newPost.createdAt || new Date().toISOString(),
            comments: newPost.comments || [],
            commentsCount: newPost.commentsCount || 0,
            ...newPost
          };
          
          setStreamPosts(prevPosts => {
            const postsArray = Array.isArray(prevPosts) ? prevPosts : [];
            return [postToAdd, ...postsArray];
          });
        } else {
          console.warn('No post data returned from API');
        }

        // Reset editor state
        setShowEditor(false);
        setRichTextContent('');
        setAttachments([]);
        announcementForm.resetFields();
        
        message.success('Your post has been shared successfully!');
      } else {
        throw new Error(response.data?.message || response.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating student post:', error);
      message.error('Failed to share your post. Please try again.');
    } finally {
      setPostingAnnouncement(false);
    }
  };
  const renderTabLabel = (icon, label) => <Space>{icon} {label}</Space>;
  
  const tabItems = useMemo(() => {
    if (!classroom) return [];

    return [
      {
        key: 'overview',
        label: renderTabLabel(<BookOutlined />, 'Overview'),
        children: (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={24}>
              <StreamHeader classData={classroom} userRole="student" />

              <div className="p-4">
                <Row gutter={24}>
                  <Col xs={24} md={16}>
                    <div className="space-y-6">
                      {/* Student Editor - Only show if students can post */}
                      {canStudentPost() && (
                        <AnnouncementEditor
                          showEditor={showEditor}
                          setShowEditor={setShowEditor}
                          richTextContent={richTextContent}
                          setRichTextContent={setRichTextContent}
                          targetAudience={targetAudience}
                          setTargetAudience={setTargetAudience}
                          attachments={attachments}
                          setAttachments={setAttachments}
                          handlePostAnnouncement={handlePostAnnouncement}
                          postingAnnouncement={postingAnnouncement}
                          announcementForm={announcementForm}
                          userRole="student"
                          classroomPermissions={{
                            canPost: canStudentPost(),
                            canComment: canStudentComment()
                          }}
                        />
                      )}

                      {/* Stream Posts */}
                      {streamLoading ? (
                        <div className="flex justify-center items-center py-12">
                          <Spin size="large" tip="Loading classroom stream..." />
                        </div>
                      ) : !Array.isArray(streamPosts) || streamPosts.length === 0 ? (
                        <StreamEmptyState />
                      ) : (
                        <div className="space-y-4">
                          {streamPosts.map((item) => (
                            <StreamItem
                              key={item._id || item.id}
                              item={item}
                              formatTimeAgo={formatTimeAgo}
                              onPin={handlePin}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onAddComment={canStudentComment() ? handleAddComment : null}
                              onDeleteComment={handleDeleteComment}
                              userRole="student"
                              currentUserId={user?._id}
                              classroomSettings={{
                                allowStudentComment: canStudentComment(),
                                allowStudentPost: canStudentPost()
                              }}
                              classroomId={classroomId}
                              streamItemId={item._id}
                            />
                          ))}
                          
                          {/* Load More Button */}
                          {streamPagination.currentPage < streamPagination.totalPages && (
                            <div className="text-center mt-6">
                              <Button
                                type="default"
                                size="large"
                                loading={loadingMoreStream}
                                onClick={handleLoadMoreStream}
                                className="px-8 py-2 h-auto"
                              >
                                {loadingMoreStream ? 'Loading more posts...' : `Load More Posts (${streamPagination.totalItems - streamPosts.length} remaining)`}
                              </Button>
                            </div>
                          )}
                          
                          {/* Pagination Info */}
                          {streamPagination.totalItems > 0 && (
                            <div className="text-center mt-4 text-gray-500 text-sm">
                              Showing {streamPosts.length} of {streamPagination.totalItems} posts
                              {streamPagination.totalPages > 1 && (
                                <span> • Page {streamPagination.currentPage} of {streamPagination.totalPages}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Col>

                  <Col xs={24} md={8}>
                    {/* Show permission status for students */}
                    <ClassroomPermissionStatus 
                      classroom={classroom} 
                      compact={false}
                    />
                    
                    <StreamSidebar
                      classData={classroom}
                      handleCopyClassCode={handleCopyClassCode}
                      upcoming={classroom.upcomingEvents}
                      userRole="student"
                    />
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        )
      },
      {
        key: 'materials',
        label: <Space><FileTextOutlined /> Materials <Badge count={materials.length} size="small" /></Space>,
        children: (
          <Row gutter={[24, 24]}>
            <Col span={24}>
              {materials.length > 0 ? (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                  dataSource={materials}
                  renderItem={(material) => (
                    <List.Item>
                      <Card
                        hoverable
                        actions={[<Tooltip title="Download"><Button icon={<DownloadOutlined />} onClick={() => message.info('Download coming soon!')} /></Tooltip>]}
                      >
                        <Card.Meta
                          avatar={<Avatar icon={material.type === 'document' ? <FilePdfOutlined /> : material.type === 'presentation' ? <FileExclamationOutlined /> : <LinkOutlined />} style={{ backgroundColor: material.type === 'document' ? '#ff4d4f' : material.type === 'presentation' ? '#1890ff' : '#52c41a' }} />}
                          title={material.title}
                          description={<div><Text type="secondary" className="text-xs">{material.type === 'link' ? 'Link' : material.fileSize}</Text><br /><Text type="secondary" className="text-xs">{new Date(material.uploadedAt).toLocaleDateString()}</Text></div>}
                        />
                      </Card>
                    </List.Item>
                  )}
                />
              ) : <Empty description="No materials available" />}
            </Col>
          </Row>
        )
      },
      {
        key: 'assignments',
        label: renderTabLabel(<TrophyOutlined />, 'Assignments'),
        children: <StudentAssignmentList classroomId={classroomId} onNavigateTab={setActiveTab} />
      },
      {
        key: 'quizzes',
        label: renderTabLabel(<ClockCircleOutlined />, 'Quizzes'),
        children: <StudentQuizList classroomId={classroomId} onNavigateTab={setActiveTab} />
      },
      {
        key: 'classmates',
        label: <Space><TeamOutlined /> Classmates</Space>,
        children: (
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card title={`Classmates (${classroom.totalStudents})`}>
                <Text type="secondary" className="block mb-4">Connect with your classmates and collaborate.</Text>
                <Empty description="Classmates list is only available to teachers" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </Card>
            </Col>
          </Row>
        )
              }
      ];
  }, [
    classroom, 
    materials, 
    streamPosts, 
    streamLoading,
    streamPagination,
    loadingMoreStream,
    // AnnouncementEditor state dependencies
    showEditor,
    richTextContent,
    attachments,
    postingAnnouncement,
    // Functions remain stable due to useCallback
    handlePostAnnouncement,
    formatTimeAgo,
    handlePin,
    handleEdit,
    handleDelete,
    handleAddComment,
    handleDeleteComment,
    handleCopyClassCode,
    handleLoadMoreStream,
    setActiveTab,
    user
  ]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  if (!classroom) {
    return <div className="text-center py-12"><Title level={3}>Classroom not found</Title><Button onClick={() => navigate('/student/classrooms')}>Back to Classrooms</Button></div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/student/classrooms')} className="mb-4">Back to Classrooms</Button>
        <div className="flex justify-between items-start">
          <Space>
            <Tag color="green" className="text-base px-3 py-1">Enrolled</Tag>
            <Popconfirm
              title={`Are you sure you want to leave "${classroom.name}"?`}
              description="You will need to rejoin using the class code if you want to access this classroom again."
              onConfirm={handleLeaveClassroom}
              okText="Yes, Leave"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<LogoutOutlined />}>Leave Class</Button>
            </Popconfirm>
          </Space>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          navigate(`#${key}`);
        }}
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default StudentClassroomDetail;