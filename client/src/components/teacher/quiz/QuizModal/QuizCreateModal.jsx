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
      questions: quizQuestions.map(q => ({_id: q._id})),
      allowReview: values.allowReview ?? true,
      showResults: values.showResults ?? true,
      shuffleQuestions: values.shuffleQuestions ?? false,
      shuffleOptions: values.shuffleOptions ?? false,
      fullScreen: values.lockdownBrowser ?? false,
      copyAllowed: values.preventCopyPaste ?? false,
      checkTab: values.detectTabSwitch ?? false,
      randomizeQuestions: values.randomizeQuestions ?? false,
    };

    form.resetFields();
    setCurrentStep(0);
    setQuizQuestions([]);
    setQuestionSource('manual');

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
    setQuestionSource('manual');
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
            questionDataRendered ={quizQuestions}
            setQuestionDataRendered={setQuizQuestions}
            questionSource={questionSource}
            setQuestionSource={setQuestionSource}
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