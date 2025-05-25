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
  LogoutOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { setCurrentRole } from '../store/slices/userSlice';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const currentRole = useSelector((state) => state.users.currentRole);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = async () => {
    try {
      console.log('Attempting to logout...');
      const result = await dispatch(logout()).unwrap();
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed with error:', error);
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const handleRoleChange = (role) => {
    dispatch(setCurrentRole(role));
    navigate('/admin/users');
  };

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
    },
    {
      key: '2',
      icon: <TeamOutlined />,
      label: 'User Management',
      children: [
        {
          key: '2-1',
          label: 'Admin Management',
          onClick: () => handleRoleChange('admin'),
        },
        {
          key: '2-2',
          label: 'Teacher Management',
          onClick: () => handleRoleChange('teacher'),
        },
        {
          key: '2-3',
          label: 'Student Management',
          onClick: () => handleRoleChange('student'),
        },
      ],
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
      key: '6',
      icon: <QuestionCircleOutlined />,
      label: 'Question Management',
      onClick: () => navigate('/admin/questions'),
    },
    {
      key: '5',
      icon: <BellOutlined />,
      label: 'Notifications',
      onClick: () => navigate('/admin/notifications'),
    },
  ];

  // Determine which menu item should be selected based on current path and role
  const getSelectedKeys = () => {
    const path = location.pathname;
    
    if (path.startsWith('/admin/users')) {
      return [`2-${currentRole === 'admin' ? '1' : currentRole === 'teacher' ? '2' : '3'}`];
    }
    if (path.startsWith('/admin/classrooms')) {
      return ['3'];
    }
    if (path.startsWith('/admin/quizzes')) {
      return ['4'];
    }
    if (path.startsWith('/admin/notifications')) {
      return ['5'];
    }
    if (path.startsWith('/admin/questions')) {
      return ['6'];
    }
    if (path.startsWith('/admin/dashboard')) {
      return ['1'];
    }
    return ['1'];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={['2']}
          items={menuItems}
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