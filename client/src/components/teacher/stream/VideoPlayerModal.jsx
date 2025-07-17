import React, { useRef, useState, useEffect } from 'react';
import { Modal, Badge } from 'antd';
import { PlayCircleOutlined, YoutubeOutlined, LinkOutlined } from '@ant-design/icons';
import {EnhancedVideoPlayer} from './index';
import { videoWatchAPI } from '../../../services/api';

const VideoPlayerModal = ({ visible, onCancel, videoData, classroomId, streamItemId, enableTracking = true }) => {
  const playerRef = useRef(null);
  const [realViewCount, setRealViewCount] = useState(null);
  const [loadingViewCount, setLoadingViewCount] = useState(true);
  
  // Extract videoId from videoData
  const getVideoId = () => {
    if (!videoData) return null;
    
    let videoId = videoData.videoId || videoData.id;
    if (!videoId && (videoData.url || videoData.embedUrl)) {
      const ytUrl = videoData.url || videoData.embedUrl;
      const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = ytUrl.match(ytRegex);
      if (match) {
        videoId = match[1];
      }
    }
    return videoId;
  };

  // Fetch real view count from database
  const fetchViewCount = async () => {
    if (!visible || !classroomId || !enableTracking) return;
    
    const videoId = getVideoId();
    if (!videoId) {
      setLoadingViewCount(false);
      return;
    }

    try {
      const response = await videoWatchAPI.getVideoViewCount(classroomId, videoId);
      
      if (response.success) {
        setRealViewCount(response.data.viewCount);
      } else {
        console.error('❌ Failed to fetch view count:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching view count:', error);
    } finally {
      setLoadingViewCount(false);
    }
  };

  useEffect(() => {
    fetchViewCount();
  }, [visible, classroomId, enableTracking]);

  // Callback when view is counted to refresh view count
  const handleViewCounted = () => {
    fetchViewCount();
  };  

  // Reset view count when modal closes
  useEffect(() => {
    if (!visible) {
      setRealViewCount(null);
      setLoadingViewCount(true);
    }
  }, [visible]);

  // Early return after all hooks
  if (!videoData) return null;

  const { title, embedUrl, url, duration, channel, viewCount, thumbnail, type } = videoData;

  // Determine if this is a YouTube video or uploaded video
  const isYouTubeVideo = type === 'video/youtube' || 
                        (url && url.includes('youtube.com')) ||
                        (url && url.includes('youtu.be'));

  const handleModalClose = () => {
    // End watch session before closing modal
    if (playerRef.current && enableTracking) {
      playerRef.current.endWatchSession();
    }
    onCancel();
  };

  // Function to display view count
  const displayViewCount = () => {
    if (!enableTracking) {
      // If tracking is disabled, show original viewCount or nothing
      return viewCount ? `${viewCount} views` : null;
    }
    
    if (loadingViewCount) {
      return '⏳ loading...';
    }
    
    if (realViewCount !== null) {
      return `${realViewCount} views`;
    }
    
    // Fallback to original viewCount if real count fails to load
    return viewCount ? `${viewCount} views` : '0 views';
  };

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
              {" "}{displayViewCount() && <span> • {displayViewCount()}</span>}
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleModalClose}
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
              onClick={handleModalClose}
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
        {/* Use EnhancedVideoPlayer for all videos (YouTube and uploaded) to enable tracking */}
        <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
          <div className="absolute inset-0">
            <EnhancedVideoPlayer
              videoData={videoData}
              autoplay={true}
              showControls={true}
              className="w-full h-full"
              classroomId={classroomId}
              streamItemId={streamItemId}
              enableTracking={enableTracking}
              onViewCounted={handleViewCounted}
              onReady={(playerData) => {
                console.log('Video ready:', playerData);
              }}
              onError={(error) => {
                console.error('Video error:', error);
              }}
              ref={playerRef}
            />
          </div>
        </div>
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