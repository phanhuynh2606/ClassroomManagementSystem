import React from 'react';
import { Card, Tag, Space, Typography, Tooltip } from 'antd';
import { 
  CommentOutlined, 
  EditOutlined, 
  UserAddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

const ClassroomPermissionStatus = ({ classroom, compact = false }) => {
  if (!classroom?.settings) return null;

  const settings = classroom.settings;
  
  const permissions = [
    {
      key: 'comment',
      label: 'Comments',
      icon: <CommentOutlined />,
      allowed: settings.allowStudentComment !== false, // Default true
      description: 'Students can comment on posts'
    },
    {
      key: 'post',
      label: 'Posts',
      icon: <EditOutlined />,
      allowed: settings.allowStudentPost === true, // Default false
      description: 'Students can create their own posts'
    },
    {
      key: 'invite',
      label: 'Invites',
      icon: <UserAddOutlined />,
      allowed: settings.allowStudentInvite === true, // Default false
      description: 'Students can invite others to join'
    }
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {permissions.map(permission => (
          <Tooltip key={permission.key} title={permission.description}>
            <Tag 
              color={permission.allowed ? 'green' : 'red'}
              className="flex items-center gap-1"
            >
              {permission.allowed ? (
                <CheckCircleOutlined className="text-xs" />
              ) : (
                <CloseCircleOutlined className="text-xs" />
              )}
              {permission.label}
            </Tag>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <Card 
      size="small" 
      title={
        <Space>
          <span>Classroom Permissions</span>
          <Text type="secondary" className="text-xs font-normal">
            What you can do in this classroom
          </Text>
        </Space>
      }
      className="mb-4"
    >
      <Space direction="vertical" size="small" className="w-full">
        {permissions.map(permission => (
          <div key={permission.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {permission.icon}
              <Text>{permission.label}</Text>
            </div>
            <Tag 
              color={permission.allowed ? 'green' : 'red'}
              className="flex items-center gap-1"
            >
              {permission.allowed ? (
                <>
                  <CheckCircleOutlined className="text-xs" />
                  Enabled
                </>
              ) : (
                <>
                  <CloseCircleOutlined className="text-xs" />
                  Disabled
                </>
              )}
            </Tag>
          </div>
        ))}
      </Space>
    </Card>
  );
};

export default ClassroomPermissionStatus; 