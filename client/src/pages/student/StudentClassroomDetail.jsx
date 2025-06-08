import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Descriptions, 
  Button, 
  Row, 
  Col, 
  Typography,
  message,
  Spin,
  Avatar,
  List,
  Tag,
  Divider,
  Space,
  Popconfirm,
  Tabs,
  Timeline,
  Badge,
  Progress,
  Empty,
  Tooltip
} from 'antd';
import { 
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  FileTextOutlined,
  NotificationOutlined,
  CalendarOutlined,
  TrophyOutlined,
  DownloadOutlined,
  LinkOutlined,
  FilePdfOutlined,
  FileExclamationOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import classroomAPI from '../../services/api/classroom.api';

const { Title, Text, Paragraph } = Typography;

const StudentClassroomDetail = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (classroomId) {
      fetchClassroomDetails();
    }
  }, [classroomId]);

  const fetchClassroomDetails = async () => {
    setLoading(true);
    try {
      // Get detailed classroom information
      const classroomResponse = await classroomAPI.getDetail(classroomId);
      setClassroom(classroomResponse.data.data || classroomResponse.data);
      
      // Get classroom materials
      try {
        const materialsResponse = await classroomAPI.getMaterials(classroomId);
        setMaterials(materialsResponse.data.data || materialsResponse.data || []);
      } catch (error) {
        console.log('Cannot fetch materials:', error);
      }
    } catch (error) {
      message.error('Failed to fetch classroom details');
      console.error('Error fetching classroom:', error);
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

  const copyClassCode = () => {
    if (classroom?.code) {
      navigator.clipboard.writeText(classroom.code);
      message.success('Class code copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="text-center py-12">
        <Title level={3}>Classroom not found</Title>
        <Button onClick={() => navigate('/student/classrooms')}>
          Back to Classrooms
        </Button>
      </div>
    );
  }

  // Render different tab content
  const renderOverview = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card title="Classroom Information" className="mb-6">
          <Descriptions column={2} size="middle">
            <Descriptions.Item label="Class Name" span={2}>
              <Text strong>{classroom.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Subject">
              <Tag color="blue">{classroom.subject}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Code">
              <Space>
                <Text code className="font-mono">{classroom.code}</Text>
                <Button 
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={copyClassCode}
                >
                  Copy
                </Button>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Category">
              <Tag color="orange">{classroom.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Level">
              <Tag color="purple">{classroom.level}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Teacher" span={2}>
              <Space>
                <Avatar 
                  size="small" 
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <Text strong>{classroom.teacher?.fullName}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="My Status">
              <Badge status="success" text="Enrolled" />
            </Descriptions.Item>
            <Descriptions.Item label="Joined">
              <Text>{new Date(classroom.myEnrollment?.joinedAt).toLocaleDateString()}</Text>
            </Descriptions.Item>
          </Descriptions>

          {classroom.description && (
            <>
              <Divider />
              <div>
                <Title level={5}>Description</Title>
                <Paragraph>{classroom.description}</Paragraph>
              </div>
            </>
          )}
        </Card>

        {/* Recent Activities */}
        <Card title={
          <Space>
            <NotificationOutlined />
            Recent Activities
          </Space>
        }>
          {classroom.recentActivities?.length > 0 ? (
            <Timeline>
              {classroom.recentActivities.map((activity) => (
                <Timeline.Item 
                  key={activity.id}
                  color={activity.type === 'announcement' ? 'blue' : 'green'}
                >
                  <div>
                    <Text strong>{activity.title}</Text>
                    <br />
                    <Text type="secondary">{activity.content}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      {new Date(activity.createdAt).toLocaleDateString()} - {activity.author}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <Empty description="No recent activities" />
          )}
        </Card>
      </Col>

      <Col xs={24} lg={8}>
                 <Card title="Quick Actions" className="mb-6">
           <Space direction="vertical" className="w-full">
             <Button 
               type="primary" 
               block 
               icon={<FileTextOutlined />}
               onClick={() => setActiveTab('materials')}
             >
               View Materials
             </Button>
             <Button 
               block 
               icon={<TrophyOutlined />}
               onClick={() => message.info('Assignments feature coming soon!')}
             >
               Assignments
             </Button>
             <Button 
               block 
               icon={<ClockCircleOutlined />}
               onClick={() => message.info('Quiz feature coming soon!')}
             >
               Quizzes
             </Button>
           </Space>
         </Card>

        <Card title="Class Stats" className="mb-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <Text>Total Students:</Text>
              <Text strong>{classroom.totalStudents}</Text>
            </div>
            <div className="flex justify-between">
              <Text>Max Capacity:</Text>
              <Text strong>{classroom.maxStudents}</Text>
            </div>
            <div className="flex justify-between">
              <Text>Capacity:</Text>
              <Progress 
                percent={Math.round((classroom.totalStudents / classroom.maxStudents) * 100)}
                size="small"
              />
            </div>
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card title={
          <Space>
            <CalendarOutlined />
            Upcoming Events
          </Space>
        }>
          {classroom.upcomingEvents?.length > 0 ? (
            <List
              size="small"
              dataSource={classroom.upcomingEvents}
              renderItem={(event) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        count={event.type} 
                        style={{ 
                          backgroundColor: event.type === 'quiz' ? '#faad14' : '#52c41a' 
                        }}
                      />
                    }
                    title={event.title}
                    description={
                      <div>
                        <Text type="secondary" className="text-xs">
                          Due: {new Date(event.dueDate).toLocaleDateString()}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No upcoming events" />
          )}
        </Card>
      </Col>
    </Row>
  );

  const renderMaterials = () => (
    <Row gutter={[24, 24]}>
      <Col span={24}>
        {materials.length > 0 ? (
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
            }}
            dataSource={materials}
            renderItem={(material) => (
              <List.Item>
                <Card
                  hoverable
                  actions={[
                    <Tooltip title="Download">
                      <Button 
                        icon={<DownloadOutlined />}
                        onClick={() => message.info('Download feature coming soon!')}
                      />
                    </Tooltip>
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar 
                        icon={
                          material.type === 'document' ? <FilePdfOutlined /> :
                          material.type === 'presentation' ? <FileExclamationOutlined /> :
                          <LinkOutlined />
                        }
                        style={{ 
                          backgroundColor: 
                            material.type === 'document' ? '#ff4d4f' :
                            material.type === 'presentation' ? '#1890ff' :
                            '#52c41a'
                        }}
                      />
                    }
                    title={material.title}
                    description={
                      <div>
                        <Text type="secondary" className="text-xs">
                          {material.type === 'link' ? 'Links' : material.fileSize}
                        </Text>
                        <br />
                        <Text type="secondary" className="text-xs">
                          {new Date(material.uploadedAt).toLocaleDateString()}
                        </Text>
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No materials available" />
        )}
      </Col>
    </Row>
  );

  const renderClassmates = () => (
    <Row gutter={[24, 24]}>
      <Col span={24}>
        <Card title={`Classmates (${classroom.totalStudents})`}>
          <Text type="secondary" className="block mb-4">
            Connect with your classmates and collaborate on assignments.
          </Text>
          <Empty 
            description="Classmates list is only available to teachers"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      </Col>
    </Row>
  );

  const tabItems = [
    {
      key: 'overview',
      label: (
        <Space>
          <BookOutlined />
          Overview
        </Space>
      ),
      children: renderOverview()
    },
    {
      key: 'materials',
      label: (
        <Space>
          <FileTextOutlined />
          Materials
          <Badge count={materials.length} size="small" />
        </Space>
      ),
      children: renderMaterials()
    },
    {
      key: 'classmates',
      label: (
        <Space>
          <TeamOutlined />
          Classmates
        </Space>
      ),
      children: renderClassmates()
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/student/classrooms')}
          className="mb-4"
        >
          Back to Classrooms
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <Title level={2} className="mb-2">
              {classroom.name}
            </Title>
            <Text type="secondary" className="text-lg">
              {classroom.subject}
            </Text>
          </div>
          <Space>
            <Tag color="green" className="text-base px-3 py-1">
              Enrolled
            </Tag>
            <Popconfirm
              title={`Are you sure you want to leave "${classroom.name}"?`}
              description="You will need to rejoin using the class code if you want to access this classroom again."
              onConfirm={handleLeaveClassroom}
              okText="Yes, Leave"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger 
                icon={<LogoutOutlined />}
              >
                Leave Class
              </Button>
            </Popconfirm>
          </Space>
        </div>
      </div>

      {/* Tab Content */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default StudentClassroomDetail;