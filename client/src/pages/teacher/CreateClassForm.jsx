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
import './style/teacher.css';

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
        Quay lại
      </Button>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Tạo lớp học mới</h2>
          <p className="text-gray-600">
            Vui lòng điền thông tin để tạo lớp học mới. Lớp học sẽ cần sự chấp thuận của quản trị viên.
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
            label="Mô tả"
            name="description"
          >
            <TextArea
              placeholder="Nhập mô tả lớp học (tùy chọn)"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Danh mục"
              name="category"
              rules={[
                { required: true, message: 'Vui lòng chọn danh mục' }
              ]}
            >
              <Select placeholder="Chọn danh mục">
                <Option value="academic">Học thuật</Option>
                <Option value="professional">Chuyên nghiệp</Option>
                <Option value="other">Khác</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Cấp độ"
              name="level"
              rules={[
                { required: true, message: 'Vui lòng chọn cấp độ' }
              ]}
            >
              <Select placeholder="Chọn cấp độ">
                <Option value="beginner">Người mới bắt đầu</Option>
                <Option value="intermediate">Trung cấp</Option>
                <Option value="advanced">Nâng cao</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="Số lượng học sinh tối đa"
            name="maxStudents"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng học sinh tối đa' },
              { type: 'number', min: 1, message: 'Phải có ít nhất 1 học sinh' }
            ]}
          >
            <InputNumber
              placeholder="Nhập số lượng học sinh tối đa"
              className="w-full h-10"
              min={1}
              max={200}
            />
          </Form.Item>

          <Alert
            message="Lớp học mới sẽ cần sự chấp thuận của quản trị viên trước khi nó trở thành hoạt động."
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
                type="primary" 
                htmlType="submit"
                loading={loading}
                className="h-10 px-7"
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