import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Typography,
  Space,
  Card,
  Row,
  Col,
  Divider,
  message,
  Switch,
  Button,
  Steps,
  List,
  Checkbox,
  Upload,
  Tag,
  Tooltip,
  Alert,
  Table,
  Progress
} from 'antd';
import {
  QuestionCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  RobotOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  BulbOutlined,
  FileTextOutlined,
  UploadOutlined,
  CheckOutlined,
  FilterOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const QuizCreateModal = ({ 
  visible, 
  onCancel, 
  onOk, 
  loading = false,
  initialValues = null,
  mode = 'create' // 'create' | 'edit'
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [questionSource, setQuestionSource] = useState('manual');
  const [manualQuestion, setManualQuestion] = useState({
    content: '',
    options: [
      { content: '', isCorrect: false },
      { content: '', isCorrect: false },
      { content: '', isCorrect: false },
      { content: '', isCorrect: false }
    ],
    explanation: '',
    difficulty: 'medium',
    points: 1
  });
  const [searchText, setSearchText] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);

  // Mock question bank
  const questionBank = [
    {
      id: '1',
      content: 'React là gì?',
      difficulty: 'easy',
      category: 'React',
      options: [
        { content: 'Một thư viện JavaScript', isCorrect: true },
        { content: 'Một framework PHP', isCorrect: false },
        { content: 'Một database', isCorrect: false },
        { content: 'Một ngôn ngữ lập trình', isCorrect: false }
      ],
      points: 1,
      usageCount: 5
    },
    {
      id: '2',
      content: 'Hook useState được sử dụng để làm gì?',
      difficulty: 'medium',
      category: 'React',
      options: [
        { content: 'Quản lý state', isCorrect: true },
        { content: 'Gọi API', isCorrect: false },
        { content: 'Tạo component', isCorrect: false },
        { content: 'Định nghĩa CSS', isCorrect: false }
      ],
      points: 2,
      usageCount: 8
    },
    {
      id: '3',
      content: 'CSS Grid và Flexbox khác nhau như thế nào?',
      difficulty: 'hard',
      category: 'CSS',
      options: [
        { content: 'Grid dành cho layout 2D, Flexbox dành cho layout 1D', isCorrect: true },
        { content: 'Grid và Flexbox hoàn toàn giống nhau', isCorrect: false },
        { content: 'Grid chỉ dành cho mobile', isCorrect: false },
        { content: 'Flexbox mới hơn Grid', isCorrect: false }
      ],
      points: 3,
      usageCount: 3
    }
  ];

  const steps = [
    { title: 'Thông tin cơ bản', content: 'Thiết lập thông tin bài thi' },
    { title: 'Chọn câu hỏi', content: 'Thêm câu hỏi vào bài thi' },
    { title: 'Cấu hình', content: 'Cài đặt thời gian và quyền' }
  ];

  const handleAddManualQuestion = () => {
    if (!manualQuestion.content || !manualQuestion.options.some(opt => opt.content && opt.isCorrect)) {
      message.error('Vui lòng nhập đầy đủ nội dung câu hỏi và đáp án đúng');
      return;
    }

    const newQuestion = {
      id: Date.now().toString(),
      ...manualQuestion,
      source: 'manual'
    };

    setQuizQuestions(prev => [...prev, newQuestion]);
    setManualQuestion({
      content: '',
      options: [
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false }
      ],
      explanation: '',
      difficulty: 'medium',
      points: 1
    });

    message.success('Đã thêm câu hỏi');
  };

  const handleAddSelectedQuestions = () => {
    const questionsToAdd = questionBank.filter(q => selectedQuestions.includes(q.id));
    setQuizQuestions(prev => [...prev, ...questionsToAdd]);
    setSelectedQuestions([]);
    message.success(`Đã thêm ${questionsToAdd.length} câu hỏi`);
  };

  const handleGenerateAIQuestions = async () => {
    setAiGenerating(true);
    setAiProgress(0);

    // Simulate AI generation progress
    const interval = setInterval(() => {
      setAiProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiQuestions = [
        {
          id: 'ai1',
          content: 'AI Generated: React có đặc điểm gì nổi bật?',
          difficulty: 'medium',
          points: 2,
          options: [
            { content: 'Virtual DOM', isCorrect: true },
            { content: 'Real DOM', isCorrect: false },
            { content: 'No DOM', isCorrect: false },
            { content: 'Multi DOM', isCorrect: false }
          ],
          source: 'ai'
        },
        {
          id: 'ai2', 
          content: 'AI Generated: Hooks trong React được giới thiệu từ phiên bản nào?',
          difficulty: 'easy',
          points: 1,
          options: [
            { content: 'React 16.8', isCorrect: true },
            { content: 'React 17', isCorrect: false },
            { content: 'React 15', isCorrect: false },
            { content: 'React 18', isCorrect: false }
          ],
          source: 'ai'
        }
      ];

      setQuizQuestions(prev => [...prev, ...aiQuestions]);
      setAiProgress(100);
      message.success('AI đã tạo thành công câu hỏi');
      
    } catch (error) {
      message.error('Có lỗi xảy ra khi tạo câu hỏi');
    } finally {
      setTimeout(() => {
        setAiGenerating(false);
        setAiProgress(0);
      }, 500);
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleFinish = () => {
    form.validateFields().then(values => {
      const quizData = {
        ...values,
        questions: quizQuestions,
        totalPoints: quizQuestions.reduce((sum, q) => sum + (q.points || 1), 0),
        questionsCount: quizQuestions.length,
        dueDate: values.dueDate?.toISOString(),
        startTime: values.startTime?.toISOString(),
        endTime: values.endTime?.toISOString()
      };

      console.log('Finished:', quizData);
      
      onOk(quizData);
    }).catch(error => {
      console.error('Validation failed:', error);
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setCurrentStep(0);
    setQuizQuestions([]);
    setQuestionSource('manual');
    setSelectedQuestions([]);
    onCancel();
  };

  const filteredQuestionBank = questionBank.filter(q =>
    q.content.toLowerCase().includes(searchText.toLowerCase()) ||
    q.category.toLowerCase().includes(searchText.toLowerCase())
  );

  const questionBankColumns = [
    {
      title: 'Câu hỏi',
      dataIndex: 'content',
      key: 'content',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div className="mt-1">
            <Tag color="blue">{record.category}</Tag>
            <Tag color={record.difficulty === 'easy' ? 'green' : record.difficulty === 'medium' ? 'orange' : 'red'}>
              {record.difficulty}
            </Tag>
            <Tag>{record.points} điểm</Tag>
          </div>
        </div>
      )
    },
    {
      title: 'Đã dùng',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      render: (count) => <Text type="secondary">{count} lần</Text>
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <QuestionCircleOutlined />
          {mode === 'create' ? 'Tạo bài thi trắc nghiệm' : 'Chỉnh sửa bài thi'}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={1200}
      style={{ top: 20 }}
      footer={null}
    >
      <Steps current={currentStep} className="mb-6">
        {steps.map(item => (
          <Step key={item.title} title={item.title} description={item.content} />
        ))}
      </Steps>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          duration: 60,
          passingScore: 70,
          maxAttempts: 1,
          showResults: true,
          allowReview: false,
          shuffleQuestions: true,
          ...initialValues
        }}
      >
        {/* Step 1: Basic Information */}
        {currentStep === 0 && (
          <div>
            <Title level={4}>📝 Thông tin bài thi</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="Tiêu đề bài thi"
                  rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                >
                  <Input placeholder="Nhập tiêu đề bài thi" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="Danh mục"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                >
                  <Select placeholder="Chọn danh mục">
                    <Option value="midterm">Kiểm tra giữa kỳ</Option>
                    <Option value="final">Kiểm tra cuối kỳ</Option>
                    <Option value="quiz">Bài kiểm tra nhỏ</Option>
                    <Option value="practice">Luyện tập</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Mô tả"
            >
              <TextArea rows={3} placeholder="Mô tả nội dung bài thi..." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="duration"
                  label="Thời gian làm bài (phút)"
                  rules={[{ required: true, message: 'Vui lòng nhập thời gian' }]}
                >
                  <InputNumber
                    min={1}
                    max={300}
                    style={{ width: '100%' }}
                    placeholder="60"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="passingScore"
                  label="Điểm qua môn (%)"
                  rules={[{ required: true, message: 'Vui lòng nhập điểm qua môn' }]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: '100%' }}
                    placeholder="70"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="maxAttempts"
                  label="Số lần làm tối đa"
                  rules={[{ required: true, message: 'Vui lòng nhập số lần làm' }]}
                >
                  <InputNumber
                    min={1}
                    max={10}
                    style={{ width: '100%' }}
                    placeholder="1"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {/* Step 2: Question Management */}
        {currentStep === 1 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <Title level={4}>❓ Quản lý câu hỏi</Title>
              <div className="text-right">
                <Text strong>Tổng câu hỏi: {quizQuestions.length}</Text><br />
                <Text type="secondary">
                  Tổng điểm: {quizQuestions.reduce((sum, q) => sum + (q.points || 1), 0)}
                </Text>
              </div>
            </div>

            {/* Question Source Selection */}
            <Card title="Chọn nguồn câu hỏi" size="small" className="mb-4">
              <div className="grid grid-cols-3 gap-4">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    questionSource === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
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
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    questionSource === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
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
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    questionSource === 'ai' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
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
                    <Input.TextArea
                      value={manualQuestion.content}
                      onChange={(e) => setManualQuestion({...manualQuestion, content: e.target.value})}
                      placeholder="Nhập nội dung câu hỏi..."
                      rows={3}
                      className="mb-3"
                    />
                    
                    <div className="space-y-2 mb-3">
                      {manualQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Checkbox
                            checked={option.isCorrect}
                            onChange={(e) => {
                              const newOptions = [...manualQuestion.options];
                              // Only one correct answer allowed
                              newOptions.forEach((opt, i) => {
                                opt.isCorrect = i === index ? e.target.checked : false;
                              });
                              setManualQuestion({...manualQuestion, options: newOptions});
                            }}
                          />
                          <Input
                            value={option.content}
                            onChange={(e) => {
                              const newOptions = [...manualQuestion.options];
                              newOptions[index].content = e.target.value;
                              setManualQuestion({...manualQuestion, options: newOptions});
                            }}
                            placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                          />
                        </div>
                      ))}
                    </div>
                  </Col>
                  
                  <Col span={8}>
                    <Select
                      value={manualQuestion.difficulty}
                      onChange={(value) => setManualQuestion({...manualQuestion, difficulty: value})}
                      style={{ width: '100%', marginBottom: 8 }}
                    >
                      <Option value="easy">Dễ</Option>
                      <Option value="medium">Trung bình</Option>
                      <Option value="hard">Khó</Option>
                    </Select>
                    
                    <InputNumber
                      value={manualQuestion.points}
                      onChange={(value) => setManualQuestion({...manualQuestion, points: value})}
                      min={1}
                      max={10}
                      style={{ width: '100%', marginBottom: 8 }}
                      placeholder="Điểm"
                    />
                    
                    <Button 
                      type="primary" 
                      onClick={handleAddManualQuestion}
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
                    onClick={handleAddSelectedQuestions}
                    disabled={selectedQuestions.length === 0}
                    className="ml-4"
                  >
                    Thêm {selectedQuestions.length} câu hỏi đã chọn
                  </Button>
                </div>
                
                <Table
                  rowSelection={{
                    selectedRowKeys: selectedQuestions,
                    onChange: setSelectedQuestions,
                  }}
                  columns={questionBankColumns}
                  dataSource={filteredQuestionBank}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
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
                    
                    <Button 
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
                    )}
                  </Col>
                </Row>
              </Card>
            )}

            {/* Current Questions List */}
            {quizQuestions.length > 0 && (
              <Card title="📋 Câu hỏi đã thêm" size="small">
                <List
                  dataSource={quizQuestions}
                  renderItem={(question, index) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="link" 
                          icon={<EditOutlined />} 
                          size="small"
                        >
                          Sửa
                        </Button>,
                        <Button 
                          type="link" 
                          danger 
                          icon={<DeleteOutlined />} 
                          size="small"
                          onClick={() => {
                            setQuizQuestions(prev => prev.filter((_, i) => i !== index));
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
        )}

        {/* Step 3: Configuration */}
        {currentStep === 2 && (
          <div>
            <Title level={4}>⚙️ Cấu hình bài thi</Title>
            
            <Row gutter={16}>
              <Col span={12}>
                <Card title="⏰ Thời gian" size="small" className="mb-4">
                  <Form.Item
                    name="startTime"
                    label="Thời gian bắt đầu"
                  >
                    <DatePicker
                      showTime
                      format="DD/MM/YYYY HH:mm"
                      style={{ width: '100%' }}
                      placeholder="Chọn thời gian bắt đầu"
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="endTime"
                    label="Thời gian kết thúc"
                  >
                    <DatePicker
                      showTime
                      format="DD/MM/YYYY HH:mm"
                      style={{ width: '100%' }}
                      placeholder="Chọn thời gian kết thúc"
                    />
                  </Form.Item>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="🔒 Quyền truy cập" size="small" className="mb-4">
                  <Form.Item name="showResults" valuePropName="checked">
                    <Checkbox>Hiện kết quả sau khi làm xong</Checkbox>
                  </Form.Item>
                  
                  <Form.Item name="allowReview" valuePropName="checked">
                    <Checkbox>Cho phép xem lại đáp án</Checkbox>
                  </Form.Item>
                  
                  <Form.Item name="shuffleQuestions" valuePropName="checked">
                    <Checkbox>Trộn thứ tự câu hỏi</Checkbox>
                  </Form.Item>
                  
                  <Form.Item name="shuffleOptions" valuePropName="checked">
                    <Checkbox>Trộn thứ tự đáp án</Checkbox>
                  </Form.Item>
                </Card>
              </Col>
            </Row>

            <Card title="🛡️ Chống gian lận" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="lockdownBrowser" valuePropName="checked">
                    <Checkbox>Chế độ toàn màn hình (khóa trình duyệt)</Checkbox>
                  </Form.Item>
                  
                  <Form.Item name="preventCopyPaste" valuePropName="checked">
                    <Checkbox>Chặn copy/paste</Checkbox>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="detectTabSwitch" valuePropName="checked">
                    <Checkbox>Phát hiện chuyển tab</Checkbox>
                  </Form.Item>
                  
                  <Form.Item name="randomizeQuestions" valuePropName="checked">
                    <Checkbox>Random câu hỏi cho mỗi học sinh</Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Form>

      {/* Footer Actions */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t">
        <div>
          {currentStep === 1 && quizQuestions.length > 0 && (
            <Text type="secondary">
              📊 Tổng kết: {quizQuestions.length} câu hỏi, {quizQuestions.reduce((sum, q) => sum + (q.points || 1), 0)} điểm
            </Text>
          )}
        </div>
        
        <Space>
          <Button onClick={handleCancel}>
            Hủy
          </Button>
          {currentStep > 0 && (
            <Button onClick={handlePrev}>
              Quay lại
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button type="primary" onClick={handleNext}>
              Tiếp theo
            </Button>
          ) : (
            <Button type="primary" loading={loading} onClick={handleFinish}>
              {mode === 'create' ? 'Tạo bài thi' : 'Cập nhật'}
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default QuizCreateModal; 