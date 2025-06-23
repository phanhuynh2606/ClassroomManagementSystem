import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, 
  Tabs, 
  Button, 
  Table, 
  Input, 
  Space, 
  Typography, 
  Badge,
  message,
  Tooltip,
  Modal,
  Spin,
  Alert,
  Avatar,
  Divider,
  Form,
  Upload,
  Tag,
  Empty,
  Timeline,
  Select,
  Row,
  Col,
  Layout
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SearchOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  SendOutlined,
  PaperClipOutlined,
  ClockCircleOutlined,
  BookOutlined,
  BellOutlined,
  MessageOutlined,
  FileTextOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  FormatPainterOutlined,
  MoreOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import classroomAPI from '../../services/api/classroom.api';
import './teacher.css';

// Import components
import StreamHeader from './components/StreamHeader';
import StreamSidebar from './components/StreamSidebar';
import AnnouncementEditor from './components/AnnouncementEditor';
import StreamItem from './components/StreamItem';
import StreamEmptyState from './components/StreamEmptyState';
import PeopleTab from './components/StudentList';
import ClassworkTab from './components/AssignmentList';
import GradesTab from './components/GradesTab';
import MaterialList from './components/MaterialList';

const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;
const { Option } = Select;
const { Sider, Content } = Layout;

const ClassroomDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stream');
  const [searchText, setSearchText] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [announcementForm] = Form.useForm();
  const [richTextContent, setRichTextContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('all_students');
  const [showEditor, setShowEditor] = useState(false);
  const [editorFocused, setEditorFocused] = useState(false);
  const [attachments, setAttachments] = useState([]);
  
  const [classData, setClassData] = useState(null);
  const [studentsData, setStudentsData] = useState([]);
  const [streamData, setStreamData] = useState([
    {
      id: '1',
      type: 'announcement',
      title: 'Welcome to the new semester!',
      content: 'Dear students, welcome to our Programming Fundamentals class. Please check the syllabus and prepare for our first assignment.',
      author: {
        name: 'John Smith',
        avatar: null,
        role: 'Teacher'
      },
      createdAt: '2024-01-15T10:30:00Z',
      attachments: [],
      comments: [
        {
          id: 'c1',
          author: 'Alice Johnson',
          content: 'Thank you for the warm welcome!',
          createdAt: '2024-01-15T11:00:00Z'
        }
      ]
    },
    {
      id: '2',
      type: 'assignment',
      title: 'Assignment 1: Basic Programming Concepts',
      content: 'Complete the exercises in Chapter 1-3. Due date: January 25th, 2024.',
      author: {
        name: 'John Smith',
        avatar: null,
        role: 'Teacher'
      },
      createdAt: '2024-01-16T14:20:00Z',
      dueDate: '2024-01-25T23:59:00Z',
      attachments: [
        {
          name: 'assignment1_template.pdf',
          size: '245 KB'
        }
      ],
      comments: []
    },
    {
      id: '3',
      type: 'material',
      title: 'Lecture Slides - Week 1',
      content: 'Here are the slides from our first week covering introduction to programming.',
      author: {
        name: 'John Smith',
        avatar: null,
        role: 'Teacher'
      },
      createdAt: '2024-01-14T09:15:00Z',
      attachments: [
        {
          name: 'week1_slides.pptx',
          size: '1.2 MB'
        }
      ],
      comments: []
    },
    {
      id: '4',
      type: 'activity',
      title: 'Student Alice Johnson joined the class',
      content: '',
      author: {
        name: 'System',
        avatar: null,
        role: 'System'
      },
      createdAt: '2024-01-13T16:45:00Z',
      attachments: [],
      comments: []
    }
  ]);

  useEffect(() => {
    if (classId) {
      fetchClassroomData();
      fetchStudentsData();
    }
  }, [classId]);

  const fetchClassroomData = async () => {
    setLoading(true);
    try {
      const response = await classroomAPI.getDetail(classId);
      if (response.success) {
        setClassData(response.data);
      } else {
        message.error(response.message || 'Classroom not found');
        navigate('/teacher/classroom');
      }
    } catch (error) {
      console.error('Error fetching classroom:', error);
      message.error(error.response?.data?.message || 'Failed to fetch classroom data');
      navigate('/teacher/classroom');
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
      console.error('Error fetching students:', error);
      // Don't show error message as this might be expected for new classrooms
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleCopyClassCode = useCallback(() => {
    if (classData?.code) {
      navigator.clipboard.writeText(classData.code);
      message.success('Class code copied to clipboard');
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

      message.success('Deletion request sent to admin for approval');
      setDeleteModalVisible(false);
      navigate('/teacher/classroom');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete classroom');
    } finally {
      setDeleting(false);
    }
  }, [classId, navigate]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false);
  }, []);

  const handlePostAnnouncement = useCallback(async (values) => {
    setPostingAnnouncement(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAnnouncement = {
        id: Date.now().toString(),
        type: 'announcement',
        title: values.title || 'Class Announcement',
        content: richTextContent || values.content,
        author: {
          name: 'John Smith', // Should be current teacher's name
          avatar: null,
          role: 'Teacher'
        },
        createdAt: new Date().toISOString(),
        attachments: attachments,
        comments: []
      };
      
      setStreamData(prev => [newAnnouncement, ...prev]);
      announcementForm.resetFields();
      setRichTextContent('');
      setShowEditor(false);
      setAttachments([]);
      message.success('Announcement posted successfully!');
    } catch (error) {
      message.error('Failed to post announcement');
    } finally {
      setPostingAnnouncement(false);
    }
  }, [richTextContent, attachments, announcementForm]);

  const formatTimeAgo = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
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
      rejected: { status: "error", text: "Rejected" }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge status={config.status} text={config.text} />;
  };

  const StudentListComponent = useMemo(() => (
    <PeopleTab 
      studentsData={studentsData}
      studentsLoading={studentsLoading}
      searchText={searchText}
      setSearchText={setSearchText}
      classData={classData}
      handleCopyClassCode={handleCopyClassCode}
    />
  ), [studentsData, studentsLoading, searchText, classData, handleCopyClassCode]);

  const AssignmentListComponent = useMemo(() => (
    <ClassworkTab />
  ), []);

  const StreamTab = useMemo(() => (
    <div>
      <StreamHeader classData={classData} />

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
            />

            {/* Stream Items */}
            {streamData.length === 0 ? (
              <StreamEmptyState />
            ) : (
              streamData.map((item) => (
                <StreamItem 
                  key={item.id} 
                  item={item} 
                  formatTimeAgo={formatTimeAgo} 
                />
              ))
            )}
          </div>
        </Col>
      </Row>
    </div>
  ), [classData, handleCopyClassCode, showEditor, richTextContent, targetAudience, attachments, handlePostAnnouncement, postingAnnouncement, announcementForm, streamData, formatTimeAgo]);

  const ClassworkTabComponent = useMemo(() => (
    <ClassworkTab />
  ), []);

  const PeopleTabComponent = useMemo(() => (
    <PeopleTab 
      studentsData={studentsData}
      studentsLoading={studentsLoading}
      searchText={searchText}
      setSearchText={setSearchText}
      classData={classData}
      handleCopyClassCode={handleCopyClassCode}
    />
  ), [studentsData, studentsLoading, searchText, classData, handleCopyClassCode]);

  const GradesTabComponent = useMemo(() => (
    <GradesTab />
  ), []);
 

  const tabItems = useMemo(() => [
    {
      key: 'stream',
      label: 'Stream',
      children: StreamTab
    },
    {
      key: 'materials',
      label: 'Materials', 
      children: <MaterialList classId={classId} classData={classData} />
    },
    {
      key: 'classwork',
      label: 'Classwork',
      children: ClassworkTabComponent
    },
    {
      key: 'people',
      label: 'People',
      children: PeopleTabComponent
    },
    {
      key: 'grades',
      label: 'Grades',
      children: GradesTabComponent
    }
  ], [StreamTab, ClassworkTabComponent, PeopleTabComponent, GradesTabComponent]);

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
    <div className="p-6" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Back button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/teacher/classroom')}
        className="mb-4"
      >
        Back to Classrooms
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Title level={2} className="mb-2">
              {classData.name}
            </Title>
            <Text type="secondary" className="text-lg">
              {classData.subject}
            </Text>
            {classData.description && (
              <div className="mt-2">
                <Text className="text-gray-600">
                  {classData.description}
                </Text>
              </div>
            )}
          </div>
          <Space direction="vertical" align="end">
            {getApprovalStatusBadge(classData.status)}
            <Space>
              {classData.status === 'active' && (
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEditClass}
                  className="flex items-center hover:text-white hover:bg-blue-600"
                >
                  Edit
                </Button>
              )}
              {classData.status === 'active' && (
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
        {classData.status === 'inactive' && (
          <Alert
            message="This classroom is currently inactive"
            description="Students cannot access this classroom while it is inactive."
            type="info"
            showIcon
            className="mb-4"
          />
        )}
        {classData.status === 'pending_delete' && (
          <Alert
            message="Deletion Request Pending"
            description="This classroom is pending deletion approval from the administrator."
            type="warning"
            showIcon
            className="mb-4"
          />
        )}
        {classData.status === 'pending_edit' && (
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
              <div className="text-2xl font-bold text-blue-600">{classData.code}</div>
              <div className="text-gray-500">Class Code</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{studentsData.length}</div>
              <div className="text-gray-500">Students</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{classData.category}</div>
              <div className="text-gray-500">Category</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{classData.level}</div>
              <div className="text-gray-500">Level</div>
            </div>
          </Card>
        </div>

        {classData.approvalStatus === 'rejected' && classData.rejectionReason && (
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
            Are you sure you want to delete "{classData.name}"?
            This action will require admin approval.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default ClassroomDetail; 