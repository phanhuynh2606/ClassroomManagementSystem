import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Input, Button, Table, List, Tag, Typography, Checkbox, Select, InputNumber, Alert, Upload, Progress, Radio, message } from 'antd';
import { EditOutlined, FileTextOutlined, RobotOutlined, SearchOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { questionAPI } from '../../../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const questionBankColumns = [
  {
    title: 'Câu hỏi',
    dataIndex: 'content',
    key: 'content',
    ellipsis: true,
  },
  {
    title: 'Độ khó',
    dataIndex: 'difficulty',
    key: 'difficulty',
    render: (difficulty) => {
      const colors = { easy: 'green', medium: 'orange', hard: 'red' };
      const labels = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };
      return <span style={{ color: colors[difficulty] }}>{labels[difficulty]}</span>;
    }
  },
  {
    title: 'Danh mục',
    dataIndex: 'category',
    key: 'category',
    render: (category) => <Tag color="blue">{category}</Tag>,
  },
  {
    title: 'Môn học',
    dataIndex: 'subjectCode',
    key: 'subjectCode',
    render: (subjectCode) => <Tag color="purple">{subjectCode}</Tag>,
  },
  {
    title: 'Điểm',
    dataIndex: 'points',
    key: 'points',
    width: 80,
  }
];

const QuizStepQuestions = ({
  questionDataRendered,
setQuestionDataRendered,
  questionSource,
  setQuestionSource,
}) => {

  const { TextArea } = Input;
  const [questionBank, setQuestionBank] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const categoryOptions = [
    { value: 'PT1', label: 'PT1' },
    { value: 'PT2', label: 'PT2' },
    { value: 'QUIZ1', label: 'QUIZ1' },
    { value: 'QUIZ2', label: 'QUIZ2' },
    { value: 'FE', label: 'FE' },
    { value: 'ASSIGNMENT', label: 'ASSIGNMENT' },
  ];

  const [manualQuestion, setManualQuestion] = useState({
    content: '',
    options: [
      { content: '', isCorrect: false },
      { content: '', isCorrect: false },
      { content: '', isCorrect: false },
      { content: '', isCorrect: false },
    ],
    subjectCode: '',
    category: 'PT1',
    explanation: '',
    status: 'published',
    difficulty: 'medium',
  });

  const handleChangeOption = (index, key, value) => {
    const newOptions = [...manualQuestion.options];
    newOptions[index][key] = value;
    setManualQuestion({ ...manualQuestion, options: newOptions });
  };

  const handleSubmit = async () => {
    if (!manualQuestion.content.trim()) {
      message.error('Nội dung câu hỏi không được để trống');
      return;
    }
    if (manualQuestion.options.every(opt => !opt.content)) {
      message.error('Ít nhất một đáp án phải có nội dung');
      return;
    }

    if (manualQuestion.options.filter(opt => opt.isCorrect).length === 0) {
      message.error('Ít nhất một đáp án phải được đánh dấu là đúng');
      return;
    }
    if (!manualQuestion.category) {
      message.error('Vui lòng chọn danh mục cho câu hỏi');
      return;
    }
    if (!manualQuestion.subjectCode.trim()) {
      message.error('Mã môn học không được để trống');
      return;
    }
    if (!manualQuestion.difficulty) {
      message.error('Vui lòng chọn độ khó cho câu hỏi');
      return;
    }
    try {
      const response = await questionAPI.createManual(manualQuestion);
      if (response.success) {
        const newQuestion = {
          key: response.data._id,
          ...manualQuestion,
        };
        setQuestionDataRendered(prev => [...prev, newQuestion]);
        // setQuizQuestions(prev => [...prev, { _id: response.data._id }]);
        setManualQuestion({
          content: '',
          options: [
            { content: '', isCorrect: false },
            { content: '', isCorrect: false },
            { content: '', isCorrect: false },
            { content: '', isCorrect: false },
          ],
          subjectCode: '',
          category: 'PT1',
          explanation: '',
          status: 'published',
          difficulty: 'medium',
        });
        message.success('Question created successfully');
        fetchQuestions(pagination.current, pagination.pageSize, searchText);
      }
    } catch (error) {
      message.error('Failed to create question');
      console.error('Error creating question:', error);
    }
  };

  const handleTableChange = (page, pageSize) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize,
    }));
    fetchQuestions(page, pageSize);
  };


  useEffect(() => {
    fetchQuestions(1, pagination.pageSize, searchText);
  }, [searchText]);

  const fetchQuestions = async (page = 1, limit = 5, search = searchText) => {
    try {
      const response = await questionAPI.getAll(
        page,
        limit,
        search,
      );

      if (response.success) {
        const questions = response.data;
        const paging = response.pagination;
        const formattedQuestions = questions.map((question) => ({
          key: question._id,
          ...question,
        }));

        setQuestionBank(formattedQuestions);
        setPagination({
          current: paging.page,
          pageSize: paging.limit,
          total: paging.total,
        });
      }

    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  // Filter question bank based on search text
  const filteredQuestionBank = questionBank.filter(question =>
    question.content.toLowerCase().includes(searchText.toLowerCase()) ||
    question.category?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Handle add selected questions locally
const handleAddSelectedQuestionsLocal = () => {

  const existingIds = new Set(questionDataRendered.map(q => q._id));
  const questionsToAdd = questionBank.filter(
    q => selectedQuestions.includes(q._id) && !existingIds.has(q._id)
  );

  const formattedQuestions = questionsToAdd.map(q => ({
    ...q,
    source: 'bank',
    id: q._id || Date.now() + Math.random()
  }));

  // const formattedQuestionsId = formattedQuestions.map(q => ({
  //   _id: q._id,
  // }));

  setQuestionDataRendered(prev => [...prev, ...formattedQuestions]);
  // setQuizQuestions(prev => [...prev, ...formattedQuestionsId]);
  setSelectedQuestions([]);
};

  

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Title level={4}>❓ Quản lý câu hỏi</Title>
        <div className="text-right">
          <Text strong>Tổng câu hỏi: {questionDataRendered.length}</Text><br />
          <Text type="secondary">
            Tổng điểm: {questionDataRendered.reduce((sum, q) => sum + (q.points || 1), 0)}
          </Text>
        </div>
      </div>
      {/* Question Source Selection */}
      <Card title="Chọn nguồn câu hỏi" size="small" className="mb-4">
        <div className="grid grid-cols-3 gap-4">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${questionSource === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
            onClick={() => setQuestionSource('manual')}
          >
            <div className="text-center">
              <EditOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div className="mt-2 font-medium">Tạo thủ công</div>
              <Text type="secondary" className="text-sm">Tự soạn câu hỏi mới</Text>
            </div>
          </div>
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${questionSource === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
            onClick={() => setQuestionSource('bank')}
          >
            <div className="text-center">
              <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div className="mt-2 font-medium">Ngân hàng câu hỏi</div>
              <Text type="secondary" className="text-sm">Chọn từ câu hỏi có sẵn</Text>
            </div>
          </div>
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${questionSource === 'ai' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
            onClick={() => setQuestionSource('ai')}
          >
            <div className="text-center">
              <RobotOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              <div className="mt-2 font-medium">AI tạo câu hỏi</div>
              <Text type="secondary" className="text-sm">Tự động từ tài liệu</Text>
            </div>
          </div>
        </div>
      </Card>
      {/* Manual Question Creation */}
      {questionSource === 'manual' && (
        <Card title="➕ Tạo câu hỏi thủ công" size="small" className="mb-4">
          <Row gutter={16}>
            <Col span={16}>
              <TextArea
                value={manualQuestion.content}
                onChange={(e) => setManualQuestion({ ...manualQuestion, content: e.target.value })}
                placeholder="Nhập nội dung câu hỏi..."
                rows={3}
                className="mb-3"
              />

              <div className="space-y-2 mb-3">
                <Radio.Group
                  value={manualQuestion.options.findIndex(o => o.isCorrect)}
                  onChange={(e) => {
                    const newOptions = manualQuestion.options.map((opt, idx) => ({
                      ...opt,
                      isCorrect: idx === e.target.value,
                    }));
                    setManualQuestion({ ...manualQuestion, options: newOptions });
                  }}
                >
                  {manualQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <Radio value={index} />
                      <Input
                        value={option.content}
                        onChange={(e) => handleChangeOption(index, 'content', e.target.value)}
                        placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                      />
                    </div>
                  ))}
                </Radio.Group>
              </div>

              <Select
                value={manualQuestion.category}
                onChange={(value) => setManualQuestion({ ...manualQuestion, category: value })}
                style={{ width: '100%', marginBottom: 8 }}
              >
                {categoryOptions.map(cat => (
                  <Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Option>
                ))}
              </Select>

              <Input
                value={manualQuestion.subjectCode}
                onChange={(e) => setManualQuestion({ ...manualQuestion, subjectCode: e.target.value })}
                placeholder="Mã môn học"
                className="mb-3"
              />
            </Col>

            <Col span={8}>
              <Select
                value={manualQuestion.difficulty}
                onChange={(value) => setManualQuestion({ ...manualQuestion, difficulty: value })}
                style={{ width: '100%', marginBottom: 8 }}
              >
                <Option value="easy">Dễ</Option>
                <Option value="medium">Trung bình</Option>
                <Option value="hard">Khó</Option>
              </Select>

              <Button
                type="primary"
                onClick={handleSubmit}
                style={{ width: '100%' }}
              >
                Thêm câu hỏi
              </Button>
            </Col>
          </Row>
        </Card>
      )}
      {/* Question Bank Selection */}
      {questionSource === 'bank' && (
        <Card title="📚 Ngân hàng câu hỏi" size="small" className="mb-4">
          <div className="mb-4">
            <Input
              placeholder="Tìm kiếm câu hỏi..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
            />
            <Button
              type="primary"
              onClick={handleAddSelectedQuestionsLocal}
              disabled={selectedQuestions.length === 0}
              className="ml-4"
            >
              Thêm {selectedQuestions.length} câu hỏi đã chọn ở trang này
            </Button>
          </div>
          <Table
            rowSelection={{
              selectedRowKeys: selectedQuestions,
              onChange: (keys) => setSelectedQuestions(keys),
            }}
            columns={questionBankColumns}
            dataSource={filteredQuestionBank}
            rowKey="_id"
            size="small"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: handleTableChange,
            }}
          />



        </Card>
      )}
      {/* AI Question Generation */}
      {questionSource === 'ai' && (
        <Card title="🤖 AI tạo câu hỏi" size="small" className="mb-4">
          <Alert
            message="Tính năng AI"
            description="Upload tài liệu hoặc nhập chủ đề để AI tự động tạo câu hỏi trắc nghiệm"
            type="info"
            showIcon
            className="mb-4"
          />
          <Row gutter={16}>
            <Col span={12}>
              <Upload.Dragger
                multiple={false}
                beforeUpload={() => false}
                showUploadList={false}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">Upload tài liệu</p>
                <p className="ant-upload-hint">
                  Hỗ trợ PDF, DOCX, TXT
                </p>
              </Upload.Dragger>
            </Col>
            <Col span={12}>
              <Input.TextArea
                placeholder="Hoặc nhập chủ đề, nội dung cần tạo câu hỏi..."
                rows={6}
                className="mb-3"
              />
              {/* <Button
                type="primary"
                onClick={handleGenerateAIQuestions}
                loading={aiGenerating}
                style={{ width: '100%' }}
                icon={<RobotOutlined />}
              >
                {aiGenerating ? 'Đang tạo câu hỏi...' : 'Tạo câu hỏi với AI'}
              </Button>
              {aiGenerating && (
                <Progress
                  percent={aiProgress}
                  status="active"
                  className="mt-2"
                />
              )} */}
            </Col>
          </Row>
        </Card>
      )}
      {/* Current Questions List */}
      {questionDataRendered.length > 0 && (
        <Card title="📋 Câu hỏi đã thêm" size="small">
          <List
            dataSource={questionDataRendered}
            renderItem={(question, index) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={() => {
                      setQuestionDataRendered(prev => prev.filter((_, i) => i !== index))
                      // setQuizQuestions(prev => prev.filter((_, i) => i !== index));
                    }}
                  >
                    Xóa
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-2">
                      <Text strong>Câu {index + 1}: {question.content}</Text>
                      <Tag color={question.source === 'ai' ? 'orange' : question.source === 'bank' ? 'green' : 'blue'}>
                        {question.source === 'ai' ? 'AI' : question.source === 'bank' ? 'Ngân hàng' : 'Thủ công'}
                      </Tag>
                      <Tag>{question.points || 1} điểm</Tag>
                    </div>
                  }
                  description={
                    <div>
                      {question.options?.map((opt, i) => (
                        <div key={i} className={opt.isCorrect ? 'text-green-600 font-medium' : ''}>
                          {String.fromCharCode(65 + i)}. {opt.content}
                          {opt.isCorrect && ' ✓'}
                        </div>
                      ))}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}

export default QuizStepQuestions;