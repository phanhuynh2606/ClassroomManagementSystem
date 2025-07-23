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
  MessageOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import logo from '../images/logo.png';
import { useLocation } from 'react-router-dom';
import useUnreadCount from '../hooks/useUnreadCount';
import NotificationBell from '../components/notifications/NotificationBell';
const { Header, Sider, Content } = Layout;

const StudentLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const { unreadChatsCount } = useUnreadCount();

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
    // {
    //   key: 'assignments',
    //   icon: <FileTextOutlined />,
    //   label: 'Assignments',
    //   onClick: () => navigate('/student/assignments'),
    // },
    {
      key: 'grades',
      icon: <CheckSquareOutlined />,
      label: 'My Grades',
      onClick: () => navigate('/student/grades'),
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
      onClick: () => navigate('/student/notifications'),
    },
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: collapsed ? (
        <div style={{ position: 'relative' }}>
          <span>Chat</span>
          {unreadChatsCount > 0 && (
            <span className="chat-badge-collapsed chat-badge-pulse" style={{ 
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: '#ff4d4f',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '10px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #001529',
              minWidth: '18px',
              boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)'
            }}>
              {unreadChatsCount > 99 ? '99+' : unreadChatsCount}
            </span>
          )}
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%'
        }}>
          <span>Chat</span>
          {unreadChatsCount > 0 && (
            <span className="chat-badge chat-badge-pulse" style={{ 
              backgroundColor: '#ff4d4f', 
              color: 'white', 
              borderRadius: '50px', 
              padding: '4px 8px', 
              fontSize: '11px',
              fontWeight: '600',
              minWidth: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {unreadChatsCount > 99 ? '99+' : unreadChatsCount}
            </span>
          )}
        </div>
      ),
      onClick: () => navigate('/student/chat'),
    },
  ];

  // Determine which menu item should be selected based on current path
  const getSelectedKeys = () => {
    const path = location.pathname;
    
    if (path.startsWith('/student/classrooms')) {
      return ['classrooms'];
    }
    if (path.startsWith('/student/grades')) {
      return ['grades'];
    }
    if (path.startsWith('/student/notifications')) {
      return ['notifications'];
    }
    if (path.startsWith('/student/chat')) {
      return ['chat'];
    }
    if (path.startsWith('/student/dashboard')) {
      return ['dashboard'];
    }
    return ['dashboard'];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={'250px'}>
      <div className="demo-logo-vertical" >
          <img src={logo} alt="logo" style={{ width: '100%', height: 'auto' }} />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
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
          <div style={{ marginRight: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationBell />
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
            padding: location.pathname.includes('/chat') ? 0 : 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
            height: location.pathname.includes('/chat') ? 'calc(100vh - 112px)' : 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentLayout; 