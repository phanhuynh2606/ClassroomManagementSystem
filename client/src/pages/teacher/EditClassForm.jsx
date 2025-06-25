import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Space, 
  message, 
  Alert,
  Card,
  Spin,
  Select,
  InputNumber,
  Switch
} from 'antd';
import { InfoCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import classroomAPI from '../../services/api/classroom.api';
import './style/teacher.css';

const { TextArea } = Input;
const { Option } = Select;

const EditClassForm = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadClassData = async () => {
      setInitialLoading(true);
      try {
        const response = await classroomAPI.getDetail(classId);
        if (response.success) {
          const classData = response.data;
          
          // Set form values
          form.setFieldsValue({
            name: classData.name,
            description: classData.description,
            category: classData.category,
            level: classData.level,
            maxStudents: classData.maxStudents,
            settings: {
              allowStudentInvite: classData.settings?.allowStudentInvite || false,
              allowStudentPost: classData.settings?.allowStudentPost || false,
              allowStudentComment: classData.settings?.allowStudentComment || false
            }
          });
        } else {
          message.error(response.message || 'Failed to load class information');
          navigate('/teacher/classroom');
        }
      } catch (error) {
        console.error('Error loading class data:', error);
        message.error(error.response?.data?.message || 'Unable to load class information');
        navigate('/teacher/classroom');
      } finally {
        setInitialLoading(false);
      }
    };

    if (classId) {
      loadClassData();
    }
  }, [classId, form, navigate]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formData = {
        name: values.name,
        description: values.description,
        category: values.category,
        level: values.level,
        maxStudents: values.maxStudents,
        settings: {
          allowStudentInvite: values.settings.allowStudentInvite,
          allowStudentPost: values.settings.allowStudentPost,
          allowStudentComment: values.settings.allowStudentComment
        },
        requireApproval: true // Always require admin approval for changes
      };

      const response = await classroomAPI.updateByTeacher(classId, formData);
      
      if (response.data.success) {
        message.success('Class updated successfully! Changes will need admin approval.');
        navigate(`/teacher/classroom/${classId}`);
      } else {
        message.error(response.data.message || 'Failed to update class');
      }
    } catch (error) {
      console.error('Error updating class:', error);
      message.error(error.response?.data?.message || 'An error occurred while updating the class');
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
        onClick={handleCancel}
        className="mb-4"
      >
        Back
      </Button>

      <div className="flex justify-center">
        <div className="max-w-2xl w-full">
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Edit Class & Settings</h2>
              <p className="text-gray-600">
                Update class information and student permissions. Changes will need admin approval.
              </p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className="space-y-4"
            >
              <Form.Item
                label="Class Name"
                name="name"
                rules={[
                  { required: true, message: 'Please enter class name' },
                  { min: 3, message: 'Class name must be at least 3 characters' }
                ]}
              >
                <Input 
                  placeholder="Enter class name"
                  className="h-10"
                />
              </Form.Item>

              <Form.Item
                label="Description"
                name="description"
              >
                <TextArea
                  placeholder="Enter class description (optional)"
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

              <div className="border-t pt-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Student Permissions</h3>
                  <p className="text-gray-600 text-sm">
                    Control what students can do in this classroom
                  </p>
                </div>
                
                <Form.Item
                  label="Allow Students to Invite Others"
                  name={['settings', 'allowStudentInvite']}
                  valuePropName="checked"
                  extra="Students can invite other students to join the classroom"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  label="Allow Students to Create Posts"
                  name={['settings', 'allowStudentPost']}
                  valuePropName="checked"
                  extra="Students can share content and create posts in the classroom stream"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  label="Allow Students to Comment"
                  name={['settings', 'allowStudentComment']}
                  valuePropName="checked"
                  extra="Students can comment on posts and participate in discussions"
                >
                  <Switch />
                </Form.Item>
              </div>

              <Alert
                message="Class updates will need admin approval before taking effect."
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
                    style={{
                      color: 'white',
                      height: '40px'
                    }}
                  >
                    Update Class
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