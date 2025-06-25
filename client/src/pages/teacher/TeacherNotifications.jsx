import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  List,
  Avatar,
  Button,
  Badge,
  Tabs,
  Space,
  Typography,
  Input,
  Select,
  Dropdown,
  Modal,
  message,
  Empty,
  Tooltip,
  Tag,
  Row,
  Col,
  Statistic,
  Divider,
  Switch,
  Pagination
} from 'antd';
import {
  BellOutlined,
  MailOutlined,
  TeamOutlined,
  BookOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  MoreOutlined,
  FilterOutlined,
  SettingOutlined,
  BellFilled,
  CheckOutlined,
  CloseOutlined,
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const TeacherNotifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { user } = useSelector((state) => state.auth);

  // Mock notifications data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'assignment',
      title: 'Bài tập mới được nộp',
      message: 'Học sinh Nguyễn Văn A đã nộp bài tập "JavaScript Fundamentals"',
      sender: {
        name: 'Nguyễn Văn A',
        avatar: null,
        role: 'student'
      },
      classroom: 'WDP301 - Web Development',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      isRead: false,
      priority: 'medium',
      category: 'submission'
    },
    {
      id: 2,
      type: 'announcement',
      title: 'Thông báo từ Admin',
      message: 'Hệ thống sẽ bảo trì vào 23:00 hôm nay. Vui lòng hoàn thành công việc trước giờ này.',
      sender: {
        name: 'Admin System',
        avatar: null,
        role: 'admin'
      },
      classroom: null,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false,
      priority: 'high',
      category: 'system'
    },
    {
      id: 3,
      type: 'student_request',
      title: 'Yêu cầu tham gia lớp học',
      message: 'Học sinh Trần Thị B yêu cầu tham gia lớp "Advanced React"',
      sender: {
        name: 'Trần Thị B',
        avatar: null,
        role: 'student'
      },
      classroom: 'React Advanced Course',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isRead: true,
      priority: 'medium',
      category: 'request'
    },
    {
      id: 4,
      type: 'deadline',
      title: 'Nhắc nhở deadline',
      message: 'Bài tập "Database Design" sẽ hết hạn trong 2 ngày nữa',
      sender: {
        name: 'System',
        avatar: null,
        role: 'system'
      },
      classroom: 'DBI301 - Database',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isRead: true,
      priority: 'high',
      category: 'reminder'
    },
    {
      id: 5,
      type: 'comment',
      title: 'Bình luận mới',
      message: 'Học sinh Lê Văn C đã bình luận trong bài "Introduction to AI"',
      sender: {
        name: 'Lê Văn C',
        avatar: null,
        role: 'student'
      },
      classroom: 'AI101 - Artificial Intelligence',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isRead: true,
      priority: 'low',
      category: 'interaction'
    }
  ]);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    assignmentSubmissions: true,
    studentRequests: true,
    systemUpdates: true,
    deadlineReminders: true,
    comments: false
  });

  // Statistics
  const stats = useMemo(() => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const todayCount = notifications.filter(n => {
      const today = new Date();
      const notifDate = new Date(n.timestamp);
      return notifDate.toDateString() === today.toDateString();
    }).length;
    const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.isRead).length;

    return {
      total: notifications.length,
      unread: unreadCount,
      today: todayCount,
      highPriority: highPriorityCount
    };
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (activeTab === 'read') {
      filtered = filtered.filter(n => n.isRead);
    }

    if (searchText) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchText.toLowerCase()) ||
        n.message.toLowerCase().includes(searchText.toLowerCase()) ||
        n.sender.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === filterPriority);
    }

    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [notifications, activeTab, searchText, filterType, filterPriority]);

  // Paginated notifications
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredNotifications.slice(startIndex, endIndex);
  }, [filteredNotifications, currentPage, pageSize]);

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment': return <CheckSquareOutlined className="text-blue-500" />;
      case 'announcement': return <BellFilled className="text-orange-500" />;
      case 'student_request': return <UserOutlined className="text-green-500" />;
      case 'deadline': return <ClockCircleOutlined className="text-red-500" />;
      case 'comment': return <MailOutlined className="text-purple-500" />;
      default: return <BellOutlined className="text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  // Mark as read/unread
  const toggleReadStatus = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n)
    );
  };

  // Delete notification
  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    message.success('Đã xóa thông báo');
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    message.success('Đã đánh dấu tất cả là đã đọc');
  };

  // Delete selected notifications
  const deleteSelected = () => {
    if (selectedNotifications.length === 0) {
      message.warning('Vui lòng chọn thông báo để xóa');
      return;
    }
    
    Modal.confirm({
      title: 'Xóa thông báo',
      content: `Bạn có chắc muốn xóa ${selectedNotifications.length} thông báo đã chọn?`,
      onOk: () => {
        setNotifications(prev => 
          prev.filter(n => !selectedNotifications.includes(n.id))
        );
        setSelectedNotifications([]);
        message.success('Đã xóa thông báo đã chọn');
      }
    });
  };

  // Notification action menu
  const getActionMenu = (notification) => ({
    items: [
      {
        key: 'read',
        icon: notification.isRead ? <CloseOutlined /> : <CheckOutlined />,
        label: notification.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc',
        onClick: () => toggleReadStatus(notification.id)
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Xóa',
        danger: true,
        onClick: () => deleteNotification(notification.id)
      }
    ]
  });

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          <BellOutlined /> Tất cả
          <Badge count={stats.total} style={{ marginLeft: 8 }} />
        </span>
      )
    },
    {
      key: 'unread',
      label: (
        <span>
          <MailOutlined /> Chưa đọc
          <Badge count={stats.unread} style={{ marginLeft: 8 }} />
        </span>
      )
    },
    {
      key: 'read',
      label: (
        <span>
          <EyeOutlined /> Đã đọc
          <Badge count={stats.total - stats.unread} style={{ marginLeft: 8 }} />
        </span>
      )
    }
  ];

  return (
    <div className="p-6" style={{ minHeight: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
      {/* Header */}
      <div className="mb-6">
        <Title level={2} className="mb-0">
          <BellOutlined className="mr-3" />
          Thông báo
        </Title>
        <Text type="secondary">Quản lý và theo dõi các thông báo của bạn</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số thông báo"
              value={stats.total}
              prefix={<BellOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Chưa đọc"
              value={stats.unread}
              prefix={<MailOutlined className="text-orange-500" />}
              valueStyle={{ color: '#ff7875' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hôm nay"
              value={stats.today}
              prefix={<CalendarOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Ưu tiên cao"
              value={stats.highPriority}
              prefix={<ExclamationCircleOutlined className="text-red-500" />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card className="shadow-sm">
        {/* Toolbar */}
        <div className="mb-4">
          <Row gutter={16} align="middle">
            <Col xs={24} md={12}>
              <Space wrap>
                <Search
                  placeholder="Tìm kiếm thông báo..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                />
                <Select
                  value={filterType}
                  onChange={setFilterType}
                  style={{ width: 150 }}
                  placeholder="Loại thông báo"
                >
                  <Option value="all">Tất cả loại</Option>
                  <Option value="assignment">Bài tập</Option>
                  <Option value="announcement">Thông báo</Option>
                  <Option value="student_request">Yêu cầu</Option>
                  <Option value="deadline">Deadline</Option>
                  <Option value="comment">Bình luận</Option>
                </Select>
                <Select
                  value={filterPriority}
                  onChange={setFilterPriority}
                  style={{ width: 130 }}
                  placeholder="Ưu tiên"
                >
                  <Option value="all">Tất cả</Option>
                  <Option value="high">Cao</Option>
                  <Option value="medium">Trung bình</Option>
                  <Option value="low">Thấp</Option>
                </Select>
              </Space>
            </Col>
            <Col xs={24} md={12} className="text-right">
              <Space>
                <Button 
                  icon={<CheckOutlined />}
                  onClick={markAllAsRead}
                  disabled={stats.unread === 0}
                >
                  Đánh dấu tất cả đã đọc
                </Button>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={deleteSelected}
                  disabled={selectedNotifications.length === 0}
                  danger
                >
                  Xóa đã chọn ({selectedNotifications.length})
                </Button>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setShowSettings(true)}
                >
                  Cài đặt
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="mb-4"
        />

        {/* Notifications List */}
        {paginatedNotifications.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có thông báo nào"
          />
        ) : (
          <>
            <List
              itemLayout="vertical"
              dataSource={paginatedNotifications}
              renderItem={(notification) => (
                <List.Item
                  key={notification.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  extra={
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="mb-2">
                          <Tag color={getPriorityColor(notification.priority)}>
                            {notification.priority === 'high' ? 'Cao' : 
                             notification.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                          </Tag>
                        </div>
                        <Text type="secondary" className="text-xs">
                          {formatTimeAgo(notification.timestamp)}
                        </Text>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip title="Xem chi tiết">
                          <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => toggleReadStatus(notification.id)}
                            size="small"
                          />
                        </Tooltip>
                        <Dropdown
                          menu={getActionMenu(notification)}
                          trigger={['click']}
                        >
                          <Button
                            type="text"
                            icon={<MoreOutlined />}
                            size="small"
                          />
                        </Dropdown>
                      </div>
                    </div>
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <div className="relative">
                        <Avatar
                          icon={notification.sender.avatar ? undefined : <UserOutlined />}
                          src={notification.sender.avatar}
                          size={48}
                        />
                        <div className="absolute -bottom-1 -right-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className={notification.isRead ? 'text-gray-600' : 'font-semibold'}>
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <Badge status="processing" />
                        )}
                      </div>
                    }
                    description={
                      <div>
                        <Paragraph 
                          className={`mb-2 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}
                          ellipsis={{ rows: 2, expandable: true }}
                        >
                          {notification.message}
                        </Paragraph>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Từ: {notification.sender.name}</span>
                          {notification.classroom && (
                            <span>Lớp: {notification.classroom}</span>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            {/* Pagination */}
            <div className="mt-6 text-center">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredNotifications.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} trong ${total} thông báo`
                }
                pageSizeOptions={['10', '20', '50', '100']}
              />
            </div>
          </>
        )}
      </Card>

      {/* Settings Modal */}
      <Modal
        title="Cài đặt thông báo"
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        onOk={() => {
          message.success('Đã lưu cài đặt thông báo');
          setShowSettings(false);
        }}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <Title level={5}>Phương thức nhận thông báo</Title>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Email thông báo</span>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onChange={(checked) =>
                    setNotificationSettings(prev => ({
                      ...prev,
                      emailNotifications: checked
                    }))
                  }
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Push notifications</span>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onChange={(checked) =>
                    setNotificationSettings(prev => ({
                      ...prev,
                      pushNotifications: checked
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <Divider />

          <div>
            <Title level={5}>Loại thông báo</Title>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Bài tập được nộp</span>
                <Switch
                  checked={notificationSettings.assignmentSubmissions}
                  onChange={(checked) =>
                    setNotificationSettings(prev => ({
                      ...prev,
                      assignmentSubmissions: checked
                    }))
                  }
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Yêu cầu từ học sinh</span>
                <Switch
                  checked={notificationSettings.studentRequests}
                  onChange={(checked) =>
                    setNotificationSettings(prev => ({
                      ...prev,
                      studentRequests: checked
                    }))
                  }
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Cập nhật hệ thống</span>
                <Switch
                  checked={notificationSettings.systemUpdates}
                  onChange={(checked) =>
                    setNotificationSettings(prev => ({
                      ...prev,
                      systemUpdates: checked
                    }))
                  }
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Nhắc nhở deadline</span>
                <Switch
                  checked={notificationSettings.deadlineReminders}
                  onChange={(checked) =>
                    setNotificationSettings(prev => ({
                      ...prev,
                      deadlineReminders: checked
                    }))
                  }
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Bình luận mới</span>
                <Switch
                  checked={notificationSettings.comments}
                  onChange={(checked) =>
                    setNotificationSettings(prev => ({
                      ...prev,
                      comments: checked
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherNotifications; 