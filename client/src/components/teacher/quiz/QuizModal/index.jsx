import React, { useState } from 'react';
import { Modal, Steps, Space, Button, Form, message } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import BasicInfoStep from './BasicInfoStep';
import QuestionManagementStep from './QuestionManagementStep';
import ConfigurationStep from './ConfigurationStep';

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

  const steps = [
    { title: 'Thông tin cơ bản', content: 'Thiết lập thông tin bài thi' },
    { title: 'Chọn câu hỏi', content: 'Thêm câu hỏi vào bài thi' },
    { title: 'Cấu hình', content: 'Cài đặt thời gian và quyền' }
  ];

  const handleNext = () => {
    if (currentStep === 0) {
      form.validateFields(['title', 'category', 'duration', 'passingScore', 'maxAttempts'])
        .then(() => setCurrentStep(prev => prev + 1))
        .catch(() => message.error('Vui lòng điền đầy đủ thông tin bắt buộc'));
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleFinish = () => {
    if (quizQuestions.length === 0) {
      message.error('Vui lòng thêm ít nhất 1 câu hỏi');
      return;
    }

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

      onOk(quizData);
    }).catch(error => {
      console.error('Validation failed:', error);
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setCurrentStep(0);
    setQuizQuestions([]);
    onCancel();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep form={form} />;
      case 1:
        return (
          <QuestionManagementStep 
            questions={quizQuestions}
            onQuestionsChange={setQuizQuestions}
          />
        );
      case 2:
        return <ConfigurationStep form={form} />;
      default:
        return null;
    }
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
        {renderStepContent()}
      </Form>

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