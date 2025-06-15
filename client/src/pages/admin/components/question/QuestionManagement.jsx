import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  message,
  Tag,
  Dropdown,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { questionAPI } from '../../../../services/api';
import ModalAddQuestion from './ModalAddQuestion';
import ModalEditQuestion from './ModalEditQuestion';
import ModalSelectMethod from './ModalSelectMethod';
import ModalAddExcel from './ModalAddExcel';
import ModalAddAi from './ModalAddAi';

const { Option } = Select;

const categoryOptions = [
  { value: 'PT1', label: 'PT1' },
  { value: 'PT2', label: 'PT2' },
  { value: 'QUIZ1', label: 'QUIZ1' },
  { value: 'QUIZ2', label: 'QUIZ2' },
  { value: 'FE', label: 'FE' },
  { value: 'ASSIGNMENT', label: 'ASSIGNMENT' },
];

const QuestionManagement = () => {
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

  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isAddExcelModalVisible, setIsAddExcelModalVisible] = useState(false);
  const [isAddAIModalVisible, setIsAddAIModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isMethodSelectVisible, setIsMethodSelectVisible] = useState(false);


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

  // Create question
  const createQuestion = async (questionData) => {
    try {
      setLoading(true);
      const response = await questionAPI.create(questionData);

      if (response.success) {
        message.success('Question created successfully');
        fetchQuestions(pagination.current, pagination.pageSize, searchText);
        setIsAddModalVisible(false);
      }
    } catch (error) {
      message.error('Failed to create question');
      console.error('Error creating question:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update question
  const updateQuestion = async (questionData) => {
    try {
      setLoading(true);
      const response = await questionAPI.update(editingQuestion._id, questionData);

      if (response.success) {
        message.success('Question updated successfully');
        fetchQuestions(pagination.current, pagination.pageSize, searchText);
        setIsEditModalVisible(false);
        setEditingQuestion(null);
      }
      console.log('Updating question with data:', questionData);
    } catch (error) {
      message.error('Failed to update question');
      console.error('Error updating question:', error);
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

  const handleAddManual = () => {
    setIsAddModalVisible(true);
  };

  const handleEdit = async (question) => {
    try {
      setLoading(true);
      const response = await questionAPI.getById(question._id);

      if (response.success) {
        setEditingQuestion(response.data);
        setIsEditModalVisible(true);
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

  const handleSearch = (value) => {
    setSearchText(value.target.value);
    fetchQuestions(1, pagination.pageSize, value);
  };

  const handleTableChange = (paginationConfig) => {
    fetchQuestions(paginationConfig.current, paginationConfig.pageSize, searchText);
  };

  const handleAddModalCancel = () => {
    setIsAddModalVisible(false);
  };

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setEditingQuestion(null);
  };
  const handleOpenMethodSelect = () => {
    setIsMethodSelectVisible(true);
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
          onClick={handleOpenMethodSelect}
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

      {/* Add Question Modal */}
      <ModalAddQuestion
        visible={isAddModalVisible}
        onCancel={handleAddModalCancel}
        onSave={createQuestion}
        loading={loading}
      />

      {/* Edit Question Modal */}
      <ModalEditQuestion
        visible={isEditModalVisible}
        onCancel={handleEditModalCancel}
        onSave={updateQuestion}
        loading={loading}
        questionData={editingQuestion}
      />

      {/* Add Excel Modal */}
      <ModalAddExcel
        visible={isAddExcelModalVisible}
        onCancel={() => setIsAddExcelModalVisible(false)}
        onSave={(data) => {
          // Handle saving imported data
          console.log('Imported data:', data);
          setIsAddExcelModalVisible(false);
          message.success('Questions imported successfully!');
          fetchQuestions(pagination.current, pagination.pageSize, searchText);
        }}
      />

      {/* AI Question Generation Modal */}
      <ModalAddAi
        visible={isAddAIModalVisible}
        onCancel={() => setIsAddAIModalVisible(false)}
        onSave={(data) => {
          // Handle saving AI generated question
          console.log('AI generated question:', data);
          setIsAddAIModalVisible(false);
          message.success('AI question generated successfully!');
          fetchQuestions(pagination.current, pagination.pageSize, searchText);
        }}
      />

      {/* Method Selection Modal */}
      <ModalSelectMethod
        visible={isMethodSelectVisible}
        onCancel={() => setIsMethodSelectVisible(false)}
        onSelectMethod={(method) => {
          setIsMethodSelectVisible(false);
          if (method === 'manual') {
            handleAddManual();
          } else if (method === 'excel') {
            setIsAddExcelModalVisible(true);
          } else if (method === 'ai') {
            setIsAddAIModalVisible(true);
          }
        }}
      />
    </div>
  );
};

export default QuestionManagement;