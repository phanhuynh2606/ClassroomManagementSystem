import React from 'react';
import { 
  Card, 
  Button, 
  Typography,
  Tag,
  Space,
  Tooltip,
  Popconfirm,
  Badge
} from 'antd';
import { 
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  CopyOutlined,
  EyeOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ClassroomCard = ({ 
  classroom, 
  onLeave, 
  onCopyCode, 
  showActions = true,
  size = 'default' // 'default' | 'small'
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
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

  const actions = showActions ? [
    <Tooltip title="View Details">
      <Button 
        type="text"
        icon={<EyeOutlined />}
        onClick={handleViewDetails}
      >
        {size === 'small' ? '' : 'View Details'}
      </Button>
    </Tooltip>,
    <Tooltip title="Copy Class Code">
      <Button 
        type="text"
        icon={<CopyOutlined />}
        onClick={handleCopyCode}
      >
        {size === 'small' ? '' : 'Copy Code'}
      </Button>
    </Tooltip>,
    <Popconfirm
      title={`Leave "${classroom.name}"?`}
      description="You will need to rejoin using the class code if you want to access this classroom again."
      onConfirm={handleLeave}
      okText="Yes, Leave"
      cancelText="Cancel"
      icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
    >
      <Button 
        type="text"
        danger
        icon={<LogoutOutlined />}
      >
        {size === 'small' ? '' : 'Leave'}
      </Button>
    </Popconfirm>
  ] : [];

  return (
    <Badge.Ribbon text="Enrolled" color="green">
      <Card
        className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        actions={actions}
        onClick={size === 'small' ? handleViewDetails : undefined}
      >
        <div className="mb-4">
          <div className="flex justify-between items-start mb-3">
            <Title 
              level={size === 'small' ? 5 : 4} 
              className="mb-0" 
              style={{ color: '#1890ff' }}
            >
              {classroom.name}
            </Title>
          </div>
          
          <Space direction="vertical" size="small" className="w-full">
            <Tag color="blue" icon={<BookOutlined />}>
              {classroom.subject}
            </Tag>
            
            {classroom.description && size !== 'small' && (
              <Text className="text-sm text-gray-600 line-clamp-2">
                {classroom.description.length > 100 
                  ? `${classroom.description.substring(0, 100)}...`
                  : classroom.description
                }
              </Text>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Code: <Text code strong>{classroom.code}</Text></span>
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
      </Card>
    </Badge.Ribbon>
  );
};

export default ClassroomCard; 