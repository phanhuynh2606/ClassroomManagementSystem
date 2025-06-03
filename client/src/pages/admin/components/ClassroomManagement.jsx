import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import classroomAPI from '../../../services/api/classroom.api';

const { Option } = Select;

const ClassroomManagement = () => {
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [rejectingClassroom, setRejectingClassroom] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentRole = useSelector((state) => state.users.currentRole);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await classroomAPI.getAllByAdmin();
      if (res.data && Array.isArray(res.data.data)) {
        setClassrooms(res.data.data);
      } else if (Array.isArray(res.data)) {
        setClassrooms(res.data);
      } else {
        message.error('Invalid response format');
      }
    } catch (err) {
      message.error('Failed to fetch classrooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleAdd = () => {
    setEditingClassroom(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (classroom) => {
    setEditingClassroom(classroom);
    form.resetFields();

    setTimeout(() => {
      form.setFieldsValue({
        code: classroom.code || '',
        name: classroom.name || '',
        description: classroom.description || '',
        category: classroom.category || '',
        level: classroom.level || '',
        maxStudents: classroom.maxStudents || '',
      });
    }, 0);

    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await classroomAPI.deleteByAdmin(id);
      message.success('Classroom deleted');
      fetchClassrooms();
    } catch (err) {
      message.error('Failed to delete classroom');
    }
  };

  const handleApprove = async (id) => {
    try {
      await classroomAPI.approveClassroom(id);
      message.success('Classroom approved successfully');
      fetchClassrooms();
    } catch (err) {
      message.error('Failed to approve classroom');
    }
  };

  const handleReject = (classroom) => {
    setRejectingClassroom(classroom);
    setIsRejectModalVisible(true);
  };

  const handleRejectSubmit = async () => {
    try {
      const values = await rejectForm.validateFields();
      await classroomAPI.rejectClassroom(rejectingClassroom._id, values.reason);
      message.success('Classroom rejected successfully');
      setIsRejectModalVisible(false);
      rejectForm.resetFields();
      fetchClassrooms();
    } catch (err) {
      message.error('Failed to reject classroom');
    }
  };

  const handleApproveDeletion = async (id) => {
    try {
      await classroomAPI.approveDeletion(id);
      message.success('Classroom deletion approved');
      fetchClassrooms();
    } catch (err) {
      message.error('Failed to approve deletion');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingClassroom) {
        await classroomAPI.updateByAdmin(editingClassroom._id, values);
        message.success('Classroom updated');
      } else {
        await classroomAPI.createByAdmin(values);
        message.success('Classroom added');
      }

      setIsModalVisible(false);
      fetchClassrooms();
    } catch (err) {
      console.error('Error in handleModalOk:', err.response || err.message || err);
      message.error(
        'Operation failed: ' +
        (err.response?.data?.message || err.message || 'Unknown error')
      );
    }
  };

  const filteredClassrooms = classrooms.filter((c) =>
    c.code?.toLowerCase().includes(searchText.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    c.teacher?.fullName?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Class Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: 'Class Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text) => text?.toUpperCase() || 'N/A',
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: (text) => text?.toUpperCase() || 'N/A',
    },
    {
      title: 'Teacher',
      dataIndex: 'teacher',
      key: 'teacher',
      render: (teacher) => teacher?.fullName || 'N/A',
    },
    {
      title: 'Students',
      dataIndex: 'students',
      key: 'students',
      render: (students) => (
        <Space>
          <UserOutlined />
          {students?.length || 0}
        </Space>
      ),
    },
    {
      title: 'Approval Status',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (status) => {
        const config = {
          pending: { color: 'orange', text: 'PENDING' },
          approved: { color: 'green', text: 'APPROVED' },
          rejected: { color: 'red', text: 'REJECTED' },
        };
        const { color, text } = config[status] || config.pending;
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Active Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => {
        const color = isActive ? 'green' : 'red';
        return <Tag color={color}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          {record.approvalStatus === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record._id)}
                style={{ backgroundColor: '#52c41a' }}
              >
                Approve
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
              >
                Reject
              </Button>
            </>
          )}
          {record.deletionRequested && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleApproveDeletion(record._id)}
              style={{ backgroundColor: '#722ed1' }}
            >
              Approve Deletion
            </Button>
          )}
          <Button 
            size="small"
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this classroom?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          marginTop: 25,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Input
          placeholder="Search classrooms..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Classroom
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredClassrooms}
        rowKey={(record) => record._id}
        loading={loading}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingClassroom ? 'Edit Classroom' : 'Add Classroom'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        maskClosable={false}
        okText={editingClassroom ? 'Update' : 'Add'}
        width={600}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="code"
            label="Class Code"
            rules={[{ required: true, message: 'Please input class code!' }]}
          >
            <Input disabled={editingClassroom} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Class Name"
            rules={[{ required: true, message: 'Please input class name!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select category!' }]}
          >
            <Select>
              <Option value="academic">Academic</Option>
              <Option value="professional">Professional</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="level"
            label="Level"
            rules={[{ required: true, message: 'Please select level!' }]}
          >
            <Select>
              <Option value="beginner">Beginner</Option>
              <Option value="intermediate">Intermediate</Option>
              <Option value="advanced">Advanced</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="maxStudents"
            label="Max Students"
            rules={[
              { required: true, message: 'Please input max number of students!' },
              {
                type: 'number',
                min: 1,
                message: 'Must be at least 1',
                transform: (value) => Number(value),
              },
            ]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title="Reject Classroom"
        open={isRejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={() => {
          setIsRejectModalVisible(false);
          rejectForm.resetFields();
        }}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Rejection Reason"
            rules={[{ required: true, message: 'Please provide a reason for rejection!' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter reason for rejection..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassroomManagement;
