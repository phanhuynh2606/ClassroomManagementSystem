import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Space, 
  message, 
  Alert,
  Card,
  Typography
} from 'antd';
import { InfoCircleOutlined, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import './teacher.css';

const { TextArea } = Input;

const CreateClassForm = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [classCode, setClassCode] = useState('');

  const generateClassCode = () => {
    // Generate a random class code
    const prefix = 'WADA';
    const number = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const newCode = `${prefix}${number}`;
    setClassCode(newCode);
    form.setFieldsValue({ code: newCode });
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Form values:', values);
      message.success('Tạo lớp học thành công! Lớp học đang chờ admin phê duyệt.');
      form.resetFields();
      setClassCode('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tạo lớp học');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setClassCode('');
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
        Quay lại
      </Button>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Tạo lớp học mới</h2>
          <p className="text-gray-600">
            Điền thông tin để tạo lớp học mới. Lớp học sẽ cần được admin phê duyệt.
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          <Form.Item
            label="Tên lớp học"
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên lớp học' },
              { min: 3, message: 'Tên lớp học phải có ít nhất 3 ký tự' }
            ]}
          >
            <Input 
              placeholder="Nhập tên lớp học"
              className="h-10"
            />
          </Form.Item>

          <Form.Item
            label="Môn học"
            name="subject"
            rules={[
              { required: true, message: 'Vui lòng nhập môn học' }
            ]}
          >
            <Input 
              placeholder="Nhập tên môn học"
              className="h-10"
            />
          </Form.Item>

          <Form.Item
            label="Mô tả lớp học"
            name="description"
          >
            <TextArea
              placeholder="Nhập mô tả về lớp học (không bắt buộc)"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="Mã lớp học"
            name="code"
          >
            <div className="flex gap-2">
              <Input
                value={classCode}
                placeholder="Mã lớp học sẽ được tạo tự động"
                readOnly
                className="flex-1 h-10"
              />
              <Button 
                onClick={generateClassCode}
                className="h-10"
              >
                Tạo mới
              </Button>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Học sinh sẽ dùng mã này để tham gia lớp học
            </div>
          </Form.Item>

          <Alert
            message="Lớp học mới sẽ cần được admin phê duyệt trước khi có hiệu lực."
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
                Hủy
              </Button>
              <Button 
                type="success" 
                htmlType="submit"
                loading={loading}
                className="h-10 px-7 bg-green-500 hover:bg-green-600"
                style={{
                    color: 'white'
                }}
              >
                Tạo lớp học
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateClassForm; 