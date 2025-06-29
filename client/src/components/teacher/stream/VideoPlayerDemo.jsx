import React, { useState } from 'react';
import { Card, Button, Space, Divider, Typography, Tag } from 'antd';
import { PlayCircleOutlined, YoutubeOutlined, LockOutlined } from '@ant-design/icons';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';
import VideoPlayerModal from './VideoPlayerModal';
import VideoPermissionsGuide from './VideoPermissionsGuide';

const { Title, Text } = Typography;

const VideoPlayerDemo = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [permissionsGuideVisible, setPermissionsGuideVisible] = useState(false);

  // Sample video data for demo
  const sampleVideos = [
    {
      id: '1',
      title: 'Sample YouTube Video - React Tutorial',
      type: 'video/youtube',
      url: 'https://www.youtube.com/watch?v=p4czhxeW6W0',
      embedUrl: 'https://www.youtube.com/embed/p4czhxeW6W0',
      thumbnail: 'https://img.youtube.com/vi/dGcsHMXbSOA/hqdefault.jpg',
      duration: '15:30',
      channel: 'React Channel',
      viewCount: '100000'
    },
    {
      id: '2',
      title: 'Sample Uploaded Video - Educational Content',
      type: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
      duration: '9:56',
      channel: 'Your Channel',
      viewCount: '0',
      uploadedByUser: true
    }
  ];

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setModalVisible(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Title level={2}>
              <PlayCircleOutlined className="text-red-500 mr-3" />
              Enhanced Video Player Demo
            </Title>
            <Text type="secondary" className="text-lg">
              Showcasing improved video player with custom controls and YouTube integration
            </Text>
          </div>
          <Button
            icon={<LockOutlined />}
            onClick={() => setPermissionsGuideVisible(true)}
            className="ml-4"
          >
            View Permissions
          </Button>
        </div>
      </div>

      {/* Feature Highlights */}
      <Card className="mb-6">
        <Title level={4}>🚀 Features</Title>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 font-medium">📺 Dual Support</div>
            <div className="text-sm text-gray-600 mt-1">
              YouTube videos + Direct file uploads
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 font-medium">🎮 Custom Controls</div>
            <div className="text-sm text-gray-600 mt-1">
              Play/pause, volume, seek, fullscreen
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-600 font-medium">🎨 Beautiful UI</div>
            <div className="text-sm text-gray-600 mt-1">
              Gradient overlays, hover effects, smooth animations
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-orange-600 font-medium">⚡ Smart Loading</div>
            <div className="text-sm text-gray-600 mt-1">
              Thumbnail preview, loading states
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-600 font-medium">🖥️ Fullscreen</div>
            <div className="text-sm text-gray-600 mt-1">
              Native fullscreen support
            </div>
          </div>
          <div className="bg-cyan-50 p-4 rounded-lg">
            <div className="text-cyan-600 font-medium">📱 Responsive</div>
            <div className="text-sm text-gray-600 mt-1">
              Works on all screen sizes
            </div>
          </div>
        </div>
      </Card>

      {/* Video Samples */}
      <div className="space-y-6">
        <Title level={3}>🎬 Video Samples</Title>
        
        {sampleVideos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <div className="flex items-start gap-4">
              {/* Video Thumbnail */}
              <div 
                className="relative w-48 h-28 bg-black rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleVideoClick(video)}
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    video.type === 'video/youtube' ? 'bg-red-600' : 'bg-blue-600'
                  }`}>
                    {video.type === 'video/youtube' ? (
                      <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                    ) : (
                      <span className="text-white text-xl">🎬</span>
                    )}
                  </div>
                </div>
                
                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                  {video.duration}
                </div>
                
                {/* Type badge */}
                <div className="absolute top-2 left-2">
                  <Tag color={video.type === 'video/youtube' ? 'red' : 'blue'}>
                    {video.type === 'video/youtube' ? 'YouTube' : 'Upload'}
                  </Tag>
                </div>
              </div>

              {/* Video Info */}
              <div className="flex-1">
                <Title level={4} className="mb-2">{video.title}</Title>
                <Space direction="vertical" size="small">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>📺 {video.channel}</span>
                    <span>⏱️ {video.duration}</span>
                    <span>👁️ {parseInt(video.viewCount).toLocaleString()} views</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {video.type === 'video/youtube' ? (
                      <Tag icon={<YoutubeOutlined />} color="red">
                        YouTube Video
                      </Tag>
                    ) : (
                      <Tag color="blue">
                        🎬 Uploaded Video
                      </Tag>
                    )}
                  </div>
                </Space>

                <div className="mt-4">
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleVideoClick(video)}
                    className="bg-red-600 border-red-600 hover:bg-red-700"
                  >
                    Play Video
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Embedded Player Demo */}
      <Divider />
      <div className="mb-6">
        <Title level={3}>🎮 Embedded Player Preview</Title>
        <Text type="secondary" className="block mb-4">
          Direct embedded player (not in modal) - Shows custom controls and features
        </Text>
        
        <Card className="overflow-hidden">
          <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
            <div className="absolute inset-0">
              <EnhancedVideoPlayer
                videoData={sampleVideos[1]} // Use uploaded video sample
                autoplay={false}
                showControls={true}
                className="w-full h-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        videoData={selectedVideo}
      />

      {/* Video Permissions Guide */}
      <VideoPermissionsGuide
        visible={permissionsGuideVisible}
        onClose={() => setPermissionsGuideVisible(false)}
      />
    </div>
  );
};

export default VideoPlayerDemo; 