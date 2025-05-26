import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Space, Spin } from 'antd';
import { LockOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import authAPI from '../../services/api/auth.api';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      setVerifying(true);
      const response = await authAPI.verifyResetToken(token);
      setTokenValid(true);
      setUserEmail(response.email);
    } catch (error) {
      setTokenValid(false);
      message.error('Invalid or expired reset link');
    } finally {
      setVerifying(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await authAPI.resetPassword(token, values.password);
      setResetSuccess(true);
      message.success('Password reset successful!');
    } catch (error) {
      console.error('Reset password error:', error);
      message.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  if (verifying) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Card 
          style={{ 
            width: 400,
            borderRadius: '15px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            textAlign: 'center',
            padding: '2rem'
          }}
        >
          <Spin size="large" />
          <div style={{ marginTop: '1rem' }}>
            <Text style={{ color: '#718096', fontSize: '16px' }}>
              Verifying reset link...
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Card 
          style={{ 
            width: 500,
            borderRadius: '15px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            textAlign: 'center'
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              fontSize: '32px',
              color: 'white'
            }}>
              ✕
            </div>
            
            <div>
              <Title level={2} style={{ color: '#1a365d', marginBottom: '8px' }}>
                Invalid Reset Link
              </Title>
              <Text style={{ color: '#718096', fontSize: '16px' }}>
                This password reset link is invalid or has expired.
              </Text>
            </div>

            <div style={{ color: '#718096', fontSize: '14px', lineHeight: '1.6' }}>
              <p>Reset links expire after 1 hour for security reasons.</p>
              <p>Please request a new password reset link.</p>
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/forgot-password">
                <Button 
                  type="primary"
                  style={{
                    height: '45px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #4299e1 0%, #2b6cb0 100%)',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: '500',
                    width: '100%'
                  }}
                >
                  Request New Reset Link
                </Button>
              </Link>
              
              <Link to="/login">
                <Button 
                  icon={<ArrowLeftOutlined />}
                  style={{
                    height: '45px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    width: '100%'
                  }}
                >
                  Back to Login
                </Button>
              </Link>
            </Space>
          </Space>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Card 
          style={{ 
            width: 500,
            borderRadius: '15px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            textAlign: 'center'
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              fontSize: '32px',
              color: 'white'
            }}>
              <CheckCircleOutlined />
            </div>
            
            <div>
              <Title level={2} style={{ color: '#1a365d', marginBottom: '8px' }}>
                Password Reset Successful!
              </Title>
              <Text style={{ color: '#718096', fontSize: '16px' }}>
                Your password has been successfully reset.
              </Text>
            </div>

            <div style={{ color: '#718096', fontSize: '14px', lineHeight: '1.6' }}>
              <p>You can now sign in with your new password.</p>
              <p>For security, all your devices have been logged out.</p>
            </div>

            <Button 
              type="primary"
              onClick={handleGoToLogin}
              style={{
                height: '45px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4299e1 0%, #2b6cb0 100%)',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                width: '100%'
              }}
            >
              Go to Login
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Left side - Info */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ textAlign: 'center', color: '#1a365d' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            Reset Your Password
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
            Enter your new password below to complete the reset process.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem'
      }}>
        <Card 
          style={{ 
            width: 400,
            borderRadius: '15px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            background: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Title level={2} style={{ 
              fontSize: '2rem', 
              color: '#1a365d',
              marginBottom: '0.5rem'
            }}>
              New Password
            </Title>
            <Text style={{ color: '#718096', fontSize: '1rem' }}>
              Resetting password for: <strong>{userEmail}</strong>
            </Text>
          </div>

          <Form
            name="resetPassword"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your new password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#718096' }} />}
                placeholder="Enter new password"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your new password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#718096' }} />}
                placeholder="Confirm new password"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                style={{
                  height: '45px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4299e1 0%, #2b6cb0 100%)',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Reset Password
              </Button>
            </Form.Item>

            <div style={{ 
              textAlign: 'center',
              marginTop: '1rem',
              color: '#4a5568'
            }}>
              Remember your password?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: '#4299e1',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Back to Login
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword; 