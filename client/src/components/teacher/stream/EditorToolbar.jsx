import React, { useCallback } from 'react';
import {
  Upload,
  Button,
  message,
} from 'antd';
import {
  PaperClipOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  LinkOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';

const EditorToolbar = ({
  onFileUpload,
  onAddVideo,
  onUploadVideo,
  onAddLink,
}) => {
  const handleFileUpload = useCallback(
    async (file) => {
      // Validate file size (15MB limit)
      if (file.size > 15 * 1024 * 1024) {
        message.error("File size must be less than 15MB");
        return false;
      }

      try {
        // Show loading message
        const hide = message.loading("Uploading file...", 0);

        // Import streamAPI here to avoid circular dependency
        const { streamAPI } = await import("../../../services/api");

        // Upload file to server
        const response = await streamAPI.uploadAttachment(file);

        hide();

        if (response.success) {
          const newAttachment = {
            id: Date.now().toString(),
            name: response.data.originalName || file.name,
            size: (response.data.size / 1024).toFixed(1) + " KB",
            type: file.type,
            url: response.data.url, // Cloudinary URL
            file: file, // Keep original file for fallback
          };

          if (onFileUpload) {
            onFileUpload(newAttachment);
          }
          message.success("File uploaded successfully");
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
      
      {/* Video Options */}
      <div className="flex items-center">
        <Button
          type="text"
          icon={<VideoCameraOutlined />}
          className="hover:bg-gray-100"
          onClick={onAddVideo}
        >
          Add Video
        </Button>
        <Button
          type="text"
          icon={<CloudUploadOutlined />}
          className="hover:bg-gray-100"
          onClick={onUploadVideo}
          title="Upload video to YouTube"
        >
          Upload Video
        </Button>
      </div>

      <Button
        type="text"
        icon={<LinkOutlined />}
        className="hover:bg-gray-100"
        onClick={onAddLink}
      >
        Add Link
      </Button>
      <Button
        type="text"
        icon={<CalendarOutlined />}
        className="hover:bg-gray-100"
      >
        Schedule
      </Button>
    </div>
  );
};

export default EditorToolbar; 