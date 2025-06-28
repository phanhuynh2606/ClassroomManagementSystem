import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Button, Slider, Tooltip, message } from 'antd';
import {
  PlayCircleOutlined,
  PauseOutlined,
  SoundOutlined,
  FullscreenOutlined,
  SettingOutlined,
  YoutubeOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { videoWatchAPI } from '../../../services/api';

const EnhancedVideoPlayer = ({ 
  videoData, 
  autoplay = false, 
  showControls = true,
  className = "",
  onReady,
  onError,
  // New props for tracking
  classroomId,
  streamItemId,
  enableTracking = true
}) => {
  const [playing, setPlaying] = useState(autoplay);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCustomControls, setShowCustomControls] = useState(false);
  
  // Watch tracking state
  const [watchId, setWatchId] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);
  const [totalWatchedSeconds, setTotalWatchedSeconds] = useState(0);
  const [viewCounted, setViewCounted] = useState(false);
  
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const progressUpdateIntervalRef = useRef(null);
  const sessionWatchTimeRef = useRef(0);

  if (!videoData) return null;

  const { url, embedUrl, title, thumbnail, type } = videoData;

  // Initialize watch tracking
  useEffect(() => {
    if (enableTracking && classroomId && videoData) {
      initializeWatchTracking();
    }

    // Cleanup on unmount
    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
      // End session when component unmounts
      if (watchId && sessionStartTime) {
        endWatchSession();
      }
    };
  }, [enableTracking, classroomId, videoData]);

  const initializeWatchTracking = async () => {
    try {
      const response = await videoWatchAPI.startWatching(
        {
          id: videoData.videoId || videoData.id,
          videoId: videoData.videoId || videoData.id,
          title: title,
          name: title,
          url: url,
          duration: videoData.duration,
          type: type
        },
        classroomId,
        streamItemId
      );

      if (response.data.success) {
        const { watchId: newWatchId, currentTime, progressPercent } = response.data.data;
        setWatchId(newWatchId);
        setSessionStartTime(Date.now());
        
        // Restore previous position if exists
        if (currentTime > 0 && playerRef.current) {
          console.log(`Resuming video from ${currentTime} seconds (${progressPercent}%)`);
          playerRef.current.seekTo(currentTime);
          message.info(`Resuming from ${formatTime(currentTime)}`);
        }
      }
    } catch (error) {
      console.error('Error initializing watch tracking:', error);
    }
  };

  const updateWatchProgress = useCallback(async () => {
    if (!watchId || !duration || seeking) return;

    try {
      const currentTime = played * duration;
      const now = Date.now();
      const sessionTime = sessionStartTime ? (now - sessionStartTime) / 1000 : 0;
      
      sessionWatchTimeRef.current = Math.min(sessionTime, currentTime);

      const response = await videoWatchAPI.updateProgress(
        watchId,
        currentTime,
        sessionWatchTimeRef.current
      );

      if (response.data.success) {
        const { viewCounted: newViewCounted } = response.data.data;
        if (newViewCounted && !viewCounted) {
          setViewCounted(true);
          console.log('View counted!');
        }
      }
      
      setLastProgressUpdate(now);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [watchId, duration, played, seeking, sessionStartTime, viewCounted]);

  const endWatchSession = async () => {
    if (!watchId) return;

    try {
      const currentTime = played * duration;
      await videoWatchAPI.endWatching(
        watchId,
        currentTime,
        sessionWatchTimeRef.current
      );
    } catch (error) {
      console.error('Error ending watch session:', error);
    }
  };

  // Setup progress tracking interval
  useEffect(() => {
    if (playing && watchId) {
      // Update progress every 15 seconds
      progressUpdateIntervalRef.current = setInterval(() => {
        updateWatchProgress();
      }, 15000);
    } else {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
        progressUpdateIntervalRef.current = null;
      }
    }

    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
    };
  }, [playing, watchId, updateWatchProgress]);

  // Determine video URL - prefer direct file URL for uploaded videos
  const getVideoUrl = () => {
    if (type === 'video' && url && !url.includes('youtube.com') && !url.includes('youtu.be')) {
      // For uploaded videos, use direct URL if available
      return url;
    }
    // For YouTube videos, use embedUrl or url
    return embedUrl || url;
  };

  const videoUrl = getVideoUrl();
  
  // Check if it's a YouTube video using URL pattern instead of ReactPlayer.canPlay
  const isYouTubeVideo = videoUrl && (
    videoUrl.includes('youtube.com') || 
    videoUrl.includes('youtu.be') || 
    videoUrl.includes('youtube-nocookie.com') ||
    type === 'video/youtube'
  );

  // Format time display
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Player event handlers
  const handlePlay = useCallback(() => {
    setPlaying(true);
    // Reset session start time when resuming
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
  }, [sessionStartTime]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    // Update progress when pausing
    if (watchId) {
      updateWatchProgress();
    }
  }, [watchId, updateWatchProgress]);

  const handleProgress = useCallback((state) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  }, [seeking]);

  const handleDuration = useCallback((duration) => {
    setDuration(duration);
    setLoading(false);
    if (onReady) onReady({ duration });
  }, [onReady]);

  const handleSeekChange = useCallback((value) => {
    setSeeking(true);
    setPlayed(value / 100);
  }, []);

  const handleSeekMouseUp = useCallback((value) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(value / 100);
    }
  }, []);

  const handleVolumeChange = useCallback((value) => {
    setVolume(value / 100);
    setMuted(value === 0);
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying(!playing);
  }, [playing]);

  const toggleMute = useCallback(() => {
    setMuted(!muted);
  }, [muted]);

  const toggleFullscreen = useCallback(() => {
    if (!fullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullscreen(false);
      }
    }
  }, [fullscreen]);

  const handleError = useCallback((error) => {
    console.error('Video player error:', error);
    setLoading(false);
    
    // More specific error messages
    let errorMessage = 'Failed to load video. Please try again.';
    if (error && typeof error === 'object') {
      if (error.message) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('format')) {
          errorMessage = 'Video format not supported.';
        } else if (error.message.includes('blocked')) {
          errorMessage = 'Video is blocked or unavailable.';
        }
      }
    }
    
    message.error(errorMessage);
    if (onError) onError(error);
  }, [onError]);

  const openInYouTube = useCallback(() => {
    if (url) {
      window.open(url, '_blank');
    }
  }, [url]);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseEnter={() => setShowCustomControls(true)}
      onMouseLeave={() => setShowCustomControls(false)}
    >
      {/* Video Player */}
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={playing}
        volume={volume}
        muted={muted}
        onPlay={handlePlay}
        onPause={handlePause}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onError={handleError}
        controls={!showControls}
        light={loading ? thumbnail : false}
        config={{
          youtube: {
            playerVars: {
              showinfo: 0,
              rel: 0,
              modestbranding: 1,
              controls: showControls ? 0 : 1,
              iv_load_policy: 3,
              fs: 1
            }
          },
          file: {
            attributes: {
              crossOrigin: 'anonymous',
              playsInline: true
            },
            forceVideo: true
          }
        }}
        style={{
          borderRadius: '8px'
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-center">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div>Loading video...</div>
          </div>
        </div>
      )}

      {/* Custom Controls Overlay */}
      {showControls && !loading && (
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ${
            showCustomControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Play/Pause Button Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              type="text"
              size="large"
              icon={playing ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={togglePlay}
              className="text-white text-4xl border-none shadow-lg bg-black bg-opacity-50 hover:bg-opacity-75"
              style={{ 
                width: '80px', 
                height: '80px',
                borderRadius: '50%'
              }}
            />
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <Slider
                value={played * 100}
                onChange={handleSeekChange}
                onAfterChange={handleSeekMouseUp}
                tooltip={{
                  formatter: (value) => formatTime((value / 100) * duration),
                  placement: 'top'
                }}
                className="video-progress-slider"
                trackStyle={{ backgroundColor: '#ff4d4f' }}
                handleStyle={{ 
                  borderColor: '#ff4d4f',
                  backgroundColor: '#ff4d4f'
                }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <Button
                  type="text"
                  icon={playing ? <PauseOutlined /> : <PlayCircleOutlined />}
                  onClick={togglePlay}
                  className="text-white hover:text-red-400"
                />

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <Button
                    type="text"
                    icon={<SoundOutlined />}
                    onClick={toggleMute}
                    className={`${muted ? 'text-gray-400' : 'text-white'} hover:text-red-400`}
                  />
                  <div className="w-20">
                    <Slider
                      value={muted ? 0 : volume * 100}
                      onChange={handleVolumeChange}
                      tooltip={{ formatter: (value) => `${value}%` }}
                      trackStyle={{ backgroundColor: '#ff4d4f' }}
                      handleStyle={{ 
                        borderColor: '#ff4d4f',
                        backgroundColor: '#ff4d4f',
                        width: '12px',
                        height: '12px'
                      }}
                    />
                  </div>
                </div>

                {/* Time Display */}
                <div className="text-white text-sm">
                  {formatTime(played * duration)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* YouTube Link */}
                {isYouTubeVideo && (
                  <Tooltip title="Watch on YouTube">
                    <Button
                      type="text"
                      icon={<YoutubeOutlined />}
                      onClick={openInYouTube}
                      className="text-white hover:text-red-400"
                    />
                  </Tooltip>
                )}

                {/* Quality/Settings */}
                <Tooltip title="Settings">
                  <Button
                    type="text"
                    icon={<SettingOutlined />}
                    className="text-white hover:text-red-400"
                  />
                </Tooltip>

                {/* Fullscreen */}
                <Tooltip title="Fullscreen">
                  <Button
                    type="text"
                    icon={<FullscreenOutlined />}
                    onClick={toggleFullscreen}
                    className="text-white hover:text-red-400"
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Video Title Overlay */}
          {title && showCustomControls && (
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
              <h3 className="text-white text-lg font-medium truncate">{title}</h3>
            </div>
          )}
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .video-progress-slider .ant-slider-rail {
          background-color: rgba(255, 255, 255, 0.3);
          height: 6px;
        }
        
        .video-progress-slider .ant-slider-track {
          height: 6px;
        }
        
        .video-progress-slider .ant-slider-handle {
          width: 16px;
          height: 16px;
          margin-top: -5px;
          border: 2px solid #ff4d4f;
        }
        
        .video-progress-slider:hover .ant-slider-handle {
          border-color: #ff7875;
        }
      `}</style>
    </div>
  );
};

export default EnhancedVideoPlayer; 