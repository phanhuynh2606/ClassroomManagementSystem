import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Tabs,
  Button,
  Input,
  Space,
  Typography,
  Badge,
  message,
  Modal,
  Spin,
  Alert,
  Form,
  Select,
  Row,
  Col,
  Layout,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import classroomAPI from "../../services/api/classroom.api";
import streamAPI from "../../services/api/stream.api";
import useClassroomPermissions from "../../hooks/useClassroomPermissions";
import "./style/teacher.css";

// Import components from new organized structure
import {
  StreamHeader,
  StreamSidebar,
  AnnouncementEditor,
  StreamItem,
  StreamEmptyState,
  EditPostModal,
} from "../../components/teacher/stream";

import {
  AssignmentList as ClassworkTab,
} from "../../components/teacher/assignment";

import {
  QuizManagement,
} from "../../components/teacher/quiz";

import {
  GradesTab,
} from "../../components/teacher/grading";

import {
  MaterialList,
} from "../../components/teacher/material";

import {
  StudentList as PeopleTab,
  BackgroundCustomizer,
} from "../../components/teacher/classroom";

const { Title, Text } = Typography;
const ClassroomDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("stream");
  const [searchText, setSearchText] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [announcementForm] = Form.useForm();
  const [richTextContent, setRichTextContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("all_students");
  const [showEditor, setShowEditor] = useState(false);
  const [attachments, setAttachments] = useState([]);

  // Background customizer state
  const [backgroundCustomizerVisible, setBackgroundCustomizerVisible] =
    useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);

  // Edit post state
  const [editPostModalVisible, setEditPostModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [savingPost, setSavingPost] = useState(false);

  const [classData, setClassData] = useState(null);
  const [studentsData, setStudentsData] = useState([]);
  const [teachersData, setTeachersData] = useState([]);
  const [streamData, setStreamData] = useState([]);
  
  // Pagination state
  const [streamPagination, setStreamPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [loadingMoreStream, setLoadingMoreStream] = useState(false);

  // Get classroom permissions
  const permissions = useClassroomPermissions(classData);

  // Handle hash navigation
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  useEffect(() => {
    if (classId) {
      fetchClassroomData();
      fetchStreamData();
    }
  }, [classId]);

  const fetchClassroomData = async () => {
    setLoading(true);
    try {
      const response = await classroomAPI.getDetail(classId);
      if (response.success) {
        setClassData(response.data);
        setStudentsData(response.data.students || []);
        setTeachersData(Array.isArray(response.data.teacher) ? response.data.teacher : [response.data.teacher]);
      } else {
        message.error(response.message || "Classroom not found");
        navigate("/teacher/classroom");
      }
    } catch (error) {
      console.error("Error fetching classroom:", error);
      message.error(
        error.response?.data?.message || "Failed to fetch classroom data"
      );
      navigate("/teacher/classroom");
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamData = async (page = 1, append = false) => {
    try {
      const response = await streamAPI.getClassroomStream(classId, {
        page: page,
        limit: 20,
      });

      if (response.success || response.data) {
        const data = response.data?.data || response.data;
        const items = data?.items || data || [];
        const pagination = data?.pagination || {
          currentPage: page,
          totalPages: 1,
          totalItems: items.length,
          itemsPerPage: 20
        };

        if (append) {
          // Append new items for Load More
          setStreamData(prev => [...prev, ...items]);
        } else {
          // Replace items for initial load
          setStreamData(items);
        }
        
        setStreamPagination(pagination);
      }
    } catch (error) {
      console.error("Error fetching stream data:", error);
      // Don't show error message for stream data as it might be empty for new classrooms
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

  const handleCopyClassCode = useCallback(() => {
    if (classData?.code) {
      navigator.clipboard.writeText(classData.code);
      message.success("Class code copied to clipboard");
    }
  }, [classData?.code]);

  const handleEditClass = useCallback(() => {
    navigate(`/teacher/classroom/edit/${classId}`);
  }, [navigate, classId]);

  const handleDeleteClass = useCallback(() => {
    setDeleteModalVisible(true);
  }, []);

  const confirmDeleteClass = useCallback(async () => {
    setDeleting(true);
    try {
      await classroomAPI.deleteByTeacher(classId);

      message.success("Deletion request sent to admin for approval");
      setDeleteModalVisible(false);
      navigate("/teacher/classroom");
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to delete classroom"
      );
    } finally {
      setDeleting(false);
    }
  }, [classId, navigate]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false);
  }, []);

  // Background customizer handlers
  const handleOpenBackgroundCustomizer = useCallback(() => {
    setBackgroundCustomizerVisible(true);
  }, []);

  const handleCloseBackgroundCustomizer = useCallback(() => {
    setBackgroundCustomizerVisible(false);
  }, []);

  const handleSaveAppearance = useCallback(
    async (appearanceData) => {
      setSavingAppearance(true);
      try {
        const response = await classroomAPI.updateAppearance(
          classId,
          appearanceData
        );
        if (response.success) {
          // Update local classData with new appearance
          setClassData((prev) => ({
            ...prev,
            appearance: appearanceData,
          }));
          setBackgroundCustomizerVisible(false);
          message.success("Classroom appearance updated successfully!");
        } else {
          message.error(response.message || "Failed to update appearance");
        }
      } catch (error) {
        console.error("Error updating appearance:", error);
        message.error(
          error.response?.data?.message || "Failed to update appearance"
        );
      } finally {
        setSavingAppearance(false);
      }
    },
    [classId]
  );

  const handlePostAnnouncement = useCallback(
    async (values) => {
      setPostingAnnouncement(true);
      try {
        const announcementData = {
          title: values.title || "Class Announcement",
          content: richTextContent || values.content || "",
          attachments: attachments.map((att) => {
            const baseAttachment = {
              name: att.name,
              url: att.url,
              type: att.type || 'file',
              size: att.size,
              title: att.title,
            };

            // Add video-specific fields for both uploaded videos and YouTube videos
            if (att.type === 'video' || att.type === 'video/youtube') {
              return {
                ...baseAttachment,
                videoId: att.videoId,
                thumbnail: att.thumbnail,
                duration: att.duration,
                channel: att.channel,
                channelThumbnail: att.channelThumbnail,
                viewCount: att.viewCount,
                description: att.description,
                metadata: att.metadata,
                // Include file-specific fields for uploaded videos
                fileType: att.fileType,
                fileSize: att.fileSize,
              };
            }

            // Add link-specific fields if it's a link
            if (att.type === 'link') {
              return {
                ...baseAttachment,
                favicon: att.favicon,
                metadata: att.metadata,
              };
            }

            // Regular file attachment
            return {
              ...baseAttachment,
              fileType: att.fileType,
              fileSize: att.fileSize,
            };
          }),
          targetAudience: targetAudience,
          targetStudents: targetAudience === "specific" ? [] : undefined,
        };

        const response = await streamAPI.createAnnouncement(
          classId,
          announcementData
        );

        if (response.success) {
          // Add new announcement to stream
          setStreamData((prev) => [response.data, ...prev]);

          // Reset form
          announcementForm.resetFields();
          setRichTextContent("");
          setShowEditor(false);
          setAttachments([]);
          setTargetAudience("all_students");

          message.success("Announcement posted successfully!");
        } else {
          message.error(response.message || "Failed to post announcement");
        }
      } catch (error) {
        console.error("Error posting announcement:", error);
        message.error(
          error.response?.data?.message || "Failed to post announcement"
        );
      } finally {
        setPostingAnnouncement(false);
      }
    },
    [classId, richTextContent, attachments, targetAudience, announcementForm]
  );

  // Stream item handlers
  const handlePinPost = useCallback(async (streamId) => {
    try {
      const response = await streamAPI.togglePinStreamItem(streamId);
      if (response.success) {
        // Update stream data
        setStreamData((prev) =>
          prev.map((item) => (item._id === streamId ? response.data : item))
        );
        message.success(response.message);
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
      message.error("Failed to update pin status");
    }
  }, []);

  const handleEditPost = useCallback(
    async (streamId) => {
      const postToEdit = streamData.find((item) => item._id === streamId);
      if (postToEdit) {
        setEditingPost(postToEdit);
        setEditPostModalVisible(true);
      }
    },
    [streamData]
  );

  const handleSaveEditPost = useCallback(
    async (postData) => {
      if (!editingPost) return;

      setSavingPost(true);
      try {
        const response = await streamAPI.updateStreamItem(
          editingPost._id,
          postData
        );
        if (response.success) {
          // Update stream data
          setStreamData((prev) =>
            prev.map((item) =>
              item._id === editingPost._id ? response.data : item
            )
          );
          message.success("Post updated successfully");
        }
      } catch (error) {
        console.error("Error updating post:", error);
        message.error("Failed to update post");
        throw error;
      } finally {
        setSavingPost(false);
      }
    },
    [editingPost]
  );

  const handleCloseEditModal = useCallback(() => {
    setEditPostModalVisible(false);
    setEditingPost(null);
  }, []);

  const handleDeletePost = useCallback(async (streamId) => {
    Modal.confirm({
      title: "Delete Post",
      content:
        "Are you sure you want to delete this post? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await streamAPI.deleteStreamItem(streamId);
          if (response.success) {
            // Remove from stream data
            setStreamData((prev) =>
              prev.filter((item) => item._id !== streamId)
            );
            message.success("Post deleted successfully");
          }
        } catch (error) {
          console.error("Error deleting post:", error);
          message.error("Failed to delete post");
        }
      },
    });
  }, []);

  const handleAddComment = useCallback(async (streamId, content) => {
    try {
      const response = await streamAPI.addComment(streamId, content);
      if (response.success) {
        // Update stream data with new comment
        setStreamData((prev) =>
          prev.map((item) => {
            if (item._id === streamId) {
              return {
                ...item,
                comments: [...(item.comments || []), response.data],
                commentsCount: (item.commentsCount || 0) + 1,
              };
            }
            return item;
          })
        );
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }, []);

  const handleDeleteComment = useCallback(async (streamId, commentId) => {
    try {
      const response = await streamAPI.deleteComment(streamId, commentId);
      if (response.success) {
        // Update stream data by removing the comment
        setStreamData((prev) =>
          prev.map((item) => {
            if (item._id === streamId) {
              return {
                ...item,
                comments: (item.comments || []).filter(
                  (comment) => (comment._id || comment.id) !== commentId
                ),
                commentsCount: Math.max(0, (item.commentsCount || 0) - 1),
              };
            }
            return item;
          })
        );
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }, []);

  const formatTimeAgo = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }, []);

  const getApprovalStatusBadge = (status) => {
    const statusConfig = {
      active: { status: "success", text: "Active" },
      inactive: { status: "default", text: "Inactive" },
      pending_delete: { status: "error", text: "Pending Deletion" },
      pending_edit: { status: "processing", text: "Pending Edit" },
      approved: { status: "success", text: "Approved" },
      pending: { status: "processing", text: "Pending Approval" },
      rejected: { status: "error", text: "Rejected" },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge status={config.status} text={config.text} />;
  };

  const StudentListComponent = useMemo(
    () => (
      <PeopleTab
        studentsData={studentsData}
        studentsLoading={studentsLoading}
        searchText={searchText}
        setSearchText={setSearchText}
        classData={classData}
        handleCopyClassCode={handleCopyClassCode}
      />
    ),
    [studentsData, studentsLoading, searchText, classData, handleCopyClassCode]
  );

  const AssignmentListComponent = useMemo(() => <ClassworkTab />, []);

  const StreamTab = useMemo(
    () => (
      <div>
        <StreamHeader
          classData={classData}
          onCustomizeClick={handleOpenBackgroundCustomizer}
        />

        <Row gutter={24}>
          {/* Left Sidebar */}
          <Col xs={24} lg={6}>
            <StreamSidebar
              classData={classData}
              handleCopyClassCode={handleCopyClassCode}
            />
          </Col>

          {/* Main Content */}
          <Col xs={24} lg={18}>
            <div className="space-y-6">
              {/* Announcement Editor */}
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
                userRole={user?.role}
                classroomPermissions={permissions}
              />

              {/* Stream Items */}
              {streamData.length === 0 ? (
                <StreamEmptyState />
              ) : (
                <>
                  {streamData.map((item) => (
                    <StreamItem
                      key={item._id || item.id}
                      item={item}
                      formatTimeAgo={formatTimeAgo}
                      onPin={handlePinPost}
                      onEdit={handleEditPost}
                      onDelete={handleDeletePost}
                      onAddComment={handleAddComment}
                      onDeleteComment={handleDeleteComment}
                      userRole={user?.role}
                      currentUserId={user?._id}
                      classroomId={classId}
                      streamItemId={item._id}
                      classroomSettings={classData?.settings || {}}
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
                        {loadingMoreStream ? 'Loading more posts...' : `Load More Posts (${streamPagination.totalItems - streamData.length} remaining)`}
                      </Button>
                    </div>
                  )}
                  
                  {/* Pagination Info */}
                  {streamPagination.totalItems > 0 && (
                    <div className="text-center mt-4 text-gray-500 text-sm">
                      Showing {streamData.length} of {streamPagination.totalItems} posts
                      {streamPagination.totalPages > 1 && (
                        <span> • Page {streamPagination.currentPage} of {streamPagination.totalPages}</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </Col>
        </Row>
      </div>
    ),
    [
      classData,
      handleCopyClassCode,
      handleOpenBackgroundCustomizer,
      showEditor,
      richTextContent,
      targetAudience,
      attachments,
      handlePostAnnouncement,
      postingAnnouncement,
      announcementForm,
      streamData,
      streamPagination,
      loadingMoreStream,
      formatTimeAgo,
      handlePinPost,
      handleEditPost,
      handleDeletePost,
      handleAddComment,
      handleLoadMoreStream,
      user?.role,
      user?._id,
    ]
  );

  const ClassworkTabComponent = useMemo(() => <ClassworkTab classId={classId} />, [classId]);

  const PeopleTabComponent = useMemo(
    () => (
      <PeopleTab
        studentsData={studentsData}
        teachersData={teachersData}
        studentsLoading={studentsLoading}
        searchText={searchText}
        setSearchText={setSearchText}
        classData={classData}
        handleCopyClassCode={handleCopyClassCode}
      />
    ),
    [studentsData, studentsLoading, searchText, classData, handleCopyClassCode]
  );

  const GradesTabComponent = useMemo(() => <GradesTab classroomId={classId} />, [classId]);

  const QuizManagementComponent = useMemo(
    () => <QuizManagement classId={classId} />,
    [classId]
  );

  const tabItems = useMemo(
    () => [
      {
        key: "stream",
        label: "Bảng tin",
        children: StreamTab,
      },
      {
        key: "materials",
        label: "Tài liệu",
        children: <MaterialList classId={classId} classData={classData} />,
      },
      {
        key: "classwork",
        label: "Bài tập",
        children: ClassworkTabComponent,
      },
      {
        key: "quizzes",
        label: "Quiz",
        children: QuizManagementComponent,
      },
      {
        key: "people",
        label: "Thành viên",
        children: PeopleTabComponent,
      },
      {
        key: "grades",
        label: "Bảng điểm",
        children: GradesTabComponent,
      },
    ],
    [
      StreamTab,
      ClassworkTabComponent,
      QuizManagementComponent,
      PeopleTabComponent,
      GradesTabComponent,
    ]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="p-6">
        <Text type="secondary">Classroom not found</Text>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ minHeight: "calc(100vh - 64px)" }}>
      {/* Back button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/teacher/classroom")}
        className="mb-4"
      >
        Quay lại danh sách lớp
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <Space>{getApprovalStatusBadge(classData.status)}</Space>
          <Space direction="vertical" align="end">
            <Space>
              {classData.status === "active" && (
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEditClass}
                  className="flex items-center hover:text-white hover:bg-blue-600"
                >
                  Edit Class & Settings
                </Button>
              )}
              {classData.status === "active" && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteClass}
                  className="flex items-center hover:text-white hover:bg-red-600"
                >
                  Delete Class
                </Button>
              )}
            </Space>
          </Space>
        </div>

        {/* Status Messages */}
        {classData.status === "inactive" && (
          <Alert
            message="Lớp học này hiện đang bị khóa"
            description="Học sinh sẽ không thể truy cập lớp học khi lớp bị khóa."
            type="info"
            showIcon
            className="mb-4"
          />
        )}
        {classData.status === "pending_delete" && (
          <Alert
            message="Yêu cầu xóa lớp đang chờ duyệt"
            description="Lớp học này đang chờ quản trị viên phê duyệt xóa."
            type="warning"
            showIcon
            className="mb-4"
          />
        )}
        {classData.status === "pending_edit" && (
          <Alert
            message="Yêu cầu chỉnh sửa đang chờ duyệt"
            description="Các thay đổi với lớp học này đang chờ quản trị viên phê duyệt."
            type="warning"
            showIcon
            className="mb-4"
          />
        )}

        {/* Class Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {classData.code}
              </div>
              <div className="text-gray-500">Mã lớp</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {studentsData.length}
              </div>
              <div className="text-gray-500">Học sinh</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {classData.category}
              </div>
              <div className="text-gray-500">Danh mục</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {classData.level}
              </div>
              <div className="text-gray-500">Trình độ</div>
            </div>
          </Card>
        </div>

        {classData.approvalStatus === "rejected" &&
          classData.rejectionReason && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
              <Text type="danger" strong>
                Rejection Reason: {classData.rejectionReason}
              </Text>
            </div>
          )}
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          navigate(`#${key}`);
        }}
        items={tabItems}
        className="classroom-detail-tabs"
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Classroom"
        open={deleteModalVisible}
        onOk={confirmDeleteClass}
        onCancel={handleCancelDelete}
        confirmLoading={deleting}
        okText="Gửi yêu cầu xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <div className="py-4">
          <ExclamationCircleOutlined className="text-orange-500 mr-2" />
          <Text>
            Bạn có chắc chắn muốn xóa lớp "{classData.name}"? Hành động này sẽ cần quản trị viên phê duyệt.
          </Text>
        </div>
      </Modal>

      {/* Background Customizer Modal */}
      <BackgroundCustomizer
        visible={backgroundCustomizerVisible}
        onCancel={handleCloseBackgroundCustomizer}
        onSave={handleSaveAppearance}
        classroomData={classData}
        loading={savingAppearance}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        visible={editPostModalVisible}
        onCancel={handleCloseEditModal}
        onSave={handleSaveEditPost}
        loading={savingPost}
        initialData={editingPost}
        userRole={user?.role}
      />
    </div>
  );
};

export default ClassroomDetail;
