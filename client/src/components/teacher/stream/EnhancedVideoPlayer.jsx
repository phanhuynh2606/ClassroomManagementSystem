import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import ReactPlayer from 'react-player';
import { Button, Slider, Tooltip, message } from 'antd';
import {
  PlayCircleOutlined,
  PauseOutlined,
  SoundOutlined,
  FullscreenOutlined,
  SettingOutlined,
  YoutubeOutlined,
  LinkOutlined,
  CheckOutlined,
  RedoOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { videoWatchAPI } from '../../../services/api';

const EnhancedVideoPlayer = forwardRef(({ 
  videoData, 
  autoplay = false, 
  showControls = true,
  className = "",
  onReady,
  onError,
  // New props for tracking
  classroomId,
  streamItemId,
  enableTracking = true,
  onViewCounted  // New callback when view is counted
}, ref) => {
  const [playing, setPlaying] = useState(autoplay);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCustomControls, setShowCustomControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  
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
  
  // Store latest values in refs to avoid stale closure
  const latestValuesRef = useRef({
    watchId: null,
    duration: 0,
    played: 0,
    seeking: false,
    sessionStartTime: null,
    viewCounted: false,
    isEndingSession: false  // Add flag to prevent double calls
  });

  // Update refs whenever values change
  useEffect(() => {
    latestValuesRef.current = {
      ...latestValuesRef.current,  // Preserve isEndingSession flag
      watchId,
      duration,
      played,
      seeking,
      sessionStartTime,
      viewCounted
    };
  }, [watchId, duration, played, seeking, sessionStartTime, viewCounted]);

  if (!videoData) return null;

  const { url, embedUrl, title, thumbnail, type } = videoData;

  // Initialize watch tracking
  useEffect(() => {
    
    if (enableTracking && classroomId && videoData) {
      console.log('✅ Starting tracking initialization...');
      initializeWatchTracking();
    } else {
      console.log('❌ Tracking not initialized - missing requirements:', {
        enableTracking: enableTracking ? '✅' : '❌ false/undefined',
        classroomId: classroomId ? '✅' : '❌ missing', 
        videoData: videoData ? '✅' : '❌ missing'
      });
    }

    // Cleanup on unmount
    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
      // End session when component unmounts (only if not already ending)
      const current = latestValuesRef.current;
      if (current.watchId && current.sessionStartTime && !current.isEndingSession) {
        endWatchSession();
      } else if (current.isEndingSession) {
        console.log('ℹ️ Watch session already being ended - skipping cleanup');
      } else {
        console.log('ℹ️ Watch session already ended or not started - skipping cleanup');
      }
    };
  }, [enableTracking, classroomId, videoData]);

  const initializeWatchTracking = async (skipResume = false) => {
    try {
      // Check authentication
      const token = localStorage.getItem('token');
      console.log('🔐 Auth check:', token ? 'Token exists' : 'No token found');
      
      // Parse duration for YouTube videos (MM:SS format to seconds)
      let durationInSeconds = 0;
      if (videoData.duration) {
        const parts = videoData.duration.toString().split(':').map(p => parseInt(p) || 0);
        if (parts.length === 2) {
          durationInSeconds = parts[0] * 60 + parts[1]; // MM:SS
        } else if (parts.length === 3) {
          durationInSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
        } else if (parts.length === 1) {
          durationInSeconds = parts[0]; // Already in seconds
        }
      }

      // Extract YouTube video ID if needed
      let videoId = videoData.videoId || videoData.id;
      if (!videoId && (url || embedUrl)) {
        const ytUrl = url || embedUrl;
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = ytUrl.match(ytRegex);
        if (match) {
          videoId = match[1];
        }
      }

      // Determine video type
      const videoType = isYouTubeVideo ? 'video/youtube' : 'video';

      const response = await videoWatchAPI.startWatching(
        {
          id: videoId,
          videoId: videoId,
          title: title,
          name: title,
          url: url,
          duration: durationInSeconds,
          type: videoType
        },
        classroomId,
        streamItemId
      );

      if (response.success) {
        const { watchId: newWatchId, currentTime, progressPercent } = response.data;
        
        setWatchId(newWatchId);
        setSessionStartTime(Date.now());
        
        // Reset ending session flag for new session
        latestValuesRef.current.isEndingSession = false;
        
        // Restore previous position if exists (unless skipResume is true)
        if (currentTime > 0 && playerRef.current && !skipResume) {
          
          // Add delay to ensure player is ready
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.seekTo(currentTime);
              message.info(`Resuming from ${formatTime(currentTime)}`);
            }
          }, 1000);
        } else if (skipResume) {
          // Ensure we start from 0
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.seekTo(0);
            }
          }, 500);
        } else {
          console.log('ℹ️ Starting from beginning - no previous position');
        }
      } else {
        console.error('❌ Watch tracking initialization failed:', response);
      }
    } catch (error) {
      console.error('Error initializing watch tracking:', error);
    }
  };

  const endWatchSession = async () => {
    const current = latestValuesRef.current;
    
    // Check if already ending session to prevent race conditions
    if (current.isEndingSession) {
      console.log('⚠️ Session already being ended - skipping duplicate call');
      return;
    }
    
    if (!current.watchId) {
      console.log('⚠️ No watchId available for ending session');
      return;
    }

    // Set flag immediately to prevent double calls
    latestValuesRef.current.isEndingSession = true;

    try {
      const currentTime = current.played * current.duration;
      const now = Date.now();
      const sessionTime = current.sessionStartTime ? (now - current.sessionStartTime) / 1000 : 0;
      
      // Calculate actual watched seconds for this session
      const actualWatchedSeconds = Math.min(sessionTime, currentTime);

      await videoWatchAPI.endWatching(
        current.watchId,
        currentTime,
        actualWatchedSeconds
      );
      
      // Clear watchId to prevent future calls
      setWatchId(null);
      setSessionStartTime(null);
      
      // Also update refs immediately
      latestValuesRef.current.watchId = null;
      latestValuesRef.current.sessionStartTime = null;
      
    } catch (error) {
      console.error('❌ Error ending watch session:', error);
      // Reset flag on error so it can be retried
      latestValuesRef.current.isEndingSession = false;
    }
  };

  // Setup progress tracking interval
  useEffect(() => {
    
    // Clear existing interval first
    if (progressUpdateIntervalRef.current) {
      clearInterval(progressUpdateIntervalRef.current);
      progressUpdateIntervalRef.current = null;
    }
    
    if (playing && watchId) {
      console.log('✅ Setting up 15s progress tracking interval');
      // Update progress every 15 seconds
      progressUpdateIntervalRef.current = setInterval(async () => {
        const current = latestValuesRef.current;
        console.log('⏰ Progress interval triggered - updating...');
        
        if (!current.watchId || !current.duration || current.seeking) {
          return;
        }

        try {
          const currentTime = current.played * current.duration;
          const now = Date.now();
          const sessionTime = current.sessionStartTime ? (now - current.sessionStartTime) / 1000 : 0;
          
          sessionWatchTimeRef.current = Math.min(sessionTime, currentTime);


          const response = await videoWatchAPI.updateProgress(
            current.watchId,
            currentTime,
            sessionWatchTimeRef.current
          );

          console.log('📊 Progress update response:', response);

          if (response.success) {
            const { viewCounted: newViewCounted } = response.data;
            if (newViewCounted && !current.viewCounted) {
              setViewCounted(true);
              console.log('👁️ View counted!');
              // Notify parent component that view was counted
              if (onViewCounted) {
                onViewCounted();
              }
            }
            console.log('✅ Progress updated successfully');
          }
          
          setLastProgressUpdate(now);
        } catch (error) {
          console.error('❌ Error updating progress:', error);
        }
      }, 15000);
    }

    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
        progressUpdateIntervalRef.current = null;
      }
    };
  }, [playing, watchId]);

  // Debug watchId changes
  useEffect(() => {
    console.log('🆔 WatchID changed:', watchId ? `Set to ${watchId}` : 'Not set');
  }, [watchId]);

  // Save progress when user pauses or when component unmounts
  useEffect(() => {
    const handleBeforeUnload = () => {
      const current = latestValuesRef.current;
      
      if (current.watchId && current.sessionStartTime) {
        // Use sendBeacon for reliable request when page unloads
        const currentTime = current.played * current.duration;
        const now = Date.now();
        const sessionTime = current.sessionStartTime ? (now - current.sessionStartTime) / 1000 : 0;
        const actualWatchedSeconds = Math.min(sessionTime, currentTime);
        
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        
        // Try sendBeacon first, fallback to fetch with keepalive
        const success = navigator.sendBeacon(
          `${apiUrl}/video-watch/end/${current.watchId}`,
          JSON.stringify({
            endPosition: currentTime,
            sessionWatchedSeconds: actualWatchedSeconds
          })
        );
        
        if (!success) {
          // Fallback to fetch with keepalive
          fetch(`${apiUrl}/video-watch/end/${current.watchId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              endPosition: currentTime,
              sessionWatchedSeconds: actualWatchedSeconds
            }),
            keepalive: true
          }).catch(console.error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Empty dependency array since we use refs

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
    console.log('▶️ PLAY event - Setting playing to true');
    setPlaying(true);
    // Reset session start time when resuming
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
      console.log('📅 Session start time initialized');
    }
  }, [sessionStartTime]);

  const handlePause = useCallback(() => {
    console.log('⏸️ PAUSE event - Setting playing to false');
    setPlaying(false);
    // Update progress immediately when pausing
    const current = latestValuesRef.current;
    if (current.watchId) {
      console.log('💾 Updating progress on pause...');
      
      // Inline progress update for pause
      (async () => {
        if (!current.watchId || !current.duration || current.seeking) return;

        try {
          const currentTime = current.played * current.duration;
          const now = Date.now();
          const sessionTime = current.sessionStartTime ? (now - current.sessionStartTime) / 1000 : 0;
          
          sessionWatchTimeRef.current = Math.min(sessionTime, currentTime);

          const response = await videoWatchAPI.updateProgress(
            current.watchId,
            currentTime,
            sessionWatchTimeRef.current
          );

          if (response.success) {
            const { viewCounted: newViewCounted } = response.data;
            if (newViewCounted && !current.viewCounted) {
              setViewCounted(true);
              console.log('👁️ View counted!');
              // Notify parent component that view was counted
              if (onViewCounted) {
                onViewCounted();
              }
            }
            console.log('✅ Pause progress updated successfully');
          }
          
          setLastProgressUpdate(now);
        } catch (error) {
          console.error('❌ Error updating progress on pause:', error);
        }
      })();
    }
  }, []);

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

  // Add onReady handler to clear loading state
  const handleReady = useCallback(() => {
    setLoading(false);
  }, []);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout - clearing loading state');
        setLoading(false);
      }
    }, 1000); // 10 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  // Close settings when user leaves video area
  useEffect(() => {
    if (!showCustomControls && showSettings) {
      const timeout = setTimeout(() => setShowSettings(false), 3000); // Close after 3s if no interaction
      return () => clearTimeout(timeout);
    }
  }, [showCustomControls, showSettings]);

  // Close settings when pressing Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showSettings) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showSettings]);

  const handleSeekChange = useCallback((value) => {
    setSeeking(true);
    setPlayed(value / 100);
  }, []);

  const handleSeekMouseUp = useCallback((value) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(value / 100);
      // Update progress after seeking
      setTimeout(() => {
        const current = latestValuesRef.current;
        if (current.watchId) {
          console.log('💾 Updating progress after seek...');
          
          // Inline progress update for seek
          (async () => {
            if (!current.watchId || !current.duration) return;

            try {
              const currentTime = current.played * current.duration;
              const now = Date.now();
              const sessionTime = current.sessionStartTime ? (now - current.sessionStartTime) / 1000 : 0;
              
              sessionWatchTimeRef.current = Math.min(sessionTime, currentTime);

              const response = await videoWatchAPI.updateProgress(
                current.watchId,
                currentTime,
                sessionWatchTimeRef.current
              );

              if (response.success) {
                const { viewCounted: newViewCounted } = response.data;
                if (newViewCounted && !current.viewCounted) {
                  setViewCounted(true);
                  console.log('👁️ View counted!');
                  // Notify parent component that view was counted
                  if (onViewCounted) {
                    onViewCounted();
                  }
                }
                console.log('✅ Seek progress updated successfully');
              }
              
              setLastProgressUpdate(now);
            } catch (error) {
              console.error('❌ Error updating progress after seek:', error);
            }
          })();
        }
      }, 1000); // Wait 1 second after seek to update progress
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

  const toggleSettings = useCallback(() => {
    console.log('🔧 Settings clicked! Current state:', showSettings);
    setShowSettings(!showSettings);
    console.log('🔧 Settings state after toggle:', !showSettings);
  }, [showSettings]);

  const handlePlaybackRateChange = useCallback((rate) => {
    setPlaybackRate(rate);
    setShowSettings(false);
    console.log('🔄 Playback rate changed to:', rate);
    message.success(`Playback speed: ${rate === 1 ? 'Normal' : `${rate}x`}`);
  }, []);

  const handleEnded = useCallback(async () => {
    console.log('🏁 Video ended - handling completion...');
    setPlaying(false);
    setIsCompleted(true);
    
    const current = latestValuesRef.current;
    
    // Final progress update to 100%
    if (current.watchId && enableTracking) {
      try {
        console.log('📊 Final progress update to 100%...');
        
        const now = Date.now();
        const sessionTime = current.sessionStartTime ? (now - current.sessionStartTime) / 1000 : 0;
        const finalWatchedSeconds = Math.min(sessionTime, current.duration);

        // Update to 100% completion
        const response = await videoWatchAPI.updateProgress(
          current.watchId,
          current.duration, // Full duration
          finalWatchedSeconds
        );

        if (response.success) {
          const { viewCounted: newViewCounted } = response.data;
          if (newViewCounted && !current.viewCounted) {
            setViewCounted(true);
            console.log('👁️ View counted on completion!');
            // Notify parent component that view was counted
            if (onViewCounted) {
              onViewCounted();
            }
          }
          console.log('✅ Final progress updated to 100%');
        }

        // End the watch session
        console.log('🔚 Ending watch session after completion...');
        await endWatchSession();
        
        message.success({
          content: '🎉 Video completed! Well done!',
          duration: 3,
          style: { marginTop: '60px' }
        });
        
      } catch (error) {
        console.error('❌ Error handling video completion:', error);
      }
    } else {
      console.log('ℹ️ Video completed but tracking not enabled');
      message.success('🎉 Video completed!');
    }
  }, [enableTracking, onViewCounted]);

  const handleError = useCallback((error) => {
    console.error('Video player error:', error);
    console.error('Video URL that failed:', videoUrl);
    console.error('Video data:', videoData);
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
          errorMessage = 'Video is blocked or unavailable in your region.';
        } else if (error.message.includes('embed')) {
          errorMessage = 'Video cannot be embedded. Try watching on YouTube.';
        }
      }
    }
    
    // For YouTube videos that fail to load, suggest opening in YouTube
    if (isYouTubeVideo) {
      errorMessage += ' Try clicking "Watch on YouTube" button.';
    }
    
    message.error(errorMessage);
    if (onError) onError(error);
  }, [onError, videoUrl, videoData, isYouTubeVideo]);

  const openInYouTube = useCallback(() => {
    if (url) {
      window.open(url, '_blank');
    }
  }, [url]);

  const handleReplay = useCallback(async () => {
    console.log('🔄 Replaying video...');
    setIsCompleted(false);
    setPlayed(0);
    
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }
    
    // Reset database position and start fresh session
    if (enableTracking && classroomId && videoData && watchId) {
      try {
        console.log('🔄 Resetting database position to 0 for replay...');
        
        // Update database position to 0
        await videoWatchAPI.updateProgress(watchId, 0, 0);
        
        // End current session
        await endWatchSession();
        
        // Small delay then re-initialize with skipResume flag
        setTimeout(() => {
          console.log('🆕 Re-initializing tracking for replay...');
          initializeWatchTracking(true); // Skip resume - start from beginning
        }, 500);
        
      } catch (error) {
        console.error('❌ Error resetting for replay:', error);
        // Fallback: just reinitialize without reset
        setTimeout(() => {
          initializeWatchTracking(true); // Skip resume even in fallback
        }, 500);
      }
    }
    
    setPlaying(true);
    message.info('🔄 Starting video from beginning...');
  }, [enableTracking, classroomId, videoData, watchId]);

  useImperativeHandle(ref, () => ({
    endWatchSession: endWatchSession
  }));

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
        playbackRate={playbackRate}
        onPlay={handlePlay}
        onPause={handlePause}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onReady={handleReady}
        onEnded={handleEnded}
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
              fs: 1,
              playsinline: 1
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

      {/* Video Completion Overlay */}
      {isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-30">
          <div className="text-white text-center p-8 rounded-lg bg-black bg-opacity-60 border border-gray-600">
            <div className="mb-6">
              <TrophyOutlined className="text-6xl text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">🎉 Video Completed!</h2>
              <p className="text-gray-300 text-lg">You've successfully watched the entire video</p>
            </div>
            
            <div className="mb-6">
              <div className="text-sm text-gray-400 space-y-1">
                <div>Duration: {formatTime(duration)}</div>
                <div className="text-green-400">✅ Progress: 100%</div>
                {enableTracking && viewCounted && (
                  <div className="text-blue-400">👁️ View Counted</div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                type="primary" 
                icon={<RedoOutlined />}
                onClick={handleReplay}
                size="large"
                className="bg-red-600 hover:bg-red-700 border-red-600"
              >
                Watch Again
              </Button>
              
              {isYouTubeVideo && (
                <Button 
                  icon={<YoutubeOutlined />}
                  onClick={openInYouTube}
                  size="large"
                  ghost
                >
                  Open in YouTube
                </Button>
              )}
            </div>
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
                <div className="relative">
                  <Tooltip title="Settings">
                    <Button
                      type="text"
                      icon={<SettingOutlined />}
                      onClick={toggleSettings}
                      className={`text-white hover:text-red-400 ${showSettings ? 'text-red-400' : ''}`}
                    />
                  </Tooltip>
                </div>

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

      {/* Settings Panel - Outside controls to avoid z-index issues */}
      {showSettings && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowSettings(false)}
          />
          
          {/* Settings Panel */}
          <div className="settings-panel fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-95 rounded-lg p-4 min-w-[280px] max-w-[350px] z-50 border border-gray-600 shadow-2xl">
            <div className="text-white text-lg font-semibold mb-4 text-center border-b border-gray-600 pb-2">
              🏃‍♂️ Playback Speed
            </div>
            
            {/* Playback Speed Section */}
            <div className="mb-4">
              <div className="grid grid-cols-4 gap-2">
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                  <button
                    key={rate}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      playbackRate === rate 
                        ? 'bg-red-600 text-white shadow-lg' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => handlePlaybackRateChange(rate)}
                  >
                    {rate === 1 ? 'Normal' : `${rate}x`}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Video Info Section */}
            <div className="mb-4">
              <div className="text-white text-sm font-semibold mb-2">
                📊 Video Information
              </div>
              <div className="text-gray-300 text-xs space-y-1 bg-gray-800 rounded p-2">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="text-white">{formatTime(duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current:</span>
                  <span className="text-white">{formatTime(played * duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Progress:</span>
                  <span className={`${Math.round(played * 100) === 100 ? 'text-green-400' : 'text-white'}`}>
                    {Math.round(played * 100)}%
                    {isCompleted && ' ✅'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="text-white">{isYouTubeVideo ? 'YouTube' : 'Uploaded'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="text-white">{playbackRate === 1 ? 'Normal' : `${playbackRate}x`}</span>
                </div>
                {enableTracking && watchId && (
                  <div className="flex justify-between">
                    <span>Tracking:</span>
                    <span className="text-green-400">📊 Active</span>
                  </div>
                )}
                {viewCounted && (
                  <div className="flex justify-between">
                    <span>View Status:</span>
                    <span className="text-blue-400">👁️ Counted</span>
                  </div>
                )}
                {isCompleted && (
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-400">🏆 Completed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="text-center">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </>
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
});

export default EnhancedVideoPlayer; 