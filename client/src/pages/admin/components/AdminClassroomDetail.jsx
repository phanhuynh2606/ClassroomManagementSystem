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
  Input,
  Modal,
  Form,
  Select,
  Switch,
  InputNumber
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
const { TextArea } = Input;
const { Option } = Select;

const AdminClassroomDetail = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [searchText, setSearchText] = useState('');
  
  // Edit dialog states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [editLoading, setEditLoading] = useState(false);

  // Ban/Unban dialog states
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [banForm] = Form.useForm();
  const [banLoading, setBanLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [bannedStudents, setBannedStudents] = useState([]);

  useEffect(() => {
    if (classroomId) {
      fetchClassroomDetails();
      fetchStudents();
      fetchBannedStudents();
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

  const fetchBannedStudents = async () => {
    try {
      const response = await classroomAPI.getBannedStudents(classroomId);
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
    banForm.resetFields();
  };

  const handleUnbanStudent = async (student) => {
    try {
      const studentId = student.student?._id || student._id;
      await classroomAPI.unbanStudent(classroomId, studentId);
      message.success('Student unbanned successfully');
      await fetchStudents();
      await fetchBannedStudents();
    } catch (error) {
      message.error('Failed to unban student');
      console.error('Error unbanning student:', error);
    }
  };

  const handleBanSubmit = async (values) => {
    setBanLoading(true);
    try {
      const studentId = selectedStudent.student?._id || selectedStudent._id;
      await classroomAPI.banStudent(classroomId, studentId, values.reason);
      message.success('Student banned successfully');
      setBanModalVisible(false);
      banForm.resetFields();
      await fetchStudents();
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
    banForm.resetFields();
    setSelectedStudent(null);
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
      render: (status) => {
        const color = status === 'active' ? 'green' : status === 'banned' ? 'red' : 'orange';
        return (
          <Tag color={color}>
            {status?.toUpperCase() || 'UNKNOWN'}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const status = record.status;
        const studentInfo = record.student || record;
        
        return (
          <Space size="small">
            {status === 'active' && (
              <Button
                type="primary"
                danger
                onClick={() => handleBanStudent(record)}
              >
                Ban
              </Button>
            )}
            {status === 'banned' && (
              <Button
                type="primary"
                onClick={() => handleUnbanStudent(record)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Unban
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const handleEdit = () => {
    if (classroom) {
      // Set form values with current classroom data
      const currentValues = {
        name: classroom.name || '',
        description: classroom.description || '',
        maxStudents: classroom.maxStudents || 50,
        category: classroom.category || 'academic',
        level: classroom.level || 'beginner',
        isActive: classroom.isActive || false,
        allowStudentInvite: classroom.settings?.allowStudentInvite ?? false,
        allowStudentPost: classroom.settings?.allowStudentPost ?? true,
        allowStudentComment: classroom.settings?.allowStudentComment ?? true,
      };
      
      console.log('Setting form values:', currentValues);
      editForm.setFieldsValue(currentValues);
      setEditModalVisible(true);
    } else {
      message.error('Classroom data not available');
    }
  };

  const handleEditSubmit = async (values) => {
    setEditLoading(true);
    try {
      const updateData = {
        name: values.name,
        description: values.description,
        maxStudents: values.maxStudents,
        category: values.category,
        level: values.level,
        isActive: values.isActive,
        settings: {
          allowStudentInvite: values.allowStudentInvite,
          allowStudentPost: values.allowStudentPost,
          allowStudentComment: values.allowStudentComment,
        }
      };

      await classroomAPI.updateByAdmin(classroomId, updateData);
      message.success('Classroom updated successfully');
      setEditModalVisible(false);
      editForm.resetFields();
      // Refresh classroom details
      await fetchClassroomDetails();
    } catch (error) {
      message.error('Failed to update classroom');
      console.error('Error updating classroom:', error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    editForm.resetFields();
  };

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
            {/* {classroom.approvalStatus === 'pending' && (
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
            )} */}
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
              onClick={handleEdit}
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
            {/* <div>
              <Text strong>Approval Status: </Text>
              <Tag color={
                classroom.approvalStatus === 'approved' ? 'green' :
                classroom.approvalStatus === 'pending' ? 'orange' : 'red'
              }>
                {classroom.approvalStatus?.toUpperCase()}
              </Tag>
            </div> */}
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

  const renderEditModal = () => (
    <Modal
      title={`Edit Classroom: ${classroom?.name || 'Unknown'}`}
      open={editModalVisible}
      onCancel={handleEditCancel}
      footer={null}
      width={600}
      destroyOnClose
      afterOpenChange={(open) => {
        if (open && classroom) {
          // Re-populate form when modal opens to ensure data is current
          const currentValues = {
            name: classroom.name || '',
            description: classroom.description || '',
            maxStudents: classroom.maxStudents || 50,
            category: classroom.category || 'academic',
            level: classroom.level || 'beginner',
            isActive: classroom.isActive || false,
            allowStudentInvite: classroom.settings?.allowStudentInvite ?? false,
            allowStudentPost: classroom.settings?.allowStudentPost ?? true,
            allowStudentComment: classroom.settings?.allowStudentComment ?? true,
          };
          editForm.setFieldsValue(currentValues);
        }
              }}
      >
        {/* Current Classroom Info */}
        <Card size="small" className="mb-4" style={{ backgroundColor: '#f9f9f9' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Current Class Code: </Text>
              <Text code>{classroom?.code}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Created: </Text>
              <Text>{classroom?.createdAt ? new Date(classroom.createdAt).toLocaleDateString() : 'N/A'}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Teacher: </Text>
              <Text>{classroom?.teacher?.fullName || 'N/A'}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Current Students: </Text>
              <Text>{students.length}/{classroom?.maxStudents || 0}</Text>
            </Col>
          </Row>
        </Card>

        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          preserve={false}
          initialValues={{
            name: classroom?.name || '',
            description: classroom?.description || '',
            maxStudents: classroom?.maxStudents || 50,
            category: classroom?.category || 'academic',
            level: classroom?.level || 'beginner',
            isActive: classroom?.isActive || false,
            allowStudentInvite: classroom?.settings?.allowStudentInvite ?? false,
            allowStudentPost: classroom?.settings?.allowStudentPost ?? true,
            allowStudentComment: classroom?.settings?.allowStudentComment ?? true,
          }}
        >
          <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Classroom Name"
              name="name"
              rules={[
                { required: true, message: 'Please input classroom name!' },
                { min: 3, message: 'Classroom name must be at least 3 characters!' }
              ]}
            >
              <Input placeholder="Enter classroom name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: 'Please select a category!' }]}
            >
              <Select placeholder="Select category">
                <Option value="academic">Academic</Option>
                <Option value="professional">Professional</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Level"
              name="level"
              rules={[{ required: true, message: 'Please select a level!' }]}
            >
              <Select placeholder="Select level">
                <Option value="beginner">Beginner</Option>
                <Option value="intermediate">Intermediate</Option>
                <Option value="advanced">Advanced</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Max Students"
              name="maxStudents"
              rules={[
                { required: true, message: 'Please input max students!' },
                { type: 'number', min: Math.max(1, students.length), max: 1000, message: `Max students must be between ${Math.max(1, students.length)} and 1000!` },
                {
                  validator: (_, value) => {
                    if (value && value < students.length) {
                      return Promise.reject(new Error(`Max students cannot be less than current students (${students.length})`));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
              tooltip={`Current students: ${students.length}. Max students must be at least ${students.length}.`}
            >
              <InputNumber
                min={Math.max(1, students.length)}
                max={1000}
                placeholder="Enter max students"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Active Status"
              name="isActive"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="Active" 
                unCheckedChildren="Inactive"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Description"
              name="description"
            >
              <TextArea
                rows={4}
                placeholder="Enter classroom description (optional)"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Card title="Classroom Settings" size="small" className="mb-4">
              <Row gutter={16}>
                {/* <Col span={8}>
                  <Form.Item
                    label="Allow Student Invite"
                    name="allowStudentInvite"
                    valuePropName="checked"
                  >
                    <Switch size="small" />
                  </Form.Item>
                </Col> */}
                <Col span={8}>
                  <Form.Item
                    label="Allow Student Post"
                    name="allowStudentPost"
                    valuePropName="checked"
                  >
                    <Switch size="small" />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item
                    label="Allow Student Comment"
                    name="allowStudentComment"
                    valuePropName="checked"
                  >
                    <Switch size="small" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row justify="end" gutter={8}>
          <Col>
            <Button onClick={handleEditCancel}>
              Cancel
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              htmlType="submit"
              loading={editLoading}
            >
              Update Classroom
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );

  const renderBannedStudents = () => {
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

  const renderBanModal = () => (
    <Modal
      title={`Ban Student: ${selectedStudent?.student?.fullName || selectedStudent?.fullName || 'Unknown'}`}
      open={banModalVisible}
      onCancel={handleBanCancel}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Form
        form={banForm}
        layout="vertical"
        onFinish={handleBanSubmit}
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
            <Button onClick={handleBanCancel}>
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
    },
    {
      key: 'banned',
      label: (
        <Space>
          <UserOutlined />
          Banned Students
          <Badge count={bannedStudents.length} size="small" />
        </Space>
      ),
      children: renderBannedStudents()
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
          {/* <Space>
            <Tag color={
              classroom.approvalStatus === 'approved' ? 'green' :
              classroom.approvalStatus === 'pending' ? 'orange' : 'red'
            } className="text-base px-3 py-1">
              {classroom.approvalStatus?.toUpperCase()}
            </Tag>
          </Space> */}
        </div>
      </div>

      {/* Tab Content */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />

      {renderEditModal()}
      {renderBanModal()}
    </div>
  );
};

export default AdminClassroomDetail; 