import React from 'react';
import { Typography } from 'antd';

const { Title, Text } = Typography;

const StreamEmptyState = () => {
  return (
    <div className="text-center py-16">
      <div className="mb-4">
        <img 
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120' viewBox='0 0 200 120'%3E%3Cg fill='%23e0e0e0'%3E%3Cpath d='M50 60c0-16.569 13.431-30 30-30s30 13.431 30 30-13.431 30-30 30-30-13.431-30-30z'/%3E%3Cpath d='M120 60c0-16.569 13.431-30 30-30s30 13.431 30 30-13.431 30-30 30-30-13.431-30-30z'/%3E%3C/g%3E%3C/svg%3E" 
          alt="No content"
          className="mx-auto mb-4"
        />
      </div>
      <Title level={3} className="text-gray-500 mb-2">
        This is where you can talk to your class
      </Title>
      <Text type="secondary" className="text-lg">
        Use the stream to share announcements, post assignments and respond to
      </Text>
      <br />
      <Text type="secondary" className="text-lg">
        student questions.
      </Text>
    </div>
  );
};

export default StreamEmptyState; 