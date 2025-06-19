import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  MailOutlined,
} from '@ant-design/icons';


const AdminDashboard = () => {

  // Mock data - replace with actual API calls
  const statistics = {
    totalUsers: 150,
    totalClassrooms: 25,
    totalQuizzes: 100,
    totalQuestions: 500,
  };

  const recentActivities = [
    {
      key: '1',
      type: 'user',
      action: 'New user registered',
      details: 'John Doe (Student)',
      time: '2 hours ago',
    },
    {
      key: '2',
      type: 'classroom',
      action: 'New classroom created',
      details: 'WDP301 - Web Development',
      time: '3 hours ago',
    },
    {
      key: '3',
      type: 'quiz',
      action: 'New quiz created',
      details: 'Midterm Exam - WDP301',
      time: '5 hours ago',
    },
    {
      key: '4',
      type: 'question',
      action: 'New questions added',
      details: '10 questions added to Question Bank',
      time: '1 day ago',
    },
  ];

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = {
          user: 'blue',
          classroom: 'green',
          quiz: 'purple',
          question: 'orange',
        };
        const icons = {
          user: <UserOutlined />,
          classroom: <TeamOutlined />,
          quiz: <FileTextOutlined />,
          question: <QuestionCircleOutlined />,
        };
        return (
          <Tag color={colors[type]}>
            {icons[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
    },
  ];

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={statistics.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Classrooms"
              value={statistics.totalClassrooms}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Quizzes"
              value={statistics.totalQuizzes}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Questions"
              value={statistics.totalQuestions}
              prefix={<QuestionCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Card title="Recent Activities">
        <Table
          columns={columns}
          dataSource={recentActivities}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;