import React from 'react';
import {
  Card,
  Typography,
  Tag,
  Space,
  Tooltip,
  Dropdown,
  Menu,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  CopyOutlined,
  LogoutOutlined,
  MoreOutlined,

} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const colorPalette = [
  '#D32F2F', '#C2185B', '#7B1FA2', '#512DA8', '#303F9F',
  '#1976D2', '#00796B', '#388E3C', '#F57C00', '#E64A19'
];

const ClassroomCard = ({
  classroom,
  onLeave,
  onCopyCode,
  showActions = true,
  size = 'default'
}) => {
  const navigate = useNavigate();

  const handleClickCard = () => {
    navigate(`/student/classroom/${classroom._id}`);
  };

  const handleCopyCode = () => {
    if (onCopyCode) {
      onCopyCode(classroom.code);
    }
  };

  const handleLeave = () => {
    if (onLeave) {
      onLeave(classroom._id, classroom.name);
    }
  };

  const getRandomColor = () => {
    const index = [...classroom._id].reduce((acc, char) => acc + char.charCodeAt(0), 0) % colorPalette.length;
    return colorPalette[index];
  };

  const menuProps = {
    items: [
      {
        key: 'copy',
        label: (
          <span onClick={handleCopyCode}>
            <CopyOutlined className="mr-2" />
            Copy Class Code
          </span>
        ),
        icon: null, // nếu muốn bỏ icon mặc định
      },
      {
        key: 'leave',
        label: (
          <Popconfirm
            title="Are you sure you want to leave this classroom?"
            description="You will need the class code to rejoin if you want to access this classroom again."
            onConfirm={handleLeave}
            okText="Leave"
            cancelText="Cancel"
            icon={<LogoutOutlined style={{ color: 'red' }} />}
          >
            <div className="flex items-center text-red-600 hover:bg-red-50 px-3 py-1">
              <LogoutOutlined className="mr-2" />
              Leave Class
            </div>
          </Popconfirm>
        ),
        disabled: true, // Popconfirm ngăn click, nên ta disable item chính
      },
    ],
  };
  return (
    <Card
      className="h-full hover:shadow-md transition-shadow duration-200 relative"
      styles={{ body: { padding: 0, minHeight: 180 } }}
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          backgroundColor: getRandomColor(),
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          width: '100%',
          boxSizing: 'border-box'
        }}
        onClick={handleClickCard}
      >
        <Title
          level={size === 'small' ? 5 : 4}
          className="mb-0 text-white"
          style={{ color: '#fff' }}
        >
          {classroom.name}
        </Title>

        {showActions && (
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown menu={menuProps} trigger={['click']}>
              <Tooltip title="More Actions">
                <span>
                  <MoreOutlined style={{ fontSize: 18, color: '#fff' }} />
                </span>
              </Tooltip>
            </Dropdown>
          </div>
        )}
      </div>

      <div className="p-4" onClick={handleClickCard}>
        <Space direction="vertical" size="small" className="w-full">
          <Tag color="blue" icon={<BookOutlined />}>
            {classroom.subject}
          </Tag>

          {classroom.description && size !== 'small' && (
            <Text className="text-sm text-gray-600 line-clamp-2">
              {classroom.description.length > 100
                ? `${classroom.description.substring(0, 100)}...`
                : classroom.description}
            </Text>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Code: <Text code strong>{classroom.code}</Text>
            </span>
            <Tooltip title="Total Students">
              <Space>
                <TeamOutlined />
                <Text>{classroom.students?.length || 0}</Text>
              </Space>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <UserOutlined className="text-gray-400" />
            <Text className="text-sm">
              Teacher: <Text strong>{classroom.teacher?.fullName || 'Unknown'}</Text>
            </Text>
          </div>

          {size !== 'small' && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <Tag size="small" color="orange">{classroom.category}</Tag>
              <Tag size="small" color="purple">{classroom.level}</Tag>
            </div>
          )}
        </Space>
      </div>
    </Card >
  );
};

export default ClassroomCard;
