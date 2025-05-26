import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message, Divider } from 'antd';
import { LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { GoogleLogin } from '@react-oauth/google';
import { login, googleLogin, clearError } from '../../store/slices/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error && message) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'teacher':
          navigate('/teacher');
          break;
        case 'student':
          navigate('/student');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, navigate]);

  const onFinish = async (values) => {
    try {
      await dispatch(login(values)).unwrap();
      message.success('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await dispatch(googleLogin(credentialResponse.credential)).unwrap();
      message.success('Google login successful!');
    } catch (error) {
      console.error('Google login error:', error);
      message.error('Google login failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    message.error('Google login failed. Please try again.');
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Left side - Image */}
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
            Welcome Back!
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
            Sign in to continue your learning journey
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
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
            <h2 style={{ 
              fontSize: '2rem', 
              color: '#1a365d',
              marginBottom: '0.5rem'
            }}>
              Learning Management System
            </h2>
            <p style={{ color: '#718096', fontSize: '1rem' }}>
              Sign in to your account
            </p>
          </div>

          {/* Google Login Button */}
          <div style={{ marginBottom: '1rem' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              size="large"
              text="signin_with"
              shape="rectangular"
              logo_alignment="left"
              width="100%"
            />
          </div>

          <Divider style={{ margin: '1.5rem 0' }}>
            <span style={{ color: '#718096', fontSize: '0.9rem' }}>or continue with email</span>
          </Divider>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Please input your email!' }]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#718096' }} />} 
                placeholder="Email"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#718096' }} />}
                placeholder="Password"
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
                Sign In
              </Button>
            </Form.Item>

            <div style={{ 
              textAlign: 'center',
              marginTop: '1rem',
              color: '#4a5568'
            }}>
              Don't have an account?{' '}
              <Link 
                to="/register" 
                style={{ 
                  color: '#4299e1',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Register here
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;