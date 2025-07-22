import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Badge,
  Tooltip,
  Divider,
  Alert
} from 'antd';
import {
  BellOutlined,
  PlusOutlined,
  EyeOutlined,
  SendOutlined,
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  StopOutlined,
  MailOutlined,
  SearchOutlined,
  BookOutlined
} from '@ant-design/icons';
import notificationAPI from '../../services/api/notification.api';
import classroomAPI from '../../services/api/classroom.api';
import { useSocket } from '../../hooks/useSocket';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TeacherNotifications = () => {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalReceived: 0,
    classNotifications: 0,
    todayReceived: 0,
    personalNotifications: 0
  });
  
  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  // Form and filters
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    priority: undefined,
    dateRange: undefined,
    search: ''
  });

  // Teacher-specific data
  const [classrooms, setClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [selectedClassroomStudents, setSelectedClassroomStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
    fetchClassrooms();
  }, []);

  // Socket event listeners for real-time notifications
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (data) => {
        console.log('Teacher received new notification:', data);
        const { notification } = data;
        
        // Add new notification to the beginning of the list
        setNotifications(prev => [notification, ...prev]);
        
        // Show toast message for new notification
        message.info({
          content: `New notification: ${notification.title}`,
          duration: 4,
          onClick: () => {
            // Optionally handle click to show notification details
            console.log('Clicked on notification toast');
          }
        });
        
        // Update stats
        fetchStats();
      };

      socket.on('newNotification', handleNewNotification);

      return () => {
        socket.off('newNotification', handleNewNotification);
      };
    }
  }, [socket]);

      // Filter notifications based on search and other filters
  useEffect(() => {
    if (!Array.isArray(notifications)) {
      setFilteredNotifications([]);
      return;
    }

    let filtered = [...notifications];

    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(notification => {
        if (!notification) return false;
        
        const title = notification.title || '';
        const content = notification.content || '';
        const senderName = notification.sender?.fullName || '';
        
        return title.toLowerCase().includes(searchTerm) ||
               content.toLowerCase().includes(searchTerm) ||
               senderName.toLowerCase().includes(searchTerm);
      });
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(notification => notification && notification.priority === filters.priority);
    }

    // Date range filter
    if (filters.dateRange && Array.isArray(filters.dateRange) && filters.dateRange.length === 2) {
      try {
        const startDate = filters.dateRange[0].startOf('day');
        const endDate = filters.dateRange[1].endOf('day');
        filtered = filtered.filter(notification => {
          if (!notification || !notification.createdAt) return false;
          const notificationDate = dayjs(notification.createdAt);
          return notificationDate.isAfter(startDate) && notificationDate.isBefore(endDate);
        });
      } catch (error) {
        console.error('Date filtering error:', error);
      }
    }

    setFilteredNotifications(filtered);
  }, [notifications, filters]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {
        page: 1,
        limit: 100
      };

      // Get notifications received by teacher
      const response = await notificationAPI.getMyNotifications(params);
      
      if (response && response.success && response.data) {
        const fetchedNotifications = response.data.notifications || [];
        setNotifications(fetchedNotifications);
        setFilteredNotifications(fetchedNotifications);
      } else {
        setNotifications([]);
        setFilteredNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      message.error('Error fetching notifications');
      setNotifications([]);
      setFilteredNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get received notifications for teacher
      const response = await notificationAPI.getMyNotifications({
        page: 1,
        limit: 1000
      });
      
      if (response && response.success && response.data) {
        const notifications = response.data.notifications || [];
        const today = dayjs().startOf('day');
        
        const todayReceived = notifications.filter(n => 
          n && n.createdAt && dayjs(n.createdAt).isSame(today, 'day')
        ).length;

        const classNotifications = notifications.filter(n => 
          n && (n.type === 'class_general' || n.type === 'class_specific')
        ).length;

        const personalNotifications = notifications.filter(n => 
          n && n.type === 'personal'
        ).length;

        setStats({
          totalReceived: notifications.length,
          classNotifications,
          todayReceived,
          personalNotifications
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchClassrooms = async () => {
    setLoadingClassrooms(true);
    try {
      const response = await classroomAPI.getTeacherClassrooms();
      if (response && response.success) {
        setClassrooms(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    } finally {
      setLoadingClassrooms(false);
    }
  };

  const fetchClassroomStudents = async (classroomId) => {
    if (!classroomId) return;
    
    setLoadingStudents(true);
    try {
      const response = await notificationAPI.getClassroomStudents(classroomId);
      if (response && response.success) {
        setSelectedClassroomStudents(response.data.students || []);
      }
    } catch (error) {
      console.error('Error fetching classroom students:', error);
      setSelectedClassroomStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleCreateNotification = async (values) => {
    try {
      const response = await notificationAPI.createNotification(values);
      if (response && response.success) {
        message.success('Notification sent successfully');
        setCreateModalVisible(false);
        form.resetFields();
        setSelectedClassroomStudents([]);
        fetchNotifications();
        fetchStats();
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      message.error('Error sending notification');
    }
  };

  const handleTypeChange = (type) => {
    form.setFieldsValue({ type });
    // Reset classroom and students when changing type
    form.setFieldsValue({ classroomId: undefined, recipientIds: undefined });
    setSelectedClassroomStudents([]);
  };

  const handleClassroomChange = (classroomId) => {
    form.setFieldsValue({ classroomId });
    form.setFieldsValue({ recipientIds: undefined }); // Reset recipients
    fetchClassroomStudents(classroomId);
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
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'processing';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'system': return 'purple';
      case 'class_general': return 'blue';
      case 'class_specific': return 'cyan';
      case 'personal': return 'green';
      case 'deadline': return 'orange';
      case 'reminder': return 'geekblue';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => (a.title || '').localeCompare(b.title || ''),
      render: (text, record) => (
        <div>
          <Text strong>{text || 'No title'}</Text>
          <div style={{ marginTop: 4 }}>
            <Space size={4}>
              {getPriorityIcon(record.priority)}
              <Tag color={getPriorityColor(record.priority)} size="small">
                {record.priority || 'normal'}
              </Tag>
              <Tag color={getTypeColor(record.type)} size="small">
                {record.type || 'unknown'}
              </Tag>
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: 'From',
      dataIndex: 'sender',
      key: 'sender',
      render: (sender) => (
        <div>
          <Text>{sender?.fullName || 'Unknown'}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {sender?.role || 'N/A'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      render: (content) => (
        <Text ellipsis style={{ maxWidth: 200 }}>
          {content || 'No content'}
        </Text>
      ),
    },
    {
      title: 'Received',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: 'descend',
      sortDirections: ['descend', 'ascend'],
      render: (date) => {
        if (!date) return <Text type="secondary">No date</Text>;
        return (
          <div>
            <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {dayjs(date).format('HH:mm')}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedNotification(record);
                setViewModalVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const displayFilteredNotifications = Array.isArray(filteredNotifications) ? filteredNotifications : [];
  const displayNotifications = Array.isArray(notifications) ? notifications : [];

  return (
    <div className="teacher-notifications-container">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>
            
          </Title>
          <Button
            style={{marginTop: 16}}
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create Notification
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Received"
              value={stats.totalReceived}
              prefix={<MailOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Class Notifications"
              value={stats.classNotifications}
              prefix={<BookOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Personal Messages"
              value={stats.personalNotifications}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Today"
              value={stats.todayReceived}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Notifications List */}
      <Card 
        title={
          <Space>
            My Notifications
            {(filters.search || filters.priority || filters.dateRange) && (
              <Badge 
                count={
                  (filters.search ? 1 : 0) + 
                  (filters.priority ? 1 : 0) + 
                  (filters.dateRange ? 1 : 0)
                } 
                size="small"
                title="Active filters"
              />
            )}
          </Space>
        } 
        extra={
        <Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {displayFilteredNotifications.length !== displayNotifications.length 
              ? `Showing ${displayFilteredNotifications.length} of ${displayNotifications.length} notifications`
              : `${displayNotifications.length} notifications (sorted by newest first)`
            }
          </Text>
          {isConnected ? (
            <Tag color="green" size="small">Real-time Active</Tag>
          ) : (
            <Tag color="orange" size="small">Real-time Connecting...</Tag>
          )}
          <Button onClick={fetchNotifications} loading={loading} icon={<BellOutlined />}>
            Refresh
          </Button>
        </Space>
      }>
        {/* Filters */}
        <Card style={{ marginBottom: 16, background: '#fafafa' }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={8}>
              <Input
                placeholder="Search notifications by title or content..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                allowClear
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Select
                placeholder="Priority"
                allowClear
                style={{ width: '100%' }}
                value={filters.priority}
                onChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <Option value="urgent">Urgent</Option>
                <Option value="high">High</Option>
                <Option value="normal">Normal</Option>
                <Option value="low">Low</Option>
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <RangePicker
                style={{ width: '100%' }}
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              />
            </Col>
            <Col xs={24} sm={2}>
              <Button 
                onClick={() => {
                  setFilters({
                    priority: undefined,
                    dateRange: undefined,
                    search: ''
                  });
                }} 
                title="Clear all filters"
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Notifications Table */}
        <Table
          columns={columns}
          dataSource={displayFilteredNotifications}
          loading={loading}
          rowKey="_id"
          pagination={{
            total: displayFilteredNotifications.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} notifications`,
          }}
          locale={{
            emptyText: filters.search || filters.priority || filters.dateRange 
              ? 'No notifications match your search criteria' 
              : 'No notifications received yet'
          }}
        />
      </Card>

      {/* Create Notification Modal */}
      <Modal
        title={<><SendOutlined /> Send Notification to Class</>}
        visible={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
          setSelectedClassroomStudents([]);
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateNotification}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please input notification title' }]}
          >
            <Input placeholder="Notification title" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: 'Please input notification content' }]}
          >
            <TextArea rows={4} placeholder="Notification content" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="type"
                label="Send To"
                rules={[{ required: true, message: 'Please select notification type' }]}
              >
                <Select placeholder="Select type" onChange={handleTypeChange}>
                  <Option value="class_general">Entire Class</Option>
                  <Option value="class_specific">Individual Students</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="priority"
                label="Priority"
                initialValue="normal"
              >
                <Select>
                  <Option value="low">Low</Option>
                  <Option value="normal">Normal</Option>
                  <Option value="high">High</Option>
                  <Option value="urgent">Urgent</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const notificationType = getFieldValue('type');
              
              if (notificationType === 'class_general' || notificationType === 'class_specific') {
                return (
                  <>
                    <Form.Item
                      name="classroomId"
                      label="Select Class"
                      rules={[{ required: true, message: 'Please select a class' }]}
                    >
                      <Select 
                        placeholder="Select classroom"
                        loading={loadingClassrooms}
                        onChange={handleClassroomChange}
                      >
                        {Array.isArray(classrooms) ? classrooms.map(classroom => (
                          <Option key={classroom._id} value={classroom._id}>
                            {classroom.name} ({classroom.code})
                          </Option>
                        )) : []}
                      </Select>
                    </Form.Item>
                    
                    {notificationType === 'class_specific' && (
                      <Form.Item
                        name="recipientIds"
                        label="Select Students"
                        rules={[{ required: true, message: 'Please select students' }]}
                      >
                        <Select
                          mode="multiple"
                          placeholder="Select students"
                          loading={loadingStudents}
                          notFoundContent={loadingStudents ? 'Loading students...' : 'No students found'}
                        >
                          {Array.isArray(selectedClassroomStudents) ? selectedClassroomStudents.map(student => (
                            <Option key={student._id} value={student._id}>
                              {student.fullName} ({student.email})
                            </Option>
                          )) : []}
                        </Select>
                      </Form.Item>
                    )}
                  </>
                );
              }
              
              return null;
            }}
          </Form.Item>
          
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
                setSelectedClassroomStudents([]);
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Send to Class
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* View Notification Modal */}
      <Modal
        title="Notification Details"
        visible={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedNotification(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewModalVisible(false);
            setSelectedNotification(null);
          }}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedNotification && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Title level={4}>{selectedNotification.title}</Title>
              <Space>
                <Tag color={getPriorityColor(selectedNotification.priority)}>
                  {selectedNotification.priority}
                </Tag>
                <Tag color={getTypeColor(selectedNotification.type)}>
                  {selectedNotification.type}
                </Tag>
              </Space>
            </div>
            
            <Divider />
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>Content:</Text>
              <div style={{ marginTop: 8, padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                <Text>{selectedNotification.content}</Text>
              </div>
            </div>
            
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>From:</Text>
                <div>
                  <Text>{selectedNotification.sender?.fullName}</Text>
                  <br />
                  <Text type="secondary">({selectedNotification.sender?.role})</Text>
                </div>
              </Col>
              <Col span={12}>
                <Text strong>Received:</Text>
                <div>
                  <Text>{dayjs(selectedNotification.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeacherNotifications; 