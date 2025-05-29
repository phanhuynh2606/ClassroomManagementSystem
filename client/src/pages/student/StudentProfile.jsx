import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, DatePicker, message, Upload, Avatar, Row, Col, Statistic, Progress, Descriptions, Badge, Space, Table, Tag, Tooltip, Popconfirm, Typography, Collapse } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  UploadOutlined,
  BookOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LockOutlined,
  SettingOutlined,
  CrownOutlined,
  MobileOutlined,
  TabletOutlined,
  DesktopOutlined,
  GlobalOutlined,
  LogoutOutlined,
  DeleteOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import userAPI from '../../services/api/user.api';
import authAPI from '../../services/api/auth.api';
import { fetchProfile, updatePassword } from '../../store/slices/authSlice';

const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;

const StudentProfile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');           
  const [previewImage, setPreviewImage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [user, setUser] = useState({});

  useEffect(() => {
    const fetchProfileFunc = async () => {
      const res = await dispatch(fetchProfile());
      setUser(res.payload);
    };
    fetchProfileFunc();
    fetchDevices();
  }, []);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        ...user,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
      });
    }
  }, [user, form]);

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      const updatedData = {
        ...values,
        dateOfBirth: values.dateOfBirth?.toISOString(),
      };
      
      await userAPI.updateProfile(updatedData);
      message.success('Profile updated successfully');
    } catch (error) {
      message.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleImageChange = async (info) => {
    const file = info.file;
    console.log('File info:', file);
    
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      if (file.originFileObj) {
        const preview = await getBase64(file.originFileObj);
        setPreviewImage(preview);
      } else {
        const preview = await getBase64(file);
        setPreviewImage(preview);
      }
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      message.warning('Please select an image first');
      return;
    }
    
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Use originFileObj if available, otherwise use the file directly
      const fileToUpload = selectedFile.originFileObj || selectedFile;
      formData.append('image', fileToUpload);
      
      console.log('Uploading file:', fileToUpload);
      
      const res = await userAPI.updateProfileImage(formData);
      console.log('Upload response:', res);
      
      // Update image URL
      setImageUrl(res.imageUrl);
      setPreviewImage('');
      setSelectedFile(null);
      
      message.success('Avatar uploaded successfully');
      
      // Refresh profile to get updated image
      const updatedProfile = await dispatch(fetchProfile());
      setUser(updatedProfile.payload);
      
    } catch (error) {
      console.error('Upload error:', error);
      message.error(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      setDevicesLoading(true);
      const response = await authAPI.getUserDevices();
      setDevices(response.data); // Không cần filter vì server đã xóa hoàn toàn
    } catch (error) {
      message.error('Failed to fetch devices');
    } finally {
      setDevicesLoading(false);
    }
  };

  const handleLogoutDevice = async (token, isCurrentDevice) => {
    try {
      await authAPI.logoutDevice(token);
      message.success(isCurrentDevice ? 'Logged out from current device' : 'Device logged out successfully');
      
      if (isCurrentDevice) {
        // If current device, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('persist:root');
        window.location.href = '/login';
      } else {
        // Refresh devices list
        fetchDevices();
      }
    } catch (error) {
      message.error('Failed to logout device');
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await authAPI.logoutAllDevices();
      message.success('Logged out from all devices');
      
      // Redirect to login since current device is also logged out
      localStorage.removeItem('token');
      localStorage.removeItem('persist:root');
      window.location.href = '/login';
    } catch (error) {
      message.error('Failed to logout all devices');
    }
  };

  const getDeviceIcon = (deviceName) => {
    if (deviceName?.toLowerCase().includes('mobile')) {
      return <MobileOutlined style={{ color: '#1890ff' }} />;
    } else if (deviceName?.toLowerCase().includes('tablet')) {
      return <TabletOutlined style={{ color: '#52c41a' }} />;
    } else {
      return <DesktopOutlined style={{ color: '#722ed1' }} />;
    }
  };

  const deviceColumns = [
    {
      title: 'Device',
      dataIndex: 'device',
      key: 'device',
      render: (device, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getDeviceIcon(device)}
          <span>
            {device || 'Unknown Device'}
            {record.isCurrentDevice && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                Current Device
              </Tag>
            )}
          </span>
        </div>
      ),
    },
    {
      title: 'Browser',
      dataIndex: 'userAgent',
      key: 'userAgent',
      render: (userAgent) => userAgent || 'Unknown Browser',
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip) => (
        <Tooltip title="IP Address">
          <span>
            <GlobalOutlined style={{ marginRight: 8 }} />
            {ip}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Login Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title={`Logout from ${record.isCurrentDevice ? 'current device' : 'this device'}?`}
          description={record.isCurrentDevice ? 'You will be redirected to login page.' : 'This will end the session on this device.'}
          onConfirm={() => handleLogoutDevice(record.token, record.isCurrentDevice)}
          okText="Yes"
          cancelText="No"
        >
          <Button 
            type="link" 
            danger 
            icon={<LogoutOutlined />}
            size="small"
          >
            Logout
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 0' }}>
      <Card
        style={{
          borderRadius: 18,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          marginBottom: 16,
          padding: 0,
          border: 'none',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Row align="middle" style={{ padding: '24px 32px 24px 32px' }}>
          <Col span={6} style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Upload
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleImageChange}
                accept="image/*"
              >
                <Avatar
                  size={120}
                  src={previewImage || user?.image || imageUrl}
                  icon={<UserOutlined style={{ fontSize: 48 }} />}
                  
                  style={{
                    border: '5px solid #e6f7ff',
                    boxShadow: '0 2px 8px rgba(24,144,255,0.15)',
                    marginBottom: 16,
                    background: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                  }}
                />
              </Upload>
              {previewImage && (
                <div style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  background: '#52c41a',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                }}>
                  ✓
                </div>
              )}
            </div>
            <Button
              icon={<UploadOutlined />}
              onClick={handleImageUpload}
              loading={loading && selectedFile}
              disabled={!selectedFile}
              style={{
                borderRadius: 20,
                background: selectedFile 
                  ? 'linear-gradient(90deg, #52c41a 0%, #73d13d 100%)' 
                  : 'linear-gradient(90deg, #1890ff 0%, #40a9ff 100%)',
                color: '#fff',
                border: 'none',
                marginTop: 8,
                fontWeight: 500,
                opacity: selectedFile ? 1 : 0.7,
              }}
            >
              {selectedFile ? 'Upload Avatar' : 'Change Avatar'}
            </Button>
          </Col>
          <Col span={18}>
            <div style={{ marginLeft: 32 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 2 }}>{user?.fullName}</h1>
              <div style={{ fontSize: 18, color: '#888', marginBottom: 1 }}>
                <MailOutlined style={{ marginRight: 8 }} />{user?.email}
              </div>
              <div style={{ fontSize: 16, color: '#1890ff', fontWeight: 500, marginBottom: 2 }}>
                <CrownOutlined style={{ marginRight: 8 }} />{user?.role?.toUpperCase()}
              </div>
              <Space size={16}>
                <Badge status={user?.isActive ? 'success' : 'error'} text={user?.isActive ? 'Active' : 'Inactive'} />
              </Space>

              <Row gutter={24} style={{ marginTop: 24 }}>
                <Col span={8}>
                  <Statistic
                    title="Courses Enrolled"
                    value={5}
                    prefix={<BookOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Completed Quizzes"
                    value={12}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Average Score"
                    value={85}
                    suffix="%"
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Card>

      <Collapse 
        defaultActiveKey={['1']} 
        style={{ 
          background: 'transparent',
          border: 'none'
        }}
      >
        <Panel 
          header={
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              <UserOutlined style={{ marginRight: 8 }} />
              Profile Information
            </span>
          } 
          key="1"
          style={{
            marginBottom: 16,
            borderRadius: 16,
            border: 'none',
            boxShadow: '0 2px 8px rgba(24,144,255,0.07)',
          }}
        >
          <Row gutter={32}>
            <Col span={12}>
              <Card
                title={<span style={{ fontWeight: 600, fontSize: 16 }}>Personal Information</span>}
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: '24px' }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  initialValues={user}
                >
                  <Form.Item
                    name="fullName"
                    label={<span style={{ fontWeight: 500 }}>Full Name</span>}
                    rules={[{ required: true, message: 'Please input your full name!' }]}
                  >
                    <Input prefix={<UserOutlined />} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label={<span style={{ fontWeight: 500 }}>Phone Number</span>}
                    rules={[{ required: true, message: 'Please input your phone number!' }]}
                  >
                    <Input prefix={<PhoneOutlined />} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="dateOfBirth"
                    label={<span style={{ fontWeight: 500 }}>Date of Birth</span>}
                  >
                    <DatePicker style={{ width: '100%' }} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="gender"
                    label={<span style={{ fontWeight: 500 }}>Gender</span>}
                    rules={[{ required: true, message: 'Please select your gender!' }]}
                  >
                    <Select size="large">
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 12,
                        background: 'linear-gradient(90deg, #1890ff 0%, #40a9ff 100%)',
                        fontWeight: 600,
                        border: 'none',
                      }}
                    >
                      Update Profile
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col span={12}>
              <Card
                title={<span style={{ fontWeight: 600, fontSize: 16 }}>Account Information</span>}
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: '24px' }}
              >
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
                  <Descriptions.Item label="Role">{user?.role?.toUpperCase()}</Descriptions.Item>
                  <Descriptions.Item label="Account Status">
                    <Badge status={user?.isActive ? 'success' : 'error'} text={user?.isActive ? 'Active' : 'Inactive'} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Last Login">{user?.lastLogin ? dayjs(user.lastLogin).format('YYYY-MM-DD HH:mm') : 'Never'}</Descriptions.Item>
                  <Descriptions.Item label="Created At">{user?.createdAt ? dayjs(user.createdAt).format('YYYY-MM-DD HH:mm') : ''}</Descriptions.Item>
                  <Descriptions.Item label="Updated At">{user?.updatedAt ? dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm') : ''}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </Panel>

        <Panel 
          header={
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              <LockOutlined style={{ marginRight: 8 }} />
              Security Settings
            </span>
          } 
          key="2"
          style={{
            marginBottom: 16,
            borderRadius: 16,
            border: 'none',
            boxShadow: '0 2px 8px rgba(24,144,255,0.07)',
          }}
        >
          <Card
            title={<span style={{ fontWeight: 600, fontSize: 16 }}>Change Password</span>}
            style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
            bodyStyle={{ padding: '24px' }}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={async (values) => {
                try {
                  await dispatch(updatePassword(values)).unwrap();
                  message.success('Password updated successfully');
                  passwordForm.resetFields();
                } catch (error) {
                  message.error(error.message || 'Failed to update password');
                }
              }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="currentPassword"
                    label={<span style={{ fontWeight: 500 }}>Current Password</span>}
                    rules={[{ required: true, message: 'Please input your current password!' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="newPassword"
                    label={<span style={{ fontWeight: 500 }}>New Password</span>}
                    rules={[
                      { required: true, message: 'Please input your new password!' },
                      { min: 6, message: 'Password must be at least 6 characters!' }
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="confirmPassword"
                    label={<span style={{ fontWeight: 500 }}>Confirm New Password</span>}
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Please confirm your new password!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('The two passwords do not match!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{
                    height: 40,
                    borderRadius: 12,
                    background: 'linear-gradient(90deg, #1890ff 0%, #40a9ff 100%)',
                    fontWeight: 600,
                    border: 'none',
                    paddingLeft: 32,
                    paddingRight: 32,
                  }}
                >
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Panel>

        <Panel 
          header={
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              <SafetyOutlined style={{ marginRight: 8 }} />
              Device Management ({devices.length})
            </span>
          } 
          key="3"
          style={{
            borderRadius: 16,
            border: 'none',
            boxShadow: '0 2px 8px rgba(24,144,255,0.07)',
          }}
        >
          <Card
            style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
            bodyStyle={{ padding: '24px' }}
            extra={
              <Space>
                <Button
                  icon={<LogoutOutlined />}
                  onClick={fetchDevices}
                  loading={devicesLoading}
                  size="small"
                >
                  Refresh
                </Button>
                <Popconfirm
                  title="Logout from all devices?"
                  description="This will end all sessions including current device. You will be redirected to login page."
                  onConfirm={handleLogoutAllDevices}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  >
                    Logout All
                  </Button>
                </Popconfirm>
              </Space>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">
                Manage your active login sessions. You can logout from specific devices or all devices at once.
              </Text>
            </div>
            
            <Table
              dataSource={devices}
              columns={deviceColumns}
              rowKey="token"
              loading={devicesLoading}
              pagination={false}
              size="middle"
              scroll={{ x: 800 }}
            />
          </Card>
        </Panel>
      </Collapse>
    </div>
  );
};

export default StudentProfile; 