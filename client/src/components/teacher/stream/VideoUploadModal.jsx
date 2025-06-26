import React, { useState, useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  Upload,
  Button,
  Progress,
  Select,
  message,
} from 'antd';
import {
  CloudUploadOutlined,
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

  const handleVideoFileSelect = useCallback((file) => {
    // Validate video file
    if (!file.type.startsWith('video/')) {
      message.error('Please select a video file');
      return false;
    }

    // Check file size (200MB limit for YouTube)
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
        // Get video info
        const videoInfo = await youtubeAPI.getVideoInfo(uploadResult.id);
        
        // Create attachment
        const videoAttachment = {
          id: Date.now().toString(),
          name: videoInfo.title,
          type: "video/youtube",
          url: videoInfo.url,
          title: videoInfo.title,
          videoId: videoInfo.id,
          thumbnail: videoInfo.thumbnail,
          duration: videoInfo.duration,
          channel: videoInfo.channel,
          viewCount: videoInfo.viewCount,
          description: videoInfo.description,
          status: videoInfo.status,
          uploadedByUser: true,
          metadata: {
            publishedAt: videoInfo.publishedAt,
            embedUrl: videoInfo.embedUrl,
            originalFilename: videoFile.name,
            uploadDate: new Date().toISOString()
          }
        };

        if (onSuccess) {
          onSuccess(videoAttachment);
        }
        
        // Reset form
        handleCancel();
        
        message.success(`Video "${videoInfo.title}" uploaded successfully to YouTube!`);
      } else {
        throw new Error('No video ID returned from upload');
      }

    } catch (error) {
      console.error('Video upload error:', error);
      message.destroy();
      
      let errorMessage = 'Failed to upload video to YouTube';
      if (error.message.includes('sign in')) {
        errorMessage = 'Please sign in to YouTube to upload videos';
      } else if (error.message.includes('size')) {
        errorMessage = 'Video file is too large. Please use a file smaller than 200MB';
      } else if (error.message.includes('quota')) {
        errorMessage = 'YouTube upload quota exceeded. Please try again later';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setUploadingVideo(false);
      if (setLoading) setLoading(false);
    }
  }, [videoFile, uploadForm, onSuccess, setLoading]);

  const handleCancel = useCallback(() => {
    setVideoFile(null);
    setUploadProgress(0);
    setUploadingVideo(false);
    uploadForm.resetFields();
    if (onCancel) onCancel();
  }, [uploadForm, onCancel]);

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <CloudUploadOutlined className="text-white text-lg" />
          </div>
          <div>
            <div className="text-lg font-semibold">Upload Video to YouTube</div>
            <div className="text-sm text-gray-500">Share videos with your students</div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      centered
      destroyOnClose
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
                  label="Privacy Setting"
                  initialValue="unlisted"
                >
                  <Select>
                    <Select.Option value="unlisted">
                      <div>
                        <div className="font-medium">Unlisted</div>
                        <div className="text-xs text-gray-500">
                          Only people with the link can see this video
                        </div>
                      </div>
                    </Select.Option>
                    <Select.Option value="private">
                      <div>
                        <div className="font-medium">Private</div>
                        <div className="text-xs text-gray-500">
                          Only you can see this video
                        </div>
                      </div>
                    </Select.Option>
                    <Select.Option value="public">
                      <div>
                        <div className="font-medium">Public</div>
                        <div className="text-xs text-gray-500">
                          Anyone can search for and view this video
                        </div>
                      </div>
                    </Select.Option>
                  </Select>
                </Form.Item>
              </>
            )}

            {/* Action buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                disabled={!videoFile}
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
              Uploading to YouTube...
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
              {uploadProgress < 100 ? (
                `Uploading... ${uploadProgress}%`
              ) : (
                'Processing video... This may take a few minutes.'
              )}
            </div>

            <div className="text-xs text-gray-400 mt-4">
              Please don't close this window during upload
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VideoUploadModal; 