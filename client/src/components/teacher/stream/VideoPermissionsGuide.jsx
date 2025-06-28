import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Table, 
  Tag, 
  Button, 
  Modal, 
  Tabs, 
  Space,
  Alert,
  Collapse
} from 'antd';
import { 
  VideoCameraOutlined, 
  YoutubeOutlined, 
  LockOutlined, 
  UnlockOutlined,
  UserOutlined,
  CrownOutlined,
  TeamOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useVideoPermissions } from './VideoPermissionGuard';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const VideoPermissionsGuide = ({ visible, onClose }) => {
  const { userRole, userId } = useVideoPermissions();
  const [activeTab, setActiveTab] = useState('overview');

  // Permission matrix data
  const permissionMatrix = [
    {
      key: '1',
      action: 'Upload Video Files',
      description: 'Upload video files directly to YouTube',
      student: false,
      teacher: true,
      admin: true,
      notes: 'Requires YouTube API authentication'
    },
    {
      key: '2', 
      action: 'Add YouTube Videos',
      description: 'Add existing YouTube videos by URL',
      student: false,
      teacher: true,
      admin: true,
      notes: 'No upload quota consumed'
    },
    {
      key: '3',
      action: 'View Videos',
      description: 'Watch videos in classrooms',
      student: true,
      teacher: true, 
      admin: true,
      notes: 'Available to all users'
    },
    {
      key: '4',
      action: 'Edit Video Metadata',
      description: 'Edit title, description, tags',
      student: false,
      teacher: 'own',
      admin: true,
      notes: 'Teachers can only edit their own videos'
    },
    {
      key: '5',
      action: 'Delete Videos',
      description: 'Remove videos from stream',
      student: false,
      teacher: 'own',
      admin: true,
      notes: 'Permanent action, cannot be undone'
    },
    {
      key: '6',
      action: 'Manage Privacy Settings',
      description: 'Set video as public/unlisted/private',
      student: false,
      teacher: true,
      admin: true,
      notes: 'Controls who can view the video'
    },
    {
      key: '7',
      action: 'Comment on Videos',
      description: 'Add comments to video posts',
      student: true,
      teacher: true,
      admin: true,
      notes: 'Subject to classroom moderation'
    },
    {
      key: '8',
      action: 'YouTube API Management',
      description: 'Configure YouTube integration',
      student: false,
      teacher: false,
      admin: true,
      notes: 'System-level configuration'
    }
  ];

  const roleDescriptions = {
    student: {
      icon: <UserOutlined className="text-blue-500" />,
      color: 'blue',
      title: 'Student',
      permissions: [
        '✅ View all videos in joined classrooms',
        '✅ Watch videos inline or on YouTube',
        '✅ Comment on video posts (if allowed)',
        '✅ Like/react to video content',
        '❌ Upload or add videos',
        '❌ Edit video metadata',
        '❌ Delete video content'
      ],
      limitations: [
        'Cannot upload video files',
        'Cannot add YouTube videos',
        'Cannot modify video settings',
        'Comments subject to moderation'
      ]
    },
    teacher: {
      icon: <TeamOutlined className="text-green-500" />,
      color: 'green', 
      title: 'Teacher',
      permissions: [
        '✅ All student permissions',
        '✅ Upload video files to YouTube',
        '✅ Add YouTube videos by URL',
        '✅ Edit own video metadata',
        '✅ Delete own videos',
        '✅ Set privacy settings',
        '✅ Manage classroom video content',
        '❌ Edit others\' videos',
        '❌ System-level YouTube settings'
      ],
      limitations: [
        'Can only edit/delete own videos',
        'Cannot access others\' YouTube channels',
        'Subject to upload quotas and limits',
        'Requires YouTube account authentication'
      ]
    },
    admin: {
      icon: <CrownOutlined className="text-orange-500" />,
      color: 'orange',
      title: 'Administrator', 
      permissions: [
        '✅ All teacher permissions',
        '✅ Edit any video metadata',
        '✅ Delete any video content',
        '✅ Manage YouTube API settings',
        '✅ View upload statistics',
        '✅ Configure system limits',
        '✅ Access all classrooms',
        '✅ Moderate all video content'
      ],
      limitations: [
        'Responsible for YouTube API quotas',
        'Must ensure compliance with policies',
        'System configuration changes affect all users'
      ]
    }
  };

  const uploadLimits = {
    fileSize: '200MB per video',
    duration: 'No specific limit (YouTube limits apply)',
    formats: 'MP4, MOV, AVI, WMV, FLV, WebM',
    quota: 'Subject to YouTube API daily quotas',
    authentication: 'Google account with YouTube access required',
    privateSharing: 'Max 50 people can be invited to private videos'
  };

  const renderPermissionIcon = (permission) => {
    if (permission === true) {
      return <Tag color="green" icon={<UnlockOutlined />}>Allowed</Tag>;
    } else if (permission === false) {
      return <Tag color="red" icon={<LockOutlined />}>Denied</Tag>;
    } else if (permission === 'own') {
      return <Tag color="orange" icon={<UserOutlined />}>Own Only</Tag>;
    }
    return <Tag color="default">-</Tag>;
  };

  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 200,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" className="text-xs">
            {record.description}
          </Text>
        </div>
      )
    },
    {
      title: 'Student',
      dataIndex: 'student', 
      key: 'student',
      align: 'center',
      width: 100,
      render: renderPermissionIcon
    },
    {
      title: 'Teacher',
      dataIndex: 'teacher',
      key: 'teacher', 
      align: 'center',
      width: 100,
      render: renderPermissionIcon
    },
    {
      title: 'Admin',
      dataIndex: 'admin',
      key: 'admin',
      align: 'center', 
      width: 100,
      render: renderPermissionIcon
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (text) => (
        <Text type="secondary" className="text-xs">
          {text}
        </Text>
      )
    }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <VideoCameraOutlined className="text-red-500 text-xl" />
          <div>
            <Title level={4} className="mb-0">Video Upload Permissions</Title>
            <Text type="secondary">Role-based access control for video features</Text>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      width="90vw"
      style={{ maxWidth: '1200px' }}
      bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <InfoCircleOutlined />
              Overview
            </span>
          } 
          key="overview"
        >
          <Space direction="vertical" className="w-full" size="large">
            {/* Current User Info */}
            <Alert
              message={
                <div className="flex items-center gap-2">
                  {roleDescriptions[userRole]?.icon}
                  <span>Your current role: <strong className="capitalize">{userRole}</strong></span>
                </div>
              }
              description={`You have ${userRole} level permissions for video features.`}
              type="info"
              showIcon={false}
              className="mb-4"
            />

            {/* Permission Matrix */}
            <Card title="Permission Matrix" size="small">
              <Table
                columns={columns}
                dataSource={permissionMatrix}
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
              />
            </Card>
          </Space>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <UserOutlined />
              Role Details
            </span>
          } 
          key="roles"
        >
          <Space direction="vertical" className="w-full" size="large">
            {Object.entries(roleDescriptions).map(([role, desc]) => (
              <Card 
                key={role}
                title={
                  <div className="flex items-center gap-2">
                    {desc.icon}
                    <span>{desc.title}</span>
                    {role === userRole && (
                      <Tag color={desc.color} className="ml-2">Your Role</Tag>
                    )}
                  </div>
                }
                size="small"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Title level={5} className="text-green-600 mb-2">Permissions</Title>
                    <ul className="list-none space-y-1">
                      {desc.permissions.map((perm, idx) => (
                        <li key={idx} className="text-sm">
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Title level={5} className="text-orange-600 mb-2">Limitations</Title>
                    <ul className="list-none space-y-1">
                      {desc.limitations.map((limit, idx) => (
                        <li key={idx} className="text-sm text-gray-600">
                          • {limit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <YoutubeOutlined />
              Upload Limits
            </span>
          } 
          key="limits"
        >
          <Space direction="vertical" className="w-full" size="large">
            <Card title="Technical Limitations" size="small">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(uploadLimits).map(([key, value]) => (
                  <div key={key} className="p-3 border rounded-lg">
                    <Text strong className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </Text>
                    <br />
                    <Text type="secondary">{value}</Text>
                  </div>
                ))}
              </div>
            </Card>

            <Collapse size="small">
              <Panel header="YouTube API Authentication" key="auth">
                <div className="space-y-2">
                  <Paragraph>
                    <Text strong>For Teachers & Admins:</Text>
                  </Paragraph>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Must authenticate with a Google account</li>
                    <li>Account must have YouTube channel access</li>
                    <li>App is in development mode - only authorized test users can upload</li>
                    <li>Contact administrator to add email to authorized users list</li>
                  </ul>
                </div>
              </Panel>
              
              <Panel header="File Format Support" key="formats">
                <div className="space-y-2">
                  <Text strong>Supported formats:</Text>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['MP4', 'MOV', 'AVI', 'WMV', 'FLV', 'WebM'].map(format => (
                      <Tag key={format} color="blue">{format}</Tag>
                    ))}
                  </div>
                  <Text type="secondary" className="text-xs block mt-2">
                    Maximum file size: 200MB for free YouTube accounts
                  </Text>
                </div>
              </Panel>

              <Panel header="Privacy Settings Explained" key="privacy">
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🔐</span>
                      <Text strong>Private</Text>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• Only uploader can view initially</li>
                      <li>• Can invite up to 50 specific Google accounts</li>
                      <li>• Invited users must sign in to view</li>
                      <li>• Perfect for small, controlled groups</li>
                      <li>• No public link sharing possible</li>
                    </ul>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🔒</span>
                      <Text strong>Unlisted (Recommended)</Text>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• Anyone with the link can view</li>
                      <li>• Easy sharing within classroom platforms</li>
                      <li>• No limit on number of viewers</li>
                      <li>• Not searchable on YouTube</li>
                      <li>• Best balance of security and convenience</li>
                    </ul>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🌐</span>
                      <Text strong>Public</Text>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• Visible to everyone on YouTube</li>
                      <li>• Appears in search results</li>
                      <li>• Can be recommended to other users</li>
                      <li>• Good for educational content sharing</li>
                      <li>• Use when content is meant for public access</li>
                    </ul>
                  </div>
                </div>
              </Panel>
            </Collapse>
          </Space>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default VideoPermissionsGuide; 