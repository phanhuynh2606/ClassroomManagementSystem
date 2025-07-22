import React, { useState, useEffect } from 'react';
import {
  List,
  Card,
  Avatar,
  Typography,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Select,
  Input,
  Pagination,
  Empty,
  Spin,
  Tooltip,
  message
} from 'antd';
import {
  BellOutlined,
  FilterOutlined,
  SearchOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNotifications } from '../../contexts/NotificationContext';
import notificationAPI from '../../services/api/notification.api';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const NotificationList = ({ showFilters = true, pageSize = 10 }) => {
  const {
    notifications,
    loading,
    page,
    hasMore,
    setNotifications,
    setLoading,
    setPage
  } = useNotifications();

  const [filters, setFilters] = useState({
    priority: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadNotifications(1);
  }, [filters]);

  const loadNotifications = async (pageNum = 1) => {
    setLocalLoading(true);
    try {
      const params = {
        page: pageNum,
        limit: pageSize,
        ...filters
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await notificationAPI.getMyNotifications(params);
      
      if (response.success) {
        if (pageNum === 1) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        setTotal(response.data.total || response.data.notifications.length);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      message.error('Unable to load notifications');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    loadNotifications(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLoadMore = () => {
    if (!localLoading && hasMore) {
      loadNotifications(page + 1);
    }
  };

  const getPriorityIcon = (priority) => {
    const iconProps = { style: { fontSize: '16px' } };
    switch (priority) {
      case 'urgent':
        return <StopOutlined {...iconProps} style={{ color: '#ff4d4f' }} />;
      case 'high':
        return <ExclamationCircleOutlined {...iconProps} style={{ color: '#faad14' }} />;
      case 'normal':
        return <InfoCircleOutlined {...iconProps} style={{ color: '#1890ff' }} />;
      case 'low':
        return <InfoCircleOutlined {...iconProps} style={{ color: '#52c41a' }} />;
      default:
        return <InfoCircleOutlined {...iconProps} style={{ color: '#1890ff' }} />;
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
      'class_general': 'Class General',
      'class_specific': 'Class Specific',
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
        className="notification-list-item"
        actions={[
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {dayjs(notification.createdAt).format('DD/MM/YYYY HH:mm')}
          </Text>
        ]}
      >
        <List.Item.Meta
          avatar={
            <Avatar 
              icon={getPriorityIcon(notification.priority)} 
              style={{ backgroundColor: 'transparent' }}
            />
          }
          title={
            <div className="notification-item-title">
              <Space>
                <Text>{notification.title}</Text>
                <Tag color={getPriorityColor(notification.priority)} size="small">
                  {getTypeLabel(notification.type)}
                </Tag>
                {notification.priority === 'urgent' && (
                  <Tag color="red" size="small">URGENT</Tag>
                )}
              </Space>
            </div>
          }
          description={
            <div className="notification-item-content">
              <Text type="secondary">
                {notification.content.length > 150 
                  ? `${notification.content.substring(0, 150)}...`
                  : notification.content
                }
              </Text>
              {notification.sender && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    From: {notification.sender.fullName} ({notification.sender.role})
                  </Text>
                </div>
              )}
              {notification.classroom && (
                <div style={{ marginTop: '4px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Class: {notification.classroom.name} ({notification.classroom.code})
                  </Text>
                </div>
              )}
            </div>
          }
        />
      </List.Item>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading notifications...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-list-container">
      {showFilters && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8} md={8}>
              <Input
                placeholder="Search notifications by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={(e) => handleSearch(e.target.value)}
                allowClear
                prefix={<SearchOutlined />}
              />
            </Col>
            
            <Col xs={12} sm={4} md={4}>
              <Select
                placeholder="Priority"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('priority', value)}
              >
                <Option value="urgent">Urgent</Option>
                <Option value="high">High</Option>
                <Option value="normal">Normal</Option>
                <Option value="low">Low</Option>
              </Select>
            </Col>
            
            <Col xs={12} sm={4} md={3}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadNotifications(1)}
                loading={localLoading}
              >
                Refresh
              </Button>
            </Col>
            
            <Col xs={12} sm={4} md={3}>
              <Button
                onClick={() => {
                  setFilters({ priority: null });
                  setSearchTerm('');
                  loadNotifications(1);
                }}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {notifications.length === 0 ? (
        <Card>
          <Empty
            description="No notifications found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <Card>
          <List
            dataSource={notifications}
            renderItem={renderNotificationItem}
            loading={localLoading}
          />
          
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button 
                onClick={handleLoadMore} 
                loading={localLoading}
                type="default"
              >
                Load More
              </Button>
            </div>
          )}
          
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Text type="secondary">
              {notifications.length > 0 && `1-${notifications.length} of ${total} notifications`}
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default NotificationList; 