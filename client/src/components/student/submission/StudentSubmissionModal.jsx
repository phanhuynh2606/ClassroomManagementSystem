import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Upload,
  Button,
  Alert,
  Tag,
  message,
  Typography,
  Space
} from 'antd';
import {
  CloudUploadOutlined,
  SendOutlined,
  FileTextOutlined,
  PaperClipOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { TextArea } = Input;
const { Text } = Typography;

const StudentSubmissionModal = ({
  visible,
  onCancel,
  onSubmit,
  assignment,
  loading = false,
  user
}) => {
  const [form] = Form.useForm();
  const [attachments, setAttachments] = useState([]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submissionSettings = assignment?.submissionSettings || {};
      
      // Validate submission requirements based on settings
      const hasContent = values.content && values.content.trim();
      const hasFiles = attachments && attachments.length > 0;

      // Check text submission requirement
      if (submissionSettings.textSubmissionRequired && !hasContent) {
        message.error("Text submission is required for this assignment");
        return;
      }

      // Check file submission requirement
      if (submissionSettings.fileSubmissionRequired && !hasFiles) {
        message.error("File submission is required for this assignment");
        return;
      }

      // Check submission type
      if (submissionSettings.type === 'text' && hasFiles) {
        message.error("This assignment only accepts text submissions");
        return;
      }

      if (submissionSettings.type === 'file' && hasContent) {
        message.error("This assignment only accepts file submissions");
        return;
      }

      // Check if at least one submission method is provided (for 'both' type)
      if (submissionSettings.type === 'both' && !hasContent && !hasFiles) {
        message.error("Please provide either text content or file attachments");
        return;
      }

      // FINAL VALIDATION: Always ensure at least some content is provided
      // This catches any edge cases where no content is provided
      if (!hasContent && !hasFiles) {
        message.error("Cannot submit empty assignment. Please provide either text content or file attachments");
        return;
      }

      const submissionData = {
        content: values.content || '',
        attachments: attachments,
      };

      await onSubmit(submissionData);
      
      // Reset form after successful submission
      form.resetFields();
      setAttachments([]);
    } catch (error) {
      if (error.errorFields) {
        message.error("Please check the form for errors");
      } else {
        console.error("Error in submission validation:", error);
      }
    }
  };

  const handleUploadChange = ({ fileList }) => {
    setAttachments(fileList);
  };

  const beforeUpload = (file) => {
    const submissionSettings = assignment?.submissionSettings || {};
    const maxSize = submissionSettings.maxFileSize || 25; // Default 25MB
    const allowedTypes = submissionSettings.allowedFileTypes || [];
    
    // Check file size
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxSize) {
      message.error(`File size must be less than ${maxSize}MB! Your file is ${fileSizeMB.toFixed(2)}MB`);
      return Upload.LIST_IGNORE; // Prevent file from being added to the list
    }

    // Check file type if restrictions are set
    if (allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const fileType = file.type;
      
      // Map common MIME types to our allowed types
      const typeMapping = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'text/plain': 'txt',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'application/zip': 'zip',
        'application/x-rar-compressed': 'rar',
        'image/jpeg': 'image',
        'image/jpg': 'image', 
        'image/png': 'image',
        'image/gif': 'image',
        'image/webp': 'image',
        'video/mp4': 'video',
        'video/avi': 'video',
        'video/quicktime': 'video',
        'audio/mpeg': 'audio',
        'audio/wav': 'audio',
        'text/csv': 'csv',
        'application/json': 'json',
        'text/html': 'html',
        'text/css': 'css',
        'application/javascript': 'js',
        'application/typescript': 'ts'
      };

      const detectedType = typeMapping[fileType] || fileExtension;
      
      if (!allowedTypes.includes(detectedType) && !allowedTypes.includes(fileExtension)) {
        message.error(`File type "${fileExtension}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        return Upload.LIST_IGNORE; // Prevent file from being added to the list
      }
    }

    return false; // Prevent auto upload but allow file to be added to list
  };

  const handleCancel = () => {
    form.resetFields();
    setAttachments([]);
    onCancel();
  };

  if (!assignment) return null;

  const submissionSettings = assignment.submissionSettings || {};
  const requirements = [];
  
  if (submissionSettings.textSubmissionRequired) {
    requirements.push("📝 Text content is required");
  }
  if (submissionSettings.fileSubmissionRequired) {
    requirements.push("📎 File attachment is required");
  }
  if (submissionSettings.type === 'text') {
    requirements.push("✍️ Only text submissions accepted");
  }
  if (submissionSettings.type === 'file') {
    requirements.push("📁 Only file submissions accepted");
  }
  if ((submissionSettings.type === 'both' || submissionSettings.type === 'file') && submissionSettings.maxFileSize && submissionSettings.maxFileSize !== 25) {
    requirements.push(`📏 Max file size: ${submissionSettings.maxFileSize}MB`);
  }
  if (submissionSettings.allowedFileTypes && submissionSettings.allowedFileTypes.length > 0) {
    requirements.push(`🔧 Allowed file types: ${submissionSettings.allowedFileTypes.join(', ')}`);
  }

  // Generate accept attribute based on allowed types
  const generateAcceptAttribute = () => {
    const allowedTypes = submissionSettings.allowedFileTypes || [];
    
    // If no file type restrictions, don't set accept attribute 
    // This will show "All files" instead of "Custom files" in file picker
    if (allowedTypes.length === 0) {
      return undefined;
    }
    
    const extensionMap = {
      'pdf': '.pdf',
      'doc': '.doc',
      'docx': '.docx',
      'txt': '.txt',
      'xls': '.xls',
      'xlsx': '.xlsx',
      'ppt': '.ppt',
      'pptx': '.pptx',
      'zip': '.zip',
      'rar': '.rar',
      'image': '.jpg,.jpeg,.png,.gif,.webp',
      'video': '.mp4,.avi,.mov,.webm',
      'audio': '.mp3,.wav,.flac,.aac',
      'csv': '.csv',
      'json': '.json',
      'html': '.html',
      'css': '.css',
      'js': '.js',
      'ts': '.ts'
    };
    
    return allowedTypes
      .map(type => extensionMap[type] || `.${type}`)
      .join(',');
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <SendOutlined className="text-white" />
          </div>
          <span>Submit Assignment</span>
        </div>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={800}
      okText={loading ? "Submitting..." : "Submit Assignment"}
      cancelText="Cancel"
      okButtonProps={{
        className: "bg-gradient-to-r from-green-500 to-green-600 border-0",
        size: "large"
      }}
    >
      <div className="py-4">
        {/* Submission Requirements */}
        {requirements.length > 0 && (
          <Alert
            message="📋 Submission Requirements"
            description={
              <ul className="list-disc list-inside space-y-1 mt-2">
                {requirements.map((req, index) => (
                  <li key={index} className="text-sm">{req}</li>
                ))}
              </ul>
            }
            type="info"
            showIcon
            className="mb-6 rounded-lg"
          />
        )}

        <Form form={form} layout="vertical" size="large">
          {/* Text Content Field */}
          {(() => {
            const showTextInput = submissionSettings.type !== 'file';
            const isRequired = submissionSettings.textSubmissionRequired || submissionSettings.type === 'text';
            
            return showTextInput && (
              <Form.Item
                name="content"
                label={
                  <div className="flex items-center gap-2">
                    <Text strong>Your Answer</Text>
                    {isRequired && <Text type="danger">*</Text>}
                    {submissionSettings.type === 'text' && (
                      <Tag color="blue" size="small">Text Only</Tag>
                    )}
                  </div>
                }
                rules={isRequired ? [{ required: true, message: "Text content is required for this assignment" }] : []}
              >
                <TextArea
                  rows={5}
                  placeholder={
                    submissionSettings.type === 'text' 
                      ? "Enter your text answer here (file uploads disabled for this assignment)..."
                      : "Enter your assignment content here..."
                  }
                  showCount
                  maxLength={5000}
                  className="rounded-lg"
                />
              </Form.Item>
            );
          })()}

          {/* File Upload Field */}
          {(() => {
            const showFileInput = submissionSettings.type !== 'text';
            const isRequired = submissionSettings.fileSubmissionRequired || submissionSettings.type === 'file';
            const maxSize = submissionSettings.maxFileSize || 25;
            const allowedTypes = submissionSettings.allowedFileTypes || [];
            
            const acceptAttribute = generateAcceptAttribute();
            
            return showFileInput && (
              <Form.Item 
                name="attachments" 
                label={
                  <div className="flex items-center gap-2">
                    <Text strong>Attach Files</Text>
                    {isRequired ? (
                      <Text type="danger">*</Text>
                    ) : (
                      <Text type="secondary">(optional)</Text>
                    )}
                    {submissionSettings.type === 'file' && (
                      <Tag color="green" size="small">Files Only</Tag>
                    )}
                  </div>
                }
              >
                <Upload.Dragger
                  multiple
                  beforeUpload={beforeUpload}
                  onChange={handleUploadChange}
                  fileList={attachments}
                  {...(acceptAttribute && { accept: acceptAttribute })}
                  className="rounded-lg border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors"
                >
                  <p className="ant-upload-drag-icon">
                    <CloudUploadOutlined className="text-green-500 text-4xl" />
                  </p>
                  <p className="ant-upload-text text-lg font-medium">
                    {submissionSettings.type === 'file' 
                      ? "Upload your assignment files"
                      : "Click or drag files to upload"
                    }
                  </p>
                  <p className="ant-upload-hint text-gray-500">
                    {allowedTypes.length > 0 
                      ? `Allowed: ${allowedTypes.join(', ')} • Max ${maxSize}MB per file`
                      : `Support: PDF, Word, Images, Videos, Archives • Max ${maxSize}MB per file`
                    }
                  </p>
                </Upload.Dragger>
              </Form.Item>
            );
          })()}

          {/* Warning Alerts */}
          {assignment && (() => {
            const isOverdue = moment().isAfter(moment(assignment.dueDate));
            return isOverdue && assignment.allowLateSubmission && (
              <Alert
                message="⚠️ Late Submission Warning"
                description={`This assignment is overdue. A penalty of ${assignment.latePenalty}% per day will be applied to your grade.`}
                type="warning"
                showIcon
                className="mb-4 rounded-lg"
              />
            );
          })()}
        </Form>
      </div>
    </Modal>
  );
};

export default StudentSubmissionModal; 