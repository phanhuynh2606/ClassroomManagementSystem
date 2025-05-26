import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Upload, 
  message, 
  Row, 
  Col, 
  Typography, 
  DatePicker, 
  Select, 
  Avatar,
  Statistic,
  Space,
  Divider,
  Badge,
  Timeline,
  Progress
} from 'antd';
import { 
  UserOutlined, 
  UploadOutlined, 
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  SettingOutlined,
  CrownOutlined,
  SafetyOutlined,
  CalendarOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { updatePassword, fetchProfile } from '../../store/slices/authSlice';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const AdminProfile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [file, setFile] = useState(null);
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  useEffect(() => {
    const fetchProfileFunc = async () => {
      const res = await dispatch(fetchProfile());
      setUser(res.payload.user);
    };
    fetchProfileFunc();
  }, []);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
        gender: user.gender,
      });
      setPreviewImage('');
      setFile(null);
    }
  }, [user, form]);

  // Preview image before upload
  const handleImageChange = (info) => {
    let fileObj = info.file.originFileObj || info.file;
    if (fileObj) {
      setFile(fileObj);
      const reader = new FileReader();
      reader.onload = e => setPreviewImage(e.target.result);
      reader.readAsDataURL(fileObj);
    }
  };

  const handleProfileUpdate = async (values) => {
    try {
      let imageUrl = user.image;
      if (file) {
        // Upload file lên server, lấy url trả về
        const formData = new FormData();
        formData.append('image', file);
        // Giả sử bạn có API uploadImage
        // const res = await dispatch(uploadImage(formData)).unwrap();
        // imageUrl = res.url;
      }
      // await dispatch(updateProfile({
      //   ...values,
      //   image: imageUrl,
      //   dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
      // })).unwrap();
      message.success('Profile updated successfully');
    } catch (error) {
      message.error(error.message || 'Failed to update profile');
    }
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div>
      <Title level={2}>Profile Settings</Title>
      <Row gutter={24}>
        <Col span={12}>
          <Card title="Personal Information">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleProfileUpdate}
            >
              <Form.Item label="Profile Image">
                <Upload
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handleImageChange}
                  accept="image/*"
                >
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Avatar
                      size={100}
                      src={previewImage || user?.image}
                      icon={<UserOutlined />}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Button icon={<UploadOutlined />}>Change Avatar</Button>
                    </div>
                  </div>
                </Upload>
              </Form.Item>

              <Form.Item
                name="fullName"
                label="Full Name"
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone Number"
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item
                name="gender"
                label="Gender"
              >
                <Select allowClear placeholder="Select gender">
                  {genderOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Update Profile
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Change Password">
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
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: 'Please input your current password!' }]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please input your new password!' },
                  { min: 6, message: 'Password must be at least 6 characters!' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
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
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminProfile; 