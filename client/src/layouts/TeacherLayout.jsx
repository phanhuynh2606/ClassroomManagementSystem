import React, { useState } from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  LineChartOutlined,
  LogoutOutlined,
  UserOutlined,
  CalendarOutlined,
  BellOutlined,
  BookOutlined,
  BarChartOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import useUnreadCount from '../hooks/useUnreadCount';
import NotificationBell from '../components/notifications/NotificationBell';

const { Header, Sider, Content } = Layout;

const TeacherLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { unreadChatsCount } = useUnreadCount();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  // Get current selected menu key based on pathname
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/teacher' || path === '/teacher/dashboard') return 'dashboard';
    if (path.startsWith('/teacher/classroom')) return 'classrooms';
    if (path.startsWith('/teacher/quizzes')) return 'quizzes';
    if (path.startsWith('/teacher/assignments')) return 'assignments';
    if (path.startsWith('/teacher/grades')) return 'grades';
    if (path.startsWith('/teacher/students')) return 'students';
    if (path.startsWith('/teacher/reports')) return 'reports';
    if (path.startsWith('/teacher/schedule')) return 'schedule';
    if (path.startsWith('/teacher/requests')) return 'requests';
    if (path.startsWith('/teacher/notifications')) return 'notifications';
    if (path.startsWith('/teacher/chat')) return 'chat';
    if (path.startsWith('/teacher/profile')) return 'profile';
    return 'dashboard';
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/teacher/dashboard'),
    },
    {
      type: 'divider',
    },
    {
      key: 'teaching',
      label: 'Teaching',
      type: 'group',
    },
    {
      key: 'classrooms',
      icon: <TeamOutlined />,
      label: 'Classroom Management',
      onClick: () => navigate('/teacher/classroom'),
    },
    {
      key: 'assignments',
      icon: <BookOutlined />,
      label: 'Assignments',
      onClick: () => navigate('/teacher/assignments'),
    },
    {
      key: 'quizzes',
      icon: <FileTextOutlined />,
      label: 'Quizzes',
      onClick: () => navigate('/teacher/quizzes'),
    },
    {
      key: 'grades',
      icon: <LineChartOutlined />,
      label: 'Grading',
      onClick: () => navigate('/teacher/grades'),
    },
    {
      type: 'divider',
    },
    {
      key: 'management',
      label: 'Management',
      type: 'group',
    },
    {
      key: 'students',
      icon: <UserOutlined />,
      label: 'Students',
      onClick: () => navigate('/teacher/students'),
    },
    {
      key: 'schedule',
      icon: <CalendarOutlined />,
      label: 'Schedule',
      onClick: () => navigate('/teacher/schedule'),
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      onClick: () => navigate('/teacher/reports'),
    },
    {
      key: 'requests',
      icon: <CheckSquareOutlined />,
      label: 'Request Management',
      onClick: () => navigate('/teacher/requests'),
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
      onClick: () => navigate('/teacher/notifications'),
    },
    {
      type: 'divider',
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
      onClick: () => navigate('/teacher/chat'),
    },
    // {
    //   key: 'notifications',
    //   icon: <BellOutlined />,
    //   label: 'Notifications',
    //   onClick: () => navigate('/teacher/notifications'),
    // },
  ];

  return (
    <Layout className="teacher-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={'250px'}
        collapsedWidth={80}
        style={{
          background: '#001529'
        }}
      >
        <div className="demo-logo-vertical h-16 bg-gray-800 flex items-center justify-center border-b border-gray-700">
          {!collapsed ? (
            <div className="text-white font-bold text-lg">
              📚 Teacher Portal
            </div>
          ) : (
            <div className="text-white text-2xl">📚</div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{
            borderRight: 0,
            height: 'calc(100vh - 90px)',
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: '#B2DAFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
              color: '#1565C0'
            }}
          />
          <div style={{ marginRight: 16, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <NotificationBell />
            <span 
              style={{ 
                marginRight: 16, 
                cursor: 'pointer',
                color: '#1565C0',
                fontWeight: '500'
              }} 
              onClick={() => navigate('/teacher/profile')}
            >
              👨‍🏫 {user?.fullName || 'Teacher'}
            </span>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                color: '#1565C0'
              }}
            >
              Logout
            </Button>
          </div>
        </Header>
        <Content
          style={{
            padding: location.pathname.includes('/chat') ? 0 : 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'hidden',
            height: location.pathname.includes('/chat') ? 'calc(100vh - 90px)' : 'auto',
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

export default TeacherLayout; 