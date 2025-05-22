import React, { useState, useEffect } from 'react';
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
  Row,
  Col,
  Card,
} from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import adminAPI from '../../../services/api/admin.api';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const UserManagement = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: undefined,
    gender: undefined,
    dateRange: undefined,
    verificationStatus: undefined,
  });

  const currentRole = useSelector((state) => state.users.currentRole);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getUsers(currentRole);
        setUsers(response.data);
      } catch (error) {
        message.error('Failed to fetch users');
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentRole]);

  const handleVerifyTeacher = async (userId, verify) => {
    try {
      console.log(userId, verify)
      await adminAPI.verifyTeacher(userId, verify );
      setUsers(users.map(user => 
        user._id === userId ? { ...user, verified: verify } : user
      ));
      message.success(`Teacher ${verify ? 'verified' : 'unverified'} successfully`);
    } catch (error) {
      message.error(`Failed to ${verify ? 'verify' : 'unverify'} teacher`);
      console.error('Error updating teacher verification:', error);
    }
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const colors = {
          admin: 'red',
          teacher: 'blue',
          student: 'green',
        };
        return <Tag color={colors[role]}>{role.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Teacher', value: 'teacher' },
        { text: 'Student', value: 'student' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender) => gender?.charAt(0).toUpperCase() + gender?.slice(1),
      filters: [
        { text: 'Male', value: 'male' },
        { text: 'Female', value: 'female' },
        { text: 'Other', value: 'other' },
      ],
      onFilter: (value, record) => record.gender === value,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : 'Never',
      sorter: (a, b) => new Date(a.lastLogin) - new Date(b.lastLogin),
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
          {record.role === 'teacher' && (
            <>
              {!record.verified ? (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleVerifyTeacher(record._id, true)}
                >
                  Verify
                </Button>
              ) : (
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleVerifyTeacher(record._id, false)}
                >
                  Unverify
                </Button>
              )}
            </>
          )}
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record._id)}
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
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: currentRole });
    setIsModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (key) => {
    try {
      await adminAPI.deleteUser(key);
      setUsers(users.filter((user) => user._id !== key));
      message.success('User deleted successfully');
    } catch (error) {
      message.error('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await adminAPI.updateUser(editingUser._id, values);
        setUsers(
          users.map((user) =>
            user._id === editingUser._id ? { ...user, ...values } : user
          )
        );
        message.success('User updated successfully');
      } else {
        const newUser = await adminAPI.createUser(values);
        setUsers([...users, newUser]);
        message.success('User added successfully');
      }
      setIsModalVisible(false);
    } catch (error) {
      message.error('Failed to save user');
      console.error('Error saving user:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = filters.status === undefined || user.isActive === filters.status;
    const matchesGender = !filters.gender || user.gender === filters.gender;
    const matchesVerification = filters.verificationStatus === undefined || user.verified === filters.verificationStatus;
    
    const matchesDateRange = !filters.dateRange || (
      user.lastLogin && 
      dayjs(user.lastLogin).isAfter(filters.dateRange[0]) && 
      dayjs(user.lastLogin).isBefore(filters.dateRange[1])
    );

    return matchesSearch && matchesStatus && matchesGender && matchesDateRange && matchesVerification;
  });

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Input
              placeholder="Search users..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by Status"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by Gender"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => handleFilterChange('gender', value)}
            >
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
              <Option value="other">Other</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
          </Col>
        </Row>
        {currentRole === 'teacher' && (
          <Row style={{ marginTop: 16 }}>
            <Col>
              <Space>
                <Button 
                  type={filters.verificationStatus === undefined ? 'primary' : 'default'}
                  onClick={() => handleFilterChange('verificationStatus', undefined)}
                >
                  All Teachers
                </Button>
                <Button 
                  type={filters.verificationStatus === true ? 'primary' : 'default'}
                  onClick={() => handleFilterChange('verificationStatus', true)}
                >
                  Verified Teachers
                </Button>
                <Button 
                  type={filters.verificationStatus === false ? 'primary' : 'default'}
                  onClick={() => handleFilterChange('verificationStatus', false)}
                >
                  Unverified Teachers
                </Button>
              </Space>
            </Col>
          </Row>
        )}
      </Card>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleAdd}
        >
          Add User
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredUsers} 
        loading={loading}
        rowKey="_id"
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please input email!' },
                  { type: 'email', message: 'Please enter a valid email!' },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Full Name"
                rules={[{ required: true, message: 'Please input full name!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Please input phone number!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true, message: 'Please select gender!' }]}
              >
                <Select>
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role!' }]}
              >
                <Select>
                  <Option value="admin">Admin</Option>
                  <Option value="teacher">Teacher</Option>
                  <Option value="student">Student</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="isActive"
            label="Status"
            rules={[{ required: true, message: 'Please select status!' }]}
          >
            <Select>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement; 