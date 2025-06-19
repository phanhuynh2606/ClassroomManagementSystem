import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Button, 
  Table, 
  Input, 
  Space, 
  Typography, 
  Badge,
  message,
  Tooltip,
  Modal,
  Spin,
  Alert,
  Form,
  Row,
  Col,
  Avatar
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined,
  SearchOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import classroomAPI from '../../services/api/classroom.api';
import './teacher.css';

const { Title, Text } = Typography;
const { Search, TextArea } = Input;

const ClassroomDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [searchText, setSearchText] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  const [classData, setClassData] = useState(null);
  const [studentsData, setStudentsData] = useState([]);
  
  // Ban/Unban states
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [banLoading, setBanLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [bannedStudents, setBannedStudents] = useState([]);

  useEffect(() => {
    if (classId) {
      fetchClassroomData();
      fetchStudentsData();
      fetchBannedStudents();
    }
  }, [classId]);

  const fetchClassroomData = async () => {
    setLoading(true);
    try {
      const response = await classroomAPI.getDetail(classId);
      if (response.success) {
        setClassData(response.data);
      } else {
        message.error(response.message || 'Classroom not found');
        navigate('/teacher/classroom');
      }
    } catch (error) {
      console.error('Error fetching classroom:', error);
      message.error(error.response?.data?.message || 'Failed to fetch classroom data');
      navigate('/teacher/classroom');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsData = async () => {
    setStudentsLoading(true);
    try {
      const response = await classroomAPI.getStudentsByTeacher(classId);
      if (response.success) {
        setStudentsData(response.data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Don't show error message as this might be expected for new classrooms
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchBannedStudents = async () => {
    try {
      const response = await classroomAPI.getBannedStudents(classId);
      const data = response.data.data || response.data || [];
      setBannedStudents(data);
    } catch (error) {
      console.log('Cannot fetch banned students:', error);
      setBannedStudents([]);
    }
  };

  const handleBanStudent = (student) => {
    setSelectedStudent(student);
    setBanModalVisible(true);
  };

  const handleUnbanStudent = async (student) => {
    try {
      const studentId = student.student?._id || student._id;
      await classroomAPI.unbanStudent(classId, studentId);
      message.success('Student unbanned successfully');
      await fetchStudentsData();
      await fetchBannedStudents();
    } catch (error) {
      message.error('Failed to unban student');
      console.error('Error unbanning student:', error);
    }
  };

  const handleBanSubmit = async (reason) => {
    setBanLoading(true);
    try {
      const studentId = selectedStudent.student?._id || selectedStudent._id;
      await classroomAPI.banStudent(classId, studentId, reason);
      message.success('Student banned successfully');
      setBanModalVisible(false);
      await fetchStudentsData();
      await fetchBannedStudents();
    } catch (error) {
      message.error('Failed to ban student');
      console.error('Error banning student:', error);
    } finally {
      setBanLoading(false);
    }
  };

  const handleBanCancel = () => {
    setBanModalVisible(false);
    setSelectedStudent(null);
  };

  const handleCopyClassCode = () => {
    if (classData?.code) {
      navigator.clipboard.writeText(classData.code);
      message.success('Class code copied to clipboard');
    }
  };

  const handleEditClass = () => {
    navigate(`/teacher/classroom/edit/${classId}`);
  };

  const handleDeleteClass = () => {
    setDeleteModalVisible(true);
  };

  const confirmDeleteClass = async () => {
    setDeleting(true);
    try {
      await classroomAPI.deleteByTeacher(classId);
      
      message.success('Deletion request sent to admin for approval');
      setDeleteModalVisible(false);
      navigate('/teacher/classroom');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete classroom');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
  };

  const getApprovalStatusBadge = (status) => {
    const statusConfig = {
      active: { status: "success", text: "Active" },
      inactive: { status: "default", text: "Inactive" },
      pending_delete: { status: "error", text: "Pending Deletion" },
      pending_edit: { status: "processing", text: "Pending Edit" },
      approved: { status: "success", text: "Approved" },
      pending: { status: "processing", text: "Pending Approval" },
      rejected: { status: "error", text: "Rejected" }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge status={config.status} text={config.text}/>;
  };

  const studentColumns = [
    {
      title: 'Student ID',
      dataIndex: ['student', '_id'],
      key: 'studentId',
      width: 120,
      render: (id) => id?.slice(-6)?.toUpperCase() || 'N/A',
    },
    {
      title: 'Full Name',
      dataIndex: ['student', 'fullName'],
      key: 'fullName',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.student?.fullName?.toLowerCase().includes(value.toLowerCase()) || false,
    },
    {
      title: 'Email',
      dataIndex: ['student', 'email'],
      key: 'email',
    },
    {
      title: 'Average Score',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 140,
      render: (score) => (
        <Badge 
          color={score >= 80 ? 'green' : score >= 65 ? 'orange' : 'red'}
          text={`${score}/100`}
        />
      ),
    },
    {
      title: 'Submissions',
      dataIndex: 'submissionCount',
      key: 'submissionCount',
      width: 130,
    },
    {
      title: 'Joined Date',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 130,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => {
        const color = status === 'active' ? 'green' : status === 'banned' ? 'red' : 'orange';
        return (
          <Badge 
            color={color}
            text={status?.toUpperCase() || 'UNKNOWN'}
          />
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => {
        return (
          <Space size="small">
            <Button
              type="primary"
              danger
              onClick={() => handleBanStudent(record)}
            >
              Ban
            </Button>
          </Space>
        );
      },
    },
  ];

  const StudentList = () => {
    // Filter out banned students from the main student list
    const activeStudents = studentsData.filter(student => student.status !== 'banned');
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <Search
            placeholder="Search students..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={setSearchText}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <div className="flex items-center gap-4">
            <Text type="secondary">
              Total: {activeStudents.length} students
            </Text>
            {classData?.code && (
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyClassCode}
              >
                Copy Class Code: {classData.code}
              </Button>
            )}
          </div>
        </div>
        
        <Table
          columns={studentColumns}
          dataSource={activeStudents}
          rowKey={(record) => record.student?._id || record._id}
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
  };

  const AssignmentList = () => (
    <div className="text-center py-12">
      <Text type="secondary" className="text-lg">
        Assignment management feature is under development
      </Text>
    </div>
  );

  const BannedStudentsList = () => {
    const bannedColumns = [
      {
        title: 'Student Name',
        key: 'studentName',
        render: (_, record) => (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{record.studentName || 'N/A'}</Text>
          </Space>
        ),
      },
      {
        title: 'Email',
        dataIndex: 'studentEmail',
        key: 'studentEmail',
      },
      {
        title: 'Banned Date',
        dataIndex: 'bannedAt',
        key: 'bannedAt',
        render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
      },
      {
        title: 'Banned By',
        dataIndex: 'bannedBy',
        key: 'bannedBy',
      },
      {
        title: 'Reason',
        dataIndex: 'banReason',
        key: 'banReason',
        ellipsis: true,
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Button
            type="primary"
            onClick={() => handleUnbanStudent({ student: { _id: record.studentId } })}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Unban
          </Button>
        ),
      },
    ];

    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <Text type="secondary">
            Total banned: {bannedStudents.length} students
          </Text>
        </div>
        
        <Table
          columns={bannedColumns}
          dataSource={bannedStudents}
          rowKey="studentId"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} banned students`,
          }}
          locale={{
            emptyText: 'No banned students'
          }}
        />
      </div>
    );
  };

  const BanModal = () => {
    const [banForm] = Form.useForm();

    const handleSubmit = async (values) => {
      await handleBanSubmit(values.reason);
      banForm.resetFields();
    };

    const handleCancel = () => {
      handleBanCancel();
      banForm.resetFields();
    };

    return (
      <Modal
        title={`Ban Student: ${selectedStudent?.student?.fullName || selectedStudent?.fullName || 'Unknown'}`}
        open={banModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={500}
        destroyOnClose
      >
        <Form
          form={banForm}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={false}
        >
          <div className="mb-4">
            <Text type="secondary">
              You are about to ban this student from the classroom. This action will prevent them from accessing classroom content and participating in activities.
            </Text>
          </div>

          <Form.Item
            label="Reason for Ban"
            name="reason"
            rules={[
              { required: true, message: 'Please provide a reason for banning this student!' },
              { min: 10, message: 'Reason must be at least 10 characters!' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Enter the reason for banning this student..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={banLoading}
              >
                Ban Student
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    );
  };

  const tabItems = [
    {
      key: 'students',
      label: `Students (${studentsData.filter(student => student.status !== 'banned').length})`,
      children: <StudentList />
    },
    {
      key: 'banned',
      label: `Banned Students (${bannedStudents.length})`,
      children: <BannedStudentsList />
    },
    {
      key: 'assignments',
      label: 'Assignments',
      children: <AssignmentList />
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="p-6">
        <Text type="secondary">Classroom not found</Text>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Back button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/teacher/classroom')}
        className="mb-4"
      >
        Back to Classrooms
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Title level={2} className="mb-2">
              {classData.name}
            </Title>
            <Text type="secondary" className="text-lg">
              {classData.subject}
            </Text>
            {classData.description && (
              <div className="mt-2">
                <Text className="text-gray-600">
                  {classData.description}
                </Text>
              </div>
            )}
          </div>
          <Space direction="vertical" align="end">
            {getApprovalStatusBadge(classData.status)}
            <Space>
              {classData.status === 'active' && (
                <Button 
                  icon={<EditOutlined />}
                  onClick={handleEditClass}
                  className="flex items-center hover:text-white hover:bg-blue-600"
                >
                  Edit
                </Button>
              )}
              {classData.status === 'active' && (
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteClass}
                  className="flex items-center hover:text-white hover:bg-red-600"
                >
                  Delete Class
                </Button>
              )}
            </Space>
          </Space>
        </div>

        {/* Status Messages */}
        {classData.status === 'inactive' && (
          <Alert
            message="This classroom is currently inactive"
            description="Students cannot access this classroom while it is inactive."
            type="info"
            showIcon
            className="mb-4"
          />
        )}
        {classData.status === 'pending_delete' && (
          <Alert
            message="Deletion Request Pending"
            description="This classroom is pending deletion approval from the administrator."
            type="warning"
            showIcon
            className="mb-4"
          />
        )}
        {classData.status === 'pending_edit' && (
          <Alert
            message="Edit Request Pending"
            description="Changes to this classroom are pending approval from the administrator."
            type="warning"
            showIcon
            className="mb-4"
          />
        )}

        {/* Class Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{classData.code}</div>
              <div className="text-gray-500">Class Code</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{studentsData.filter(student => student.status !== 'banned').length}</div>
              <div className="text-gray-500">Students</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{classData.category}</div>
              <div className="text-gray-500">Category</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{classData.level}</div>
              <div className="text-gray-500">Level</div>
            </div>
          </Card>
        </div>

        {classData.approvalStatus === 'rejected' && classData.rejectionReason && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <Text type="danger" strong>
              Rejection Reason: {classData.rejectionReason}
            </Text>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="classroom-detail-tabs"
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Classroom"
        open={deleteModalVisible}
        onOk={confirmDeleteClass}
        onCancel={handleCancelDelete}
        confirmLoading={deleting}
        okText="Request Deletion"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <div className="py-4">
          <ExclamationCircleOutlined className="text-orange-500 mr-2" />
          <Text>
            Are you sure you want to delete "{classData.name}"? 
            This action will require admin approval.
          </Text>
        </div>
      </Modal>

      {/* Ban Student Modal */}
      <BanModal />
    </div>
  );
};

export default ClassroomDetail; 