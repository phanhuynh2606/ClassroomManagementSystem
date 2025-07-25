import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message, Divider } from 'antd';
import { LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { GoogleLogin } from '@react-oauth/google';
import { login, googleLogin, facebookLogin, clearError } from '../../store/slices/authSlice';
import FacebookLoginButton from '../../components/FacebookLogin';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);
  const [facebookLoading, setFacebookLoading] = useState(false);

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
      message.success('Đăng nhập thành công!');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await dispatch(googleLogin(credentialResponse.credential)).unwrap();
      message.success('Đăng nhập Google thành công!');
    } catch (error) {
      console.error('Google login error:', error);
      message.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
    }
  };

  const handleGoogleError = () => {
    message.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
  };

  const handleFacebookSuccess = async (accessToken) => {
    setFacebookLoading(true);
    try {
      await dispatch(facebookLogin(accessToken)).unwrap();
      message.success('Đăng nhập Facebook thành công!');
    } catch (error) {
      console.error('Facebook login error:', error);
      message.error('Đăng nhập Facebook thất bại. Vui lòng thử lại.');
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleFacebookFailure = (error) => {
    console.error('Facebook login error:', error);
    message.error('Đăng nhập Facebook thất bại. Vui lòng thử lại.');
    setFacebookLoading(false);
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
            Chào mừng trở lại!
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
            Đăng nhập để tiếp tục hành trình học tập của bạn
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
              Classroom Management System
            </h2>
            <p style={{ color: '#718096', fontSize: '1rem' }}>
              Đăng nhập vào tài khoản của bạn
            </p>
          </div>

          {/* Social Login Buttons */}
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

          <div style={{ marginBottom: '1rem' }} className='facebook-login-container'>
            <FacebookLoginButton
              onSuccess={handleFacebookSuccess}
              onFailure={handleFacebookFailure}
              loading={facebookLoading}
            />
          </div>

          <Divider style={{ margin: '1.5rem 0' }}>
            <span style={{ color: '#718096', fontSize: '0.9rem' }}>hoặc tiếp tục với email</span>
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
              rules={[{ required: true, message: 'Vui lòng nhập email của bạn!' }]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#718096' }} />} 
                placeholder="Email"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu của bạn!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#718096' }} />}
                placeholder="Mật khẩu"
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
                Đăng nhập
              </Button>
            </Form.Item>

            <div style={{ 
              textAlign: 'center',
              marginTop: '1rem',
              color: '#4a5568'
            }}>
              <Link 
                to="/forgot-password" 
                style={{ 
                  color: '#4299e1',
                  fontWeight: '500',
                  textDecoration: 'none',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}
              >
                Quên mật khẩu?
              </Link>
              Chưa có tài khoản?{' '}
              <Link 
                to="/register" 
                style={{ 
                  color: '#4299e1',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Đăng ký tại đây
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;