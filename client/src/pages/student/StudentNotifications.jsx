import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Space,
  message
} from 'antd';
import {
  BellOutlined,
  BookOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import NotificationList from '../../components/notifications/NotificationList';
import { useNotifications } from '../../contexts/NotificationContext';
import notificationAPI from '../../services/api/notification.api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const StudentNotifications = () => {
  const [stats, setStats] = useState({
    totalNotifications: 0,
    todayNotifications: 0,
    classNotifications: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = dayjs().startOf('day');
      const response = await notificationAPI.getMyNotifications({
        page: 1,
        limit: 1000
      });
      
      if (response.success) {
        const notifications = response.data.notifications;
        
        const todayNotifications = notifications.filter(n => 
          dayjs(n.createdAt).isSame(today, 'day')
        ).length;

        const classNotifications = notifications.filter(n => 
          ['class_general', 'class_specific'].includes(n.type)
        ).length;

        setStats({
          totalNotifications: notifications.length,
          todayNotifications,
          classNotifications
        });
      }
      
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="student-notifications-container">
      <div style={{ marginBottom: 24 }}>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Tổng số thông báo"
              value={stats.totalNotifications}
              prefix={<BellOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Hôm nay"
              value={stats.todayNotifications}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Thông báo lớp học"
              value={stats.classNotifications}
              prefix={<BookOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <NotificationList showFilters={true} />
    </div>
  );
};

export default StudentNotifications; 