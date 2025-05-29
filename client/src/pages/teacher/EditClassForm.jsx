import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Space, 
  message, 
  Alert,
  Card,
  Spin
} from 'antd';
import { InfoCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import './teacher.css';

const { TextArea } = Input;

const EditClassForm = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [classCode, setClassCode] = useState('');

  // Mock data - in real app, this would come from API
  const [classData, setClassData] = useState({
    id: 1,
    name: 'Toán học 10A',
    subject: 'Toán học',
    code: 'MATH10A',
    description: 'Lớp học toán dành cho học sinh lớp 10A',
    status: 'approved'
  });

  useEffect(() => {
    // Simulate loading class data
    const loadClassData = async () => {
      setInitialLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set form values
        form.setFieldsValue({
          name: classData.name,
          subject: classData.subject,
          description: classData.description,
          code: classData.code
        });
        setClassCode(classData.code);
      } catch (error) {
        message.error('Không thể tải thông tin lớp học');
      } finally {
        setInitialLoading(false);
      }
    };

    loadClassData();
  }, [classId, form, classData]);

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
      
      console.log('Updated form values:', values);
      message.success('Cập nhật lớp học thành công! Thay đổi sẽ cần được admin phê duyệt.');
      
      // Navigate back to class detail
      navigate(`/teacher/classroom/${classId}`);
    } catch (error) {
      message.error('Có lỗi xảy ra khi cập nhật lớp học');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/teacher/classroom/${classId}`);
  };

  if (initialLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/teacher/classroom/${classId}`)}
        className="mb-4"
      >
        Quay lại
      </Button>

      <div className="flex justify-center">
        <div className="max-w-2xl w-full">
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Chỉnh sửa lớp học</h2>
              <p className="text-gray-600">
                Cập nhật thông tin lớp học. Thay đổi sẽ cần được admin phê duyệt.
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
                    placeholder="Mã lớp học"
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
                message="Việc cập nhật lớp học sẽ cần được admin phê duyệt trước khi có hiệu lực."
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
                    style={{
                        color: 'white',
                        height: '40px'
                    }}
                  >
                    Cập nhật lớp học
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditClassForm; 