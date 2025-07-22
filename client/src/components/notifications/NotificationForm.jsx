import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Radio,
  Checkbox,
  DatePicker,
  message,
  Spin,
  Avatar,
  Tag,
  Typography,
  Divider
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  TeamOutlined,
  GlobalOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import notificationAPI from '../../services/api/notification.api';
import classroomAPI from '../../services/api/classroom.api';
import userAPI from '../../services/api/user.api';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const NotificationForm = ({ onSuccess, initialData = null }) => {
  const [form] = Form.useForm();
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [recipientType, setRecipientType] = useState('class_general');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (user?.role === 'teacher') {
      fetchTeacherClassrooms();
    } else if (user?.role === 'admin') {
      fetchAllUsers();
    }
  }, [user]);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
    }
  }, [initialData, form]);

  const fetchTeacherClassrooms = async () => {
    try {
      const response = await classroomAPI.getClassroomsByTeacher();
      setClassrooms(response.data?.classrooms || []);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  const fetchAllUsers = async () => {
    if (user?.role !== 'admin') return;
    
    setLoadingUsers(true);
    try {
      const response = await userAPI.getAllUsers();
      console.log('Users response:', response);
      const usersList = response.data || [];
      console.log('Users list:', usersList);
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Tạm thời set empty array để không bị crash
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchClassroomStudents = async (classroomId) => {
    setLoadingStudents(true);
    try {
      const response = await notificationAPI.getClassroomStudents(classroomId);
      setStudents(response.data?.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      message.error('Unable to load student list');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleClassroomChange = (classroomId) => {
    setSelectedClassroom(classroomId);
    if (classroomId && recipientType === 'class_specific') {
      fetchClassroomStudents(classroomId);
    }
    setSelectedStudents([]);
    form.setFieldsValue({ recipients: [] });
  };

  const handleRecipientTypeChange = (value) => {
    setRecipientType(value);
    setSelectedStudents([]);
    form.setFieldsValue({ recipients: [] });
    
    if (value === 'class_specific' && selectedClassroom) {
      fetchClassroomStudents(selectedClassroom);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const notificationData = {
        title: values.title,
        content: values.content,
        type: values.type,
        priority: values.priority || 'normal',
        scheduledFor: values.scheduledFor?.toISOString(),
        expiresAt: values.expiresAt?.toISOString(),
      };

      // Set recipients based on type and role
      if (user.role === 'admin') {
        if (values.type === 'system') {
          notificationData.targetRole = values.targetRole || 'all';
        } else if (values.type === 'personal' && values.recipients) {
          notificationData.recipientIds = values.recipients;
        }
      } else if (user.role === 'teacher') {
        if (values.type === 'class_general') {
          notificationData.classroomId = values.classroom;
        } else if (values.type === 'class_specific') {
          notificationData.classroomId = values.classroom;
          notificationData.recipientIds = values.recipients;
        } else if (values.type === 'personal') {
          notificationData.recipientIds = values.recipients;
        }
      }

      const response = await notificationAPI.createNotification(notificationData);
      
      if (response.success) {
        message.success(response.message || 'Notification sent successfully!');
        form.resetFields();
        setSelectedStudents([]);
        setSelectedClassroom(null);
        if (onSuccess) onSuccess(response.data);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      message.error(error.response?.data?.message || 'An error occurred while sending notification');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTypes = () => {
    if (user?.role === 'admin') {
      return [
        { value: 'system', label: 'System Notification' },
        { value: 'personal', label: 'Personal Notification' }
      ];
    } else if (user?.role === 'teacher') {
      return [
        { value: 'class_general', label: 'Class Notification' },
        { value: 'class_specific', label: 'Specific Students' },
        { value: 'personal', label: 'Personal Notification' },
        { value: 'deadline', label: 'Deadline Notification' },
        { value: 'reminder', label: 'Reminder' }
      ];
    }
    return [];
  };

  const renderRecipientSelector = () => {
    const type = form.getFieldValue('type');
    
    if (user?.role === 'admin') {
      if (type === 'system') {
        return (
          <Form.Item
            name="targetRole"
            label="Send to"
            rules={[{ required: true, message: 'Please select target audience' }]}
          >
            <Radio.Group>
              <Radio value="all">All users</Radio>
              <Radio value="teacher">Teachers</Radio>
              <Radio value="student">Students</Radio>
            </Radio.Group>
          </Form.Item>
        );
      } else if (type === 'personal') {
        return (
          <Form.Item
            name="recipients"
            label="Select Recipients"
            rules={[{ required: true, message: 'Please select recipients' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select users"
              loading={loadingUsers}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {users.map(u => (
                <Option key={u._id} value={u._id}>
                  <Avatar size="small" src={u.image} icon={<UserOutlined />} />
                  <span style={{ marginLeft: 8 }}>
                    {u.fullName} ({u.role}) - {u.email}
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>
        );
      }
    } else if (user?.role === 'teacher') {
      if (['class_general', 'class_specific'].includes(type)) {
        return (
          <>
            <Form.Item
              name="classroom"
              label="Select Classroom"
              rules={[{ required: true, message: 'Please select a classroom' }]}
            >
              <Select
                placeholder="Select classroom"
                onChange={handleClassroomChange}
              >
                {classrooms.map(classroom => (
                  <Option key={classroom._id} value={classroom._id}>
                    {classroom.name} ({classroom.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            {type === 'class_specific' && selectedClassroom && (
              <Form.Item
                name="recipients"
                label="Select Students"
                rules={[{ required: true, message: 'Please select students' }]}
              >
                <Checkbox.Group
                  style={{ width: '100%' }}
                  value={selectedStudents}
                  onChange={setSelectedStudents}
                >
                  <Row gutter={[8, 8]}>
                    {loadingStudents ? (
                      <Col span={24}>
                        <Spin />
                      </Col>
                    ) : (
                      students.map(student => (
                        <Col key={student._id} span={12}>
                          <Checkbox value={student._id}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar size="small" src={student.image} icon={<UserOutlined />} />
                              <span style={{ marginLeft: 8 }}>
                                {student.fullName}
                              </span>
                            </div>
                          </Checkbox>
                        </Col>
                      ))
                    )}
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            )}
          </>
        );
      } else if (type === 'personal') {
        return (
          <Form.Item
            name="recipients"
            label="Recipient Email"
            rules={[{ required: true, message: 'Please enter recipient email' }]}
          >
            <Select
              mode="tags"
              placeholder="Enter recipient email"
              tokenSeparators={[',', ';']}
            />
          </Form.Item>
        );
      }
    }
    
    return null;
  };

  return (
    <Card title="Create New Notification" className="notification-form-card">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          priority: 'normal',
          type: user?.role === 'teacher' ? 'class_general' : 'system'
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="type"
              label="Notification Type"
              rules={[{ required: true, message: 'Please select notification type' }]}
            >
              <Select onChange={handleRecipientTypeChange}>
                {getNotificationTypes().map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item
              name="priority"
              label="Priority Level"
            >
              <Select>
                <Option value="low">Low</Option>
                <Option value="normal">Normal</Option>
                <Option value="high">High</Option>
                <Option value="urgent">Urgent</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="title"
          label="Title"
          rules={[
            { required: true, message: 'Please enter title' },
            { max: 200, message: 'Title cannot exceed 200 characters' }
          ]}
        >
          <Input placeholder="Enter notification title" />
        </Form.Item>

        <Form.Item
          name="content"
          label="Content"
          rules={[
            { required: true, message: 'Please enter content' },
            { max: 2000, message: 'Content cannot exceed 2000 characters' }
          ]}
        >
          <TextArea
            rows={6}
            placeholder="Enter notification content"
            showCount
            maxLength={2000}
          />
        </Form.Item>

        {renderRecipientSelector()}



        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SendOutlined />}
            size="large"
            block
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default NotificationForm; 