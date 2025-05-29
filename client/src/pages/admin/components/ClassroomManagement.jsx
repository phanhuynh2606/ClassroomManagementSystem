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
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import classroomAPI from '../../../services/api/classroom.api';

const { Option } = Select;

const ClassroomManagement = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentRole = useSelector((state) => state.users.currentRole);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await classroomAPI.getAllByAdmin();
      if (Array.isArray(res.data)) {
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

    const schedule = classroom.schedule || {};

    setTimeout(() => {
      form.setFieldsValue({
        code: classroom.code || '',
        name: classroom.name || '',
        description: classroom.description || '',
        category: classroom.category || '',
        level: classroom.level || '',
        startDate: schedule.startDate?.slice(0, 10) || '',
        endDate: schedule.endDate?.slice(0, 10) || '',
        meetingDays: schedule.meetingDays || [],
        meetingTime: schedule.meetingTime || '',
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
      const schedule = {
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        meetingDays: values.meetingDays,
        meetingTime: values.meetingTime,
      };

      delete values.startDate;
      delete values.endDate;
      delete values.meetingDays;
      delete values.meetingTime;

      values.schedule = schedule;

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
      title: 'Max Students',
      dataIndex: 'maxStudents',
      key: 'maxStudents',
      render: (num) => (
        <Space>
          <UserOutlined />
          {num || 0}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive) => {
        const color = isActive ? 'green' : 'red';
        return <Tag color={color}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this classroom?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
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
      />

      <Modal
        title={editingClassroom ? 'Edit Classroom' : 'Add Classroom'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        maskClosable={false}
        okText={editingClassroom ? 'Update' : 'Add'}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="code"
            label="Class Code"
            rules={[{ required: true, message: 'Please input class code!' }]}
          >
            <Input />
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
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: 'Please select start date!' }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="End Date"
            rules={[{ required: true, message: 'Please select end date!' }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            name="meetingDays"
            label="Meeting Days"
            rules={[{ required: true, message: 'Please select days!' }]}
          >
            <Select mode="multiple" placeholder="Select days">
              <Option value="monday">Monday</Option>
              <Option value="tuesday">Tuesday</Option>
              <Option value="wednesday">Wednesday</Option>
              <Option value="thursday">Thursday</Option>
              <Option value="friday">Friday</Option>
              <Option value="saturday">Saturday</Option>
              <Option value="sunday">Sunday</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="meetingTime"
            label="Meeting Time"
            rules={[{ required: true, message: 'Please enter meeting time!' }]}
          >
            <Input type="time" />
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
    </div>
  );
};

export default ClassroomManagement;
