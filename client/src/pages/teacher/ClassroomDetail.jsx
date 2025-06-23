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
  Select,
  Tag,
  Switch
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SearchOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  InboxOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import classroomAPI from '../../services/api/classroom.api';
import './teacher.css';
import Dragger from 'antd/es/upload/Dragger';
import TextArea from 'antd/es/input/TextArea';

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
    return <Badge status={config.status} text={config.text} />;
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
  const MaterialList = () => {
    const [materialsData, setMaterialsData] = useState([]);
    const [materialsLoading, setMaterialsLoading] = useState(false);
    const [materialSearchText, setMaterialSearchText] = useState('');
    const [materialDeleteModalVisible, setMaterialDeleteModalVisible] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [deletingMaterial, setDeletingMaterial] = useState(false);

    // Create/Edit Modal States
    const [createEditModalVisible, setCreateEditModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [materialForm] = Form.useForm();
    const [submittingMaterial, setSubmittingMaterial] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [tags, setTags] = useState([]);
    const [inputTag, setInputTag] = useState('');

    useEffect(() => {
      fetchMaterialsData();
    }, []);

    const fetchMaterialsData = async () => {
      setMaterialsLoading(true);
      try {
        // const response = await classroomAPI.getMaterials(classId);
        // Mock data for demonstration
        const mockMaterials = [
          {
            _id: '1',
            title: 'Introduction to React Hooks',
            description: 'Comprehensive guide to React Hooks',
            type: 'pdf',
            fileSize: 2500000,
            fileType: 'application/pdf',
            downloadCount: 45,
            viewCount: 128,
            isPublic: true,
            tags: ['react', 'hooks', 'javascript'],
            createdAt: new Date('2024-01-15'),
            isActive: true
          },
          {
            _id: '2',
            title: 'JavaScript ES6 Features',
            description: 'Modern JavaScript features and syntax',
            type: 'slide',
            fileSize: 1800000,
            fileType: 'application/vnd.ms-powerpoint',
            downloadCount: 32,
            viewCount: 89,
            isPublic: false,
            tags: ['javascript', 'es6', 'modern'],
            createdAt: new Date('2024-01-20'),
            isActive: true
          },
          {
            _id: '3',
            title: 'Web Development Tutorial',
            description: 'Complete web development course',
            type: 'video',
            fileSize: 125000000,
            fileType: 'video/mp4',
            downloadCount: 78,
            viewCount: 245,
            isPublic: true,
            tags: ['web', 'tutorial', 'fullstack'],
            createdAt: new Date('2024-01-25'),
            isActive: true
          }
        ];
        setMaterialsData(mockMaterials);
      } catch (error) {
        console.error('Error fetching materials:', error);
        message.error('Failed to fetch materials');
      } finally {
        setMaterialsLoading(false);
      }
    };

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getTypeIcon = (type) => {
      const icons = {
        pdf: '📄',
        slide: '📊',
        video: '🎥',
        other: '📁'
      };
      return icons[type] || '📁';
    };

    const getTypeBadgeColor = (type) => {
      const colors = {
        pdf: 'red',
        slide: 'blue',
        video: 'green',
        other: 'default'
      };
      return colors[type] || 'default';
    };

    const handleCreateMaterial = () => {
      setIsEditMode(false);
      setSelectedMaterial(null);
      setTags([]);
      setFileList([]);
      materialForm.resetFields();
      setCreateEditModalVisible(true);
    };

    const handleEditMaterial = (material) => {
      setIsEditMode(true);
      setSelectedMaterial(material);
      setTags(material.tags || []);
      setFileList([]);
      materialForm.setFieldsValue({
        title: material.title,
        description: material.description,
        type: material.type,
        isPublic: material.isPublic
      });
      setCreateEditModalVisible(true);
    };

    const handleDeleteMaterial = (material) => {
      setSelectedMaterial(material);
      setMaterialDeleteModalVisible(true);
    };

    const confirmDeleteMaterial = async () => {
      setDeletingMaterial(true);
      try {
        // await classroomAPI.deleteMaterial(selectedMaterial._id);
        message.success('Material deleted successfully');
        setMaterialDeleteModalVisible(false);
        setSelectedMaterial(null);
        fetchMaterialsData(); // Refresh data
      } catch (error) {
        message.error('Failed to delete material');
      } finally {
        setDeletingMaterial(false);
      }
    };

    const handleDownloadMaterial = async (material) => {
      try {
        // await classroomAPI.downloadMaterial(material._id);
        message.success('Download started');
        // Update download count
        setMaterialsData(prev =>
          prev.map(m =>
            m._id === material._id
              ? { ...m, downloadCount: m.downloadCount + 1 }
              : m
          )
        );
      } catch (error) {
        message.error('Download failed');
      }
    };

    const handleSubmitMaterial = async (values) => {
      if (!isEditMode && fileList.length === 0) {
        message.error('Please upload a file');
        return;
      }

      setSubmittingMaterial(true);
      try {
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('description', values.description || '');
        formData.append('type', values.type);
        formData.append('isPublic', values.isPublic);
        formData.append('tags', JSON.stringify(tags));
        formData.append('classroom', classId);

        if (fileList.length > 0) {
          formData.append('file', fileList[0].originFileObj);
        }

        if (isEditMode) {
          // await classroomAPI.updateMaterial(selectedMaterial._id, formData);
          message.success('Material updated successfully');
        } else {
          // await classroomAPI.createMaterial(formData);
          message.success('Material uploaded successfully');
        }

        setCreateEditModalVisible(false);
        fetchMaterialsData(); // Refresh data
      } catch (error) {
        message.error(isEditMode ? 'Failed to update material' : 'Failed to upload material');
      } finally {
        setSubmittingMaterial(false);
      }
    };

    const handleCancelCreateEdit = () => {
      setCreateEditModalVisible(false);
      setSelectedMaterial(null);
      setTags([]);
      setFileList([]);
      materialForm.resetFields();
    };

    const handleTagAdd = () => {
      if (inputTag && !tags.includes(inputTag)) {
        setTags([...tags, inputTag]);
        setInputTag('');
      }
    };

    const handleTagRemove = (tagToRemove) => {
      setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const uploadProps = {
      name: 'file',
      multiple: false,
      fileList: fileList,
      beforeUpload: (file) => {
        setFileList([file]);
        return false; // Prevent auto upload
      },
      onRemove: () => {
        setFileList([]);
      }
    };

    const materialColumns = [
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        filteredValue: materialSearchText ? [materialSearchText] : null,
        onFilter: (value, record) =>
          record.title?.toLowerCase().includes(value.toLowerCase()) ||
          record.description?.toLowerCase().includes(value.toLowerCase()) ||
          record.tags?.some(tag => tag.toLowerCase().includes(value.toLowerCase())),
        render: (title, record) => (
          <div className="flex items-center gap-2">
            <span className="text-lg">{getTypeIcon(record.type)}</span>
            <div>
              <div className="font-medium">{title}</div>
              {record.description && (
                <div className="text-gray-500 text-sm">{record.description}</div>
              )}
            </div>
          </div>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: 100,
        render: (type) => (
          <Badge
            color={getTypeBadgeColor(type)}
            text={type.toUpperCase()}
          />
        ),
      },
      {
        title: 'File Size',
        dataIndex: 'fileSize',
        key: 'fileSize',
        width: 100,
        render: (size) => formatFileSize(size),
      },
      {
        title: 'Downloads',
        dataIndex: 'downloadCount',
        key: 'downloadCount',
        width: 100,
        sorter: (a, b) => a.downloadCount - b.downloadCount,
        render: (count) => (
          <span className="text-blue-600 font-medium">{count}</span>
        ),
      },
      {
        title: 'Views',
        dataIndex: 'viewCount',
        key: 'viewCount',
        width: 100,
        sorter: (a, b) => a.viewCount - b.viewCount,
        render: (count) => (
          <span className="text-green-600 font-medium">{count}</span>
        ),
      },
      {
        title: 'Visibility',
        dataIndex: 'isPublic',
        key: 'isPublic',
        width: 100,
        render: (isPublic) => (
          <Badge
            color={isPublic ? 'green' : 'orange'}
            text={isPublic ? 'Public' : 'Private'}
          />
        ),
      },
      {
        title: 'Tags',
        dataIndex: 'tags',
        key: 'tags',
        width: 150,
        render: (tags) => (
          <div className="flex flex-wrap gap-1">
            {tags?.slice(0, 2).map(tag => (
              <Badge key={tag} color="blue" text={tag} />
            ))}
            {tags?.length > 2 && (
              <Tooltip title={tags.slice(2).join(', ')}>
                <Badge color="gray" text={`+${tags.length - 2}`} />
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 120,
        sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        render: (date) => new Date(date).toLocaleDateString(),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Space>
            <Tooltip title="Download">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleDownloadMaterial(record)}
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditMaterial(record)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteMaterial(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <Search
            placeholder="Search materials, descriptions, tags..."
            value={materialSearchText}
            onChange={(e) => setMaterialSearchText(e.target.value)}
            onSearch={setMaterialSearchText}
            style={{ width: 400 }}
            prefix={<SearchOutlined />}
          />
          <div className="flex items-center gap-4">
            <Text type="secondary">
              Total: {materialsData.length} materials
            </Text>
            {classData?.status === 'active' && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateMaterial}
              >
                Upload Material
              </Button>
            )}
          </div>
        </div>

        <Table
          columns={materialColumns}
          dataSource={materialsData}
          rowKey="_id"
          loading={materialsLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} materials`,
          }}
          locale={{
            emptyText: materialsLoading ? 'Loading...' : 'No materials uploaded yet'
          }}
        />

        {/* Create/Edit Material Modal */}
        <Modal
          title={isEditMode ? 'Edit Material' : 'Upload New Material'}
          open={createEditModalVisible}
          onCancel={handleCancelCreateEdit}
          footer={null}
          width={600}
        >
          <Form
            form={materialForm}
            layout="vertical"
            onFinish={handleSubmitMaterial}
            initialValues={{ isPublic: false, type: 'pdf' }}
          >
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter material title' }]}
            >
              <Input placeholder="Enter material title" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea
                rows={3}
                placeholder="Enter material description (optional)"
              />
            </Form.Item>

            <Form.Item
              name="type"
              label="Material Type"
              rules={[{ required: true, message: 'Please select material type' }]}
            >
              <Select placeholder="Select material type">
                <Option value="pdf">PDF Document</Option>
                <Option value="slide">Presentation Slides</Option>
                <Option value="video">Video</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>

            {!isEditMode && (
              <Form.Item
                label="Upload File"
                required
              >
                <Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  <p className="ant-upload-hint">
                    Support for PDF, PowerPoint, Videos and other document formats
                  </p>
                </Dragger>
              </Form.Item>
            )}

            <Form.Item label="Tags">
              <div className="mb-2">
                <Input
                  placeholder="Add tag"
                  value={inputTag}
                  onChange={(e) => setInputTag(e.target.value)}
                  onPressEnter={handleTagAdd}
                  style={{ width: 'calc(100% - 80px)', marginRight: 8 }}
                />
                <Button onClick={handleTagAdd}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => handleTagRemove(tag)}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </Form.Item>

            <Form.Item
              name="isPublic"
              label="Visibility"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Public"
                unCheckedChildren="Private"
              />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
              <Space>
                <Button onClick={handleCancelCreateEdit}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submittingMaterial}
                  icon={<UploadOutlined />}
                >
                  {isEditMode ? 'Update Material' : 'Upload Material'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="Delete Material"
          open={materialDeleteModalVisible}
          onOk={confirmDeleteMaterial}
          onCancel={() => {
            setMaterialDeleteModalVisible(false);
            setSelectedMaterial(null);
          }}
          confirmLoading={deletingMaterial}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <div className="py-4">
            <ExclamationCircleOutlined className="text-orange-500 mr-2" />
            <Text>
              Are you sure you want to delete "{selectedMaterial?.title}"?
              This action cannot be undone.
            </Text>
          </div>
        </Modal>
      </div>
    );
  };

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
    },
    {
      key: 'materials',
      label: 'Materials',
      children: <MaterialList />
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