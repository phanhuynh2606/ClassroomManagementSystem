import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Statistic, 
  Progress,
  List,
  Avatar,
  Tag,
  Space,
  Calendar,
  Badge
} from 'antd';
import { 
  BookOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  BarChartOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './teacher.css';

const { Title, Text } = Typography;

const TeacherDashboard = () => {
  const navigate = useNavigate();

  // Mock data - thay thế bằng API calls trong thực tế
  const [stats, setStats] = useState({
    totalClasses: 3,
    totalStudents: 45,
    pendingApprovals: 1,
    completedAssignments: 28
  });

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: 'student_joined',
      message: 'Nguyễn Văn A đã tham gia lớp Toán học 10A',
      time: '2 giờ trước',
      avatar: 'A'
    },
    {
      id: 2,
      type: 'assignment_submitted',
      message: 'Trần Thị B đã nộp bài tập Chương 1',
      time: '4 giờ trước',
      avatar: 'B'
    },
    {
      id: 3,
      type: 'class_created',
      message: 'Lớp Hóa học 12C đã được tạo và chờ phê duyệt',
      time: '1 ngày trước',
      avatar: 'H'
    }
  ]);

  const [upcomingEvents, setUpcomingEvents] = useState([
    {
      id: 1,
      title: 'Kiểm tra chương 2 - Toán học 10A',
      date: '2023-09-15',
      time: '08:00'
    },
    {
      id: 2,
      title: 'Deadline bài tập - Vật lý 11B',
      date: '2023-09-16',
      time: '23:59'
    }
  ]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'student_joined':
        return <UserOutlined className="text-blue-500" />;
      case 'assignment_submitted':
        return <CheckCircleOutlined className="text-green-500" />;
      case 'class_created':
        return <BookOutlined className="text-purple-500" />;
      default:
        return <ClockCircleOutlined className="text-gray-500" />;
    }
  };

  const QuickActions = () => (
    <Card 
      title="Hành động nhanh" 
      className="h-full"
      extra={<BookOutlined className="text-blue-500" />}
    >
      <div className="space-y-3">
        <Button 
          type="primary" 
          block 
          icon={<PlusOutlined />}
          onClick={() => navigate('/teacher/classroom')}
          className="h-12 text-left flex items-center"
        >
          Tạo lớp học mới
        </Button>
        <Button 
          block 
          icon={<EyeOutlined />}
          onClick={() => navigate('/teacher/classroom')}
          className="h-12 text-left flex items-center"
        >
          Xem tất cả lớp học
        </Button>
        <Button 
          block 
          icon={<BarChartOutlined />}
          onClick={() => navigate('/teacher/reports')}
          className="h-12 text-left flex items-center"
        >
          Xem báo cáo
        </Button>
        <Button 
          block 
          icon={<CalendarOutlined />}
          onClick={() => navigate('/teacher/schedule')}
          className="h-12 text-left flex items-center"
        >
          Quản lý lịch học
        </Button>
      </div>
    </Card>
  );

  const StatsOverview = () => (
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={6}>
        <Card className="text-center h-full">
          <Statistic
            title="Tổng số lớp học"
            value={stats.totalClasses}
            prefix={<BookOutlined className="text-blue-500" />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="text-center h-full">
          <Statistic
            title="Tổng số học sinh"
            value={stats.totalStudents}
            prefix={<UserOutlined className="text-green-500" />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="text-center h-full">
          <Statistic
            title="Chờ phê duyệt"
            value={stats.pendingApprovals}
            prefix={<ClockCircleOutlined className="text-orange-500" />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="text-center h-full">
          <Statistic
            title="Bài tập đã hoàn thành"
            value={stats.completedAssignments}
            prefix={<CheckCircleOutlined className="text-purple-500" />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
    </Row>
  );

  const RecentActivities = () => (
    <Card 
      title="Hoạt động gần đây" 
      className="h-full"
      extra={<ClockCircleOutlined className="text-gray-500" />}
    >
      <List
        dataSource={recentActivities}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Badge dot={item.type === 'student_joined'}>
                  <Avatar style={{ backgroundColor: '#1890ff' }}>
                    {item.avatar}
                  </Avatar>
                </Badge>
              }
              title={
                <div className="flex items-center gap-2">
                  {getActivityIcon(item.type)}
                  <Text className="text-sm">{item.message}</Text>
                </div>
              }
              description={
                <Text type="secondary" className="text-xs">
                  {item.time}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  const UpcomingEvents = () => (
    <Card 
      title="Sự kiện sắp tới" 
      className="h-full"
      extra={<CalendarOutlined className="text-blue-500" />}
    >
      <div className="space-y-4">
        {upcomingEvents.map((event) => (
          <div key={event.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <div className="flex justify-between items-start">
              <div>
                <Text strong className="block text-sm">
                  {event.title}
                </Text>
                <Text type="secondary" className="text-xs">
                  {event.date} • {event.time}
                </Text>
              </div>
              <Tag color="blue" className="text-xs">
                Sắp tới
              </Tag>
            </div>
          </div>
        ))}
        {upcomingEvents.length === 0 && (
          <div className="text-center py-8">
            <CalendarOutlined className="text-4xl text-gray-300 mb-2" />
            <Text type="secondary">Không có sự kiện nào sắp tới</Text>
          </div>
        )}
      </div>
    </Card>
  );

  const ClassPerformance = () => (
    <Card title="Hiệu suất lớp học" className="h-full">
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <Text className="text-sm">Toán học 10A</Text>
            <Text className="text-sm">85%</Text>
          </div>
          <Progress percent={85} strokeColor="#52c41a" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <Text className="text-sm">Vật lý 11B</Text>
            <Text className="text-sm">92%</Text>
          </div>
          <Progress percent={92} strokeColor="#1890ff" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <Text className="text-sm">Hóa học 12C</Text>
            <Text className="text-sm">--</Text>
          </div>
          <Progress percent={0} strokeColor="#faad14" />
          <Text type="secondary" className="text-xs">
            Chưa có học sinh tham gia
          </Text>
        </div>
      </div>
    </Card>
  );

  return (
    <div 
      className="teacher-dashboard-content"
      style={{ 
        background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%)',
        padding: '24px'
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <Title level={1} style={{ color: '#1565C0', marginBottom: '8px' }}>
            Dashboard Giáo viên
          </Title>
          <Text className="text-lg text-gray-600">
            Chào mừng trở lại! Đây là tổng quan về các lớp học của bạn.
          </Text>
        </div>

        {/* Stats Overview */}
        <div className="mb-6">
          <StatsOverview />
        </div>

        {/* Main Content */}
        <Row gutter={[24, 24]}>
          {/* Left Column */}
          <Col xs={24} lg={16}>
            <div className="space-y-6">
              {/* Recent Activities */}
              <RecentActivities />
              
              {/* Class Performance */}
              <ClassPerformance />
            </div>
          </Col>

          {/* Right Column */}
          <Col xs={24} lg={8}>
            <div className="space-y-6">
              {/* Quick Actions */}
              <QuickActions />
              
              {/* Upcoming Events */}
              <UpcomingEvents />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default TeacherDashboard; 