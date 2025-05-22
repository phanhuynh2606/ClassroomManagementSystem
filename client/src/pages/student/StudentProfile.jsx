import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, DatePicker, message, Upload, Avatar, Row, Col, Statistic, Progress } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  UploadOutlined,
  BookOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import userAPI from '../../services/api/user.api';

const { Option } = Select;

const StudentProfile = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(user?.image || '');

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
      
      await userAPI.updateUser(updatedData);
      message.success('Profile updated successfully');
    } catch (error) {
      message.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (info) => {
    if (info.file.status === 'done') {
      setImageUrl(info.file.response.url);
      message.success('Image uploaded successfully');
    } else if (info.file.status === 'error') {
      message.error('Failed to upload image');
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Row gutter={[24, 24]}>
        {/* Left Column - Profile Card */}
        <Col xs={24} md={8}>
          <Card 
            style={{ 
              borderRadius: '15px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar
                size={120}
                src={imageUrl}
                icon={<UserOutlined />}
                style={{ 
                  marginBottom: 16,
                  border: '4px solid #f0f0f0'
                }}
              />
              <h2 style={{ marginBottom: 8 }}>{user?.fullName}</h2>
              <p style={{ color: '#666', marginBottom: 16 }}>{user?.email}</p>
              <Upload
                name="image"
                showUploadList={false}
                action="/api/upload"
                onChange={handleImageUpload}
              >
                <Button 
                  icon={<UploadOutlined />}
                  style={{
                    borderRadius: '20px',
                    background: '#f0f0f0',
                    border: 'none'
                  }}
                >
                  Change Avatar
                </Button>
              </Upload>
            </div>

            <div style={{ marginTop: 24 }}>
              <Statistic
                title="Courses Enrolled"
                value={5}
                prefix={<BookOutlined />}
                style={{ marginBottom: 16 }}
              />
              <Statistic
                title="Completed Quizzes"
                value={12}
                prefix={<CheckCircleOutlined />}
                style={{ marginBottom: 16 }}
              />
              <Statistic
                title="Average Score"
                value={85}
                suffix="%"
                prefix={<TrophyOutlined />}
              />
            </div>
          </Card>
        </Col>

        {/* Right Column - Forms and Info */}
        <Col xs={24} md={16}>
          <Card 
            title="Edit Profile" 
            style={{ 
              marginBottom: 24,
              borderRadius: '15px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={user}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="fullName"
                    label="Full Name"
                    rules={[{ required: true, message: 'Please input your full name!' }]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Please input your email!' },
                      { type: 'email', message: 'Please enter a valid email!' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[{ required: true, message: 'Please input your phone number!' }]}
                  >
                    <Input prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="dateOfBirth"
                    label="Date of Birth"
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true, message: 'Please select your gender!' }]}
              >
                <Select>
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
                  block
                  style={{
                    height: '45px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #4299e1 0%, #2b6cb0 100%)',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Update Profile
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card 
            title="Account Information" 
            style={{ 
              borderRadius: '15px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <strong>Role:</strong>{' '}
                  <span style={{ 
                    color: '#4299e1',
                    fontWeight: '500'
                  }}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Account Status:</strong>{' '}
                  <span style={{ 
                    color: user?.isActive ? '#48bb78' : '#f56565',
                    fontWeight: '500'
                  }}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <strong>Verification Status:</strong>{' '}
                  <span style={{ 
                    color: user?.verified ? '#48bb78' : '#ed8936',
                    fontWeight: '500'
                  }}>
                    {user?.verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                <div>
                  <strong>Last Login:</strong>{' '}
                  <span style={{ color: '#718096' }}>
                    {user?.lastLogin ? dayjs(user.lastLogin).format('YYYY-MM-DD HH:mm') : 'Never'}
                  </span>
                </div>
              </Col>
            </Row>

            <div style={{ marginTop: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Learning Progress</h3>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Course Completion</span>
                  <span>60%</span>
                </div>
                <Progress percent={60} strokeColor="#4299e1" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Quiz Completion</span>
                  <span>75%</span>
                </div>
                <Progress percent={75} strokeColor="#48bb78" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentProfile; 