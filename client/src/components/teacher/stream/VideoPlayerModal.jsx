import React from 'react';
import { Modal, Badge } from 'antd';
import { PlayCircleOutlined, YoutubeOutlined, LinkOutlined } from '@ant-design/icons';
import {EnhancedVideoPlayer} from './index';

const VideoPlayerModal = ({ visible, onCancel, videoData, classroomId, streamItemId }) => {
  if (!videoData) return null;

  const { title, embedUrl, url, duration, channel, viewCount, thumbnail, type } = videoData;

  // Determine if this is a YouTube video or uploaded video
  const isYouTubeVideo = type === 'video/youtube' || 
                        (url && url.includes('youtube.com')) ||
                        (url && url.includes('youtu.be'));

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <PlayCircleOutlined className="text-white text-lg" />
          </div>
          <div className="flex-1 min-w-0 items-center">
            <div className="text-lg font-semibold truncate">{title}</div>
            <div className="text-sm text-gray-500 flex items-center gap-3">
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{channel}</span>
              {duration && <span> • Duration: {duration} minutes</span>}
              {" "}{viewCount && <span> • {(viewCount)} views</span>}
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      maskClosable={false}
      footer={[
        <div key="footer" className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isYouTubeVideo ? (
              <span className="flex items-center gap-1">
                <YoutubeOutlined className="text-red-500" />
                YouTube Video
              </span>
            ) : (
              <span className="flex items-center gap-1">
                🎬 Uploaded Video
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {url && (
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
              >
                {isYouTubeVideo ? (
                  <>
                    <YoutubeOutlined />
                    Watch on YouTube
                  </>
                ) : (
                  <>
                    <LinkOutlined />
                    Open Video
                  </>
                )}
              </a>
            )}
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      ]}
      width={Math.min(window.innerWidth * 0.8, 1080)}
      centered
      destroyOnHidden={true}
      className="enhanced-video-player-modal"
    >
      <div className="video-container">
        {isYouTubeVideo ? (
          /* YouTube Video - Use iframe for better YouTube integration */
          embedUrl ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 */ }}>
              <iframe
                src={`${embedUrl}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-lg"
              />
            </div>
          ) : (
            <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <YoutubeOutlined className="text-6xl mb-4 text-gray-400" />
                <div className="text-lg font-medium">Video not available for embedding</div>
                <div className="text-sm text-gray-400 mt-2">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <LinkOutlined />
                    Watch on YouTube
                  </a>
                </div>
              </div>
              {thumbnail && (
                <img
                  src={thumbnail}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
            </div>
          )
        ) : (
          /* Uploaded Video - Use Enhanced Player */
          <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
            <div className="absolute inset-0">
              <EnhancedVideoPlayer
                videoData={videoData}
                autoplay={true}
                showControls={true}
                className="w-full h-full"
                classroomId={classroomId}
                streamItemId={streamItemId}
                enableTracking={true}
                onReady={(playerData) => {
                  console.log('Video ready:', playerData);
                }}
                onError={(error) => {
                  console.error('Video error:', error);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Inline styles to replace styled-jsx */}
      <style>{`
        .enhanced-video-player-modal .ant-modal-body {
          padding: 16px 0;
        }
        
        .enhanced-video-player-modal .ant-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #f0f0f0;
        }
        
        .video-container iframe {
          border: none;
          outline: none;
        }

        .video-container {
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </Modal>
  );
};

export default VideoPlayerModal; 