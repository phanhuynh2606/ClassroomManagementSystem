import React, { useState } from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  LineChartOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import logo from '../images/logo.png';
const { Header, Sider, Content } = Layout;

const StudentLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/student'),
    },
    {
      key: 'classrooms',
      icon: <BookOutlined />,
      label: 'My Classrooms',
      onClick: () => navigate('/student/classrooms'),
    },
    {
      key: 'assignments',
      icon: <FileTextOutlined />,
      label: 'Assignments',
      onClick: () => navigate('/student/assignments'),
    },
    {
      key: 'grades',
      icon: <CheckSquareOutlined />,
      label: 'My Grades',
      onClick: () => navigate('/student/grades'),
    },
    {
      key: 'schedule',
      icon: <LineChartOutlined />,
      label: 'Schedule',
      onClick: () => navigate('/student/schedule'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={'250px'}>
      <div className="demo-logo-vertical" >
          <img src={logo} alt="logo" style={{ width: '100%', height: 'auto' }} />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['dashboard']}
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
          <div style={{ marginRight: 16 }}>
            <span 
              style={{ 
                marginRight: 16,
                cursor: 'pointer',
                color: '#1890ff',
                fontWeight: '500'
              }} 
              onClick={() => navigate('/student/profile')}
            >
              {user?.fullName}
            </span>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
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

export default StudentLayout; 