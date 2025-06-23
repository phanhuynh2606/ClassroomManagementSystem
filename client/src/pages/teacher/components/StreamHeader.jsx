import React, { memo } from 'react';
import { Typography, Button } from 'antd';
import { SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const StreamHeader = ({ classData }) => {
  return (
    <div 
      className="relative h-64 mb-6 rounded-lg overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundImage: 'url(data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="36" cy="24" r="5"/%3E%3Cpath d="m36 19c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E)'
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <div className="absolute bottom-6 left-6 text-white">
        <Title level={1} className="text-white mb-2">
          {classData?.name || 'Test'}
        </Title>
        <Text className="text-white text-lg opacity-90">
          {classData?.subject || 'Programming Fundamentals'}
        </Text>
      </div>
      <div className="absolute top-4 right-4">
        <Button
          icon={<SettingOutlined />}
          className="text-white border-white hover:bg-white hover:text-gray-800"
          ghost
        >
          Customise
        </Button>
      </div>
      <div className="absolute bottom-4 right-4">
        <Button
          icon={<InfoCircleOutlined />}
          shape="circle"
          className="text-white border-white hover:bg-white hover:text-gray-800"
          ghost
        />
      </div>
    </div>
  );
};

export default memo(StreamHeader); 