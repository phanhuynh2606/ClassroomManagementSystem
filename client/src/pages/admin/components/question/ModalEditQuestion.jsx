import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Checkbox,
  Button,
  Space,
  Upload,
  message,
  Image,
} from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { questionAPI } from '../../../../services/api';
import { useState } from 'react';

const { Option } = Select;
const { TextArea } = Input;

const categoryOptions = [
  { value: 'PT1', label: 'PT1' },
  { value: 'PT2', label: 'PT2' },
  { value: 'QUIZ1', label: 'QUIZ1' },
  { value: 'QUIZ2', label: 'QUIZ2' },
  { value: 'FE', label: 'FE' },
  { value: 'ASSIGNMENT', label: 'ASSIGNMENT' },
];

const ModalEditQuestion = ({ visible, onCancel, onSave, loading, questionData }) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState('');

  const handleOk = () => {
    form.validateFields().then((values) => {
      // Validate that at least one option is correct
      const hasCorrectOption = values.options.some(option => option.isCorrect);
      if (!hasCorrectOption) {
        message.error('At least one option must be marked as correct');
        return;
      }
      onSave(values);
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };
  const handleUploadChange = async (info) => {
    try {
      const file = info.file.originFileObj || info.file;

      if (!file) {
        console.error('No file found');
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await questionAPI.uploadImage(formData);

      if (response && response.imageUrl) {
        form.setFieldsValue({ image: response.imageUrl });
        setImageUrl(response.imageUrl);
        message.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Upload failed');
    }
  };
  const uploadProps = {
    name: 'image',
    multiple: false,
    maxCount: 1,
    beforeUpload: (file) => {
      return false;
    },
    onChange: handleUploadChange,
    showUploadList: false,
    accept: 'image/*'
  };

  // Set form values when questionData changes
  useEffect(() => {
    if (visible && questionData) {
      form.setFieldsValue({
        content: questionData.content,
        options: questionData.options,
        explanation: questionData.explanation,
        difficulty: questionData.difficulty,
        category: questionData.category,
        subjectCode: questionData.subjectCode,
        status: questionData.status,
        image: questionData.image,
      });
      setImageUrl(questionData.image);
    }
  }, [visible, questionData, form]);

  return (
    <Modal
      title="Edit Question"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={900}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="content"
          label="Question Content"
          rules={[{ required: true, message: 'Please input question content!' }]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item label="Question Image" name="image"> 
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Upload Image</Button>
          </Upload>
          {imageUrl && (
            <Image
              src={imageUrl}
              alt="Question Image"
              style={{ marginTop: 16, width: '300px', height: 'auto', objectFit: 'cover'}}
            />
          )}
        </Form.Item>

        <Form.List
          name="options"
          rules={[
            {
              validator: async (_, options) => {
                if (!options || options.length < 2) {
                  return Promise.reject(new Error('At least 2 options required'));
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8, width: '100%' }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'content']}
                    rules={[{ required: true, message: 'Missing option content' }]}
                    style={{ flex: 1 }}
                  >
                    <Input placeholder="Option content" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'isCorrect']}
                    valuePropName="checked"
                  >
                    <Checkbox>Correct</Checkbox>
                  </Form.Item>
                  {fields.length > 2 && (
                    <Button type="link" onClick={() => remove(name)} danger>
                      Delete
                    </Button>
                  )}
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Option
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item
          name="explanation"
          label="Explanation"
        >
          <TextArea rows={3} placeholder="Explanation for the correct answer" />
        </Form.Item>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            name="difficulty"
            label="Difficulty"
            rules={[{ required: true, message: 'Please select difficulty!' }]}
            style={{ flex: 1 }}
          >
            <Select>
              <Option value="easy">Easy</Option>
              <Option value="medium">Medium</Option>
              <Option value="hard">Hard</Option>
            </Select>
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select category!' }]}
            style={{ flex: 1 }}
          >
            <Select>
              {categoryOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="subjectCode"
            label="Subject Code"
            rules={[{ required: true, message: 'Please input subject code!' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="e.g., SCI101, GEO101" />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status!' }]}
            style={{ flex: 1 }}
          >
            <Select>
              <Option value="draft">Draft</Option>
              <Option value="published">Published</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default ModalEditQuestion;