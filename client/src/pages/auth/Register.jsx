import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Select, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { register, clearError } from '../../store/slices/authSlice';

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
      if(res.verified === false){
        message.warning('Register successfully, please contact admin to verify your account');
        navigate('/login');
      }else{
        message.success('Registration successful!');
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
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
            Join Our Community!
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
            Start your learning journey today
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
              Create Account
            </h2>
            <p style={{ color: '#718096', fontSize: '1rem' }}>
              Fill in your details to get started
            </p>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="fullName"
              rules={[{ required: true, message: 'Please input your full name!' }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#718096' }} />} 
                placeholder="Full Name"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
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
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#718096' }} />}
                placeholder="Password"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="role"
              rules={[{ required: true, message: 'Please select your role!' }]}
              initialValue={'student'}
            >
              <Select 
                placeholder="Select your role"
                style={{ borderRadius: '8px' }}
              >
                <Option value="student">Student</Option>
                <Option value="teacher">Teacher</Option>
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
                Create Account
              </Button>
            </Form.Item>

            <div style={{ 
              textAlign: 'center',
              marginTop: '1rem',
              color: '#4a5568'
            }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: '#4299e1',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Sign in here
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Register; 