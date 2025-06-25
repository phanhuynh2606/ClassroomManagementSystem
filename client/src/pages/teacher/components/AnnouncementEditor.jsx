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
} from "antd";
import {
  UserOutlined,
  PaperClipOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  DeleteOutlined,
  LinkOutlined,
  YoutubeFilled,
} from "@ant-design/icons";
import CustomQuillEditor from "../../../components/CustomQuillEditor";
import { useSelector } from "react-redux";

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
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const [linkForm] = Form.useForm();
  const [videoForm] = Form.useForm();
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
            size: (response.data.size / 1024).toFixed(1) + " KB",
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
    setVideoModalVisible(true);
  }, []);

  const handleAddLink = useCallback(() => {
    setLinkModalVisible(true);
  }, []);

  const handleVideoSearch = useCallback(async (searchValue) => {
    if (!searchValue.trim()) {
      setVideoPreview(null);
      return;
    }

    // Extract YouTube video ID from various URL formats
    const getYouTubeId = (url) => {
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    };

    const videoId = getYouTubeId(searchValue.trim());
    if (videoId) {
      try {
        // YouTube Data API key - đọc từ environment variable
        const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

                if (API_KEY && API_KEY.trim()) {
          try {
            // Fetch video info and channel info in parallel for better performance
            const [videoResponse, channelResponse] = await Promise.all([
              fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet,statistics,contentDetails`),
              // We'll get channelId first, then fetch channel info
            ]);

            if (videoResponse.ok) {
              const videoData = await videoResponse.json();
              
              if (videoData.items && videoData.items.length > 0) {
                const video = videoData.items[0];
                const snippet = video.snippet;
                const statistics = video.statistics;
                const contentDetails = video.contentDetails;

                // Parse duration từ ISO 8601 format (PT4M13S -> 4:23)
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

                // Parse description to extract metadata
                const parseDescription = (desc) => {
                  const lines = desc.split("\n");
                  const result = {
                    mainTitle: lines[0] || snippet.title,
                    availableOn: [],
                    credits: [],
                  };

                  // Extract availability links
                  const availabilityRegex = /(Available on|Available at)\s+([^:]+):\s*([^\n]+)/gi;
                  let match;
                  while ((match = availabilityRegex.exec(desc)) !== null) {
                    result.availableOn.push({
                      platform: match[2].trim(),
                      link: match[3].trim(),
                    });
                  }

                  // Extract credits
                  const creditRegex = /(Executive Producer|Composer|Music Producer|Artist|Director|Producer):\s*([^\n]+)/gi;
                  while ((match = creditRegex.exec(desc)) !== null) {
                    result.credits.push({
                      role: match[1].trim(),
                      name: match[2].trim(),
                    });
                  }

                  return result;
                };

                const parsedDesc = parseDescription(snippet.description || "");

                // Fetch channel thumbnail
                let channelThumbnail = null;
                try {
                  const channelResp = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?id=${snippet.channelId}&key=${API_KEY}&part=snippet`
                  );
                                      if (channelResp.ok) {
                      const channelData = await channelResp.json();
                      if (channelData.items && channelData.items.length > 0) {
                        const channelSnippet = channelData.items[0].snippet;
                        channelThumbnail = channelSnippet.thumbnails.medium?.url ||
                                         channelSnippet.thumbnails.default?.url ||
                                         channelSnippet.thumbnails.high?.url;
                      }
                    }
                } catch (error) {
                  console.log('Could not fetch channel thumbnail:', error);
                }

                const videoInfo = {
                  id: videoId,
                  title: snippet.title,
                  channel: snippet.channelTitle,
                  channelId: snippet.channelId,
                  channelThumbnail: channelThumbnail,
                  channelUrl: `https://www.youtube.com/channel/${snippet.channelId}`,
                  description: snippet.description,
                  parsedDescription: parsedDesc,
                  duration: parseDuration(contentDetails.duration),
                  thumbnail: snippet.thumbnails.maxres?.url ||
                           snippet.thumbnails.high?.url ||
                           snippet.thumbnails.medium?.url,
                  url: searchValue.trim(),
                  provider: "YouTube",
                  viewCount: parseInt(statistics.viewCount).toLocaleString(),
                  likeCount: statistics.likeCount
                    ? parseInt(statistics.likeCount).toLocaleString()
                    : "N/A",
                  publishedAt: new Date(snippet.publishedAt).toLocaleDateString(),
                  tags: snippet.tags || [],
                };
                setVideoPreview(videoInfo);
                return;
              }
            }
          } catch (error) {
            console.error('Error with YouTube Data API:', error);
          }
        }

        // Fallback to oEmbed API nếu không có API key hoặc API fails
        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (response.ok) {
          const data = await response.json();
          const videoInfo = {
            id: videoId,
            title: data.title,
            channel: data.author_name,
            channelUrl: data.author_url,
            duration: "Unknown duration",
            thumbnail: data.thumbnail_url,
            url: searchValue.trim(),
            provider: data.provider_name,
          };
          setVideoPreview(videoInfo);
        } else {
          // Fallback to basic info
          const videoInfo = {
            id: videoId,
            title: "YouTube Video",
            channel: "Unknown Channel",
            duration: "Unknown duration",
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            url: searchValue.trim(),
            provider: "YouTube",
          };
          setVideoPreview(videoInfo);
        }
      } catch (error) {
        console.error("Error fetching video info:", error);
        // Fallback to basic info
        const videoInfo = {
          id: videoId,
          title: "YouTube Video",
          channel: "Unknown Channel",
          duration: "Unknown duration",
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          url: searchValue.trim(),
          provider: "YouTube",
        };
        setVideoPreview(videoInfo);
      }
    } else {
      setVideoPreview(null);
    }
  }, []);

  const handleVideoSubmit = useCallback(() => {
    if (videoPreview) {
      const videoAttachment = {
        id: Date.now().toString(),
        name: videoPreview.title,
        type: "video/youtube",
        url: videoPreview.url,
        title: videoPreview.title,
        // YouTube specific fields - save all for database
        videoId: videoPreview.id,
        thumbnail: videoPreview.thumbnail,
        duration: videoPreview.duration,
        channel: videoPreview.channel,
        channelThumbnail: videoPreview.channelThumbnail,
        viewCount: videoPreview.viewCount,
        description: videoPreview.description,
        // Additional metadata
        metadata: {
          publishedAt: videoPreview.publishedAt,
          likeCount: videoPreview.likeCount,
          tags: videoPreview.tags,
          parsedDescription: videoPreview.parsedDescription
        }
      };

      setAttachments((prev) => [...prev, videoAttachment]);
      setVideoModalVisible(false);
      setVideoPreview(null);
      videoForm.resetFields();
    }
  }, [videoPreview, setAttachments, videoForm]);

  const handleLinkSubmit = useCallback(async () => {
    try {
      const values = await linkForm.validateFields();
      const linkUrl = values.linkUrl.trim();

      // Basic URL validation
      const urlPattern =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      const fullUrl = linkUrl.startsWith("http")
        ? linkUrl
        : `https://${linkUrl}`;

      if (urlPattern.test(linkUrl) || urlPattern.test(fullUrl)) {
        const linkAttachment = {
          id: Date.now().toString(),
          name: values.title || "Just a moment...",
          type: "link",
          url: fullUrl,
          title: values.title || "Just a moment...",
          // Could add favicon fetching here in the future
          favicon: null,
          metadata: {
            originalUrl: linkUrl,
            addedAt: new Date().toISOString()
          }
        };

        setAttachments((prev) => [...prev, linkAttachment]);
        setLinkModalVisible(false);
        linkForm.resetFields();
      } else {
        message.error("Please enter a valid URL");
      }
    } catch (error) {
      console.error("Link form validation failed:", error);
    }
  }, [setAttachments, linkForm]);

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
            <Button
              type="text"
              icon={<VideoCameraOutlined />}
              className="hover:bg-gray-100"
              onClick={handleAddVideo}
            >
              Add Video
            </Button>
            <Button
              type="text"
              icon={<LinkOutlined />}
              className="hover:bg-gray-100"
              onClick={handleAddLink}
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

          {/* Attachments - Google Classroom Style Horizontal Layout */}
          {attachments.length > 0 && (
            <div className="mb-4">
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div 
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    {attachment.type === "video/youtube" ? (
                      <>
                        {/* YouTube Video Thumbnail */}
                        <div className="relative w-16 h-12 bg-black rounded overflow-hidden flex-shrink-0">
                          <img
                            src={attachment.thumbnail}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0.5 right-0.5 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded leading-none">
                            {attachment.duration}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                              <div className="w-0 h-0 border-l-[3px] border-l-white border-t-[2px] border-t-transparent border-b-[2px] border-b-transparent ml-0.5"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {attachment.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            YouTube video • {attachment.duration}
                            {attachment.viewCount && ` • ${attachment.viewCount} views`}
                          </div>
                        </div>
                      </>
                    ) : attachment.type === "link" ? (
                      <>
                        {/* Link Thumbnail - Simple favicon style */}
                        <div className="w-16 h-12 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                            <LinkOutlined className="text-white text-sm" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {attachment.title || "Just a moment..."}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {attachment.url}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* File Icon */}
                        <div className="w-16 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                          <div className="text-center">
                            <PaperClipOutlined className="text-white text-lg" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {attachment.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {attachment.size}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Delete button */}
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeAttachment(attachment.id)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                      title="Remove attachment"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* Add Link Modal */}
      <Modal
        title="Add link"
        open={linkModalVisible}
        onCancel={() => {
          setLinkModalVisible(false);
          linkForm.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setLinkModalVisible(false);
              linkForm.resetFields();
            }}
          >
            Cancel
          </Button>,
          <Button
            key="add"
            type="primary"
            onClick={handleLinkSubmit}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Add link
          </Button>,
        ]}
        width={400}
        className="add-link-modal"
      >
        <Form form={linkForm} layout="vertical">
          <Form.Item
            name="linkUrl"
            label="Link"
            rules={[{ required: true, message: "Please enter a URL" }]}
          >
            <Input placeholder="Paste or type a link" autoFocus />
          </Form.Item>
          <Form.Item name="title" label="Title (optional)">
            <Input placeholder="Title" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Video Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <YoutubeFilled className="text-white text-base" />
            </div>
            <span className="text-lg">YouTube</span>
          </div>
        }
        open={videoModalVisible}
        onCancel={() => {
          setVideoModalVisible(false);
          setVideoPreview(null);
          videoForm.resetFields();
        }}
        footer={null}
        width="80vw"
        className="youtube-modal"
        centered
        style={{ maxWidth: "1200px" }}
        styles={{
          body: { padding: 0 },
          header: {
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "16px",
            background: "white",
          },
          content: {
            borderRadius: "12px",
            overflow: "hidden",
          },
        }}
      >
        {!videoPreview ? (
          /* Search State */
          <div className="p-8 text-center h-full">
            {/* YouTube Logo and Illustration */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                {/* Cat illustration */}
                <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center text-6xl mb-4 mx-auto">
                  🐱
                </div>
                {/* Computer illustration */}
                <div className="w-24 h-16 bg-gray-200 rounded border-2 border-gray-300 mx-auto relative">
                  <div className="w-16 h-10 bg-blue-200 rounded m-1">
                    <div className="w-6 h-6 bg-blue-400 rounded m-2 flex items-center justify-center">
                      ▶
                    </div>
                  </div>
                  <div className="absolute -right-2 top-0 w-6 h-4 bg-gray-300 rounded-t"></div>
                </div>
                {/* Plant illustration */}
                <div className="absolute left-0 bottom-0 w-8 h-12 bg-green-400 rounded-t flex flex-col items-center">
                  <div className="w-2 h-8 bg-green-600 mt-1"></div>
                  <div className="w-6 h-4 bg-gray-400 rounded"></div>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="max-w-md mx-auto">
              <Input
                placeholder="Search YouTube or paste URL"
                size="large"
                className="border-2 border-blue-400 focus:border-blue-500"
                style={{
                  borderRadius: "24px",
                  padding: "12px 20px",
                  fontSize: "16px",
                }}
                onChange={(e) => handleVideoSearch(e.target.value)}
                autoFocus
                suffix={<div className="w-6 h-6 text-gray-400">🔍</div>}
              />
            </div>
          </div>
        ) : (
          /* Video Player State */
          <div>
            {/* Back Button */}
            <div className="p-4 border-b">
              <Button
                type="text"
                icon={<span>←</span>}
                onClick={() => setVideoPreview(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Back
              </Button>
            </div>

            {/* Video Content */}
            <div
              className="flex"
              style={{ height: "70vh", minHeight: "600px" }}
            >
              {/* Video Player */}
              <div className="flex-1 bg-black relative">
                <iframe
                  src={`https://www.youtube.com/embed/${videoPreview.id}?rel=0&showinfo=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Video Info Sidebar - Google Classroom Style */}
              <div className="w-96 bg-white border-l overflow-y-auto">
                {/* Header */}
                <div className="p-4 border-b">
                  <h3 className="text-xl font-normal text-gray-900 leading-tight mb-3">
                    {videoPreview.title}
                  </h3>

                  {/* Channel Info */}
                  <div className="flex items-center gap-3 mb-4">
                    {videoPreview.channelThumbnail ? (
                      <img 
                        src={videoPreview.channelThumbnail}
                        alt={`${videoPreview.channel} avatar`}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          // Fallback to letter avatar if image fails
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-8 h-8 rounded-full bg-red-600 flex items-center justify-center ${
                        videoPreview.channelThumbnail ? 'hidden' : ''
                      }`}
                    >
                      <span className="text-white text-sm font-bold">
                        {videoPreview.channel?.charAt(0)?.toUpperCase() || "Y"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {videoPreview.channel}
                    </span>
                  </div>

                  {/* Video Stats */}
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-1">
                      <span>YouTube video</span>
                      <span>•</span>
                      <span className="font-medium">
                        {videoPreview.duration}
                      </span>
                    </div>
                    {videoPreview.viewCount && (
                      <div className="font-medium text-gray-700">
                        {videoPreview.viewCount} views
                      </div>
                    )}
                    {videoPreview.likeCount &&
                      videoPreview.likeCount !== "N/A" && (
                        <div>{videoPreview.likeCount} likes</div>
                      )}
                    {videoPreview.publishedAt && (
                      <div>Published: {videoPreview.publishedAt}</div>
                    )}
                  </div>
                </div>

                {/* Full Video Information Section - Like Google Classroom */}
                <div className="p-4 border-b">

                  {/* Video Description - Full Format */}
                  {videoPreview.description && (
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {videoPreview.description
                        .split("\n")
                        .map((line, index) => {
                          if (!line.trim()) {
                            return <div key={index} className="h-2"></div>;
                          }

                          // Parse hashtags
                          if (line.startsWith("#") || line.includes("#")) {
                            return (
                              <div
                                key={index}
                                className="mb-2 text-blue-600 font-medium"
                              >
                                {line.split(/(\#\w+)/g).map((part, partIndex) =>
                                  part.startsWith("#") ? (
                                    <span
                                      key={partIndex}
                                      className="text-blue-600 hover:text-blue-800 cursor-pointer mr-1"
                                    >
                                      {part}
                                    </span>
                                  ) : (
                                    part
                                  )
                                )}
                              </div>
                            );
                          }

                          // Parse URLs
                          const urlRegex = /(https?:\/\/[^\s]+)/g;
                          if (urlRegex.test(line)) {
                            const parts = line.split(urlRegex);
                            return (
                              <div key={index} className="mb-2">
                                {parts.map((part, partIndex) => {
                                  if (urlRegex.test(part)) {
                                    return (
                                      <a
                                        key={partIndex}
                                        href={part}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline break-all"
                                      >
                                        {part}
                                      </a>
                                    );
                                  }
                                  return <span key={partIndex}>{part}</span>;
                                })}
                              </div>
                            );
                          }

                          // Parse credits/roles (anything with colon)
                          if (
                            line.includes(":") &&
                            /^[A-Za-z\s&,()]+:/.test(line)
                          ) {
                            const [role, ...nameParts] = line.split(":");
                            const name = nameParts.join(":").trim();
                            return (
                              <div key={index} className="mb-1">
                                <span className="font-medium text-gray-800">
                                  {role.trim()}:
                                </span>
                                <span className="text-gray-700 ml-1">
                                  {name}
                                </span>
                              </div>
                            );
                          }

                          // Parse special symbols/bullets
                          if (
                            line.startsWith("♪") ||
                            line.startsWith("►") ||
                            line.startsWith("🔔")
                          ) {
                            return (
                              <div
                                key={index}
                                className="mb-2 font-medium text-gray-800"
                              >
                                {line
                                  .split(/(https?:\/\/[^\s]+)/g)
                                  .map((part, partIndex) => {
                                    if (/https?:\/\/[^\s]+/.test(part)) {
                                      return (
                                        <a
                                          key={partIndex}
                                          href={part}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline break-all"
                                        >
                                          {part}
                                        </a>
                                      );
                                    }
                                    return <span key={partIndex}>{part}</span>;
                                  })}
                              </div>
                            );
                          }

                          // Parse section headers (ALL CAPS or special formatting)
                          if (/^[A-Z\s:]+$/.test(line) && line.length < 50) {
                            return (
                              <div
                                key={index}
                                className="mb-2 mt-3 font-semibold text-gray-900 text-base"
                              >
                                {line}
                              </div>
                            );
                          }

                          // Parse lyrics or long text blocks (Vietnamese lyrics detection)
                          if (
                            line.length > 80 ||
                            /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(
                              line
                            )
                          ) {
                            return (
                              <div
                                key={index}
                                className="mb-2 text-gray-600 italic leading-relaxed pl-2 border-l-2 border-gray-200"
                              >
                                {line}
                              </div>
                            );
                          }

                          // Default text
                          return (
                            <div key={index} className="mb-1 text-gray-700">
                              {line}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Bottom spacing */}
                <div className="h-4"></div>
              </div>
            </div>

            {/* Add Video Button - Fixed at bottom */}
            <div className="p-4 bg-white border-t flex justify-between items-center">
              <Button
                onClick={() => {
                  setVideoModalVisible(false);
                  setVideoPreview(null);
                }}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleVideoSubmit}
                className="bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 font-medium px-6"
                size="large"
              >
                Add video
              </Button>
            </div>
          </div>
        )}
      </Modal>
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
