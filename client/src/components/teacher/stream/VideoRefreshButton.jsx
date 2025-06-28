import React, { useState, useCallback } from 'react';
import { Button, message, Tooltip } from 'antd';
import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { youtubeAPI } from '../../../services/api';

const VideoRefreshButton = ({ videoId, onDurationUpdate, size = 'small' }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!videoId) return;

    setRefreshing(true);
    try {
      message.loading('Checking video duration...', 0);
      
      // Try to get updated video info
      const videoInfo = await youtubeAPI.getVideoInfo(videoId, 3); // Fewer retries for refresh
      
      message.destroy();
      
      if (videoInfo.duration && videoInfo.duration !== "Processing...") {
        message.success(`Duration updated: ${videoInfo.duration}`);
        if (onDurationUpdate) {
          onDurationUpdate(videoInfo);
        }
      } else {
        message.info({
          content: (
            <div>
              <div>Duration still processing...</div>
              <div className="text-xs text-gray-500 mt-1">
                YouTube typically takes 1-5 minutes to process video metadata
              </div>
            </div>
          ),
          duration: 5
        });
      }
    } catch (error) {
      console.error('Error refreshing video duration:', error);
      message.error('Failed to refresh duration. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  }, [videoId, onDurationUpdate]);

  return (
    <Tooltip title="Refresh duration from YouTube">
      <Button
        type="text"
        size={size}
        icon={refreshing ? <ClockCircleOutlined spin /> : <ReloadOutlined />}
        onClick={handleRefresh}
        loading={refreshing}
        className="text-blue-600 hover:text-blue-700"
      >
        {size !== 'small' && 'Refresh'}
      </Button>
    </Tooltip>
  );
};

export default VideoRefreshButton; 