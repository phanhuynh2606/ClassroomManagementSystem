import React, { useCallback } from 'react';
import {
  Upload,
  Button,
  message,
  Tooltip,
} from 'antd';
import {
  PaperClipOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  LinkOutlined,
  CloudUploadOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { FaYoutube } from 'react-icons/fa';
import { useVideoPermissions } from './VideoPermissionGuard';

const EditorToolbar = ({
  onFileUpload,
  onAddVideo,
  onUploadVideo,
  onAddLink,
}) => {
  const { 
    canUploadVideo, 
    canAddYouTubeVideo, 
    userRole 
  } = useVideoPermissions();
  const handleFileUpload = useCallback(
    async (file) => {
      // Validate file size (15MB limit)
      if (file.size > 15 * 1024 * 1024) {
        message.error("File size must be less than 15MB");
        return false;
      }

      try {
  

          if (onFileUpload) {
            onFileUpload(file);
          } else {
            message.error("Failed to upload file");
          }
      } catch (error) {
        console.error("Error uploading file:", error);
        message.error("Failed to upload file");
      }

      return false; // Prevent default upload
    },
    [onFileUpload]
  );

  return (
    <div className="flex items-center gap-2 mb-4">
      <Upload
        beforeUpload={handleFileUpload}
        showUploadList={false}
        accept="*"
      >
        <Button
          type="text"
          icon={<PaperClipOutlined />}
          className="hover:bg-gray-100"
        >
          Attach File
        </Button>
      </Upload>
      
      {/* Video Options - Permission Based */}
      <div className="flex items-center">
        {canAddYouTubeVideo() && userRole === 'teacher' && (
          <Button
            type="text"
            icon={<FaYoutube className="text-red-600" color='red' />}
            className="hover:bg-gray-100"
            onClick={onAddVideo}
          >
            Add Video
          </Button>
        )}
        
        {canUploadVideo() && userRole === 'teacher' && (
          <Button
            type="text"
            icon={<CloudUploadOutlined />}
            className="hover:bg-gray-100"
            onClick={onUploadVideo}
            title="Upload video to YouTube"
          >
            Upload Video
          </Button>
        )}
      </div>

      <Button
        type="text"
        icon={<LinkOutlined />}
        className="hover:bg-gray-100"
        onClick={onAddLink}
      >
        Add Link
      </Button>
      {/* {userRole === 'teacher' && (
        <Button
          type="text"
          icon={<CalendarOutlined />}
          className="hover:bg-gray-100"
        >
          Schedule
        </Button>
      )} */}
    </div>
  );
};

export default EditorToolbar; 