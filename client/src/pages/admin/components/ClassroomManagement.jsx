import React, { useState } from 'react';
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

const { Option } = Select;

const ClassroomManagement = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Mock data - replace with actual API calls
  const [classrooms, setClassrooms] = useState([
    {
      key: '1',
      code: 'WDP301',
      name: 'Web Development',
      subject: 'Web Development',
      teacher: 'Jane Smith',
      students: 25,
      status: 'active',
    },
    {
      key: '2',
      code: 'PRJ301',
      name: 'Project Management',
      subject: 'Project Management',
      teacher: 'John Doe',
      students: 30,
      status: 'active',
    },
  ]);

  const columns = [
    {
      title: 'Class Code',
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: 'Class Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Teacher',
      dataIndex: 'teacher',
      key: 'teacher',
    },
    {
      title: 'Students',
      dataIndex: 'students',
      key: 'students',
      render: (students) => (
        <Space>
          <UserOutlined />
          {students}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          active: 'green',
          inactive: 'red',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this classroom?"
            onConfirm={() => handleDelete(record.key)}
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

  const handleAdd = () => {
    setEditingClassroom(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (classroom) => {
    setEditingClassroom(classroom);
    form.setFieldsValue(classroom);
    setIsModalVisible(true);
  };

  const handleDelete = (key) => {
    setClassrooms(classrooms.filter((classroom) => classroom.key !== key));
    message.success('Classroom deleted successfully');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingClassroom) {
        // Update existing classroom
        setClassrooms(
          classrooms.map((classroom) =>
            classroom.key === editingClassroom.key
              ? { ...classroom, ...values }
              : classroom
          )
        );
        message.success('Classroom updated successfully');
      } else {
        // Add new classroom
        const newClassroom = {
          key: Date.now().toString(),
          students: 0,
          ...values,
        };
        setClassrooms([...classrooms, newClassroom]);
        message.success('Classroom added successfully');
      }
      setIsModalVisible(false);
    });
  };

  const filteredClassrooms = classrooms.filter(
    (classroom) =>
      classroom.code.toLowerCase().includes(searchText.toLowerCase()) ||
      classroom.name.toLowerCase().includes(searchText.toLowerCase()) ||
      classroom.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      classroom.teacher.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="Search classrooms..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Classroom
        </Button>
      </div>

      <Table columns={columns} dataSource={filteredClassrooms} />

      <Modal
        title={editingClassroom ? 'Edit Classroom' : 'Add Classroom'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
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
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please input subject!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="teacher"
            label="Teacher"
            rules={[{ required: true, message: 'Please select teacher!' }]}
          >
            <Select>
              <Option value="Jane Smith">Jane Smith</Option>
              <Option value="John Doe">John Doe</Option>
              {/* Add more teachers from API */}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status!' }]}
          >
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassroomManagement; 