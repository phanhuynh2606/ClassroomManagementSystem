import React, { useState, useCallback, useMemo, memo, useRef } from "react";
import {
  Card,
  Form,
  Select,
  Button,
  Upload,
  Space,
  Typography,
  Avatar,
  Modal,
  Input,
  Progress,
  message,
  Tabs,
} from "antd";
import {
  UserOutlined,
  PaperClipOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  DeleteOutlined,
  LinkOutlined,
  YoutubeFilled,
  UploadOutlined,
  CloudUploadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import CustomQuillEditor from "../../CustomQuillEditor";
import { useSelector } from "react-redux";
import { youtubeAPI } from "../../../services/api";

// Import child components
import VideoUploadModal from "./VideoUploadModal";
import VideoSearchModal from "./VideoSearchModal";
import LinkModal from "./LinkModal";
import AttachmentList from "./AttachmentList";
import EditorToolbar from "./EditorToolbar";

const { Text } = Typography;
const { Option } = Select;
// Custom styles for Quill editor
const editorStyles = `
  .ql-editor {
    min-height: "max-content";
    font-size: 16px;
    line-height: 1.5;
  }
  .ql-toolbar {
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: 1px solid #e5e7eb !important;
  }
  .ql-container {
    border: none !important;
  }
  .ql-editor.ql-blank::before {
    color: #bfbfbf;
    font-style: normal;
  }
  
  /* Line clamp utility */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* Aspect ratio utility for older browsers */
  .aspect-video {
    aspect-ratio: 16 / 9;
  }
  
  @supports not (aspect-ratio: 16 / 9) {
    .aspect-video {
      position: relative;
      padding-bottom: 56.25%; /* 16:9 */
      height: 0;
    }
    .aspect-video > * {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }
`;

const AnnouncementEditor = ({
  showEditor,
  setShowEditor,
  richTextContent,
  setRichTextContent,
  targetAudience,
  setTargetAudience,
  attachments,
  setAttachments,
  handlePostAnnouncement,
  postingAnnouncement,
  announcementForm,
  userRole = "teacher", // Add userRole prop
  classroomPermissions = null, // Add permissions prop
}) => {
  const [editorFocused, setEditorFocused] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [videoSearchModalVisible, setVideoSearchModalVisible] = useState(false);
  const [videoUploadModalVisible, setVideoUploadModalVisible] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState({});
  const [linkForm] = Form.useForm();
  const [videoForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const quillRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  // Memoize Quill editor configuration to prevent re-renders
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        ["link", "blockquote", "code-block"],
        [{ align: [] }],
        ["clean"],
      ],
    }),
    []
  );

  const quillFormats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "bullet",
      "color",
      "background",
      "link",
      "blockquote",
      "code-block",
      "align",
    ],
    []
  );

  const handleEditorClick = useCallback(() => {
    setShowEditor(true);
    setEditorFocused(true);
  }, [setShowEditor]);

  const handleCancelPost = useCallback(() => {
    setShowEditor(false);
    setRichTextContent("");
    setAttachments([]);
    announcementForm.resetFields();
  }, [setShowEditor, setRichTextContent, setAttachments, announcementForm]);

  const handleEditorChange = useCallback(
    (content) => {
      setRichTextContent(content);
    },
    [setRichTextContent]
  );

  const handleFileUpload = useCallback(
    async (file) => {
      // Dynamic import để tránh circular dependency
      const { message } = await import("antd");

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
            size: (response.data.size / 1024).toFixed(1),
            type: file.type,
            url: response.data.url, // Cloudinary URL
            file: file, // Keep original file for fallback
          };

          setAttachments((prev) => [...prev, newAttachment]);
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
    [setAttachments]
  );

  const removeAttachment = useCallback(
    (attachmentId) => {
      setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
    },
    [setAttachments]
  );

  const handleAddVideo = useCallback(() => {
    setVideoSearchModalVisible(true);
  }, []);

  const handleUploadVideo = useCallback(() => {
    setVideoUploadModalVisible(true);
  }, []);

  const handleAddLink = useCallback(() => {
    setLinkModalVisible(true);
  }, []);

  const handleVideoSuccess = useCallback((videoAttachment) => {
    setAttachments((prev) => [...prev, videoAttachment]);
  }, [setAttachments]);

  const handleLinkSuccess = useCallback((linkAttachment) => {
    setAttachments((prev) => [...prev, linkAttachment]);
  }, [setAttachments]);

  // Memoize computed values
  const isContentEmpty = useMemo(() => {
    return (
      !richTextContent.replace(/<[^>]*>/g, "").trim() &&
      attachments.length === 0
    );
  }, [richTextContent, attachments]);

  // Check if user can post
  const canPost = useMemo(() => {
    if (classroomPermissions) {
      return classroomPermissions.canPost;
    }
    return userRole === "teacher" || userRole === "admin";
  }, [userRole, classroomPermissions]);

  // Get appropriate placeholder text
  const getPlaceholderText = () => {
    if (userRole === "student") {
      return "Share something with your class";
    }
    return "Announce something to your class";
  };

  // Get appropriate button text
  const getButtonText = () => {
    if (userRole === "student") {
      return "Share";
    }
    return "Post";
  };

  return (
    <Card className="shadow-sm">
      <style>{editorStyles}</style>

      {!showEditor ? (
        /* Collapsed State */
        canPost ? (
          <div
            className="flex items-center gap-4 py-2 cursor-pointer"
            onClick={handleEditorClick}
          >
            <Avatar icon={<UserOutlined />} size={40} src={user.image} />
            <div className="flex-1 px-4 py-3 bg-gray-50 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
              <Text type="secondary">{getPlaceholderText()}</Text>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Text type="secondary">
              Students are not allowed to post in this classroom
            </Text>
          </div>
        )
      ) : (
        /* Expanded State */
        <Form
          form={announcementForm}
          onFinish={handlePostAnnouncement}
          layout="vertical"
        >
          {/* Target Audience - Only show for teachers */}
          {userRole === "teacher" && (
            <div className="flex items-center gap-4 mb-4">
              <Text strong>For</Text>
              <Select
                value={targetAudience}
                onChange={setTargetAudience}
                style={{ width: 120 }}
                size="small"
              >
                <Option value="all_students">All</Option>
                <Option value="specific">Specific students</Option>
              </Select>
              <Button
                icon={<UserOutlined />}
                size="small"
                className="flex items-center"
              >
                All students
              </Button>
            </div>
          )}

          {/* Rich Text Editor */}
          <div className="border border-gray-200 rounded-lg mb-4">
            <CustomQuillEditor
              ref={quillRef}
              value={richTextContent}
              onChange={handleEditorChange}
              placeholder={getPlaceholderText()}
              modules={quillModules}
              formats={quillFormats}
              theme="snow"
              style={{ background: "white" }}
            />
          </div>

          {/* Attachment Toolbar */}
          <EditorToolbar
            onFileUpload={handleFileUpload}
            onAddVideo={handleAddVideo}
            onUploadVideo={handleUploadVideo}
            onAddLink={handleAddLink}
            userRole={userRole}
          />

          {/* Attachments List */}
          <AttachmentList
            attachments={attachments}
            onRemoveAttachment={removeAttachment}
          />

          {/* Bottom Actions */}
          <div className="flex justify-between items-center">
            <div></div>

            <Space>
              <Button onClick={handleCancelPost}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={postingAnnouncement}
                disabled={isContentEmpty}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {getButtonText()}
              </Button>
            </Space>
          </div>
        </Form>
      )}

      {/* Child Modals */}
      <LinkModal
        visible={linkModalVisible}
        onCancel={() => setLinkModalVisible(false)}
        onSuccess={handleLinkSuccess}
      />

      <VideoSearchModal
        visible={videoSearchModalVisible}
        onCancel={() => setVideoSearchModalVisible(false)}
        onSuccess={handleVideoSuccess}
      />

      <VideoUploadModal
        visible={videoUploadModalVisible}
        onCancel={() => setVideoUploadModalVisible(false)}
        onSuccess={handleVideoSuccess}
      />
    </Card>
  );
};

export default React.memo(AnnouncementEditor, (prevProps, nextProps) => {
  // Custom comparison to prevent re-render
  return (
    prevProps.showEditor === nextProps.showEditor &&
    prevProps.richTextContent === nextProps.richTextContent &&
    prevProps.targetAudience === nextProps.targetAudience &&
    prevProps.attachments.length === nextProps.attachments.length &&
    prevProps.postingAnnouncement === nextProps.postingAnnouncement &&
    prevProps.handlePostAnnouncement === nextProps.handlePostAnnouncement
  );
});
