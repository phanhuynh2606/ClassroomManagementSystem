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
      message.success('Cập nhật hồ sơ thành công');
    } catch (error) {
      message.error('Không thể cập nhật hồ sơ');
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
      message.warning('Vui lòng chọn hình ảnh trước');
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
      
      message.success('Tải lên ảnh đại diện thành công');
      
      // Refresh profile to get updated image
      const updatedProfile = await dispatch(fetchProfile());
      setUser(updatedProfile.payload);
      
    } catch (error) {
      console.error('Upload error:', error);
      message.error(error.response?.data?.message || 'Không thể tải lên ảnh đại diện');
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
      message.error('Không thể tải danh sách thiết bị');
    } finally {
      setDevicesLoading(false);
    }
  };

  const handleLogoutDevice = async (token, isCurrentDevice) => {
    try {
      await authAPI.logoutDevice(token);
      message.success(isCurrentDevice ? 'Đã đăng xuất khỏi thiết bị hiện tại' : 'Đã đăng xuất thiết bị thành công');
      
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
      message.error('Không thể đăng xuất thiết bị');
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await authAPI.logoutAllDevices();
      message.success('Đã đăng xuất khỏi tất cả thiết bị');
      
      // Redirect to login since current device is also logged out
      localStorage.removeItem('token');
      localStorage.removeItem('persist:root');
      window.location.href = '/login';
    } catch (error) {
      message.error('Không thể đăng xuất khỏi tất cả thiết bị');
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
      title: 'Thiết bị',
      dataIndex: 'device',
      key: 'device',
      render: (device, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getDeviceIcon(device)}
          <span>
            {device || 'Thiết bị không xác định'}
            {record.isCurrentDevice && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                Thiết bị hiện tại
              </Tag>
            )}
          </span>
        </div>
      ),
    },
    {
      title: 'Trình duyệt',
      dataIndex: 'userAgent',
      key: 'userAgent',
      render: (userAgent) => userAgent || 'Trình duyệt không xác định',
    },
    {
      title: 'Địa chỉ IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip) => (
        <Tooltip title="Địa chỉ IP">
          <span>
            <GlobalOutlined style={{ marginRight: 8 }} />
            {ip}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Thời gian đăng nhập',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title={`Đăng xuất khỏi ${record.isCurrentDevice ? 'thiết bị hiện tại' : 'thiết bị này'}?`}
          description={record.isCurrentDevice ? 'Bạn sẽ được chuyển hướng đến trang đăng nhập.' : 'Điều này sẽ kết thúc phiên trên thiết bị này.'}
          onConfirm={() => handleLogoutDevice(record.token, record.isCurrentDevice)}
          okText="Có"
          cancelText="Không"
        >
          <Button 
            type="link" 
            danger 
            icon={<LogoutOutlined />}
            size="small"
          >
            Đăng xuất
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ width: "100%", margin: '0 auto', padding: '24px 100px' }}>
      <Card
        style={{
          borderRadius: 18,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          marginBottom: 16,
          width: '100%',
          padding: 0,
          border: 'none',
          margin: '0 auto',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Row align="middle" style={{ padding: '24px 32px 24px 32px' }}>
          <Col span={4} style={{ textAlign: 'center' }}>
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
              {selectedFile ? 'Tải lên ảnh đại diện' : 'Thay đổi ảnh đại diện'}
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
                <Badge status={user?.isActive ? 'success' : 'error'} text={user?.isActive ? 'Hoạt động' : 'Không hoạt động'} />
              </Space>

              {/* <Row gutter={24} style={{ marginTop: 24 }}>
                <Col span={8}>
                  <Statistic
                    title="Khóa học đã đăng ký"
                    value={5}
                    prefix={<BookOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Bài kiểm tra đã hoàn thành"
                    value={12}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Điểm trung bình"
                    value={85}
                    suffix="%"
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
              </Row> */}
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
              Thông tin hồ sơ
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
          <Row gutter={12}>
            <Col span={12}>
              <Card
                title={<span style={{ fontWeight: 600, fontSize: 16 }}>Thông tin cá nhân</span>}
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
                    label={<span style={{ fontWeight: 500 }}>Họ và tên</span>}
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                  >
                    <Input prefix={<UserOutlined />} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label={<span style={{ fontWeight: 500 }}>Email</span>}
                    rules={[
                      { required: true, message: 'Vui lòng nhập email!' },
                      { type: 'email', message: 'Email không hợp lệ!' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} size="large" disabled />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label={<span style={{ fontWeight: 500 }}>Số điện thoại</span>}
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại!' },
                      { pattern: /^(0|84|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])[0-9]{7}$|^(0|84|\+84)[1-9][0-9]{8,9}$/, message: 'Số điện thoại phải là số điện thoại Việt Nam hợp lệ!' }
                    ]}
                  >
                    <Input prefix={<PhoneOutlined />} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="dateOfBirth"
                    label={<span style={{ fontWeight: 500 }}>Ngày sinh</span>}
                    rules={[
                      { required: true, message: 'Vui lòng chọn ngày sinh!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value) return Promise.resolve();
                          const today = new Date();
                          const dob = value.toDate ? value.toDate() : value;
                          const age = today.getFullYear() - dob.getFullYear() - (today < new Date(dob.setFullYear(today.getFullYear())) ? 1 : 0);
                          if (age >= 12) return Promise.resolve();
                          return Promise.reject(new Error('Bạn phải ít nhất 12 tuổi!'));
                        }
                      })
                    ]}
                  >
                    <DatePicker style={{ width: '100%' }} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="gender"
                    label={<span style={{ fontWeight: 500 }}>Giới tính</span>}
                    rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
                  >
                    <Select size="large">
                      <Option value="male">Nam</Option>
                      <Option value="female">Nữ</Option>
                      <Option value="other">Khác</Option>
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
                      Cập nhật hồ sơ
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col span={12}>
              <Card
                title={<span style={{ fontWeight: 600, fontSize: 16 }}>Thông tin tài khoản</span>}
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: '24px' }}
              >
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
                  <Descriptions.Item label="Vai trò">{user?.role?.toUpperCase()}</Descriptions.Item>
                  <Descriptions.Item label="Trạng thái tài khoản">
                    <Badge status={user?.isActive ? 'success' : 'error'} text={user?.isActive ? 'Hoạt động' : 'Không hoạt động'} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Đăng nhập lần cuối">{user?.lastLogin ? dayjs(user.lastLogin).format('YYYY-MM-DD HH:mm') : 'Chưa bao giờ'}</Descriptions.Item>
                  <Descriptions.Item label="Ngày tham gia">{user?.createdAt ? dayjs(user.createdAt).format('YYYY-MM-DD HH:mm') : ''}</Descriptions.Item>
                  <Descriptions.Item label="Cập nhật lần cuối">{user?.updatedAt ? dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm') : ''}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </Panel>

        <Panel 
          header={
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              <LockOutlined style={{ marginRight: 8 }} />
              Cài đặt bảo mật
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
            title={<span style={{ fontWeight: 600, fontSize: 16 }}>Đổi mật khẩu</span>}
            style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
            bodyStyle={{ padding: '24px' }}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={async (values) => {
                try {
                  await dispatch(updatePassword(values)).unwrap();
                  message.success('Cập nhật mật khẩu thành công');
                  passwordForm.resetFields();
                } catch (error) {
                  message.error(error.message || 'Không thể cập nhật mật khẩu');
                }
              }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="currentPassword"
                    label={<span style={{ fontWeight: 500 }}>Mật khẩu hiện tại</span>}
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="newPassword"
                    label={<span style={{ fontWeight: 500 }}>Mật khẩu mới</span>}
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                      { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="confirmPassword"
                    label={<span style={{ fontWeight: 500 }}>Xác nhận mật khẩu mới</span>}
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Hai mật khẩu không khớp!'));
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
                  Đổi mật khẩu
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Panel>

        <Panel 
          header={
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              <SafetyOutlined style={{ marginRight: 8 }} />
              Quản lý thiết bị ({devices.length})
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
                  Làm mới
                </Button>
                <Popconfirm
                  title="Đăng xuất khỏi tất cả thiết bị?"
                  description="Điều này sẽ kết thúc tất cả phiên bao gồm thiết bị hiện tại. Bạn sẽ được chuyển hướng đến trang đăng nhập."
                  onConfirm={handleLogoutAllDevices}
                  okText="Có"
                  cancelText="Không"
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  >
                    Đăng xuất tất cả
                  </Button>
                </Popconfirm>
              </Space>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">
                Quản lý các phiên đăng nhập đang hoạt động. Bạn có thể đăng xuất khỏi thiết bị cụ thể hoặc tất cả thiết bị cùng một lúc.
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