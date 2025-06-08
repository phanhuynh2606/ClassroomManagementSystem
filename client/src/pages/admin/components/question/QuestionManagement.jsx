import React, { useState, useEffect } from 'react';
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
  Spin,
  Checkbox,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { questionAPI } from '../../../../services/api';

const { Option } = Select;
const { TextArea } = Input;

const categoryOptions = [
  { value: 'PT1', label: 'PT1' },
  { value: 'PT2', label: 'PT2' },
  { value: 'QUIZ1', label: 'QUIZ1' },
  { value: 'QUIZ2', label: 'QUIZ2' },
  { value: 'FE', label: 'FE' },
  { value: 'ASSIGNMENT', label: 'ASSIGNMENT' },
];

const QuestionManagement = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const { confirm } = Modal;


  // Fetch questions from API
  const fetchQuestions = async (page = 1, limit = 10, search = searchText) => {
    try {
      setLoading(true);
      const response = await questionAPI.getAll(page, limit, search, difficultyFilter, categoryFilter, statusFilter);

      if (response.success) {
        const formattedQuestions = response.data.map((question) => ({
          key: question._id,
          _id: question._id,
          content: question.content,
          image: question.image,
          options: question.options,
          explanation: question.explanation,
          explanationImage: question.explanationImage,
          difficulty: question.difficulty,
          points: question.points,
          isAI: question.isAI,
          category: question.category,
          deleted: question.deleted,
          subjectCode: question.subjectCode,
          status: question.status,
          statistics: question.statistics,
          createdBy: question.createdBy,
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
        }));

        setQuestions(formattedQuestions);
        setPagination({
          current: response.data.pagination.page,
          pageSize: response.data.pagination.limit,
          total: response.data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create or update question
  const saveQuestion = async (questionData) => {
    try {
      setLoading(true);
      let response;

      if (editingQuestion) {
        // Update existing question
        response = await questionAPI.update(editingQuestion._id, questionData);
      } else {
        // Create new question
        response = await questionAPI.create(questionData);
      }

      if (response.data.success) {
        message.success(editingQuestion ? 'Question updated successfully' : 'Question created successfully');
        fetchQuestions(pagination.current, pagination.pageSize, searchText);
        setIsModalVisible(false);
        form.resetFields();
      }
    } catch (error) {
      message.error('Failed to save question');
      console.error('Error saving question:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = (questionId) => {
    confirm({
      title: 'Bạn có chắc muốn xóa câu hỏi này?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await questionAPI.delete(questionId);

          if (response.success) {
            message.success('Xóa câu hỏi thành công');
            fetchQuestions(pagination.current, pagination.pageSize, searchText);
          }
        } catch (error) {
          message.error('Xóa câu hỏi thất bại');
          console.error('Lỗi khi xóa câu hỏi:', error);
        } finally {
          setLoading(false);
        }
      },
      onCancel(){
        console.log('Cancel delete');
      }
    });
  };

  useEffect(() => {
    fetchQuestions();
  }, [searchText, pagination.current, pagination.pageSize, difficultyFilter, categoryFilter, statusFilter]);

  const columns = [
    {
      title: "Actions",
      key: "action",
      dataIndex: "_id",
      fixed: "left",
      width: 80,
      render: (id, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "1",
                label: (
                  <div className="flex items-center gap-2 w-full" onClick={() => deleteQuestion(id)}>
                    <DeleteOutlined />
                    <span className="font-semibold cursor-pointer">Delete</span>
                  </div>
                ),
              },
              {
                key: "2",
                label: (
                  <div className="flex items-center gap-2 w-full" onClick={() => handleEdit(record)}>
                    <EditOutlined />
                    <span className="font-semibold cursor-pointer">Edit</span>
                  </div>
                ),
              },
            ],
          }}
          trigger={["click"]}
        >
          <MoreOutlined className="cursor-pointer text-lg" />
        </Dropdown>
      ),
    },
    {
      title: 'Question',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
      render: (text) => (
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {text.length > 100 ? `${text.substring(0, 100)}...` : text}
        </div>
      ),
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (difficulty) => {
        const colors = { easy: 'green', medium: 'orange', hard: 'red' };
        return <Tag color={colors[difficulty]}>{difficulty.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Subject',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      width: 100,
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      width: 80,
    },
    {
      title: 'Deleted',
      dataIndex: 'deleted',
      key: 'deleted',
      width: 100,
      render: (deleted) => (
        <Tag color={deleted ? 'red' : 'green'}>
          {deleted ? 'Deleted' : 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colors = { draft: 'default', published: 'green', archived: 'red' };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Statistics',
      key: 'statistics',
      width: 150,
      render: (_, record) => (
        <div>
          <div>Total: {record.statistics?.totalAttempts || 0}</div>
          <div>Correct: {record.statistics?.correctAttempts || 0}</div>
        </div>
      ),
    },
    {
      title: 'AI Generated',
      dataIndex: 'isAI',
      key: 'isAI',
      width: 100,
      render: (isAI) => (
        <Tag color={isAI ? 'blue' : 'default'}>
          {isAI ? 'AI' : 'Manual'}
        </Tag>
      ),
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 250,
      ellipsis: true,
      render: (createdBy) => (
        <div>
          {createdBy?.fullName || 'Unknown'}<hr /> ({createdBy?.email || 'N/A'})
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingQuestion(null);
    form.resetFields();
    // Set default values for new question
    form.setFieldsValue({
      options: [
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
      ],
      status: 'draft',
      isAI: false,
      points: 1,
    });
    setIsModalVisible(true);
  };

  const handleEdit = async (question) => {
  try {
    setLoading(true);
    const response = await questionAPI.getById(question._id);

    if (response.success) {
      const data = response.data;

      setEditingQuestion(data);
      form.setFieldsValue({
        content: data.content,
        options: data.options,
        explanation: data.explanation,
        difficulty: data.difficulty,
        points: data.points,
        isAI: data.isAI,
        category: data.category,
        subjectCode: data.subjectCode,
        status: data.status,
      });

      setIsModalVisible(true);
    } else {
      message.error('Không tìm thấy dữ liệu câu hỏi');
    }
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết câu hỏi:', error);
    message.error('Lỗi khi lấy chi tiết câu hỏi');
  } finally {
    setLoading(false);
  }
};

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      // Validate that at least one option is correct
      const hasCorrectOption = values.options.some(option => option.isCorrect);
      if (!hasCorrectOption) {
        message.error('At least one option must be marked as correct');
        return;
      }
      saveQuestion(values);
    });
  };

  const handleSearch = (value) => {
    setSearchText(value.target.value);
    fetchQuestions(1, pagination.pageSize, value);
  };

  const handleTableChange = (paginationConfig) => {
    fetchQuestions(paginationConfig.current, paginationConfig.pageSize, searchText);
  };

  return (
    <div className='container my-14 p-4'>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Input.Search
            placeholder="Search questions..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            onChange={handleSearch}
            enterButton
          />
          <Select
            style={{ width: 150, marginLeft: 8 }}
            onChange={(value) => {
              setDifficultyFilter(value);
            }}
            defaultValue={null}
          >
            <Option value={null}>All</Option>
            <Option value="easy">Easy</Option>
            <Option value="medium">Medium</Option>
            <Option value="hard">Hard</Option>
          </Select>
          <Select
            style={{ width: 150, marginLeft: 8 }}
            onChange={(value) => {
              setCategoryFilter(value);
            }}
            defaultValue={null}
          >
            <Option value={null}>All</Option>
            {categoryOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
          <Select
            style={{ width: 150, marginLeft: 8 }}
            onChange={(value) => {
              setStatusFilter(value);
            }}
            defaultValue={null}
          >
            <Option value={null}>All</Option>
            <Option value="draft">Draft</Option>
            <Option value="published">Published</Option>
            <Option value="archived">Archived</Option>
          </Select>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Question
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={questions}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editingQuestion ? 'Edit Question' : 'Add Question'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={900}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="content"
            label="Question Content"
            rules={[{ required: true, message: 'Please input question content!' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.List
            name="options"
            rules={[
              {
                validator: async (_, options) => {
                  if (!options || options.length < 2) {
                    return Promise.reject(new Error('At least 2 options required'));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8, width: '100%' }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'content']}
                      rules={[{ required: true, message: 'Missing option content' }]}
                      style={{ flex: 1 }}
                    >
                      <Input placeholder="Option content" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'isCorrect']}
                      valuePropName="checked"
                    >
                      <Checkbox>Correct</Checkbox>
                    </Form.Item>
                    {fields.length > 2 && (
                      <Button type="link" onClick={() => remove(name)} danger>
                        Delete
                      </Button>
                    )}
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Option
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item
            name="explanation"
            label="Explanation"
          >
            <TextArea rows={3} placeholder="Explanation for the correct answer" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="difficulty"
              label="Difficulty"
              rules={[{ required: true, message: 'Please select difficulty!' }]}
              style={{ flex: 1 }}
            >
              <Select>
                <Option value="easy">Easy</Option>
                <Option value="medium">Medium</Option>
                <Option value="hard">Hard</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="points"
              label="Points"
              rules={[{ required: true, message: 'Please input points!' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select category!' }]}
              style={{ flex: 1 }}
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
              style={{ flex: 1 }}
            >
              <Input placeholder="e.g., SCI101, GEO101" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status!' }]}
              style={{ flex: 1 }}
            >
              <Select>
                <Option value="draft">Draft</Option>
                <Option value="published">Published</Option>
                <Option value="archived">Archived</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="isAI"
              valuePropName="checked"
              style={{ flex: 1, display: 'flex', alignItems: 'center', marginTop: 30 }}
            >
              <Checkbox>AI Generated Question</Checkbox>
            </Form.Item>
          </div>

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