import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Avatar } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  LogoutOutlined,
  BellOutlined,
  BookOutlined,
  SettingOutlined,
  TrophyOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const { Header, Sider, Content } = Layout;

const TeacherLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

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
    if (path.startsWith('/teacher/todo')) return 'todo';
    if (path.startsWith('/teacher/materials')) return 'materials';
    if (path.startsWith('/teacher/requests')) return 'requests';
    if (path.startsWith('/teacher/notifications')) return 'notifications';
    if (path.startsWith('/teacher/settings')) return 'settings';
    if (path.startsWith('/teacher/profile')) return 'profile';
    if (path.startsWith('/teacher/grading-demo')) return 'grading-demo';
    return 'dashboard';
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
      onClick: () => navigate('/teacher/dashboard'),
    },
    {
      type: 'divider',
    },
    {
      key: 'core',
      label: 'Giảng dạy',
      type: 'group',
    },
    {
      key: 'classrooms',
      icon: <TeamOutlined />,
      label: 'Lớp học',
      onClick: () => navigate('/teacher/classroom'),
    },
    {
      key: 'todo',
      icon: <CheckSquareOutlined />,
      label: 'Việc cần làm',
      onClick: () => navigate('/teacher/todo'),
    },
    {
      key: 'materials',
      icon: <BookOutlined />,
      label: 'Thư viện tài liệu',
      onClick: () => navigate('/teacher/materials'),
    },
    {
      type: 'divider',
    },
    {
      key: 'management',
      label: 'Quản lý',
      type: 'group',
    },
    {
      key: 'requests',
      icon: <FileTextOutlined />,
      label: 'Yêu cầu Admin',
      onClick: () => navigate('/teacher/requests'),
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Thông báo',
      onClick: () => navigate('/teacher/notifications'),
    },
    {
      type: 'divider',
    },
    // {
    //   key: 'settings',
    //   icon: <SettingOutlined />,
    //   label: 'Cài đặt',
    //   onClick: () => navigate('/teacher/settings'),
    // },
    // {
    //   type: 'divider',
    // },
  ];

  return (
    <Layout className="teacher-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={250}
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
            <Avatar 
              size={40}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1565C0' }}
              src={user?.image}
            />
            <span 
              style={{ 
                cursor: 'pointer',
                color: '#1565C0',
                fontWeight: '500'
              }} 
              onClick={() => navigate('/teacher/profile')}
            >
             {user?.fullName || 'Giáo viên'}
            </span>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                color: '#1565C0'
              }}
            >
              Đăng xuất
            </Button>
          </div>
        </Header>
        <Content
          style={{
            padding: 0,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'hidden'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default TeacherLayout; 