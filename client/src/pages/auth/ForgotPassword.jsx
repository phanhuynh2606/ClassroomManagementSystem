import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import authAPI from '../../services/api/auth.api';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await authAPI.forgotPassword(values.email);
      setEmail(values.email);
      setEmailSent(true);
      message.success('Password reset email sent successfully!');
    } catch (error) {
      console.error('Forgot password error:', error);
      message.error(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setLoading(true);
      await authAPI.forgotPassword(email);
      message.success('Password reset email sent again!');
    } catch (error) {
      message.error('Failed to resend email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
              ✓
            </div>
            
            <div>
              <Title level={2} style={{ color: '#1a365d', marginBottom: '8px' }}>
                Check Your Email
              </Title>
              <Text style={{ color: '#718096', fontSize: '16px' }}>
                We've sent a password reset link to:
              </Text>
              <div style={{ 
                background: '#f7fafc', 
                padding: '12px', 
                borderRadius: '8px', 
                margin: '16px 0',
                fontWeight: 'bold',
                color: '#2d3748'
              }}>
                {email}
              </div>
            </div>

            <div style={{ color: '#718096', fontSize: '14px', lineHeight: '1.6' }}>
              <p>Click the link in the email to reset your password.</p>
              <p>If you don't see the email, check your spam folder.</p>
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                onClick={handleResendEmail}
                loading={loading}
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
                Resend Email
              </Button>
              
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
            Forgot Password?
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
            No worries! Enter your email and we'll send you a reset link.
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
              Reset Password
            </Title>
            <Text style={{ color: '#718096', fontSize: '1rem' }}>
              Enter your email address and we'll send you a link to reset your password
            </Text>
          </div>

          <Form
            name="forgotPassword"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#718096' }} />} 
                placeholder="Enter your email address"
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
                Send Reset Link
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

export default ForgotPassword; 