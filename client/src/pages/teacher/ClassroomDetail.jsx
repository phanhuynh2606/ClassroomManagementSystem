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
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import classroomAPI from "../../services/api/classroom.api";
import streamAPI from "../../services/api/stream.api";
import useClassroomPermissions from "../../hooks/useClassroomPermissions";
import "./style/teacher.css";

// Import components
import StreamHeader from "./components/StreamHeader";
import StreamSidebar from "./components/StreamSidebar";
import AnnouncementEditor from "./components/AnnouncementEditor";
import StreamItem from "./components/StreamItem";
import StreamEmptyState from "./components/StreamEmptyState";
import PeopleTab from "./components/StudentList";
import ClassworkTab from "./components/AssignmentList";
import GradesTab from "./components/GradesTab";
import MaterialList from "./components/MaterialList";
import QuizManagement from "./components/QuizManagement";
import BackgroundCustomizer from "./components/BackgroundCustomizer";
import EditPostModal from "./components/EditPostModal";

const { Title, Text } = Typography;
const ClassroomDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
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
  const [streamData, setStreamData] = useState([]);

  // Get classroom permissions
  const permissions = useClassroomPermissions(classData);

  useEffect(() => {
    if (classId) {
      fetchClassroomData();
      fetchStudentsData();
      fetchStreamData();
    }
  }, [classId]);

  const fetchClassroomData = async () => {
    setLoading(true);
    try {
      const response = await classroomAPI.getDetail(classId);
      if (response.success) {
        setClassData(response.data);
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

  const fetchStudentsData = async () => {
    setStudentsLoading(true);
    try {
      const response = await classroomAPI.getStudentsByTeacher(classId);
      if (response.success) {
        setStudentsData(response.data.students || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      // Don't show error message as this might be expected for new classrooms
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchStreamData = async () => {
    try {
      const response = await streamAPI.getClassroomStream(classId, {
        page: 1,
        limit: 20,
      });

      if (response.success) {
        setStreamData(response.data.items || []);
        console.log("streamData", streamData);
      }
    } catch (error) {
      console.error("Error fetching stream data:", error);
      // Don't show error message for stream data as it might be empty for new classrooms
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

            // Add YouTube-specific fields if it's a YouTube video
            if (att.type === 'video/youtube') {
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
                streamData.map((item) => (
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
                  />
                ))
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
      formatTimeAgo,
      handlePinPost,
      handleEditPost,
      handleDeletePost,
      handleAddComment,
      user?.role,
      user?._id,
    ]
  );

  const ClassworkTabComponent = useMemo(() => <ClassworkTab />, []);

  const PeopleTabComponent = useMemo(
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

  const GradesTabComponent = useMemo(() => <GradesTab />, []);

  const QuizManagementComponent = useMemo(
    () => <QuizManagement classId={classId} />,
    [classId]
  );

  const tabItems = useMemo(
    () => [
      {
        key: "stream",
        label: "Stream",
        children: StreamTab,
      },
      {
        key: "materials",
        label: "Materials",
        children: <MaterialList classId={classId} classData={classData} />,
      },
      {
        key: "classwork",
        label: "Classwork",
        children: ClassworkTabComponent,
      },
      {
        key: "quizzes",
        label: "Quizzes",
        children: QuizManagementComponent,
      },
      {
        key: "people",
        label: "People",
        children: PeopleTabComponent,
      },
      {
        key: "grades",
        label: "Grades",
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
        Back to Classrooms
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
            message="This classroom is currently inactive"
            description="Students cannot access this classroom while it is inactive."
            type="info"
            showIcon
            className="mb-4"
          />
        )}
        {classData.status === "pending_delete" && (
          <Alert
            message="Deletion Request Pending"
            description="This classroom is pending deletion approval from the administrator."
            type="warning"
            showIcon
            className="mb-4"
          />
        )}
        {classData.status === "pending_edit" && (
          <Alert
            message="Edit Request Pending"
            description="Changes to this classroom are pending approval from the administrator."
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
              <div className="text-gray-500">Class Code</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {studentsData.length}
              </div>
              <div className="text-gray-500">Students</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {classData.category}
              </div>
              <div className="text-gray-500">Category</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {classData.level}
              </div>
              <div className="text-gray-500">Level</div>
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
        onChange={setActiveTab}
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
        okText="Request Deletion"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <div className="py-4">
          <ExclamationCircleOutlined className="text-orange-500 mr-2" />
          <Text>
            Are you sure you want to delete "{classData.name}"? This action will
            require admin approval.
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
