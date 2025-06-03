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
  Spin
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
const { Search } = Input;

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

  useEffect(() => {
    if (classId) {
      fetchClassroomData();
      fetchStudentsData();
    }
  }, [classId]);

  const fetchClassroomData = async () => {
    setLoading(true);
    try {
      const response = await classroomAPI.getAllByTeacher();
      const classroom = response.data.find(c => c._id === classId);
      if (classroom) {
        setClassData(classroom);
      } else {
        message.error('Classroom not found');
        navigate('/teacher/classroom');
      }
    } catch (error) {
      message.error('Failed to fetch classroom data');
      navigate('/teacher/classroom');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsData = async () => {
    setStudentsLoading(true);
    try {
      const response = await classroomAPI.getStudentsByTeacher(classId);
      if (response.data.success) {
        setStudentsData(response.data.data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Don't show error message as this might be expected for new classrooms
    } finally {
      setStudentsLoading(false);
    }
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
      approved: { status: "success", text: "Approved" },
      pending: { status: "processing", text: "Pending Approval" },
      rejected: { status: "error", text: "Rejected" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
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
      width: 100,
      render: (status) => (
        <Badge 
          color={status === 'active' ? 'green' : 'red'}
          text={status?.toUpperCase() || 'UNKNOWN'}
        />
      ),
    },
  ];

  const StudentList = () => (
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
            Total: {studentsData.length} students
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
        dataSource={studentsData}
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

  const AssignmentList = () => (
    <div className="text-center py-12">
      <Text type="secondary" className="text-lg">
        Assignment management feature is under development
      </Text>
    </div>
  );

  const tabItems = [
    {
      key: 'students',
      label: `Students (${studentsData.length})`,
      children: <StudentList />
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
            {getApprovalStatusBadge(classData.approvalStatus)}
            <Space>
              <Button 
                icon={<EditOutlined />}
                onClick={handleEditClass}
                className="flex items-center hover:text-white hover:bg-blue-600"
              >
                Edit
              </Button>
              <Button 
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteClass}
                className="flex items-center hover:text-white hover:bg-red-600"
              >
                Delete Class
              </Button>
            </Space>
          </Space>
        </div>

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
              <div className="text-2xl font-bold text-green-600">{studentsData.length}</div>
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
    </div>
  );
};

export default ClassroomDetail; 