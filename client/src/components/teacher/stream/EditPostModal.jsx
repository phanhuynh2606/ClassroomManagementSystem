import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Button, message, Select } from 'antd';
import CustomQuillEditor from '../../CustomQuillEditor';

const { Option } = Select;

const EditPostModal = ({ 
  visible, 
  onCancel, 
  onSave, 
  loading, 
  initialData = null,
  userRole = 'teacher'
}) => {
  const [form] = Form.useForm();
  const [richTextContent, setRichTextContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('all_students');
  const quillRef = useRef(null);

  // Initialize form when modal opens
  useEffect(() => {
    if (visible && initialData && form) {
      setTimeout(() => {
        form.setFieldsValue({
          title: initialData.title || '',
        });
        setRichTextContent(initialData.content || '');
        setTargetAudience(initialData.targetAudience || 'all_students');
      }, 0);
    }
  }, [visible, initialData, form]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible && form) {
      setTimeout(() => {
        form.resetFields();
        setRichTextContent('');
        setTargetAudience('all_students');
      }, 0);
    }
  }, [visible, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const postData = {
        title: values.title,
        content: richTextContent,
        targetAudience: userRole === 'teacher' ? targetAudience : undefined
      };
      
      await onSave(postData);
      onCancel(); // Close modal after successful save
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'blockquote', 'code-block'],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'blockquote', 'code-block',
    'align'
  ];

  return (
    <Modal
      title="Edit Post"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          loading={loading}
          onClick={handleSave}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Save Changes
        </Button>
      ]}
      width={700}
      destroyOnClose
    >
      {visible && (
        <Form form={form} layout="vertical">
        {/* Title */}
        <Form.Item
          name="title"
          label="Title"
        >
          <Input placeholder="Enter post title (optional)" />
        </Form.Item>

        {/* Target Audience - Only for teachers */}
        {userRole === 'teacher' && (
          <Form.Item label="Target Audience">
            <Select
              value={targetAudience}
              onChange={setTargetAudience}
              style={{ width: 200 }}
            >
              <Option value="all_students">All Students</Option>
              <Option value="specific">Specific Students</Option>
            </Select>
          </Form.Item>
        )}

        {/* Content Editor */}
        <Form.Item
          label="Content"
          required
        >
          <div className="border border-gray-200 rounded-lg">
            <CustomQuillEditor
              ref={quillRef}
              value={richTextContent}
              onChange={setRichTextContent}
              placeholder="Edit your post content..."
              modules={quillModules}
              formats={quillFormats}
              theme="snow"
              style={{ background: 'white', minHeight: '200px' }}
            />
          </div>
        </Form.Item>
      </Form>
      )}
    </Modal>
  );
};

export default EditPostModal; 