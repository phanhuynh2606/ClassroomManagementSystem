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
  InputNumber,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const QuestionManagement = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Mock data - replace with actual API calls
  const [questions, setQuestions] = useState([
    {
      key: '1',
      content: 'What is React?',
      options: [
        { content: 'A JavaScript library for building user interfaces', isCorrect: true },
        { content: 'A programming language', isCorrect: false },
        { content: 'A database management system', isCorrect: false },
        { content: 'A web server', isCorrect: false },
      ],
      difficulty: 'easy',
      category: 'QUIZ1',
      subjectCode: 'WDP301',
      points: 1,
      status: 'published',
    },
    {
      key: '2',
      content: 'Explain the concept of state in React.',
      options: [
        { content: 'State is a built-in object that stores property values', isCorrect: true },
        { content: 'State is a function that returns JSX', isCorrect: false },
        { content: 'State is a CSS property', isCorrect: false },
        { content: 'State is a database query', isCorrect: false },
      ],
      difficulty: 'medium',
      category: 'PT1',
      subjectCode: 'WDP301',
      points: 2,
      status: 'draft',
    },
  ]);

  const columns = [
    {
      title: 'Question',
      dataIndex: 'content',
      key: 'content',
      width: '30%',
      render: (text) => <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>,
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => {
        const colors = {
          easy: 'green',
          medium: 'orange',
          hard: 'red',
        };
        return <Tag color={colors[difficulty]}>{difficulty.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Subject',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
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
            title="Are you sure you want to delete this question?"
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
    setEditingQuestion(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    form.setFieldsValue(question);
    setIsModalVisible(true);
  };

  const handleDelete = (key) => {
    setQuestions(questions.filter((question) => question.key !== key));
    message.success('Question deleted successfully');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingQuestion) {
        // Update existing question
        setQuestions(
          questions.map((question) =>
            question.key === editingQuestion.key
              ? { ...question, ...values }
              : question
          )
        );
        message.success('Question updated successfully');
      } else {
        // Add new question
        const newQuestion = {
          key: Date.now().toString(),
          ...values,
        };
        setQuestions([...questions, newQuestion]);
        message.success('Question added successfully');
      }
      setIsModalVisible(false);
    });
  };

  const filteredQuestions = questions.filter(
    (question) =>
      question.content.toLowerCase().includes(searchText.toLowerCase()) ||
      question.category.toLowerCase().includes(searchText.toLowerCase()) ||
      question.subjectCode.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="Search questions..."
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
          Add Question
        </Button>
      </div>

      <Table columns={columns} dataSource={filteredQuestions} />

      <Modal
        title={editingQuestion ? 'Edit Question' : 'Add Question'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="content"
            label="Question Content"
            rules={[{ required: true, message: 'Please input question content!' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.List name="options">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'content']}
                      rules={[{ required: true, message: 'Missing option content' }]}
                    >
                      <Input placeholder="Option content" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'isCorrect']}
                      valuePropName="checked"
                    >
                      <Select style={{ width: 100 }}>
                        <Option value={true}>Correct</Option>
                        <Option value={false}>Incorrect</Option>
                      </Select>
                    </Form.Item>
                    <Button type="link" onClick={() => remove(name)}>
                      Delete
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Option
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item
            name="difficulty"
            label="Difficulty"
            rules={[{ required: true, message: 'Please select difficulty!' }]}
          >
            <Select>
              <Option value="easy">Easy</Option>
              <Option value="medium">Medium</Option>
              <Option value="hard">Hard</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select category!' }]}
          >
            <Select>
              <Option value="PT1">PT1</Option>
              <Option value="PT2">PT2</Option>
              <Option value="QUIZ1">QUIZ1</Option>
              <Option value="QUIZ2">QUIZ2</Option>
              <Option value="FE">FE</Option>
              <Option value="ASSIGNMENT">ASSIGNMENT</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="subjectCode"
            label="Subject Code"
            rules={[{ required: true, message: 'Please input subject code!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="points"
            label="Points"
            rules={[{ required: true, message: 'Please input points!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
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

          <Form.Item label="Question Image">
            <Upload>
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuestionManagement; 