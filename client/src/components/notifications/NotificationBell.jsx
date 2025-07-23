import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, Button, List, Typography, Empty, Spin, Avatar, Tag } from 'antd';
import { 
  BellOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import { useNotifications } from '../../contexts/NotificationContext';
import notificationAPI from '../../services/api/notification.api';
import dayjs from 'dayjs';
import './NotificationBell.css';

const { Text } = Typography;

const NotificationBell = () => {
  const {
    notifications,
    loading,
    setNotifications,
    setLoading
  } = useNotifications();

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (dropdownVisible && !initialLoad) {
      loadNotifications();
    }
  }, [dropdownVisible]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationAPI.getMyNotifications({
        page: 1,
        limit: 20
      });
      
      if (response.success) {
        setNotifications(response.data.notifications);
        setInitialLoad(true);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <StopOutlined style={{ color: '#ff4d4f' }} />;
      case 'high':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'normal':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      case 'low':
        return <InfoCircleOutlined style={{ color: '#52c41a' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'processing';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type) => {
    const typeLabels = {
      'system': 'System',
      'class_general': 'Class',
      'class_specific': 'Personal',
      'personal': 'Personal',
      'deadline': 'Deadline',
      'reminder': 'Reminder'
    };
    return typeLabels[type] || type;
  };

  const renderNotificationItem = (notification) => {
    return (
      <List.Item
        key={notification._id}
        className="notification-item"
      >
        <List.Item.Meta
          avatar={
            <div className="notification-avatar">
              {getPriorityIcon(notification.priority)}
            </div>
          }
          title={
            <div className="notification-title">
              <Text>{notification.title}</Text>
              <div className="notification-meta">
                <Tag color={getPriorityColor(notification.priority)} size="small">
                  {getTypeLabel(notification.type)}
                </Tag>
                <Text type="secondary" className="notification-time">
                  {dayjs(notification.createdAt).fromNow()}
                </Text>
              </div>
            </div>
          }
          description={
            <div className="notification-content">
              <Text type="secondary">
                {notification.content.length > 100 
                  ? `${notification.content.substring(0, 100)}...`
                  : notification.content
                }
              </Text>
              {notification.sender && (
                <div className="notification-sender">
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    From: {notification.sender.fullName}
                  </Text>
                </div>
              )}
            </div>
          }
        />
      </List.Item>
    );
  };

  const dropdownContent = (
    <div className="notification-dropdown">
      <div className="notification-header">
        <Text strong>Notifications</Text>
        {notifications.length > 0 && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {notifications.length} notification{notifications.length > 1 ? 's' : ''}
          </Text>
        )}
      </div>
      
      <div className="notification-content">
        {loading ? (
          <div className="notification-loading">
            <Spin size="small" />
            <Text type="secondary">Loading...</Text>
          </div>
        ) : notifications.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications"
            style={{ padding: '20px 0' }}
          />
        ) : (
          <List
            dataSource={notifications.slice(0, 10)}
            renderItem={renderNotificationItem}
            className="notification-list"
          />
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="notification-footer">
          <Button 
            type="link" 
            size="small"
            onClick={() => {
              setDropdownVisible(false);
              // Navigate to notifications page
              window.location.href = '/notifications';
            }}
          >
            View All Notifications
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      visible={dropdownVisible}
      onVisibleChange={setDropdownVisible}
      overlayClassName="notification-dropdown-overlay"
    >
      <Button
        type="text"
        shape="circle"
        className="notification-bell-button"
      >
        <Badge dot={notifications.length > 0} size="small">
          <BellOutlined style={{ fontSize: '18px' }} />
        </Badge>
      </Button>
    </Dropdown>
  );
};

export default NotificationBell; 