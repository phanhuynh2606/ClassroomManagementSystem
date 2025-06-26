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
import StudentAssignmentList from '../student/StudentAssignmentList';
import StudentQuizList from '../student/StudentQuizList';
import {
  StreamHeader,
  StreamItem,
  StreamSidebar,
  StreamEmptyState,
  AnnouncementEditor,
} from '../../components/teacher/stream';

const { Title, Text } = Typography;

const StudentClassroomDetail = () => {  
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const location = useLocation();
  const [showEditor, setShowEditor] = useState(false);
  const [richTextContent, setRichTextContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('all_students');
  const [attachments, setAttachments] = useState([]);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [announcementForm] = Form.useForm();

  const handlePostAnnouncement = async () => {
    setPostingAnnouncement(true);
    try {
      message.success('Posted successfully (demo)');
      announcementForm.resetFields();
      setRichTextContent('');
      setAttachments([]);
      setShowEditor(false);
    } catch (err) {
      message.error('Failed to post');
    } finally {
      setPostingAnnouncement(false);
    }
  };
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

  const streamPosts = [
    {
      _id: '1',
      type: 'announcement',
      title: '📢 Welcome to the class!',
      content: '<p>Hello students! Please check the materials tab.</p>',
      createdAt: new Date().toISOString(),
      author: { name: 'Teacher John', avatar: null },
      attachments: [],
      comments: [
        { id: 'c1', author: 'Alice', content: 'Thanks!', createdAt: new Date().toISOString() }
      ]
    }
  ];

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
              <StreamHeader classData={classroom} />

              <div className="p-4">
                <Row gutter={24}>
                  <Col xs={24} md={16}>
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

                    {streamPosts.length === 0 ? (
                      <StreamEmptyState />
                    ) : (
                      <div className="space-y-4 mt-4">
                        {streamPosts.map((item) => (
                          <StreamItem
                            key={item._id || item.id}
                            item={item}
                            formatTimeAgo={formatTimeAgo}
                          />
                        ))}
                      </div>
                    )}
                  </Col>

                  <Col xs={24} md={8}>
                    <StreamSidebar
                      classData={classroom}
                      handleCopyClassCode={handleCopyClassCode}
                      upcoming={classroom.upcomingEvents}
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
  }, [classroom, materials, showEditor, richTextContent, attachments]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  if (!classroom) {
    return <div className="text-center py-12"><Title level={3}>Classroom not found</Title><Button onClick={() => navigate('/student/classrooms')}>Back to Classrooms</Button></div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/student/classrooms')} className="mb-4">Back to Classrooms</Button>
        <div className="flex justify-between items-start">
          <div>
            <Title level={2} className="mb-2">{classroom.name}</Title>
            <Text type="secondary" className="text-lg">{classroom.subject}</Text>
          </div>
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