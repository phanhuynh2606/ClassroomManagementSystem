import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Select, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { GoogleLogin } from '@react-oauth/google';
import { register, googleLogin, clearError } from '../../store/slices/authSlice';

const { Option } = Select;

const Register = () => {
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
      const res = await dispatch(register(values)).unwrap();
      if (res.verified === false) {
        message.warning('Đăng ký thành công, vui lòng liên hệ admin để xác thực tài khoản');
        navigate('/login');
      } else {
        message.success('Đăng ký thành công!');
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await dispatch(googleLogin(credentialResponse.credential)).unwrap();
      message.success('Đăng ký Google thành công!');
    } catch (error) {
      console.error('Google registration error:', error);
      message.error('Đăng ký Google thất bại. Vui lòng thử lại.');
    }
  };

  const handleGoogleError = () => {
    message.error('Đăng ký Google thất bại. Vui lòng thử lại.');
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
            Tham gia cộng đồng của chúng tôi!
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
            Bắt đầu hành trình học tập của bạn ngay hôm nay
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
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
              Tạo tài khoản
            </h2>
            <p style={{ color: '#718096', fontSize: '1rem' }}>
              Điền thông tin của bạn để bắt đầu
            </p>
          </div>

          {/* Google Login Button */}
          <div style={{ marginBottom: '1rem' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              size="large"
              text="signup_with"
              shape="rectangular"
              logo_alignment="left"
              width="100%"
            />
          </div>

          <Divider style={{ margin: '1.5rem 0' }}>
            <span style={{ color: '#718096', fontSize: '0.9rem' }}>hoặc đăng ký với email</span>
          </Divider>

          <Form
            name="register"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#718096' }} />} 
                placeholder="Họ và tên"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Vui lòng nhập email hợp lệ!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#718096' }} />} 
                placeholder="Email"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#718096' }} />}
                placeholder="Mật khẩu"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="role"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
              initialValue={'student'}
            >
              <Select 
                placeholder="Chọn vai trò của bạn"
                style={{ borderRadius: '8px' }}
              >
                <Option value="student">Học sinh</Option>
                <Option value="teacher">Giáo viên</Option>
              </Select>
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
                Tạo tài khoản
              </Button>
            </Form.Item>

            <div style={{ 
              textAlign: 'center',
              marginTop: '1rem',
              color: '#4a5568'
            }}>
              Đã có tài khoản?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: '#4299e1',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Đăng nhập tại đây
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Register;