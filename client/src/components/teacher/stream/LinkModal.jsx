import React, { useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  message,
} from 'antd';

const LinkModal = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [linkForm] = Form.useForm();

  const handleLinkSubmit = useCallback(async () => {
    try {
      const values = await linkForm.validateFields();
      const linkUrl = values.linkUrl.trim();

      // Enhanced URL validation to support complex URLs like YouTube with query parameters
      const isValidUrl = (url) => {
        try {
          // Try to create URL object - this is more reliable than regex
          const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
          return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch (error) {
          return false;
        }
      };

      const fullUrl = linkUrl.startsWith("http")
        ? linkUrl
        : `https://${linkUrl}`;

      if (isValidUrl(linkUrl) || isValidUrl(fullUrl)) {
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

        if (onSuccess) {
          onSuccess(linkAttachment);
        }

        // Reset form and close
        linkForm.resetFields();
        if (onCancel) onCancel();
      } else {
        message.error("Please enter a valid URL");
      }
    } catch (error) {
      console.error("Link form validation failed:", error);
    }
  }, [linkForm, onSuccess, onCancel]);

  const handleCancel = useCallback(() => {
    linkForm.resetFields();
    if (onCancel) onCancel();
  }, [linkForm, onCancel]);

  return (
    <Modal
      title="Add link"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button
          key="cancel"
          onClick={handleCancel}
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
  );
};

export default LinkModal; 