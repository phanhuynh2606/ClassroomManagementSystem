import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Alert,
  Table,
  message,
  Progress,
  Divider,
  Typography,
  Space,
  Card,
  Tag,
  Upload,
} from 'antd';
import {
  RobotOutlined,
  ReloadOutlined,
  BulbOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { questionAPI } from '../../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const categoryOptions = [
  { value: 'PT1', label: 'PT1' },
  { value: 'PT2', label: 'PT2' },
  { value: 'QUIZ1', label: 'QUIZ1' },
  { value: 'QUIZ2', label: 'QUIZ2' },
  { value: 'FE', label: 'FE' },
  { value: 'ASSIGNMENT', label: 'ASSIGNMENT' },
];

const ModalAddAi = ({ visible, onCancel, onSave, loading }) => {
  const [form] = Form.useForm();
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);


  const columns = [
    {
      title: 'Select',
      key: 'select',
      width: 60,
      render: (_, record) => (
        <input
          type="checkbox"
          checked={selectedQuestions.includes(record.key)}
          onChange={(e) => handleQuestionSelect(record.key, e.target.checked)}
        />
      ),
    },
    {
      title: 'Question',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
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
      width: 100,
    },
    {
      title: 'Subject',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      width: 100,
    },
    {
      title: 'Options',
      key: 'options',
      width: 200,
      render: (_, record) => (
        <div>
          {record.options.map((option, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
              <span style={{ color: option.isCorrect ? 'green' : 'inherit' }}>
                {String.fromCharCode(65 + index)}. {option.content.substring(0, 20)}...
              </span>
            </div>
          ))}
        </div>
      ),
    },
  ];

const handleGenerate = async () => {
  try {
    const values = await form.validateFields();
    setIsGenerating(true);
    setGeneratingProgress(0);
    setGeneratedQuestions([]);
    setSelectedQuestions([]);

    const progressInterval = setInterval(() => {
      setGeneratingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 5;
      });
    }, 200);

    const formData = new FormData();
    formData.append('topic', values.topic);
    formData.append('numberOfQuestions', values.numberOfQuestions);
    formData.append('difficulty', values.difficulty);
    formData.append('file', uploadedFile);

    const response = await questionAPI.genderAi(formData);

    clearInterval(progressInterval); 
    setGeneratingProgress(100);

    if (!response || !response.answer || !Array.isArray(response.answer.parsed) || response.answer.parsed.length === 0) {
      message.error('No questions generated. Please try again.');
      return;
    }

    const generatedWithFormValues = response.answer.parsed.map((q, index) => {
      const correctIndex = q.answer.toLowerCase().charCodeAt(0) - 97;

      return {
        content: q.question,
        key: `generated-${index + 1}`,
        difficulty: values.difficulty,
        category: values.category,
        subjectCode: values.subjectCode,
        options: q.options.map((opt, i) => ({
          content: opt,
          isCorrect: i === correctIndex,
        })),
      };
    });

    setGeneratedQuestions(generatedWithFormValues);
    setSelectedQuestions(generatedWithFormValues.map(q => q.key));
    message.success(`Generated ${generatedWithFormValues.length} questions successfully!`);
  } catch (error) {
    message.error('Failed to generate questions');
    console.error('Error generating questions:', error);
  } finally {
    setIsGenerating(false);
  }
};


  const handleQuestionSelect = (questionKey, checked) => {
    if (checked) {
      setSelectedQuestions([...selectedQuestions, questionKey]);
    } else {
      setSelectedQuestions(selectedQuestions.filter(key => key !== questionKey));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedQuestions(generatedQuestions.map(q => q.key));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleSave = () => {
    if (selectedQuestions.length === 0) {
      message.error('Please select at least one question to save');
      return;
    }

    const questionsToSave = generatedQuestions.filter(q =>
      selectedQuestions.includes(q.key)
    );
    onSave(questionsToSave);
    form.resetFields();
    setGeneratedQuestions([]);
    setSelectedQuestions([]);
    setGeneratingProgress(0);
    setIsGenerating(false);
    setUploadedFile(null);
  };

  const handleCancel = () => {
    form.resetFields();
    setGeneratedQuestions([]);
    setSelectedQuestions([]);
    setGeneratingProgress(0);
    setIsGenerating(false);
    setUploadedFile(null);
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined style={{ color: '#722ed1' }} />
          Generate Questions with AI
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={1200}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          loading={loading}
          disabled={selectedQuestions.length === 0}
        >
          Save {selectedQuestions.length} Selected Questions
        </Button>,
      ]}
    >
      <div>
        <Alert
          message="AI Question Generation"
          description="Configure the parameters below and let AI generate questions for you. You can review and select which questions to save."
          type="info"
          showIcon
          icon={<BulbOutlined />}
          style={{ marginBottom: 16 }}
        />

        <Card title="Generation Parameters" style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical">
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="topic"
                label="Topic/Subject"
                rules={[{ required: true, message: 'Please input topic!' }]}
                style={{ flex: 2 }}
              >
                <Input placeholder="e.g., Biology, Mathematics, Computer Science" />
              </Form.Item>

              <Form.Item
                name="numberOfQuestions"
                label="Number of Questions"
                rules={[{ required: true, message: 'Please input number!' }]}
                style={{ flex: 1 }}
              >
                <InputNumber min={1} max={20} style={{ width: '100%' }} placeholder="5" />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="difficulty"
                label="Difficulty Level"
                rules={[{ required: true, message: 'Please select difficulty!' }]}
                style={{ flex: 1 }}
              >
                <Select placeholder="Select difficulty">
                  <Option value="easy">Easy</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="hard">Hard</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category!' }]}
                style={{ flex: 1 }}
              >
                <Select placeholder="Select category">
                  {categoryOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="subjectCode"
                label="Subject Code"
                rules={[{ required: true, message: 'Please input subject code!' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="e.g., BIO101, MATH201" />
              </Form.Item>
            </div>
            <Form.Item
              label="Attach Image or PDF"
              style={{ flex: 1 }}
            >
              <Upload
                beforeUpload={(file) => {
                  const isPdfOrImage = file.type === 'application/pdf' || file.type.startsWith('image/');
                  if (!isPdfOrImage) {
                    message.error('Only PDF or image files are allowed!');
                    return false;
                  }

                  setUploadedFile(file);
                  return false;
                }}
                onRemove={() => setUploadedFile(null)}
                fileList={uploadedFile ? [uploadedFile] : []}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Choose File or Image</Button>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                icon={<RobotOutlined />}
                onClick={handleGenerate}
                loading={isGenerating}
                size="large"
              >
                {isGenerating ? 'Generating Questions...' : 'Generate Questions with AI'}
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {isGenerating && (
          <div style={{ marginBottom: 16 }}>
            <Text>AI is generating questions...</Text>
            <Progress percent={generatingProgress} status="active" />
          </div>
        )}

        {generatedQuestions.length > 0 && (
          <>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4}>Generated Questions ({generatedQuestions.length})</Title>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  Regenerate
                </Button>
                <Button
                  onClick={() => handleSelectAll(selectedQuestions.length !== generatedQuestions.length)}
                >
                  {selectedQuestions.length === generatedQuestions.length ? 'Deselect All' : 'Select All'}
                </Button>
              </Space>
            </div>
            <Table
              columns={columns}
              dataSource={generatedQuestions}
              scroll={{ x: 1000 }}
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
              }}
              size="small"
            />
          </>
        )}
      </div>
    </Modal>
  );
};

export default ModalAddAi;