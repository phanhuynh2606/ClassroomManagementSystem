import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Descriptions, 
  Button, 
  Row, 
  Col, 
  Typography,
  message,
  Spin,
  Avatar,
  List,
  Tag,
  Space,
  Popconfirm,
  Tabs,
  Badge,
  Empty,
  Table,
  Input
} from 'antd';
import { 
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import classroomAPI from '../../../services/api/classroom.api';

const { Title, Text } = Typography;

const AdminClassroomDetail = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (classroomId) {
      fetchClassroomDetails();
      fetchStudents();
    }
  }, [classroomId]);

  const fetchClassroomDetails = async () => {
    setLoading(true);
    try {
      // Get all classrooms and find the specific one to get approval status
      const response = await classroomAPI.getAllByAdmin();
      const classrooms = response.data.data || response.data || [];
      const targetClassroom = classrooms.find(c => c._id === classroomId);
      
      if (targetClassroom) {
        console.log('Admin Classroom Detail - Classroom data:', targetClassroom);
        setClassroom(targetClassroom);
      } else {
        console.log('Admin Classroom Detail - Classroom not found, available classrooms:', classrooms);
        message.error('Classroom not found');
        navigate('/admin/classrooms');
      }
    } catch (error) {
      message.error('Failed to fetch classroom details');
      console.error('Error fetching classroom:', error);
      navigate('/admin/classrooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      // Use the detailed API that includes students
      const response = await classroomAPI.getDetail(classroomId);
      const classroomData = response.data.data || response.data;
      if (classroomData && classroomData.students) {
        console.log('Admin Classroom Detail - Students data:', classroomData.students);
        setStudents(classroomData.students);
      } else {
        console.log('Admin Classroom Detail - No students found, classroomData:', classroomData);
        setStudents([]);
      }
    } catch (error) {
      console.log('Cannot fetch students:', error);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await classroomAPI.approveClassroom(classroomId);
      message.success('Classroom approved successfully');
      // Refresh both classroom details and students
      await fetchClassroomDetails();
      await fetchStudents();
    } catch (error) {
      message.error('Failed to approve classroom');
    }
  };

  const handleReject = async () => {
    // This could be expanded to show a modal for rejection reason
    try {
      await classroomAPI.rejectClassroom(classroomId, 'Rejected by admin');
      message.success('Classroom rejected successfully');
      // Refresh both classroom details and students
      await fetchClassroomDetails();
      await fetchStudents();
    } catch (error) {
      message.error('Failed to reject classroom');
    }
  };

  const handleDelete = async () => {
    try {
      await classroomAPI.deleteByAdmin(classroomId);
      message.success('Classroom deleted successfully');
      navigate('/admin/classrooms');
    } catch (error) {
      message.error('Failed to delete classroom');
    }
  };

  const handleApproveDeletion = async () => {
    try {
      await classroomAPI.approveDeletion(classroomId);
      message.success('Classroom deletion approved');
      navigate('/admin/classrooms');
    } catch (error) {
      message.error('Failed to approve deletion');
    }
  };

  const copyClassCode = () => {
    if (classroom?.code) {
      navigator.clipboard.writeText(classroom.code);
      message.success('Class code copied to clipboard!');
    }
  };

  const filteredStudents = students.filter(student => {
    // Handle different data structures
    const studentInfo = student.student || student;
    const fullName = studentInfo?.fullName || '';
    const email = studentInfo?.email || '';
    
    return fullName.toLowerCase().includes(searchText.toLowerCase()) ||
           email.toLowerCase().includes(searchText.toLowerCase());
  });

  const studentColumns = [
    {
      title: 'Student Name',
      key: 'fullName',
      render: (_, record) => {
        const studentInfo = record.student || record;
        return (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{studentInfo?.fullName || 'N/A'}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Email',
      key: 'email',
      render: (_, record) => {
        const studentInfo = record.student || record;
        return <Text>{studentInfo?.email || 'N/A'}</Text>;
      },
    },
    {
      title: 'Joined Date',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="text-center py-12">
        <Title level={3}>Classroom not found</Title>
        <Button onClick={() => navigate('/admin/classrooms')}>
          Back to Classrooms
        </Button>
      </div>
    );
  }

  const renderOverview = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card title="Classroom Information" className="mb-6">
          <Descriptions column={2} size="middle">
            <Descriptions.Item label="Class Name" span={2}>
              <Text strong>{classroom.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Class Code">
              <Space>
                <Text code className="font-mono">{classroom.code}</Text>
                <Button 
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={copyClassCode}
                >
                  Copy
                </Button>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Category">
              <Tag color="orange">{classroom.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Level">
              <Tag color="purple">{classroom.level}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Max Students">
              <Text>{classroom.maxStudents}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Teacher" span={2}>
              <Space>
                <Avatar 
                  size="small" 
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <Text strong>{classroom.teacher?.fullName}</Text>
                <Text type="secondary">({classroom.teacher?.email})</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Total Students">
              <Badge count={classroom.students?.length || students.length || 0} showZero />
            </Descriptions.Item>
            <Descriptions.Item label="Created Date">
              <Text>{new Date(classroom.createdAt).toLocaleDateString()}</Text>
            </Descriptions.Item>
            {classroom.description && (
              <Descriptions.Item label="Description" span={2}>
                <Text>{classroom.description}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="Quick Actions" className="mb-6">
          <Space direction="vertical" style={{ width: '100%' }}>
            {classroom.approvalStatus === 'pending' && (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleApprove}
                  block
                  style={{ backgroundColor: '#52c41a' }}
                >
                  Approve Classroom
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={handleReject}
                  block
                >
                  Reject Classroom
                </Button>
              </>
            )}
            {classroom.deletionRequested && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleApproveDeletion}
                block
                style={{ backgroundColor: '#722ed1' }}
              >
                Approve Deletion Request
              </Button>
            )}
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/classrooms/edit/${classroomId}`)}
              block
            >
              Edit Classroom
            </Button>
            <Popconfirm
              title="Are you sure to delete this classroom?"
              onConfirm={handleDelete}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />} block>
                Delete Classroom
              </Button>
            </Popconfirm>
          </Space>
        </Card>
        <Card title="Status">
          <Space direction="vertical">
            <div>
              <Text strong>Approval Status: </Text>
              <Tag color={
                classroom.approvalStatus === 'approved' ? 'green' :
                classroom.approvalStatus === 'pending' ? 'orange' : 'red'
              }>
                {classroom.approvalStatus?.toUpperCase()}
              </Tag>
            </div>
            <div>
              <Text strong>Active Status: </Text>
              <Tag color={classroom.isActive ? 'green' : 'red'}>
                {classroom.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Tag>
            </div>
            {classroom.deletionRequested && (
              <div>
                <Text strong>Deletion Requested: </Text>
                <Tag color="orange">PENDING APPROVAL</Tag>
              </div>
            )}
          </Space>
        </Card>
      </Col>
    </Row>
  );

  const renderStudents = () => (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Input
          placeholder="Search students..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Text type="secondary">
          Total: {students.length} students
        </Text>
      </div>
      
      <Table
        columns={studentColumns}
        dataSource={filteredStudents}
        rowKey={(record) => record.student?._id || record._id || Math.random()}
        loading={studentsLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} students`,
        }}
        locale={{
          emptyText: studentsLoading ? 'Loading...' : 'No students enrolled yet'
        }}
      />
    </div>
  );

  const tabItems = [
    {
      key: 'overview',
      label: (
        <Space>
          <BookOutlined />
          Overview
        </Space>
      ),
      children: renderOverview()
    },
    {
      key: 'students',
      label: (
        <Space>
          <TeamOutlined />
          Students
          <Badge count={students.length} size="small" />
        </Space>
      ),
      children: renderStudents()
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/classrooms')}
          className="mb-4"
        >
          Back to Classroom Management
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <Title level={2} className="mb-2">
              {classroom.name}
            </Title>
            <Text type="secondary" className="text-lg">
              {classroom.subject || classroom.category || 'No subject specified'}
            </Text>
          </div>
          <Space>
            <Tag color={
              classroom.approvalStatus === 'approved' ? 'green' :
              classroom.approvalStatus === 'pending' ? 'orange' : 'red'
            } className="text-base px-3 py-1">
              {classroom.approvalStatus?.toUpperCase()}
            </Tag>
          </Space>
        </div>
      </div>

      {/* Tab Content */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default AdminClassroomDetail; 