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
  Popconfirm,
  Empty,
  Badge,
  Tooltip
} from 'antd';
import { 
  UserOutlined,
  CopyOutlined,
  PlusOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  BookOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import classroomAPI from '../../services/api/classroom.api';
import ClassroomCard from '../../components/student/ClassroomCard';

const { Title, Text } = Typography;
const { Search } = Input;

const StudentClassroomManagement = () => {
  const [activeTab, setActiveTab] = useState('enrolled');
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [joinForm] = Form.useForm();
  const navigate = useNavigate();

  const fetchEnrolledClassrooms = async () => {
    setLoading(true);
    try {
      const response = await classroomAPI.getAllByStudent();
      const classroomData = response.data.data || response.data || [];
      setClasses(classroomData);
      setFilteredClasses(classroomData);
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

  useEffect(() => {
    if (searchValue) {
      const filtered = classes.filter(classroom => 
        classroom.name?.toLowerCase().includes(searchValue?.toLowerCase()) ||
        classroom.subject?.toLowerCase().includes(searchValue?.toLowerCase()) ||
        classroom.teacher?.fullName?.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses(classes);
    }
  }, [searchValue, classes]);

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

  const copyClassCode = (code) => {
    navigator.clipboard.writeText(code);
    message.success('Class code copied to clipboard!');
  };



  const EnrolledClasses = () => (
    <div>
      {/* Search and Filter */}
      <div className="mb-6 flex justify-between items-center">
        <Search
          placeholder="Tìm kiếm lớp học, môn học hoặc giáo viên..."
          allowClear
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Button 
          icon={<ReloadOutlined />}
          onClick={fetchEnrolledClassrooms}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          {filteredClasses.map((classItem) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={classItem._id}>
              <ClassroomCard 
                classroom={classItem}
                onLeave={handleLeaveClass}
                onCopyCode={copyClassCode}
              />
            </Col>
          ))}
          {filteredClasses.length === 0 && !loading && (
            <Col span={24}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchValue ? 
                    `Không tìm thấy lớp học nào cho "${searchValue}"` :
                    "Bạn chưa tham gia lớp học nào"
                }
              >
                {!searchValue && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setActiveTab('join')}
                  >
                    Tham gia lớp học đầu tiên
                  </Button>
                )}
              </Empty>
            </Col>
          )}
        </Row>
      </Spin>
    </div>
  );

  const JoinClassForm = () => (
    <div className="max-w-md mx-auto">
      <Card>
        <div className="mb-6 text-center">
          <div className="text-4xl mb-4">🎓</div>
          <Title level={3} className="mb-2">Tham gia lớp học</Title>
          <Text type="secondary">
            Nhập mã lớp do giáo viên cung cấp để tham gia lớp học.
          </Text>
        </div>

        <Form
          form={joinForm}
          layout="vertical"
          onFinish={handleJoinClass}
        >
          <Form.Item
            label="Mã lớp học"
            name="code"
            rules={[
              { required: true, message: 'Vui lòng nhập mã lớp học' },
              { min: 3, message: 'Mã lớp học phải có ít nhất 3 ký tự' }
            ]}
          >
            <Input 
              placeholder="Nhập mã lớp học (ví dụ: ABC123)"
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
              Tham gia lớp học
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <Title level={5} className="text-blue-600 mb-2">
            💡 Mẹo
          </Title>
          <Text className="text-blue-600 text-sm">
            Hỏi giáo viên để lấy mã lớp học. Thường là một tổ hợp ngắn các chữ cái và số.
          </Text>
        </div>
      </Card>
    </div>
  );

  const tabItems = [
    {
      key: 'enrolled',
      label: (
        <Space>
          <BookOutlined />
          Lớp học của tôi
          <Badge count={classes.length} showZero color="#1890ff" />
        </Space>
      ),
      children: <EnrolledClasses />
    },
    {
      key: 'join',
      label: (
        <Space>
          <PlusOutlined />
          Tham gia lớp
        </Space>
      ),
      children: <JoinClassForm />
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          Quản lý lớp học
        </Title>
        <Text type="secondary">
          Quản lý các lớp học đã tham gia và tham gia lớp mới
        </Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="classroom-management-tabs"
        size="large"
      />
    </div>
  );
};

export default StudentClassroomManagement; 