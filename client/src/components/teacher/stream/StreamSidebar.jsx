import React, { memo } from 'react';
import { Card, Button, Typography } from 'antd';
import { 
  VideoCameraOutlined, 
  LinkOutlined, 
  CopyOutlined, 
  MoreOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

const StreamSidebar = ({ classData, handleCopyClassCode, userRole = 'teacher' }) => {
  return (
    <div className="space-y-4">
      {/* Meet Integration */}
      {/* <Card size="small">
        <div className="flex items-center gap-3 mb-3">
          <VideoCameraOutlined className="text-blue-500" />
          <Text strong>Meet</Text>
          {userRole === 'teacher' && (
            <Button type="text" size="small" icon={<MoreOutlined />} />
          )}
        </div>
        {userRole === 'teacher' ? (
          <Button 
            type="primary" 
            block 
            className="mb-2"
            icon={<LinkOutlined />}
          >
            Generate link
          </Button>
        ) : (
          <Text type="secondary" className="text-sm">
            Your teacher will share the meeting link when it's available
          </Text>
        )}
      </Card> */}

      {/* Class Code */}
      <Card size="small">
        <div className="flex items-center justify-between mb-2">
          <Text strong>Class code</Text>
          {userRole === 'teacher' && (
            <Button type="text" size="small" icon={<MoreOutlined />} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Text 
            className="text-blue-600 font-mono text-lg cursor-pointer hover:underline"
            onClick={handleCopyClassCode}
          >
            {classData?.code || 'pc5z4c4l'}
          </Text>
          <CopyOutlined 
            className="text-gray-500 cursor-pointer hover:text-blue-500"
            onClick={handleCopyClassCode}
          />
        </div>
      </Card>

      {/* Upcoming */}
      {/* <Card size="small">
        <div className="flex items-center justify-between mb-3">
          <Text strong>Upcoming</Text>
        </div>
        <Text type="secondary" className="text-sm">
          No work due in soon
        </Text>
        <div className="mt-3">
          <Button type="link" size="small" className="p-0">
            View all
          </Button>
        </div>
      </Card> */}
    </div>
  );
};

export default memo(StreamSidebar); 