import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Space, Avatar } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  BellOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = async () => {
    try {
      console.log('Attempting to logout...');
      const result = await dispatch(logout()).unwrap();
      console.log('Logout successful:', result);
      localStorage.removeItem('token'); // Ensure token is removed
      navigate('/login');
    } catch (error) {
      console.error('Logout failed with error:', error);
      // Still try to clear local state and redirect
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: '1',
              icon: <DashboardOutlined />,
              label: 'Dashboard',
              onClick: () => navigate('/admin/dashboard'),
            },
            {
              key: '2',
              icon: <UserOutlined />,
              label: 'User Management',
              onClick: () => navigate('/admin/users'),
            },
            {
              key: '3',
              icon: <BookOutlined />,
              label: 'Classroom Management',
              onClick: () => navigate('/admin/classrooms'),
            },
            {
              key: '4',
              icon: <QuestionCircleOutlined />,
              label: 'Quiz Management',
              onClick: () => navigate('/admin/quizzes'),
            },
            {
              key: '5',
              icon: <BellOutlined />,
              label: 'Notifications',
              onClick: () => navigate('/admin/notifications'),
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Space align="center" style={{ marginRight: 16 }}>
            <Avatar
              src={user?.image}
              icon={<UserOutlined />}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/admin/profile')}
            />
            <span style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate('/admin/profile')}>
              {user?.email}
            </span>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                fontSize: '16px',
              }}
            >
              Logout
            </Button>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout; 