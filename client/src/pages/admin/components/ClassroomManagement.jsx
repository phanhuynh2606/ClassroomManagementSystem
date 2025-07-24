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
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import classroomAPI from '../../../services/api/classroom.api';

const { Option } = Select;

const ClassroomManagement = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
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
      render: (text) => (
        <Tooltip title={text}>
          {text?.length > 30 ? `${text.slice(0, 30)}...` : text}
        </Tooltip>
      ),
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
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {/* <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
          >
            Edit
          </Button> */}
          <Popconfirm
            title="Are you sure you want to delete this classroom?"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(record._id);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ margin: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="Search by code, name or teacher"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        {/* <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Classroom
        </Button> */}
      </div>

      <Table
        columns={columns}
        dataSource={filteredClassrooms}
        rowKey="_id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        onRow={(record) => ({
          onClick: () => navigate(`/admin/classrooms/${record._id}`),
          style: { cursor: 'pointer' },
          onMouseEnter: (e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.backgroundColor = '';
          }
        })}
      />

      <Modal
        title={editingClassroom ? 'Edit Classroom' : 'Add Classroom'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
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
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select category!' }]}
          >
            <Select>
              <Option value="programming">Programming</Option>
              <Option value="mathematics">Mathematics</Option>
              <Option value="science">Science</Option>
              <Option value="language">Language</Option>
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
            label="Maximum Students"
            rules={[{ required: true, message: 'Please input maximum students!' }]}
          >
            <Input type="number" min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassroomManagement;
