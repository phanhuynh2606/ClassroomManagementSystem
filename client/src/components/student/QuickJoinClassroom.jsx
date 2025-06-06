import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import classroomAPI from '../../services/api/classroom.api';

const { Text, Title } = Typography;

const QuickJoinClassroom = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleJoin = async (values) => {
    setLoading(true);
    try {
      await classroomAPI.joinClassroom(values.code);
      message.success('Successfully joined classroom!');
      form.resetFields();
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to join classroom');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <div className="text-center">
          <div className="text-3xl mb-2">🎓</div>
          <Title level={4} className="mb-0">Join a Classroom</Title>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={450}
      centered
    >
      <div className="text-center mb-6">
        <Text type="secondary">
          Enter the class code provided by your teacher
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleJoin}
      >
        <Form.Item
          label="Class Code"
          name="code"
          rules={[
            { required: true, message: 'Please enter the class code' },
            { min: 3, message: 'Class code must be at least 3 characters' }
          ]}
        >
          <Input 
            placeholder="Enter class code"
            className="h-12 text-center text-lg font-mono tracking-wider"
            style={{ textTransform: 'uppercase' }}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <div className="flex gap-3">
            <Button 
              onClick={handleCancel}
              className="flex-1"
              size="large"
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              className="flex-1"
              size="large"
              icon={<PlusOutlined />}
            >
              Join
            </Button>
          </div>
        </Form.Item>
      </Form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <Text className="text-blue-600 text-sm">
          💡 <strong>Tip:</strong> Ask your teacher for the class code. It's usually a short combination of letters and numbers.
        </Text>
      </div>
    </Modal>
  );
};

export default QuickJoinClassroom; 