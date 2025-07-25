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
import assignmentAPI from '../../services/api/assignment.api';
import quizAPI from '../../services/api/quiz.api';

import QuickJoinClassroom from '../../components/student/QuickJoinClassroom';

const { Title, Text, Paragraph } = Typography;

const StudentDashboard = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalClassrooms: 0,
    assignmentStats: { total: 0, submittedCount: 0 },
    quizStats: { total: 0, gradedCount: 0 }
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

      const [assignmentRes, quizRes] = await Promise.all([
        assignmentAPI.getAssignmentStatsByStudent(),
        quizAPI.getQuizStatsByStudent()
      ]);

      const assignments = assignmentRes.data || [];
      const quizzes = quizRes.data || [];

      const assignmentStats = {
        total: assignments.length,
        submittedCount: assignments.filter((a) => a.submission !== null).length
      };

      const quizStats = {
        total: quizzes.length,
        gradedCount: quizzes.filter(
          (q) => q.submission && q.submission.score !== null
        ).length
      };

      setStats({
        totalClassrooms: classroomData.length,
        assignmentStats,
        quizStats
      });

      setClassrooms(classroomData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, suffix = '' }) => (
    <Card className="text-center">
      <div className={`text-3xl mb-2 ${color}`}>{icon}</div>
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
              <Avatar style={{ backgroundColor: '#1890ff' }} icon={<BookOutlined />} />
            }
            title={classroom.name}
            description={
              <div>
                <Text type="secondary">{classroom.subject}</Text>
                <br />
                <Text type="secondary">
                  Giáo Viên: {classroom.teacher?.fullName || 'Unknown'}
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
        Tham gia lớp học mới
      </Button>
      <Button
        size="large"
        icon={<BookOutlined />}
        block
        onClick={() => navigate('/student/classrooms')}
      >
        Xem tất cả lớp học
      </Button>
      <Button
        size="large"
        icon={<UserOutlined />}
        block
        onClick={() => navigate('/student/profile')}
      >
        Chỉnh sửa hồ sơ
      </Button>
    </div>
  );

  const WelcomeCard = () => (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-center">
        <div className="flex-1">
          <Title level={3} className="mb-2">
            Chào mừng bạn trở lại! 👋
          </Title>
          <Paragraph className="text-gray-600 mb-4">
            Bạn có {classrooms.length} lớp học đang hoạt động
            {classrooms.length !== 1 ? '' : ''}. Hãy tiếp tục phát huy!
          </Paragraph>
          <Button type="primary" size="large" onClick={() => navigate('/student/classrooms')}>
            Đến Lớp học
          </Button>
        </div>
        <div className="text-6xl opacity-20">📚</div>
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

  const { assignmentStats, quizStats } = stats;

  const assignmentPercent = assignmentStats.total
    ? Math.round((assignmentStats.submittedCount / assignmentStats.total) * 100)
    : 0;

  const quizPercent = quizStats.total
    ? Math.round((quizStats.gradedCount / quizStats.total) * 100)
    : 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          Bảng điều khiển học sinh
        </Title>
        <Text type="secondary">Tổng quan về tiến độ học tập và hoạt động của bạn</Text>
      </div>

      <WelcomeCard />

      <Row gutter={[24, 24]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Lớp học đã tham gia"
            value={stats.totalClassrooms}
            icon={<BookOutlined />}
            color="text-blue-500"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Bài tập đã nộp"
            value={assignmentStats.submittedCount}
            icon={<ClockCircleOutlined />}
            color="text-orange-500"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Bài kiểm tra đã chấm"
            value={quizStats.gradedCount}
            icon={<TrophyOutlined />}
            color="text-green-500"
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Lớp học của tôi" className="h-full">
            {classrooms.length > 0 ? (
              <RecentClassrooms />
            ) : (
              <Empty
                description="Chưa tham gia lớp học nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => setJoinModalVisible(true)}>
                  Tham gia lớp học đầu tiên
                </Button>
              </Empty>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Thao tác nhanh" className="mb-4">
            <QuickActions />
          </Card>

          <Card title="Tiến độ học tập" className="mb-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Text>Bài tập</Text>
                  <Text>
                    {assignmentStats.submittedCount}/{assignmentStats.total} 
                  </Text>
                </div>
                <Progress percent={assignmentPercent} strokeColor="#52c41a" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Text>Bài kiểm tra</Text>
                  <Text>
                    {quizStats.gradedCount}/{quizStats.total} 
                  </Text>
                </div>
                <Progress percent={quizPercent} strokeColor="#faad14" />
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
