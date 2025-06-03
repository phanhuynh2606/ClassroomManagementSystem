import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Button, 
  Row, 
  Col, 
  Typography,
  message,
  Spin,
  Input,
  Form,
  Modal,
  Space,
  Tag,
  Popconfirm
} from 'antd';
import { 
  UserOutlined,
  CopyOutlined,
  PlusOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import classroomAPI from '../../services/api/classroom.api';

const { Title, Text } = Typography;

const StudentClassroomManagement = () => {
  const [activeTab, setActiveTab] = useState('enrolled');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinForm] = Form.useForm();

  const fetchEnrolledClassrooms = async () => {
    setLoading(true);
    try {
      const response = await classroomAPI.getAllByStudent();
      setClasses(response.data.data || response.data || []);
    } catch (error) {
      message.error('Failed to fetch enrolled classrooms');
      console.error('Error fetching classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledClassrooms();
  }, []);

  const handleJoinClass = async (values) => {
    try {
      await classroomAPI.joinClassroom(values.code);
      message.success('Successfully joined classroom!');
      setJoinModalVisible(false);
      joinForm.resetFields();
      fetchEnrolledClassrooms();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to join classroom');
    }
  };

  const handleLeaveClass = async (classroomId, classroomName) => {
    try {
      await classroomAPI.leaveClassroom(classroomId);
      message.success(`Successfully left ${classroomName}`);
      fetchEnrolledClassrooms();
    } catch (error) {
      message.error('Failed to leave classroom');
    }
  };

  const ClassCard = ({ classItem }) => (
    <Card
      className="h-full hover:shadow-lg transition-shadow duration-200"
      actions={[
        <Popconfirm
          title={`Are you sure you want to leave "${classItem.name}"?`}
          description="You will need to rejoin using the class code if you want to access this classroom again."
          onConfirm={() => handleLeaveClass(classItem._id, classItem.name)}
          okText="Yes, Leave"
          cancelText="Cancel"
          icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
        >
          <Button 
            danger
            icon={<LogoutOutlined />}
            style={{ width: '95%' }}
          >
            Leave Class
          </Button>
        </Popconfirm>
      ]}
    >
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <Title level={4} className="mb-0">
            {classItem.name}
          </Title>
          <Tag color="green">Enrolled</Tag>
        </div>
        <Text type="secondary" className="block mb-3">
          {classItem.subject}
        </Text>
        {classItem.description && (
          <Text className="block mb-3 text-sm text-gray-600">
            {classItem.description}
          </Text>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CopyOutlined className="text-gray-400" />
          <Text className="text-sm">
            Class Code: <Text strong>{classItem.code}</Text>
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <UserOutlined className="text-gray-400" />
          <Text className="text-sm">
            Teacher: {classItem.teacher?.fullName || 'Unknown'}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <UserOutlined className="text-gray-400" />
          <Text className="text-sm">
            {classItem.students?.length || 0} students enrolled
          </Text>
        </div>
        <div className="text-sm text-gray-500">
          Category: {classItem.category} | Level: {classItem.level}
        </div>
      </div>
    </Card>
  );

  const EnrolledClasses = () => (
    <Spin spinning={loading}>
      <div>
        <Row gutter={[24, 24]}>
          {classes.map((classItem) => (
            <Col xs={24} sm={12} lg={8} key={classItem._id}>
              <ClassCard classItem={classItem} />
            </Col>
          ))}
          {classes.length === 0 && !loading && (
            <Col span={24}>
              <div className="text-center py-12">
                <Text type="secondary" className="text-lg">
                  You haven't joined any classrooms yet. Use the "Join Class" tab to join a classroom.
                </Text>
              </div>
            </Col>
          )}
        </Row>
      </div>
    </Spin>
  );

  const JoinClassForm = () => (
    <div className="max-w-md mx-auto">
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Join a Classroom</h2>
          <p className="text-gray-600">
            Enter the class code provided by your teacher to join a classroom.
          </p>
        </div>

        <Form
          form={joinForm}
          layout="vertical"
          onFinish={handleJoinClass}
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
              placeholder="Enter class code (e.g., ABC123)"
              className="h-12 text-center text-lg font-mono tracking-wider"
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button 
              type="primary" 
              htmlType="submit"
              className="w-full h-12 text-lg"
              icon={<PlusOutlined />}
            >
              Join Classroom
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  const tabItems = [
    {
      key: 'enrolled',
      label: `My Classrooms (${classes.length})`,
      children: <EnrolledClasses />
    },
    {
      key: 'join',
      label: 'Join Class',
      children: <JoinClassForm />
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          My Classrooms
        </Title>
        <Text type="secondary">
          Manage your enrolled classrooms and join new ones
        </Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="classroom-management-tabs"
      />
    </div>
  );
};

export default StudentClassroomManagement; 