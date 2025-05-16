import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Tag,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const NotificationManagement = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Mock data - replace with actual API calls
  const [notifications, setNotifications] = useState([
    {
      key: '1',
      title: 'System Maintenance',
      content: 'The system will be down for maintenance on Saturday from 2-4 AM.',
      type: 'system',
      priority: 'high',
      status: 'active',
      startDate: '2024-03-20',
      endDate: '2024-03-21',
      targetAudience: ['all'],
    },
    {
      key: '2',
      title: 'New Feature Release',
      content: 'We have added new features to improve your learning experience.',
      type: 'announcement',
      priority: 'medium',
      status: 'active',
      startDate: '2024-03-19',
      endDate: '2024-03-26',
      targetAudience: ['students', 'teachers'],
    },
  ]);

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: '20%',
    },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      width: '30%',
      render: (text) => <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = {
          system: 'blue',
          announcement: 'green',
          alert: 'red',
        };
        return <Tag color={colors[type]}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const colors = {
          high: 'red',
          medium: 'orange',
          low: 'green',
        };
        return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          active: 'green',
          inactive: 'default',
          expired: 'red',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date Range',
      key: 'dateRange',
      render: (_, record) => (
        <span>
          {dayjs(record.startDate).format('YYYY-MM-DD')} to{' '}
          {dayjs(record.endDate).format('YYYY-MM-DD')}
        </span>
      ),
    },
    {
      title: 'Target Audience',
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      render: (audience) => (
        <Space>
          {audience.map((role) => (
            <Tag key={role}>{role.toUpperCase()}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this notification?"
            onConfirm={() => handleDelete(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingNotification(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    form.setFieldsValue({
      ...notification,
      dateRange: [dayjs(notification.startDate), dayjs(notification.endDate)],
    });
    setIsModalVisible(true);
  };

  const handleDelete = (key) => {
    setNotifications(notifications.filter((notification) => notification.key !== key));
    message.success('Notification deleted successfully');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const { dateRange, ...rest } = values;
      const notificationData = {
        ...rest,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      };

      if (editingNotification) {
        // Update existing notification
        setNotifications(
          notifications.map((notification) =>
            notification.key === editingNotification.key
              ? { ...notification, ...notificationData }
              : notification
          )
        );
        message.success('Notification updated successfully');
      } else {
        // Add new notification
        const newNotification = {
          key: Date.now().toString(),
          ...notificationData,
        };
        setNotifications([...notifications, newNotification]);
        message.success('Notification added successfully');
      }
      setIsModalVisible(false);
    });
  };

  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchText.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchText.toLowerCase()) ||
      notification.type.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="Search notifications..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Notification
        </Button>
      </div>

      <Table columns={columns} dataSource={filteredNotifications} />

      <Modal
        title={editingNotification ? 'Edit Notification' : 'Add Notification'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please input notification title!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: 'Please input notification content!' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select notification type!' }]}
          >
            <Select>
              <Option value="system">System</Option>
              <Option value="announcement">Announcement</Option>
              <Option value="alert">Alert</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select priority!' }]}
          >
            <Select>
              <Option value="high">High</Option>
              <Option value="medium">Medium</Option>
              <Option value="low">Low</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status!' }]}
          >
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: 'Please select date range!' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="targetAudience"
            label="Target Audience"
            rules={[{ required: true, message: 'Please select target audience!' }]}
          >
            <Select mode="multiple">
              <Option value="all">All Users</Option>
              <Option value="students">Students</Option>
              <Option value="teachers">Teachers</Option>
              <Option value="admins">Admins</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationManagement; 