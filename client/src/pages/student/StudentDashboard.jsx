import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography,
  Statistic,
  Button,
  List,
  Avatar,
  Tag,
  Progress,
  message,
  Spin,
  Empty
} from 'antd';
import { 
  BookOutlined,
  UserOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import classroomAPI from '../../services/api/classroom.api';
import QuickJoinClassroom from '../../components/student/QuickJoinClassroom';

const { Title, Text, Paragraph } = Typography;

const StudentDashboard = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalClassrooms: 0,
    activeAssignments: 0,
    completedQuizzes: 0,
    overallProgress: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await classroomAPI.getAllByStudent();
      const classroomData = response.data.data || response.data || [];
      setClassrooms(classroomData);
      
      // Calculate stats
      setStats({
        totalClassrooms: classroomData.length,
        activeAssignments: Math.floor(Math.random() * 5) + 1, // Mock data
        completedQuizzes: Math.floor(Math.random() * 10) + 1, // Mock data
        overallProgress: Math.floor(Math.random() * 40) + 60 // Mock data
      });
    } catch (error) {
      message.error('Failed to fetch dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, suffix = '' }) => (
    <Card className="text-center">
      <div className={`text-3xl mb-2 ${color}`}>
        {icon}
      </div>
      <Statistic 
        title={title} 
        value={value} 
        suffix={suffix}
        valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
      />
    </Card>
  );

  const RecentClassrooms = () => (
    <List
      dataSource={classrooms.slice(0, 5)}
      renderItem={(classroom) => (
        <List.Item
          actions={[
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => navigate('/student/classrooms')}
            >
              View
            </Button>
          ]}
        >
          <List.Item.Meta
            avatar={
              <Avatar 
                style={{ backgroundColor: '#1890ff' }}
                icon={<BookOutlined />}
              />
            }
            title={classroom.name}
            description={
              <div>
                <Text type="secondary">{classroom.subject}</Text>
                <br />
                <Text type="secondary">
                  Teacher: {classroom.teacher?.fullName || 'Unknown'}
                </Text>
                <br />
                <Tag color="green" style={{ marginTop: 4 }}>
                  {classroom.students?.length || 0} students
                </Tag>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );

  const QuickActions = () => (
    <div className="space-y-3">
      <Button 
        type="primary" 
        size="large" 
        icon={<PlusOutlined />}
        block
        onClick={() => setJoinModalVisible(true)}
      >
        Join New Classroom
      </Button>
      <Button 
        size="large" 
        icon={<BookOutlined />}
        block
        onClick={() => navigate('/student/classrooms')}
      >
        View All Classrooms
      </Button>
      <Button 
        size="large" 
        icon={<UserOutlined />}
        block
        onClick={() => navigate('/student/profile')}
      >
        Edit Profile
      </Button>
    </div>
  );

  const WelcomeCard = () => (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-center">
        <div className="flex-1">
          <Title level={3} className="mb-2">
            Welcome Back! 👋
          </Title>
          <Paragraph className="text-gray-600 mb-4">
            You have {classrooms.length} active classroom{classrooms.length !== 1 ? 's' : ''}. 
            Keep up the great work in your learning journey!
          </Paragraph>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate('/student/classrooms')}
          >
            Go to Classrooms
          </Button>
        </div>
        <div className="text-6xl opacity-20">
          📚
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          Student Dashboard
        </Title>
        <Text type="secondary">
          Overview of your learning progress and activities
        </Text>
      </div>

      <WelcomeCard />

      {/* Stats Cards */}
      <Row gutter={[24, 24]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Enrolled Classrooms"
            value={stats.totalClassrooms}
            icon={<BookOutlined />}
            color="text-blue-500"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Assignments"
            value={stats.activeAssignments}
            icon={<ClockCircleOutlined />}
            color="text-orange-500"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Completed Quizzes"
            value={stats.completedQuizzes}
            icon={<TrophyOutlined />}
            color="text-green-500"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Overall Progress"
            value={stats.overallProgress}
            icon={<TrophyOutlined />}
            color="text-purple-500"
            suffix="%"
          />
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="My Classrooms" className="h-full">
            {classrooms.length > 0 ? (
              <RecentClassrooms />
            ) : (
              <Empty
                description="No classrooms joined yet"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button 
                  type="primary"
                  onClick={() => setJoinModalVisible(true)}
                >
                  Join Your First Classroom
                </Button>
              </Empty>
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="Quick Actions" className="mb-4">
            <QuickActions />
          </Card>
          
          <Card title="Learning Progress" className="mb-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Text>Overall Progress</Text>
                  <Text>{stats.overallProgress}%</Text>
                </div>
                <Progress 
                  percent={stats.overallProgress} 
                  strokeColor="#1890ff"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Text>Assignments</Text>
                  <Text>75%</Text>
                </div>
                <Progress percent={75} strokeColor="#52c41a" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Text>Quiz Performance</Text>
                  <Text>85%</Text>
                </div>
                <Progress percent={85} strokeColor="#faad14" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <QuickJoinClassroom
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default StudentDashboard;
