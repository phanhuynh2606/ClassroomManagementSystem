import React from 'react';
import { Row, Col, Card, Statistic, List, Typography, Space, Button } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  BellOutlined,
  RiseOutlined
} from '@ant-design/icons';

const { Title } = Typography;

const DashboardOverview = () => {
  // TODO: Replace with actual data from API
  const stats = {
    totalUsers: 150,
    activeClassrooms: 12,
    totalQuizzes: 45,
    totalQuestions: 300,
    pendingNotifications: 5,
    activeStudents: 120
  };

  const recentActivities = [
    { id: 1, action: 'New user registered', time: '2 minutes ago' },
    { id: 2, action: 'New classroom created', time: '15 minutes ago' },
    { id: 3, action: 'Quiz submitted', time: '1 hour ago' },
    { id: 4, action: 'Question added', time: '2 hours ago' },
    { id: 5, action: 'Notification sent', time: '3 hours ago' }
  ];

  const quickActions = [
    { label: 'Add New User', icon: <UserOutlined /> },
    { label: 'Create Classroom', icon: <TeamOutlined /> },
    { label: 'Create Quiz', icon: <FileTextOutlined /> },
    { label: 'Add Question', icon: <QuestionCircleOutlined /> },
    { label: 'Send Notification', icon: <BellOutlined /> }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Active Classrooms"
              value={stats.activeClassrooms}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Quizzes"
              value={stats.totalQuizzes}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Questions"
              value={stats.totalQuestions}
              prefix={<QuestionCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Pending Notifications"
              value={stats.pendingNotifications}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Active Students"
              value={stats.activeStudents}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="Recent Activity">
            <List
              dataSource={recentActivities}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.action}
                    description={item.time}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Quick Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  icon={action.icon}
                  block
                >
                  {action.label}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default DashboardOverview; 