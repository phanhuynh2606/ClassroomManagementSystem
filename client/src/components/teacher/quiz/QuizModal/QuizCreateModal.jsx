import React, { useState, useEffect } from 'react';
import { Modal, Steps, Space, Button, Form, message } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import QuizStepBasicInfo from './BasicInfoStep';
import QuizStepQuestions from './QuizStepQuestions';
import QuizStepConfig from './QuizStepConfig';

const { Step } = Steps;

const CreateQuizModal = ({
  visible,
  onCancel,
  onOk,
  loading = false,
  initialValues = null,
  mode = 'create'
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);

  // Question management states
  const [questionSource, setQuestionSource] = useState('manual');
  const [manualQuestion, setManualQuestion] = useState({
    content: '',
    options: [
      { content: '', isCorrect: false },
      { content: '', isCorrect: false },
      { content: '', isCorrect: false },
      { content: '', isCorrect: false }
    ],
    difficulty: 'medium',
    points: 1
  });
  const [searchText, setSearchText] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);

  // Mock data for question bank
  const questionBankData = [
    {
      id: 1,
      content: "React là gì?",
      difficulty: "easy",
      points: 1,
      options: [
        { content: "Thư viện JavaScript", isCorrect: true },
        { content: "Framework CSS", isCorrect: false },
        { content: "Database", isCorrect: false },
        { content: "Server", isCorrect: false }
      ]
    },
    {
      id: 2,
      content: "useState hook dùng để làm gì?",
      difficulty: "medium",
      points: 2,
      options: [
        { content: "Quản lý state", isCorrect: true },
        { content: "Gọi API", isCorrect: false },
        { content: "Xử lý form", isCorrect: false },
        { content: "Routing", isCorrect: false }
      ]
    }
  ];

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
      title: 'Điểm',
      dataIndex: 'points',
      key: 'points',
      width: 80,
    }
  ];

  const filteredQuestionBank = questionBankData.filter(q =>
    q.content.toLowerCase().includes(searchText.toLowerCase())
  );

  const steps = [
    { title: 'Thông tin cơ bản', content: 'Thiết lập thông tin bài thi' },
    { title: 'Chọn câu hỏi', content: 'Thêm câu hỏi vào bài thi' },
    { title: 'Cấu hình', content: 'Cài đặt thời gian và quyền' }
  ];

  // Initialize form when modal opens or initialValues changes
  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue({
        ...initialValues,
        startTime: initialValues.startTime ? dayjs(initialValues.startTime) : null,
        endTime: initialValues.endTime ? dayjs(initialValues.endTime) : null,
        dueDate: initialValues.dueDate ? dayjs(initialValues.dueDate) : null,
      });
      if (initialValues.questions) {
        setQuizQuestions(initialValues.questions);
      }
    }
  }, [visible, initialValues, form]);

  // Reset manual question form
  const resetManualQuestion = () => {
    setManualQuestion({
      content: '',
      options: [
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false }
      ],
      difficulty: 'medium',
      points: 1
    });
  };

  // Handle manual question addition
  const handleAddManualQuestion = () => {
    // Validate manual question
    if (!manualQuestion.content.trim()) {
      message.error('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    // Check if all options are filled
    const emptyOptions = manualQuestion.options.filter(opt => !opt.content.trim());
    if (emptyOptions.length > 0) {
      message.error('Vui lòng điền đầy đủ các đáp án');
      return;
    }

    // Check if there's at least one correct answer
    const hasCorrectAnswer = manualQuestion.options.some(opt => opt.isCorrect);
    if (!hasCorrectAnswer) {
      message.error('Vui lòng chọn ít nhất một đáp án đúng');
      return;
    }

    // Add question to list
    const newQuestion = {
      id: Date.now(),
      content: manualQuestion.content,
      options: manualQuestion.options,
      difficulty: manualQuestion.difficulty,
      points: manualQuestion.points,
      source: 'manual'
    };

    setQuizQuestions(prev => [...prev, newQuestion]);
    resetManualQuestion();
    message.success('Đã thêm câu hỏi thành công');
  };

  // Handle adding selected questions from bank
  const handleAddSelectedQuestions = () => {
    const questionsToAdd = questionBankData
      .filter(q => selectedQuestions.includes(q.id))
      .map(q => ({
        ...q,
        source: 'bank'
      }));

    setQuizQuestions(prev => [...prev, ...questionsToAdd]);
    setSelectedQuestions([]);
    message.success(`Đã thêm ${questionsToAdd.length} câu hỏi từ ngân hàng`);
  };

  // Handle AI question generation
  const handleGenerateAIQuestions = async () => {
    setAiGenerating(true);
    setAiProgress(0);

    try {
      // Simulate AI generation process
      const interval = setInterval(() => {
        setAiProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock AI generated questions
      const aiQuestions = [
        {
          id: Date.now(),
          content: "React Component lifecycle có bao nhiều giai đoạn chính?",
          options: [
            { content: "3 giai đoạn", isCorrect: true },
            { content: "2 giai đoạn", isCorrect: false },
            { content: "4 giai đoạn", isCorrect: false },
            { content: "5 giai đoạn", isCorrect: false }
          ],
          difficulty: 'medium',
          points: 2,
          source: 'ai'
        },
        {
          id: Date.now() + 1,
          content: "JSX là viết tắt của gì?",
          options: [
            { content: "JavaScript XML", isCorrect: true },
            { content: "JavaScript Extension", isCorrect: false },
            { content: "Java Syntax Extension", isCorrect: false },
            { content: "JavaScript External", isCorrect: false }
          ],
          difficulty: 'easy',
          points: 1,
          source: 'ai'
        }
      ];

      setQuizQuestions(prev => [...prev, ...aiQuestions]);
      setAiProgress(100);
      message.success(`AI đã tạo ${aiQuestions.length} câu hỏi thành công`);
    } catch (error) {
      message.error('Lỗi khi tạo câu hỏi với AI');
    } finally {
      setAiGenerating(false);
      setTimeout(() => setAiProgress(0), 1000);
    }
  };

  // Step navigation with validation
  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        // Validate basic info step
        await form.validateFields(['title', 'category', 'duration', 'passingScore', 'maxAttempts']);

      } else if (currentStep === 1) {
        // Validate questions step
        if (quizQuestions.length === 0) {
          message.error('Vui lòng thêm ít nhất 1 câu hỏi');
          return;
        }
      }

      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } catch (error) {
      message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Final form submission
const handleFinish = async () => {
  try {
    if (quizQuestions.length === 0) {
      message.error('Vui lòng thêm ít nhất 1 câu hỏi');
      setCurrentStep(1);
      return;
    }

    const values = await form.validateFields();

    

    if (values.startTime && values.endTime) {
      if (values.startTime.isAfter(values.endTime)) {
        message.error('Thời gian bắt đầu không thể sau thời gian kết thúc');
        setCurrentStep(2);
        return;
      }
    }

    const quizData = {
      title: values.title,
      category: values.category,
      description: values.description || '',
      duration: values.duration,
      passingScore: values.passingScore,
      maxAttempts: values.maxAttempts,
      startTime: values.startTime?.toISOString() || null,
      endTime: values.endTime?.toISOString() || null,
      questions: quizQuestions,
      allowReview: values.allowReview ?? true,
      showResults: values.showResults ?? true,
      shuffleQuestions: values.shuffleQuestions ?? false,
      shuffleOptions: values.shuffleOptions ?? false,
      fullScreen: values.lockdownBrowser ?? false,
      copyAllowed: values.preventCopyPaste ?? false,
      checkTab: values.detectTabSwitch ?? false,
      randomizeQuestions: values.randomizeQuestions ?? false,
      publishDate: values.publishDate?.toISOString() || null,
    };

    form.resetFields();
    setCurrentStep(0);
    setQuizQuestions([]);
    setSelectedQuestions([]);
    resetManualQuestion();
    setQuestionSource('manual');
    setSearchText('');

    onOk(quizData);
  } catch (error) {
    console.error('Validation failed:', error);
    message.error('Vui lòng kiểm tra lại thông tin');
  }
};


  // Reset form and close modal
  const handleCancel = () => {
    form.resetFields();
    setCurrentStep(0);
    setQuizQuestions([]);
    setSelectedQuestions([]);
    resetManualQuestion();
    setQuestionSource('manual');
    setSearchText('');
    onCancel();
  };

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
      maskClosable={false}
      keyboard={false}
    >
      <Steps current={currentStep} className="mb-6">
        {steps.map((step, index) => (
          <Step key={index} title={step.title} description={step.content} />
        ))}
      </Steps>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        {/* Step 1: Basic Information */}
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
          <QuizStepBasicInfo />
        </div>

        {/* Step 2: Question Management */}
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          <QuizStepQuestions
            quizQuestions={quizQuestions}
            setQuizQuestions={setQuizQuestions}
            questionSource={questionSource}
            setQuestionSource={setQuestionSource}
            manualQuestion={manualQuestion}
            setManualQuestion={setManualQuestion}
            handleAddManualQuestion={handleAddManualQuestion}
            searchText={searchText}
            setSearchText={setSearchText}
            selectedQuestions={selectedQuestions}
            setSelectedQuestions={setSelectedQuestions}
            questionBankColumns={questionBankColumns}
            filteredQuestionBank={filteredQuestionBank}
            handleAddSelectedQuestions={handleAddSelectedQuestions}
            handleGenerateAIQuestions={handleGenerateAIQuestions}
            aiGenerating={aiGenerating}
            aiProgress={aiProgress}
          />
        </div>

        {/* Step 3: Configuration */}
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          <QuizStepConfig />
        </div>
      </Form>

      {/* Footer with navigation */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t">
        <div>
          {currentStep === 1 && quizQuestions.length > 0 && (
            <span className="text-gray-600">
              📊 Tổng kết: {quizQuestions.length} câu hỏi, {quizQuestions.reduce((sum, q) => sum + (q.points || 1), 0)} điểm
            </span>
          )}
        </div>

        <Space>
          <Button onClick={handleCancel}>Hủy</Button>
          {currentStep > 0 && (
            <Button onClick={handlePrev}>Quay lại</Button>
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

export default CreateQuizModal;