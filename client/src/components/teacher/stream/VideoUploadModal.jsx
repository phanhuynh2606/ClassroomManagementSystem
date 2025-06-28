import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Upload,
  Button,
  Progress,
  Select,
  message,
  Tooltip,
} from 'antd';
import {
  CloudUploadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { youtubeAPI } from '../../../services/api';

const VideoUploadModal = ({
  visible,
  onCancel,
  onSuccess,
  loading,
  setLoading,
}) => {
  const [uploadForm] = Form.useForm();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadCompleted, setUploadCompleted] = useState(false);

  // Prevent browser tab/window close during upload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (uploadingVideo) {
        e.preventDefault();
        e.returnValue = 'Video upload is in progress. Are you sure you want to leave?';
        return 'Video upload is in progress. Are you sure you want to leave?';
      }
    };

    if (uploadingVideo) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [uploadingVideo]);

  const handleVideoFileSelect = useCallback((file) => {
    // Validate video file
    if (!file.type.startsWith('video/')) {
      message.error('Please select a video file');
      return false;
    }

    // Check file size (200MB limit for YouTube free accounts)
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      message.error('Video file size must be less than 200MB');
      return false;
    }

    setVideoFile(file);
    
    // Auto-fill title from filename
    const filename = file.name.replace(/\.[^/.]+$/, "");
    uploadForm.setFieldsValue({
      title: filename,
      description: `Video uploaded from Learning Management System\n\nOriginal filename: ${file.name}\nFile size: ${(file.size / (1024 * 1024)).toFixed(2)}MB\nUpload date: ${new Date().toLocaleString()}`
    });

    return false; // Prevent auto upload
  }, [uploadForm]);

  const handleVideoUploadSubmit = useCallback(async () => {
    if (!videoFile) {
      message.error('Please select a video file first');
      return;
    }

    try {
      setUploadingVideo(true);
      setUploadProgress(0);
      if (setLoading) setLoading(true);

      const values = await uploadForm.validateFields();
      
      // Prepare metadata
      const metadata = {
        title: values.title,
        description: values.description,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : ['education', 'learning'],
        privacy: values.privacy || 'unlisted'
      };

      message.loading('Initializing YouTube upload...', 0);

      // Upload to YouTube
      const uploadResult = await youtubeAPI.uploadVideo(
        videoFile,
        metadata,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      message.destroy();

      if (uploadResult && uploadResult.id) {
        // Show processing message
        message.loading('Processing video information and extracting duration...', 0);
        
        // Get video info with retry logic - this will get duration properly
        const videoInfo = await youtubeAPI.getVideoInfo(uploadResult.id);
        console.log("Video Info with Duration:", videoInfo);
        message.destroy();
        
        // Check duration status and show appropriate message
        if (!videoInfo.duration || videoInfo.duration === "Processing...") {
          message.warning({
            content: (
              <div>
                <div className="font-medium">Video uploaded successfully!</div>
                <div className="text-sm text-gray-600 mt-1">
                  Duration is still being processed by YouTube. This usually takes 1-5 minutes.
                  {videoInfo._debug && (
                    <div className="text-xs mt-1">
                      Debug info: Raw duration = "{videoInfo._debug.rawDuration || 'null'}", 
                      Upload status = "{videoInfo._debug.uploadStatus || 'unknown'}"
                    </div>
                  )}
                </div>
              </div>
            ),
            duration: 8
          });
        } else {
          message.success(`Video "${videoInfo.title}" uploaded successfully! Duration: ${videoInfo.duration}`);
        }
        
        // Create attachment
        const videoAttachment = {
          id: Date.now().toString(),
          name: videoInfo.title,
          type: "video", // Changed from "video/youtube" to "video" for uploaded files
          url: videoInfo.url,
          title: videoInfo.title,
          fileType: videoFile.type,
          fileSize: videoFile.size,
          size: `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`,
          videoId: videoInfo.id,
          thumbnail: videoInfo.thumbnail,
          duration: videoInfo.duration || "0:00", // Ensure duration is always set
          channel: videoInfo.channel,
          viewCount: videoInfo.viewCount,
          description: videoInfo.description,
          status: videoInfo.status,
          uploadedByUser: true,
          embedUrl: videoInfo.embedUrl, // Add embedUrl at top level for easy access
          metadata: {
            publishedAt: videoInfo.publishedAt,
            embedUrl: videoInfo.embedUrl,
            originalFilename: videoFile.name,
            uploadDate: new Date().toISOString(),
            youtubeVideoId: videoInfo.id, // Keep YouTube ID for reference
            durationRaw: videoInfo.duration, // Keep raw duration
            processed: true
          }
        };

        if (onSuccess) {
          onSuccess(videoAttachment);
        }
        
        // Mark upload as completed
        setUploadCompleted(true);
        
        // Show success message and auto-close after delay
        setTimeout(() => {
          handleCancel();
        }, 3000); // Auto close after 3 seconds to let user see the success message
      } else {
        throw new Error('No video ID returned from upload');
      }

    } catch (error) {
      console.error('Video upload error:', error);
      message.destroy();
      
      let errorMessage = 'Failed to upload video to YouTube';
      if (error.message.includes('sign in') || error.message.includes('Authentication failed')) {
        errorMessage = 'Authentication failed. Please try signing in again.';
      } else if (error.message.includes('access_denied') || error.message.includes('access denied')) {
        errorMessage = '🔒 Access Denied: This app is in development mode. Only authorized test users can upload videos. Please contact the administrator to add your email to the test user list, or use an authorized Google account.';
      } else if (error.message.includes('size')) {
        errorMessage = 'Video file is too large. Please use a file smaller than 200MB';
      } else if (error.message.includes('quota')) {
        errorMessage = 'YouTube upload quota exceeded. Please try again later';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Authentication timeout. Please try again and complete the sign-in process more quickly.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setUploadingVideo(false);
      setUploadCompleted(false);
      if (setLoading) setLoading(false);
    }
  }, [videoFile, uploadForm, onSuccess, setLoading]);

  const handleCancel = useCallback(() => {
    // Prevent closing during upload
    if (uploadingVideo) {
      Modal.confirm({
        title: 'Cancel Upload?',
        content: (
          <div>
            <div className="mb-2">⚠️ Your video is still uploading to YouTube.</div>
            <div className="text-sm text-gray-600">
              Closing now will cancel the upload process and you'll need to start over.
              Are you sure you want to cancel?
            </div>
          </div>
        ),
        okText: 'Yes, Cancel Upload',
        okType: 'danger',
        cancelText: 'Continue Upload',
        onOk: () => {
                     // Force reset everything
           setVideoFile(null);
           setUploadProgress(0);
           setUploadingVideo(false);
           setUploadCompleted(false);
           uploadForm.resetFields();
           if (setLoading) setLoading(false);
           if (onCancel) onCancel();
        }
      });
      return;
    }

    // Normal cancel when not uploading
    setVideoFile(null);
    setUploadProgress(0);
    setUploadingVideo(false);
    setUploadCompleted(false);
    uploadForm.resetFields();
    if (onCancel) onCancel();
  }, [uploadForm, onCancel, uploadingVideo, setLoading]);

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <CloudUploadOutlined className="text-white text-lg" />
          </div>
          <div>
            <div className="text-lg font-semibold">Upload Video to YouTube</div>
            <div className="text-sm text-gray-500">
              {uploadingVideo ? (
                <span className="text-orange-600">
                  ⚠️ Upload in progress - Do not close this window
                </span>
              ) : (
                "Share videos with your students. You can use any Google account with YouTube access."
              )}
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      centered
      destroyOnHidden={false}
      closable={!uploadingVideo}
      maskClosable={!uploadingVideo}
      keyboard={!uploadingVideo}
      className={uploadingVideo ? 'upload-in-progress' : ''}
    >
      <div className="pt-4">
        {!uploadingVideo ? (
          <Form
            form={uploadForm}
            layout="vertical"
            onFinish={handleVideoUploadSubmit}
          >
            {/* File Upload */}
            <Form.Item
              label="Select Video File"
              required
              className="mb-6"
            >
              <Upload.Dragger
                beforeUpload={handleVideoFileSelect}
                accept="video/*"
                showUploadList={false}
                style={{ border: videoFile ? '2px solid #52c41a' : undefined }}
              >
                <div className="py-6">
                  {videoFile ? (
                    <>
                      <div className="text-5xl text-green-500 mb-3">
                        ✓
                      </div>
                      <div className="text-lg font-medium text-gray-900">
                        {videoFile.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)}MB • {videoFile.type}
                      </div>
                      <div className="text-sm text-blue-600 mt-2">
                        Click to select a different file
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-5xl text-gray-300 mb-3">
                        📹
                      </div>
                      <div className="text-lg font-medium text-gray-700">
                        Click or drag video file here
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        Maximum file size: 200MB<br/>
                        Supported formats: MP4, MOV, AVI, WMV, FLV, WebM
                      </div>
                    </>
                  )}
                </div>
              </Upload.Dragger>
            </Form.Item>

            {/* Video Metadata */}
            {videoFile && (
              <>
                <Form.Item
                  name="title"
                  label="Video Title"
                  rules={[
                    { required: true, message: 'Please enter video title' },
                    { max: 100, message: 'Title must be less than 100 characters' }
                  ]}
                >
                  <Input 
                    placeholder="Enter video title" 
                    showCount
                    maxLength={100}
                  />
                </Form.Item>

                <Form.Item
                  name="description"
                  label="Description"
                  rules={[
                    { max: 5000, message: 'Description must be less than 5000 characters' }
                  ]}
                >
                  <Input.TextArea 
                    rows={4}
                    placeholder="Enter video description"
                    showCount
                    maxLength={5000}
                  />
                </Form.Item>

                <Form.Item
                  name="tags"
                  label="Tags (optional)"
                  help="Separate tags with commas. e.g. education, learning, tutorial"
                >
                  <Input placeholder="education, learning, tutorial" />
                </Form.Item>

                <Form.Item
                  name="privacy"
                  label={
                    <div className="flex items-center gap-2">
                      <span>Privacy Setting</span>
                      <Tooltip 
                        title={
                          <div className="text-sm space-y-2">
                            <div><strong>🔐 Private:</strong> Share with specific Google accounts (max 50 people)</div>
                            <div><strong>🔒 Unlisted:</strong> Anyone with link can view (recommended for classrooms)</div>
                            <div><strong>🌐 Public:</strong> Searchable by everyone on YouTube</div>
                          </div>
                        }
                        placement="top"
                      >
                        <InfoCircleOutlined className="text-gray-400 cursor-help" />
                      </Tooltip>
                    </div>
                  }
                  initialValue="unlisted"
                  className="mb-6"
                >
                  <Select className="w-full h-fit">
                    <Select.Option value="unlisted">
                      <div>
                        <div className="font-medium">🔒 Unlisted</div>
                        <div className="text-xs text-gray-500">
                          Anyone with the link can view • Best for classrooms
                        </div>
                      </div>
                    </Select.Option>
                    <Select.Option value="private">
                      <div>
                        <div className="font-medium">🔐 Private</div>
                        <div className="text-xs text-gray-500">
                          Only you + up to 50 invited people can view
                        </div>
                      </div>
                    </Select.Option>
                    <Select.Option value="public">
                      <div>
                        <div className="font-medium">🌐 Public</div>
                        <div className="text-xs text-gray-500">
                          Anyone can search for and view this video
                        </div>
                      </div>
                    </Select.Option>
                  </Select>
                </Form.Item>
              </>
            )}

          
          

            {/* Upload warning */}
            {uploadingVideo && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-orange-600 text-lg">⚠️</div>
                  <div>
                    <div className="font-medium text-orange-800 mb-1">Upload in Progress</div>
                    <div className="text-sm text-orange-700 space-y-1">
                      <p>• Please keep this window open until upload completes</p>
                      <p>• Closing the window will cancel the upload</p>
                      <p>• Do not navigate away from this page</p>
                    </div>
                  </div>
                </div>
                              </div>
              )}

            {/* Action buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button 
                onClick={handleCancel}
                disabled={uploadingVideo}
                className={uploadingVideo ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {uploadingVideo ? 'Uploading...' : 'Cancel'}
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                disabled={!videoFile || uploadingVideo}
                className="bg-red-600 hover:bg-red-700 border-red-600"
              >
                Upload to YouTube
              </Button>
            </div>
          </Form>
        ) : (
          /* Upload Progress */
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CloudUploadOutlined className="text-red-600 text-3xl" />
            </div>
            
            <div className="text-xl font-semibold text-gray-900 mb-2">
              {uploadCompleted ? "Upload Completed! ✅" : "Uploading to YouTube..."}
            </div>
            
            <div className="text-gray-600 mb-6">
              {videoFile?.name}
            </div>

            <div className="max-w-md mx-auto mb-4">
              <Progress 
                percent={uploadProgress} 
                status="active"
                strokeColor={{
                  from: '#ff4d4f',
                  to: '#ff7875',
                }}
                trailColor="#f5f5f5"
                strokeWidth={8}
              />
            </div>

            <div className="text-sm text-gray-500">
              {uploadCompleted ? (
                'Video successfully uploaded! Window will close automatically...'
              ) : uploadProgress < 100 ? (
                `Uploading... ${uploadProgress}%`
              ) : (
                'Processing video... This may take a few minutes.'
              )}
            </div>

            <div className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-2">
              {uploadCompleted ? (
                <>
                  <span>✅</span>
                  <span>Upload completed successfully!</span>
                </>
              ) : (
                <>
                  <span className="animate-pulse">🔒</span>
                  <span>Window is locked during upload to prevent interruption</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom styles for upload in progress */}
      <style jsx>{`
        .upload-in-progress .ant-modal-header {
          background: linear-gradient(90deg, #fff2e8 0%, #fff7ed 100%);
          border-bottom: 2px solid #fed7aa;
        }
        
        .upload-in-progress .ant-modal-close {
          display: none !important;
        }
        
        .upload-in-progress::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f59e0b, #f97316, #f59e0b);
          background-size: 200% 100%;
          animation: uploadProgress 2s linear infinite;
          z-index: 1001;
        }
        
        @keyframes uploadProgress {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .upload-warning-banner {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: #fed7aa;
          padding: 8px 16px;
          text-align: center;
          font-weight: 500;
          color: #9a3412;
          border-bottom: 1px solid #fdba74;
        }
      `}</style>
    </Modal>
  );
};

export default VideoUploadModal; 