import React, { useState, useRef, useEffect } from 'react';
import { Layout, Menu, Button, theme, Space, Avatar, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  BellOutlined,
  LogoutOutlined,
  TeamOutlined,
  FileTextOutlined,
  MessageOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { FaUserGroup,FaUsersGear } from "react-icons/fa6";
import { GiTeacher } from "react-icons/gi";
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { setCurrentRole, } from '../store/slices/userSlice';
import './AdminLayout.css'; 
const { Header, Sider, Content } = Layout;
import logo from '../images/logo.png';
import useUnreadCount from '../hooks/useUnreadCount';
import NotificationBell from '../components/notifications/NotificationBell';
const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState(['2']);
  const prevOpenKeys = useRef(openKeys);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const currentRole = useSelector((state) => state.users.currentRole);
  const { unreadChatsCount } = useUnreadCount();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    if (collapsed) {
      prevOpenKeys.current = openKeys;
      setOpenKeys([]);
    } else {
      setOpenKeys(prevOpenKeys.current);
    }
  }, [collapsed]);

  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

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

  const handleMenuClick = ({ key }) => {
    if (key === '1') navigate('/admin/');
    else if (key === '2-1') handleRoleChange('admin');
    else if (key === '2-2') handleRoleChange('teacher');
    else if (key === '2-3') handleRoleChange('student');
    else if (key === '3') navigate('/admin/classrooms');
    else if (key === '4') navigate('/admin/quizzes');
    else if (key === '5') navigate('/admin/notifications');
    else if (key === '6') navigate('/admin/requests');
    else if (key === '7') navigate('/admin/questions');
    else if (key === '8') navigate('/admin/chat');
  };

  const menuItems = React.useMemo(() => [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: collapsed ? (
        <Tooltip title="Bảng điều khiển" placement="right">
          <span>Bảng điều khiển</span>
        </Tooltip>
      ) : 'Bảng điều khiển',
    },
    {
      key: '2',
      icon: <TeamOutlined />,
      label: collapsed ? (
        <Tooltip title="Quản lý người dùng" placement="right">
          <span>Quản lý người dùng</span>
        </Tooltip>
      ) : 'Quản lý người dùng',
      children: [
        { 
          key: '2-1', 
          label:  (
            <Tooltip title="Quản lý Admin" placement="right">
              <span>Quản lý Admin</span>
            </Tooltip>
          ) ,
          icon: <FaUserGroup /> 
        },
        { 
          key: '2-2', 
          label: (
            <Tooltip title="Quản lý Giáo viên" placement="right">
              <span>Quản lý Giáo viên</span>
            </Tooltip>
          ),
          icon: <GiTeacher /> 
        },
        { 
          key: '2-3', 
          label:  (
            <Tooltip title="Quản lý Học sinh" placement="right">
              <span>Quản lý Học sinh</span>
            </Tooltip>
          ) ,
          icon: <FaUsersGear /> 
        },
      ],
    },
    {
      key: '3',
      icon: <BookOutlined />,
      label: collapsed ? (
        <Tooltip title="Quản lý Lớp học" placement="right">
          <span>Quản lý Lớp học</span>
        </Tooltip>
      ) : 'Quản lý Lớp học',
    },
    {
      key: '4',
      icon: <QuestionCircleOutlined />,
      label: collapsed ? (
        <Tooltip title="Quản lý Bài kiểm tra" placement="right">
          <span>Quản lý Bài kiểm tra</span>
        </Tooltip>
      ) : 'Quản lý Bài kiểm tra',
    },
     {
      key: '7',
      icon: <QuestionCircleOutlined />,
      label: 'Quản lý Câu hỏi',
      onClick: () => navigate('/admin/questions'),
    },
    {
      key: '5',
      icon: <BellOutlined />,
      label: collapsed ? (
        <Tooltip title="Thông báo" placement="right">
          <span>Thông báo</span>
        </Tooltip>
      ) : 'Thông báo',
    },
    {
      key: '6',
      icon: <FileTextOutlined />,
      label: collapsed ? (
        <Tooltip title="Quản lý Yêu cầu" placement="right">
          <span>Quản lý Yêu cầu</span>
        </Tooltip>
      ) : 'Quản lý Yêu cầu',
    },
    {
      key: '8',
      icon: <MessageOutlined />,
      label: collapsed ? (
        <div style={{ position: 'relative' }}>
          <Tooltip title="Trò chuyện" placement="right">
            <span>Trò chuyện</span>
          </Tooltip>
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
          <span>Trò chuyện</span>
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
    },
    ], [collapsed]);

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
      return ['7'];
    }
    if (path.startsWith('/admin/requests')) {
      return ['6'];
    }
    if (path.startsWith('/admin/chat')) {
      return ['8'];
    }
    if (path.startsWith('/admin/dashboard')) {
      return ['1'];
    }
    return ['1'];
  };

  return (
    <Layout style={{ minHeight: '100vh',margin: 0, padding: 0 }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={'250px'}>
        <div className="demo-logo-vertical" >
          <img src={logo} alt="logo" style={{ width: '80%', height: 'auto',marginBottom : "10px" }} />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            margin: 0,
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
            {/* <NotificationBell /> */}
            <Avatar
              src={user?.image}
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
              Đăng xuất
            </Button>
          </Space>
        </Header>
        <Content
          style={{
            scrollbarWidth: 'none',
            // margin: '24px 16px',
            padding: location.pathname.includes('/chat') ? 0 : 24,
            background: colorBgContainer,
            // borderRadius: borderRadiusLG,
            // borderEndEndRadius: "0px",
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

export default AdminLayout; 