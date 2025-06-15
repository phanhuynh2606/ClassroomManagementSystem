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
} from 'antd';
import { 
  RobotOutlined,
  ReloadOutlined,
  BulbOutlined
} from '@ant-design/icons';

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

  const sampleGeneratedQuestions = [
    {
      key: '1',
      content: 'What is the primary function of mitochondria in a cell?',
      options: [
        { content: 'Protein synthesis', isCorrect: false },
        { content: 'Energy production', isCorrect: true },
        { content: 'DNA replication', isCorrect: false },
        { content: 'Waste disposal', isCorrect: false },
      ],
      explanation: 'Mitochondria are known as the powerhouse of the cell because they produce ATP through cellular respiration.',
      difficulty: 'medium',
      category: 'PT1',
      subjectCode: 'BIO101',
      points: 2,
      status: 'draft',
      isAI: true,
    },
    {
      key: '2',
      content: 'Which of the following is NOT a renewable energy source?',
      options: [
        { content: 'Solar power', isCorrect: false },
        { content: 'Wind power', isCorrect: false },
        { content: 'Nuclear power', isCorrect: true },
        { content: 'Hydroelectric power', isCorrect: false },
      ],
      explanation: 'Nuclear power relies on uranium, which is a finite resource, making it non-renewable.',
      difficulty: 'easy',
      category: 'QUIZ1',
      subjectCode: 'ENV101',
      points: 1,
      status: 'draft',
      isAI: true,
    },
    {
      key: '3',
      content: 'What is the time complexity of binary search algorithm?',
      options: [
        { content: 'O(n)', isCorrect: false },
        { content: 'O(log n)', isCorrect: true },
        { content: 'O(n²)', isCorrect: false },
        { content: 'O(1)', isCorrect: false },
      ],
      explanation: 'Binary search divides the search space in half with each comparison, resulting in O(log n) time complexity.',
      difficulty: 'hard',
      category: 'FE',
      subjectCode: 'CS201',
      points: 3,
      status: 'draft',
      isAI: true,
    }
  ];

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
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      width: 80,
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

      // Simulate AI generation progress
      const progressInterval = setInterval(() => {
        setGeneratingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Simulate API call to AI service
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(progressInterval);
      setGeneratingProgress(100);
      
      // Mock generated questions with form values applied
      const generatedWithFormValues = sampleGeneratedQuestions.map((q, index) => ({
        ...q,
        key: `generated-${index + 1}`,
        difficulty: values.difficulty,
        category: values.category,
        subjectCode: values.subjectCode,
        points: values.points,
      }));
      
      setGeneratedQuestions(generatedWithFormValues);
      setSelectedQuestions(generatedWithFormValues.map(q => q.key)); // Select all by default
      message.success(`Generated ${values.numberOfQuestions} questions successfully!`);
      
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
  };

  const handleCancel = () => {
    form.resetFields();
    setGeneratedQuestions([]);
    setSelectedQuestions([]);
    setGeneratingProgress(0);
    setIsGenerating(false);
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

            <Form.Item
              name="context"
              label="Additional Context (Optional)"
            >
              <TextArea 
                rows={3} 
                placeholder="Provide additional context, specific topics, or requirements for the questions..."
              />
            </Form.Item>

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

              <Form.Item
                name="points"
                label="Points per Question"
                rules={[{ required: true, message: 'Please input points!' }]}
                style={{ flex: 1 }}
              >
                <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="1" />
              </Form.Item>
            </div>

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