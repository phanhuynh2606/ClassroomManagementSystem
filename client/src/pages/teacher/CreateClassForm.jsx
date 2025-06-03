import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Space, 
  message, 
  Alert,
  Card,
  Typography,
  Select,
  InputNumber
} from 'antd';
import { InfoCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import classroomAPI from '../../services/api/classroom.api';
import './teacher.css';

const { TextArea } = Input;
const { Option } = Select;

const CreateClassForm = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formData = {
        name: values.name,
        description: values.description || '',
        category: values.category,
        level: values.level,
        maxStudents: values.maxStudents
      };

      await classroomAPI.createByTeacher(formData);
      message.success('Classroom created successfully! It is pending admin approval.');
      form.resetFields();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating classroom:', error);
      message.error(error.response?.data?.message || 'Failed to create classroom');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={handleCancel}
        className="mb-4"
      >
        Back to List
      </Button>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Create New Classroom</h2>
          <p className="text-gray-600">
            Fill in the information to create a new classroom. The classroom will need admin approval.
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          <Form.Item
            label="Classroom Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter classroom name' },
              { min: 3, message: 'Classroom name must be at least 3 characters' }
            ]}
          >
            <Input 
              placeholder="Enter classroom name"
              className="h-10"
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea
              placeholder="Enter classroom description (optional)"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Category"
              name="category"
              rules={[
                { required: true, message: 'Please select category' }
              ]}
            >
              <Select placeholder="Select category">
                <Option value="academic">Academic</Option>
                <Option value="professional">Professional</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Level"
              name="level"
              rules={[
                { required: true, message: 'Please select level' }
              ]}
            >
              <Select placeholder="Select level">
                <Option value="beginner">Beginner</Option>
                <Option value="intermediate">Intermediate</Option>
                <Option value="advanced">Advanced</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="Maximum Students"
            name="maxStudents"
            rules={[
              { required: true, message: 'Please enter maximum number of students' },
              { type: 'number', min: 1, message: 'Must be at least 1 student' }
            ]}
          >
            <InputNumber
              placeholder="Enter max students"
              className="w-full h-10"
              min={1}
              max={200}
            />
          </Form.Item>

          <Alert
            message="The new classroom will need admin approval before it becomes active."
            type="info"
            icon={<InfoCircleOutlined />}
            className="mb-6"
          />

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button 
                onClick={handleCancel}
                className="h-10 px-6"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                className="h-10 px-7"
              >
                Create Classroom
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateClassForm; 