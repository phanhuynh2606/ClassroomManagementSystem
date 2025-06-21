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
  DatePicker,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

const QuizManagement = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Mock data - replace with actual API calls
  const [quizzes, setQuizzes] = useState([
    {
      key: '1',
      title: 'Midterm Exam',
      subject: 'Web Development',
      classroom: 'WDP301',
      duration: 60,
      totalQuestions: 20,
      status: 'draft',
      startDate: '2024-03-20 09:00:00',
      endDate: '2024-03-20 10:00:00',
    },
    {
      key: '2',
      title: 'Final Project',
      subject: 'Project Management',
      classroom: 'PRJ301',
      duration: 120,
      totalQuestions: 30,
      status: 'published',
      startDate: '2024-03-25 13:00:00',
      endDate: '2024-03-25 15:00:00',
    },
  ]);

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Classroom',
      dataIndex: 'classroom',
      key: 'classroom',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => (
        <Space>
          <ClockCircleOutlined />
          {duration} minutes
        </Space>
      ),
    },
    {
      title: 'Questions',
      dataIndex: 'totalQuestions',
      key: 'totalQuestions',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          draft: 'default',
          published: 'green',
          archived: 'red',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
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
            title="Are you sure you want to delete this quiz?"
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
    setEditingQuiz(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    form.setFieldsValue({
      ...quiz,
      startDate: dayjs(quiz.startDate),
      endDate: dayjs(quiz.endDate),
    });
    setIsModalVisible(true);
  };

  const handleDelete = (key) => {
    setQuizzes(quizzes.filter((quiz) => quiz.key !== key));
    message.success('Quiz deleted successfully');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const formattedValues = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD HH:mm:ss'),
        endDate: values.endDate.format('YYYY-MM-DD HH:mm:ss'),
      };

      if (editingQuiz) {
        // Update existing quiz
        setQuizzes(
          quizzes.map((quiz) =>
            quiz.key === editingQuiz.key
              ? { ...quiz, ...formattedValues }
              : quiz
          )
        );
        message.success('Quiz updated successfully');
      } else {
        // Add new quiz
        const newQuiz = {
          key: Date.now().toString(),
          totalQuestions: 0,
          ...formattedValues,
        };
        setQuizzes([...quizzes, newQuiz]);
        message.success('Quiz added successfully');
      }
      setIsModalVisible(false);
    });
  };

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchText.toLowerCase()) ||
      quiz.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      quiz.classroom.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between',marginLeft: 25,marginRight: 20,marginTop: 20 }}>
        <Input
          placeholder="Search quizzes..."
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
          Add Quiz
        </Button>
      </div>

      <Table columns={columns} dataSource={filteredQuizzes} style={{ marginLeft: 20, marginRight: 20 }} />

      <Modal
        title={editingQuiz ? 'Edit Quiz' : 'Add Quiz'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Quiz Title"
            rules={[{ required: true, message: 'Please input quiz title!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please select subject!' }]}
          >
            <Select>
              <Option value="Web Development">Web Development</Option>
              <Option value="Project Management">Project Management</Option>
              {/* Add more subjects from API */}
            </Select>
          </Form.Item>
          <Form.Item
            name="classroom"
            label="Classroom"
            rules={[{ required: true, message: 'Please select classroom!' }]}
          >
            <Select>
              <Option value="WDP301">WDP301</Option>
              <Option value="PRJ301">PRJ301</Option>
              {/* Add more classrooms from API */}
            </Select>
          </Form.Item>
          <Form.Item
            name="duration"
            label="Duration (minutes)"
            rules={[{ required: true, message: 'Please input duration!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: 'Please select start date!' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="End Date"
            rules={[{ required: true, message: 'Please select end date!' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status!' }]}
          >
            <Select>
              <Option value="draft">Draft</Option>
              <Option value="published">Published</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuizManagement; 