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
    this.isSignedIn = false;
    this.authInstance = null;
  }

  // Initialize Google API client
  async initializeGapi() {
    if (this.gapi) return this.gapi;

    return new Promise((resolve, reject) => {
      // Load Google API script if not already loaded
      if (!window.gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          window.gapi.load('client:auth2', () => {
            this.setupGapi().then(resolve).catch(reject);
          });
        };
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        this.setupGapi().then(resolve).catch(reject);
      }
    });
  }

  async setupGapi() {
    try {
      await window.gapi.client.init({
        apiKey: YOUTUBE_CONFIG.API_KEY,
        clientId: YOUTUBE_CONFIG.CLIENT_ID,
        discoveryDocs: [YOUTUBE_CONFIG.DISCOVERY_DOC],
        scope: YOUTUBE_CONFIG.SCOPES
      });

      this.gapi = window.gapi;
      this.authInstance = this.gapi.auth2.getAuthInstance();
      this.isSignedIn = this.authInstance.isSignedIn.get();

      return this.gapi;
    } catch (error) {
      console.error('Error initializing Google API:', error);
      throw error;
    }
  }

  // Sign in to YouTube
  async signIn() {
    try {
      if (!this.gapi) {
        await this.initializeGapi();
      }

      if (!this.isSignedIn) {
        await this.authInstance.signIn();
        this.isSignedIn = true;
      }

      return true;
    } catch (error) {
      console.error('YouTube sign in error:', error);
      throw new Error('Failed to sign in to YouTube');
    }
  }

  // Sign out from YouTube
  async signOut() {
    try {
      if (this.authInstance && this.isSignedIn) {
        await this.authInstance.signOut();
        this.isSignedIn = false;
      }
      return true;
    } catch (error) {
      console.error('YouTube sign out error:', error);
      throw error;
    }
  }

  // Check if user is signed in
  async isUserSignedIn() {
    if (!this.gapi) {
      await this.initializeGapi();
    }
    return this.authInstance.isSignedIn.get();
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
      // Step 1: Initialize upload session
      const initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': file.size,
          'X-Upload-Content-Type': file.type
        },
        body: JSON.stringify(metadata)
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(`Upload initialization failed: ${errorData.error?.message || 'Unknown error'}`);
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

  // Get video info after upload
  async getVideoInfo(videoId) {
    try {
      if (!this.gapi) {
        await this.initializeGapi();
      }

      const response = await this.gapi.client.youtube.videos.list({
        part: 'snippet,statistics,contentDetails,status',
        id: videoId
      });

      if (response.result.items && response.result.items.length > 0) {
        const video = response.result.items[0];
        
        // Parse duration from ISO 8601 format
        const parseDuration = (duration) => {
          const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
          const hours = (match[1] || "").replace("H", "");
          const minutes = (match[2] || "").replace("M", "");
          const seconds = (match[3] || "").replace("S", "");

          if (hours) {
            return `${hours}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
          } else {
            return `${minutes || "0"}:${seconds.padStart(2, "0")}`;
          }
        };

        return {
          id: videoId,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
          duration: parseDuration(video.contentDetails.duration),
          channel: video.snippet.channelTitle,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          publishedAt: video.snippet.publishedAt,
          status: video.status.privacyStatus,
          viewCount: video.statistics.viewCount || '0'
        };
      }

      throw new Error('Video not found');

    } catch (error) {
      console.error('Error getting video info:', error);
      throw error;
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