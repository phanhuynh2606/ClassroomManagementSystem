import React, { useState, useCallback, useMemo, memo } from 'react';
import { 
  Card, 
  Form, 
  Select, 
  Button, 
  Upload, 
  Space, 
  Typography, 
  Avatar 
} from 'antd';
import {
  UserOutlined,
  PaperClipOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { Text } = Typography;
const { Option } = Select;

// Custom styles for Quill editor
const editorStyles = `
  .ql-editor {
    min-height: 120px;
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
  announcementForm
}) => {
  const [editorFocused, setEditorFocused] = useState(false);

  // Memoize Quill editor configuration to prevent re-renders
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'blockquote', 'code-block'],
      [{ 'align': [] }],
      ['clean']
    ],
  }), []);

  const quillFormats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'blockquote', 'code-block',
    'align'
  ], []);

  const handleEditorClick = useCallback(() => {
    setShowEditor(true);
    setEditorFocused(true);
  }, [setShowEditor]);

  const handleCancelPost = useCallback(() => {
    setShowEditor(false);
    setRichTextContent('');
    setAttachments([]);
    announcementForm.resetFields();
  }, [setShowEditor, setRichTextContent, setAttachments, announcementForm]);

  const handleEditorChange = useCallback((content) => {
    setRichTextContent(content);
  }, [setRichTextContent]);

  const handleFileUpload = useCallback((file) => {
    const newAttachment = {
      id: Date.now().toString(),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      file: file
    };
    setAttachments(prev => [...prev, newAttachment]);
    return false; // Prevent default upload
  }, [setAttachments]);

  const removeAttachment = useCallback((attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  }, [setAttachments]);

  // Memoize computed values
  const isContentEmpty = useMemo(() => {
    return !richTextContent.replace(/<[^>]*>/g, '').trim() && attachments.length === 0;
  }, [richTextContent, attachments]);

  return (
    <Card className="shadow-sm">
      <style>{editorStyles}</style>
      
      {!showEditor ? (
        /* Collapsed State */
        <div className="flex items-center gap-4 py-2 cursor-pointer" onClick={handleEditorClick}>
          <Avatar icon={<UserOutlined />} size={40} />
          <div 
            className="flex-1 px-4 py-3 bg-gray-50 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <Text type="secondary">
              Announce something to your class
            </Text>
          </div>
        </div>
      ) : (
        /* Expanded State */
        <Form
          form={announcementForm}
          onFinish={handlePostAnnouncement}
          layout="vertical"
        >
          {/* Target Audience */}
          <div className="flex items-center gap-4 mb-4">
            <Text strong>For</Text>
            <Select
              value={targetAudience}
              onChange={setTargetAudience}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="all_students">Test</Option>
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

          {/* Rich Text Editor */}
          <div className="border border-gray-200 rounded-lg mb-4">
            <ReactQuill
              value={richTextContent}
              onChange={handleEditorChange}
              placeholder="Announce something to your class"
              modules={quillModules}
              formats={quillFormats}
              theme="snow"
              style={{ background: 'white' }}
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
            >
              Add Video
            </Button>
            <Button 
              type="text" 
              icon={<CalendarOutlined />}
              className="hover:bg-gray-100"
            >
              Schedule
            </Button>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="mb-4">
              <Text strong className="block mb-2">Attachments:</Text>
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div 
                    key={attachment.id}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <PaperClipOutlined className="text-blue-500" />
                    <div className="flex-1">
                      <Text className="text-sm font-medium text-blue-700">
                        {attachment.name}
                      </Text>
                      <br />
                      <Text type="secondary" className="text-xs">
                        {attachment.size}
                      </Text>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeAttachment(attachment.id)}
                      className="text-red-500 hover:bg-red-100"
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
              <Button onClick={handleCancelPost}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={postingAnnouncement}
                disabled={isContentEmpty}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Post
              </Button>
            </Space>
          </div>
        </Form>
      )}
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