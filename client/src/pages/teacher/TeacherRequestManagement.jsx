import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  Select,
  Descriptions,
  Typography,
  Tabs,
  Badge,
  Row,
  Col,
  Statistic,
  Empty,
  Divider,
  List,
  Avatar,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import requestAPI from '../../services/api/request.api';
import classroomAPI from '../../services/api/classroom.api';
import { useSelector } from 'react-redux';
import RequestTypeDisplay from '../../components/RequestTypeDisplay';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TeacherRequestManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [requests, setRequests] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editRequestModalVisible, setEditRequestModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [typeFilter, setTypeFilter] = useState(null);

  const [editForm] = Form.useForm();

  // Fetch teacher's requests
  const fetchRequests = async (params = {}) => {
    setLoading(true);
    try {
      const apiParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...params
      };

      if (activeTab !== 'all') {
        apiParams.status = activeTab;
      }
      if (typeFilter) {
        apiParams.type = typeFilter;
      }

      const response = await requestAPI.getTeacherRequests(user._id, apiParams);
      setRequests(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0
      }));

      // Calculate stats
      if (activeTab === 'all') {
        const allResponse = await requestAPI.getTeacherRequests(user._id, { limit: 1000 });
        const allRequests = allResponse.data || [];
        setStats({
          total: allRequests.length,
          pending: allRequests.filter(r => r.status === 'pending').length,
          approved: allRequests.filter(r => r.status === 'approved').length,
          rejected: allRequests.filter(r => r.status === 'rejected').length
        });
      }
    } catch (error) {
      message.error('Failed to fetch requests');
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch teacher's classrooms
  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getTeacherClassrooms();
      setClassrooms(response.data || []);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchClassrooms();
  }, [activeTab, pagination.current, pagination.pageSize, typeFilter]);

  // Handle view details
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setDetailModalVisible(true);
  };

  // Handle create edit request
  const handleCreateEditRequest = (classroom) => {
    setSelectedClassroom(classroom);
    setEditRequestModalVisible(true);
    editForm.setFieldsValue({
      name: classroom.name,
      description: classroom.description,
      subject: classroom.subject,
      grade: classroom.grade,
      maxStudents: classroom.maxStudents
    });
  };

  const handleEditRequestSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      
      const requestData = {
        type: 'classroom_edit',
        classroom: selectedClassroom._id,
        requestData: {
          changes: values,
          currentData: {
            name: selectedClassroom.name,
            description: selectedClassroom.description,
            subject: selectedClassroom.subject,
            grade: selectedClassroom.grade,
            maxStudents: selectedClassroom.maxStudents
          }
        }
      };

      await requestAPI.createRequest(requestData);
      message.success('Edit request submitted successfully');
      setEditRequestModalVisible(false);
      editForm.resetFields();
      fetchRequests();
    } catch (error) {
      message.error('Failed to submit edit request');
      console.error('Error submitting edit request:', error);
    }
  };

  // Handle cancel request
  const handleCancelRequest = async (requestId) => {
    try {
      await requestAPI.cancelRequest(requestId);
      message.success('Request cancelled successfully');
      fetchRequests();
    } catch (error) {
      message.error('Failed to cancel request');
      console.error('Error cancelling request:', error);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ClockCircleOutlined />;
      case 'approved': return <CheckCircleOutlined />;
      case 'rejected': return <CloseCircleOutlined />;
      default: return <ExclamationCircleOutlined />;
    }
  };

  // Get type label
  const getTypeLabel = (type) => {
    switch (type) {
      case 'classroom_creation': return 'Classroom Creation';
      case 'classroom_deletion': return 'Classroom Deletion';
      case 'classroom_edit': return 'Classroom Edit';
      default: return type;
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'classroom_creation' ? 'blue' : 
                    type === 'classroom_deletion' ? 'red' : 
                    type === 'classroom_edit' ? 'yellow' : 'default'}>
          {getTypeLabel(type)}
        </Tag>
      ),
    },
    {
      title: 'Classroom',
      dataIndex: 'classroom',
      key: 'classroom',
      render: (classroom) => classroom ? (
        <div>
          <Text strong>{classroom.name}</Text>
          <br />
          <Text type="secondary">{classroom.code}</Text>
        </div>
      ) : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Requested Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Reviewed Date',
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <Popconfirm
              title="Cancel Request"
              description="Are you sure you want to cancel this request?"
              onConfirm={() => handleCancelRequest(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                Cancel
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Tab items
  const tabItems = [
    {
      key: 'all',
      label: (
        <Badge count={stats.total} offset={[10, 0]}>
          All Requests
        </Badge>
      ),
    },
    {
      key: 'pending',
      label: (
        <Badge count={stats.pending} offset={[10, 0]}>
          <Space>
            <ClockCircleOutlined />
            Pending
          </Space>
        </Badge>
      ),
    },
    {
      key: 'approved',
      label: (
        <Badge count={stats.approved} offset={[10, 0]}>
          <Space>
            <CheckCircleOutlined />
            Approved
          </Space>
        </Badge>
      ),
    },
    {
      key: 'rejected',
      label: (
        <Badge count={stats.rejected} offset={[10, 0]}>
          <Space>
            <CloseCircleOutlined />
            Rejected
          </Space>
        </Badge>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>My Requests</Title>
        <Text type="secondary">
          Manage your classroom requests and track their status
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Requests" 
              value={stats.total}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Pending" 
              value={stats.pending} 
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Approved" 
              value={stats.approved} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Rejected" 
              value={stats.rejected} 
              valueStyle={{ color: '#f5222d' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>Quick Actions</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
          Create edit requests for your classrooms
        </Text>
        
        {classrooms.length > 0 ? (
          <Row gutter={[16, 16]}>
            {classrooms.map(classroom => (
              <Col xs={24} sm={12} md={8} lg={6} key={classroom._id}>
                <Card
                  size="small"
                  actions={[
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleCreateEditRequest(classroom)}
                    >
                      Request Edit
                    </Button>
                  ]}
                >
                  <Card.Meta
                    avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>
                      {classroom.name.charAt(0)}
                    </Avatar>}
                    title={classroom.name}
                    description={
                      <div>
                        <Text type="secondary">{classroom.code}</Text>
                        <br />
                        <Text type="secondary">{classroom.subject}</Text>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="No classrooms available to edit" />
        )}
      </Card>

      {/* Requests Table */}
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
            <Col>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
              />
            </Col>
            <Col>
              <Space>
                <Select
                  style={{ width: '200px' }}
                  placeholder="Lọc theo loại yêu cầu"
                  allowClear
                  value={typeFilter}
                  onChange={setTypeFilter}
                >
                  <Option value="classroom_creation">Tạo lớp học</Option>
                  <Option value="classroom_deletion">Xóa lớp học</Option>
                  <Option value="classroom_edit">Chỉnh sửa lớp học</Option>
                </Select>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchRequests()}
                  loading={loading}
                >
                  Làm mới
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={requests}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} yêu cầu`,
            pageSizeOptions: ['5', '10', '20', '50'],
            showTitle: false,
            size: 'default',
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize
              }));
            },
            onShowSizeChange: (current, size) => {
              setPagination(prev => ({
                ...prev,
                current: 1,
                pageSize: size
              }));
            }
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Request Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedRequest?.status === 'pending' && (
            <Popconfirm
              key="cancel"
              title="Cancel Request"
              description="Are you sure you want to cancel this request?"
              onConfirm={() => {
                handleCancelRequest(selectedRequest._id);
                setDetailModalVisible(false);
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />}>
                Cancel Request
              </Button>
            </Popconfirm>
          )
        ]}
        width={700}
      >
        {selectedRequest && (
          <RequestTypeDisplay request={selectedRequest} />
        )}
      </Modal>

      {/* Edit Request Modal */}
      <Modal
        title="Create Edit Request"
        open={editRequestModalVisible}
        onOk={handleEditRequestSubmit}
        onCancel={() => {
          setEditRequestModalVisible(false);
          editForm.resetFields();
        }}
        okText="Submit Request"
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text strong>Classroom: </Text>
          <Text>{selectedClassroom?.name} ({selectedClassroom?.code})</Text>
        </div>
        <Divider />
        
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label="Classroom Name"
            rules={[
              { required: true, message: 'Please enter classroom name' },
              { min: 3, message: 'Name must be at least 3 characters' }
            ]}
          >
            <Input placeholder="Enter classroom name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Enter classroom description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="subject"
                label="Subject"
                rules={[{ required: true, message: 'Please enter subject' }]}
              >
                <Input placeholder="Enter subject" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="grade"
                label="Grade"
                rules={[{ required: true, message: 'Please enter grade' }]}
              >
                <Input placeholder="Enter grade" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="maxStudents"
            label="Maximum Students"
            rules={[
              { required: true, message: 'Please enter maximum students' },
              { type: 'number', min: 1, message: 'Must be at least 1' }
            ]}
          >
            <Input type="number" placeholder="Enter maximum students" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherRequestManagement; 