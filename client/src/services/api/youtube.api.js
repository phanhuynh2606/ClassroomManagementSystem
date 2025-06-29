import axiosClient from '../axiosClient';

// YouTube API configuration
const YOUTUBE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_YOUTUBE_CLIENT_ID,
  API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY,
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest',
  SCOPES: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube'
};

class YouTubeAPI {
  constructor() {
    this.gapi = null;
    this.tokenClient = null;
    this.accessToken = null;
    this.isSignedIn = false;
  }

  // Initialize Google API client with new Google Identity Services
  async initializeGapi() {
    if (this.gapi) return this.gapi;

    return new Promise((resolve, reject) => {
      // Load both GIS and GAPI scripts
      this.loadGoogleScripts().then(() => {
        window.gapi.load('client', async () => {
          try {
            await this.setupGapi();
            await this.setupGIS();
            resolve(this.gapi);
          } catch (error) {
            reject(error);
          }
        });
      }).catch(reject);
    });
  }

  // Load Google scripts (GIS + GAPI)
  async loadGoogleScripts() {
    return Promise.all([
      this.loadScript('https://apis.google.com/js/api.js'),
      this.loadScript('https://accounts.google.com/gsi/client')
    ]);
  }

  // Load script helper
  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async setupGapi() {
    try {
      await window.gapi.client.init({
        apiKey: YOUTUBE_CONFIG.API_KEY,
        discoveryDocs: [YOUTUBE_CONFIG.DISCOVERY_DOC],
      });

      this.gapi = window.gapi;
      return this.gapi;
    } catch (error) {
      console.error('Error initializing GAPI:', error);
      throw error;
    }
  }

  // Setup Google Identity Services (GIS)
  async setupGIS() {
    try {
      if (!window.google || !window.google.accounts) {
        throw new Error('Google Identity Services not loaded');
      }

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: YOUTUBE_CONFIG.CLIENT_ID,
        scope: YOUTUBE_CONFIG.SCOPES,
        ux_mode: 'popup',
        callback: (response) => {
          if (response.error) {
            console.error('GIS callback error:', response);
            return;
          }
          this.accessToken = response.access_token;
          this.isSignedIn = true;
        },
        error_callback: (error) => {
          console.error('GIS error callback:', error);
          this.isSignedIn = false;
          this.accessToken = null;
        }
      });

      return true;
    } catch (error) {
      console.error('Error initializing GIS:', error);
      throw error;
    }
  }

  // Sign in to YouTube using new GIS
  async signIn() {
    try {
      if (!this.gapi) {
        await this.initializeGapi();
      }

      if (!this.tokenClient) {
        throw new Error('Google Identity Services not initialized');
      }

      if (this.isSignedIn && this.accessToken) {
        return true;
      }

      return new Promise((resolve, reject) => {
        const originalCallback = this.tokenClient.callback;
        
        this.tokenClient.callback = (response) => {
          // Restore original callback
          this.tokenClient.callback = originalCallback;
          
          if (response.error) {
            this.isSignedIn = false;
            this.accessToken = null;
            
            // Handle specific OAuth errors
            if (response.error === 'access_denied') {
              reject(new Error('access_denied: This app is in development mode. Only authorized test users can sign in. Please contact the administrator to add your email to the authorized test users list.'));
            } else if (response.error === 'popup_closed_by_user') {
              reject(new Error('Authentication was cancelled. Please try again.'));
            } else {
              reject(new Error(`Authentication failed: ${response.error}`));
            }
            return;
          }
          
          this.accessToken = response.access_token;
          this.isSignedIn = true;
          resolve(true);
        };

        // Request access token with timeout
        try {
          this.tokenClient.requestAccessToken({ 
            prompt: 'consent',
            hint: 'Select the Google account you want to use for YouTube uploads'
          });
          
          // Set timeout for authentication
          setTimeout(() => {
            if (!this.isSignedIn) {
              reject(new Error('Authentication timeout. Please try again.'));
            }
          }, 60000); // 60 seconds timeout
          
        } catch (tokenError) {
          console.error('Token request error:', tokenError);
          reject(new Error('Failed to initiate authentication. Please refresh the page and try again.'));
        }
      });

    } catch (error) {
      console.error('YouTube sign in error:', error);
      throw new Error('Failed to sign in to YouTube');
    }
  }

  // Sign out from YouTube
  async signOut() {
    try {
      if (this.accessToken && window.google && window.google.accounts) {
        window.google.accounts.oauth2.revoke(this.accessToken);
      }
      
      this.isSignedIn = false;
      this.accessToken = null;
      return true;
    } catch (error) {
      console.error('YouTube sign out error:', error);
      throw error;
    }
  }

  // Check if user is signed in
  async isUserSignedIn() {
    return this.isSignedIn && this.accessToken;
  }

  // Upload video to YouTube
  async uploadVideo(file, metadata, onProgress) {
    try {
      // Ensure user is signed in
      await this.signIn();

      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (!file.type.startsWith('video/')) {
        throw new Error('File must be a video');
      }

      // File size limit (200MB for free YouTube accounts)
      const maxSize = 200 * 1024 * 1024; // 200MB
      if (file.size > maxSize) {
        throw new Error('Video file size must be less than 200MB');
      }

      // Prepare video metadata
      const videoMetadata = {
        snippet: {
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
          description: metadata.description || `Uploaded from Learning Management System\n\nUpload Date: ${new Date().toLocaleString()}`,
          tags: metadata.tags || ['education', 'learning', 'classroom'],
          categoryId: '27', // Education category
          defaultLanguage: 'vi',
          defaultAudioLanguage: 'vi'
        },
        status: {
          privacyStatus: metadata.privacy || 'unlisted', // unlisted by default for classroom videos
          selfDeclaredMadeForKids: false
        }
      };

      // Create resumable upload
      const response = await this.createResumableUpload(videoMetadata, file, onProgress);
      
      return response;

    } catch (error) {
      console.error('YouTube upload error:', error);
      throw error;
    }
  }

  // Create resumable upload session
  async createResumableUpload(metadata, file, onProgress) {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      // Step 1: Initialize upload session
      const initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': file.size,
          'X-Upload-Content-Type': file.type
        },
        body: JSON.stringify(metadata)
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json().catch(() => ({}));
        throw new Error(`Upload initialization failed: ${errorData.error?.message || `HTTP ${initResponse.status}`}`);
      }

      const uploadUrl = initResponse.headers.get('Location');
      if (!uploadUrl) {
        throw new Error('No upload URL received from YouTube');
      }

      // Step 2: Upload file in chunks
      return await this.uploadFileInChunks(uploadUrl, file, onProgress);

    } catch (error) {
      console.error('Error creating resumable upload:', error);
      throw error;
    }
  }

  // Upload file in chunks with progress tracking
  async uploadFileInChunks(uploadUrl, file, onProgress) {
    const chunkSize = 1024 * 1024; // 1MB chunks
    let start = 0;
    let uploadResponse;

    while (start < file.size) {
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
          'Content-Type': file.type
        },
        body: chunk
      });

      if (response.status === 308) {
        // Continue uploading
        start = end;
        if (onProgress) {
          onProgress(Math.round((start / file.size) * 100));
        }
      } else if (response.status === 200 || response.status === 201) {
        // Upload complete
        uploadResponse = await response.json();
        if (onProgress) {
          onProgress(100);
        }
        break;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Upload failed: ${errorData.error?.message || `HTTP ${response.status}`}`);
      }
    }

    return uploadResponse;
  }

  // Get video info after upload using direct API call
  async getVideoInfo(videoId, maxRetries = 8) {
    console.log(`[YouTube API] Getting video info for: ${videoId}`);
    
    try {
      if (!this.gapi) {
        await this.initializeGapi();
      }

      // Retry logic for processing videos with longer waits
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`[YouTube API] Attempt ${attempt + 1}/${maxRetries} for video ${videoId}`);
          
          // Method 1: Try using gapi.client first
          let video = null;
          try {
            const response = await this.gapi.client.youtube.videos.list({
              part: 'snippet,statistics,contentDetails,status',
              id: videoId
            });
            
            console.log(`[YouTube API] GAPI Response:`, response);
            
            if (response.result.items && response.result.items.length > 0) {
              video = response.result.items[0];
              console.log(`[YouTube API] Video found via GAPI:`, video);
            }
          } catch (gapiError) {
            console.warn(`[YouTube API] GAPI failed, trying REST API:`, gapiError);
          }
          
          // Method 2: Fallback to direct REST API if GAPI fails
          if (!video) {
            try {
              const restResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id=${videoId}&key=${YOUTUBE_CONFIG.API_KEY}`
              );
              
              if (restResponse.ok) {
                const restData = await restResponse.json();
                console.log(`[YouTube API] REST Response:`, restData);
                
                if (restData.items && restData.items.length > 0) {
                  video = restData.items[0];
                  console.log(`[YouTube API] Video found via REST API:`, video);
                }
              }
            } catch (restError) {
              console.warn(`[YouTube API] REST API also failed:`, restError);
            }
          }
          
          if (video) {
            // Parse duration from ISO 8601 format
            const parseDuration = (duration) => {
              console.log(`[YouTube API] Parsing duration:`, duration);
              
              if (!duration || typeof duration !== 'string') {
                console.warn('[YouTube API] No duration provided or invalid format:', duration);
                return null; // Return null instead of "0:00" to distinguish missing duration
              }

              // ISO 8601 format: PT#M#S or PT#H#M#S
              const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
              if (!match) {
                console.warn('[YouTube API] Invalid duration format:', duration);
                return null;
              }

              const hours = parseInt(match[1] || "0");
              const minutes = parseInt(match[2] || "0");  
              const seconds = parseInt(match[3] || "0");

              // Format duration based on length
              if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
              } else {
                return `${minutes}:${seconds.toString().padStart(2, "0")}`;
              }
            };

            const rawDuration = video.contentDetails?.duration;
            const duration = parseDuration(rawDuration);
            
            console.log(`[YouTube API] Raw duration: "${rawDuration}" -> Parsed: "${duration}"`);
            
            // Check if we have essential data
            const hasEssentialData = video.snippet?.title && 
                                   video.snippet?.thumbnails &&
                                   video.contentDetails;
            
            console.log(`[YouTube API] Has essential data:`, {
              hasTitle: !!video.snippet?.title,
              hasThumbnails: !!video.snippet?.thumbnails,
              hasContentDetails: !!video.contentDetails,
              hasDuration: !!rawDuration,
              processingStatus: video.status?.uploadStatus
            });

            // If duration is missing but other data is there, continue retrying
            if (!duration && attempt < maxRetries - 1) {
              const waitTime = Math.min((attempt + 1) * 3000, 15000); // Max 15 seconds
              console.log(`[YouTube API] Duration not available yet, retrying in ${waitTime/1000}s... (processing may still be ongoing)`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }

            const videoInfo = {
              id: videoId,
              title: video.snippet?.title || 'Untitled Video',
              description: video.snippet?.description || '',
              thumbnail: video.snippet?.thumbnails?.high?.url || 
                        video.snippet?.thumbnails?.medium?.url || 
                        video.snippet?.thumbnails?.default?.url ||
                        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              duration: duration || "Processing...", // Show processing status instead of 0:00
              channel: video.snippet?.channelTitle || 'Unknown Channel',
              url: `https://www.youtube.com/watch?v=${videoId}`,
              embedUrl: `https://www.youtube.com/embed/${videoId}`,
              publishedAt: video.snippet?.publishedAt,
              status: video.status?.privacyStatus || 'unlisted',
              viewCount: video.statistics?.viewCount || '0',
              // Debug info
              _debug: {
                rawDuration: rawDuration,
                attempt: attempt + 1,
                uploadStatus: video.status?.uploadStatus,
                processingProgress: video.processingDetails?.processingProgress
              }
            };

            console.log(`[YouTube API] Final video info:`, videoInfo);
            return videoInfo;
          }

          // If no video found, wait and retry
          if (attempt < maxRetries - 1) {
            const waitTime = Math.min((attempt + 1) * 3000, 10000);
            console.log(`[YouTube API] Video not found, retrying in ${waitTime/1000}s... (${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        } catch (error) {
          console.error(`[YouTube API] Attempt ${attempt + 1} failed:`, error);
          if (attempt < maxRetries - 1) {
            const waitTime = Math.min((attempt + 1) * 2000, 8000);
            console.log(`[YouTube API] Error occurred, retrying in ${waitTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw error;
        }
      }

      throw new Error('Video not found after maximum retries');

    } catch (error) {
      console.error('[YouTube API] Error getting video info:', error);
      // Return default info if API fails
      return {
        id: videoId,
        title: 'Video Upload',
        description: 'Video uploaded successfully',
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        duration: "Processing...", // Indicate processing instead of 0:00
        channel: 'Your Channel',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        publishedAt: new Date().toISOString(),
        status: 'unlisted',
        viewCount: '0',
        _debug: {
          error: error.message,
          fallbackUsed: true
        }
      };
    }
  }

  // Save video info to our backend
  async saveVideoToBackend(videoInfo, classroomId) {
    try {
      const response = await axiosClient.post('/api/stream/save-youtube-video', {
        classroomId,
        videoInfo
      });

      return response.data;
    } catch (error) {
      console.error('Error saving video to backend:', error);
      throw error;
    }
  }
}

// Create singleton instance
const youtubeAPI = new YouTubeAPI();

export default youtubeAPI; 