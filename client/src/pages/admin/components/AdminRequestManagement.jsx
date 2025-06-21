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
  Popconfirm,
  Row,
  Col,
  Statistic,
  DatePicker,
  Divider
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import requestAPI from '../../../services/api/request.api';
import { useSelector } from 'react-redux';
import RequestTypeDisplay from '../../../components/RequestTypeDisplay';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminRequestManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [filters, setFilters] = useState({
    type: null,
    dateRange: null,
    search: ''
  });

  const [form] = Form.useForm();
  const [approveForm] = Form.useForm();

  // Fetch requests
  const fetchRequests = async (params = {}) => {
    setLoading(true);
    try {
      let response;
      const apiParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...params
      };

      // Apply filters
      if (filters.type) apiParams.type = filters.type;
      if (filters.search) apiParams.search = filters.search;
      if (filters.dateRange && filters.dateRange.length === 2) {
        apiParams.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        apiParams.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      if (activeTab === 'pending') {
        response = await requestAPI.getPendingRequests(apiParams);
      } else {
        if (activeTab !== 'all') {
          apiParams.status = activeTab;
        }
        response = await requestAPI.getAllRequests(apiParams);
      }

      if (response?.success) {
        setRequests(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0
        }));

        // Calculate stats
        if (activeTab === 'all') {
          try {
            const allResponse = await requestAPI.getAllRequests({ limit: 1000 });
            if (allResponse?.success) {
              const allRequests = allResponse.data || [];
              setStats({
                total: allRequests.length,
                pending: allRequests.filter(r => r.status === 'pending').length,
                approved: allRequests.filter(r => r.status === 'approved').length,
                rejected: allRequests.filter(r => r.status === 'rejected').length
              });
            }
          } catch (error) {
            console.error('Error fetching stats:', error);
          }
        }
      } else {
        message.error('Failed to fetch requests: Invalid response format');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please login again.');
        // Redirect to login will be handled by axios interceptor
      } else {
        message.error('Failed to fetch requests: ' + (error.response?.data?.message || error.message));
      }
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab, pagination.current, pagination.pageSize, filters]);

  // Handle approve request
  const handleApprove = async (request) => {
    setSelectedRequest(request);
    setApproveModalVisible(true);
  };

  const handleApproveSubmit = async () => {
    try {
      setProcessLoading(true);
      const values = await approveForm.validateFields();
      
      const response = await requestAPI.approveRequest(selectedRequest._id, values);
      
      if (response?.success) {
        message.success('Request approved successfully');
        setApproveModalVisible(false);
        approveForm.resetFields();
        fetchRequests();
      } else {
        message.error('Failed to approve request: Invalid response format');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please login again.');
        // Redirect to login will be handled by axios interceptor
      } else {
        message.error('Failed to approve request: ' + (error.response?.data?.message || error.message));
      }
      console.error('Error approving request:', error);
    } finally {
      setProcessLoading(false);
    }
  };

  // Handle reject request
  const handleReject = async (request) => {
    setSelectedRequest(request);
    setRejectModalVisible(true);
  };

  const handleRejectSubmit = async () => {
    try {
      setProcessLoading(true);
      const values = await form.validateFields();
      
      const response = await requestAPI.rejectRequest(selectedRequest._id, values.reason);
      
      if (response?.success) {
        message.success('Request rejected successfully');
        setRejectModalVisible(false);
        form.resetFields();
        fetchRequests();
      } else {
        message.error('Failed to reject request: Invalid response format');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please login again.');
        // Redirect to login will be handled by axios interceptor
      } else {
        message.error('Failed to reject request: ' + (error.response?.data?.message || error.message));
      }
      console.error('Error rejecting request:', error);
    } finally {
      setProcessLoading(false);
    }
  };

  // Handle view details
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setDetailModalVisible(true);
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

  // Get type label
  const getTypeLabel = (type) => {
    switch (type) {
      case 'classroom_creation': return 'Classroom Creation';
      case 'classroom_deletion': return 'Classroom Deletion';
      case 'classroom_edit': return 'Classroom Edit';
      // case 'classroom_join': return 'Join Classroom';
      // case 'classroom_leave': return 'Leave Classroom';
      // case 'classroom_teacher_change': return 'Change Teacher';
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
        <Tag color={type === 'classroom_creation' ? 'blue' : type === 'classroom_deletion' ? 'red' : type === 'classroom_edit' ? 'yellow' : 'default'}>{getTypeLabel(type)}</Tag>
      ),
      filters: [
        { text: 'Classroom Creation', value: 'classroom_creation' },
        { text: 'Classroom Deletion', value: 'classroom_deletion' },
        { text: 'Classroom Edit', value: 'classroom_edit' },
        // { text: 'Join Classroom', value: 'classroom_join' },
        // { text: 'Leave Classroom', value: 'classroom_leave' },
        // { text: 'Change Teacher', value: 'classroom_teacher_change' },
      ],
      onFilter: (value, record) => record.type === value,
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
      title: 'Requested By',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      render: (requestedBy) => requestedBy ? (
        <div>
          <Text>{requestedBy.fullName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {requestedBy.email}
          </Text>
        </div>
      ) : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      ),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Requested At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record)}
                style={{ backgroundColor: '#52c41a' }}
              >
                Approve
              </Button>
              <Button
                type="primary"
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // Request details modal content
  const renderRequestDetails = () => {
    if (!selectedRequest) return null;

    const { classroom, requestedBy, reviewedBy, type, status, createdAt, updatedAt, data, reviewComment } = selectedRequest;

    return (
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Request Type">
          <Tag color="blue">{getTypeLabel(type)}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={getStatusColor(status)}>{status?.toUpperCase() || 'UNKNOWN'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Classroom">
          {classroom ? (
            <div>
              <Text strong>{classroom.name}</Text>
              <br />
              <Text type="secondary">Code: {classroom.code}</Text>
            </div>
          ) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Requested By">
          {requestedBy ? (
            <div>
              <Text>{requestedBy.fullName}</Text>
              <br />
              <Text type="secondary">{requestedBy.email}</Text>
            </div>
          ) : '-'}
        </Descriptions.Item>
        {reviewedBy && (
          <Descriptions.Item label="Reviewed By">
            <div>
              <Text>{reviewedBy.fullName}</Text>
              <br />
              <Text type="secondary">{reviewedBy.email}</Text>
            </div>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Requested At">
          {createdAt ? new Date(createdAt).toLocaleString() : '-'}
        </Descriptions.Item>
        {updatedAt && (
          <Descriptions.Item label="Updated At">
            {new Date(updatedAt).toLocaleString()}
          </Descriptions.Item>
        )}
        {reviewComment && (
          <Descriptions.Item label="Review Comment">
            {reviewComment}
          </Descriptions.Item>
        )}
        {data && (
          <Descriptions.Item label="Request Details">
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </Descriptions.Item>
        )}
      </Descriptions>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Request Management</Title>
        <Text type="secondary">
          Manage teacher requests for classroom operations
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Approved"
              value={stats.approved}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats.rejected}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Text strong>Filter by type:</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              placeholder="Choose request type"
              allowClear
              value={filters.type}
              onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              <Option value="classroom_creation">Classroom Creation</Option>
              <Option value="classroom_deletion">Classroom Deletion</Option>
              <Option value="classroom_edit">Classroom Edit</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Text strong>Filter by date:</Text>
            <RangePicker
              style={{ width: '100%', marginTop: '8px' }}
              placeholder={['From date', 'To date']}
              value={filters.dateRange}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Text strong>Search:</Text>
            <Input
              style={{ marginTop: '8px' }}
              placeholder="Search by classroom name, teacher..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              allowClear
            />
          </Col>
          <Col xs={24} sm={24} md={6}>
            <div style={{ marginTop: '24px' }}>
              <Button
                onClick={() => setFilters({ type: null, dateRange: null, search: '' })}
                style={{ marginRight: '8px' }}
              >
                Xóa lọc
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => fetchRequests()}
                loading={loading}
              >
                Làm mới
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'all',
                label: (
                  <Badge count={stats.total} offset={[10, -3]}>
                    All Requests
                  </Badge>
                ),
              },
              {
                key: 'pending',
                label: (
                  <Badge count={stats.pending} offset={[10, -3]}>
                    Pending
                  </Badge>
                ),
              },
              {
                key: 'approved',
                label: (
                  <Badge count={stats.approved} offset={[10, -3]}>
                    Approved
                  </Badge>
                ),
              },
              {
                key: 'rejected',
                label: (
                  <Badge count={stats.rejected} offset={[14, -3]}>
                    Rejected
                  </Badge>
                ),
              },
            ]}
          />
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
            <Space key="actions">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  setDetailModalVisible(false);
                  handleApprove(selectedRequest);
                }}
                style={{ backgroundColor: '#52c41a' }}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  setDetailModalVisible(false);
                  handleReject(selectedRequest);
                }}
              >
                Reject
              </Button>
            </Space>
          )
        ]}
        width={700}
      >
        {renderRequestDetails()}
      </Modal>

      {/* Approve Modal */}
      <Modal
        title="Approve Request"
        open={approveModalVisible}
        onOk={handleApproveSubmit}
        onCancel={() => {
          setApproveModalVisible(false);
          approveForm.resetFields();
        }}
        confirmLoading={processLoading}
        okText="Approve"
        okButtonProps={{ style: { backgroundColor: '#52c41a' } }}
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item
            name="comment"
            label="Comment (Optional)"
          >
            <TextArea rows={4} placeholder="Enter any additional comments..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Request"
        open={rejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={() => {
          setRejectModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={processLoading}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="reason"
            label="Reason for Rejection"
            rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
          >
            <TextArea rows={4} placeholder="Enter reason for rejection..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminRequestManagement; 