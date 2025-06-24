import React, { useState, memo } from 'react';
import { 
  Card, 
  Button, 
  List, 
  Typography, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  Select,
  Divider,
  Empty,
  Avatar,
  message,
  Tooltip,
  Progress,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  QuestionCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

// Import the quiz modal component
import QuizCreateModal from './QuizCreateModal';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const QuizManagement = ({ classId }) => {
  const navigate = useNavigate();
  const [quizCreateVisible, setQuizCreateVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Mock data for quiz items
  const [quizItems, setQuizItems] = useState([
    {
      id: '1',
      title: 'Chapter 1-3 Quiz',
      description: 'Multiple choice quiz covering the first three chapters',
      dueDate: '2024-01-20T15:00:00Z',
      duration: 60, // minutes
      totalPoints: 50,
      totalQuestions: 25,
      status: 'published',
      submissionsCount: 22,
      totalStudents: 25,
      createdAt: '2024-01-10T14:00:00Z',
      difficulty: 'Medium',
      allowRetake: false,
      randomizeQuestions: true,
      showResultsImmediately: false,
      avgScore: 42.5,
      passRate: 85
    },
    {
      id: '2',
      title: 'Programming Basics Quiz',
      description: 'Test your understanding of basic programming concepts',
      dueDate: '2024-02-15T16:00:00Z',
      duration: 45,
      totalPoints: 75,
      totalQuestions: 30,
      status: 'draft',
      submissionsCount: 0,
      totalStudents: 25,
      createdAt: '2024-01-25T09:00:00Z',
      difficulty: 'Easy',
      allowRetake: true,
      randomizeQuestions: false,
      showResultsImmediately: true,
      avgScore: null,
      passRate: null
    },
    {
      id: '3',
      title: 'Midterm Exam',
      description: 'Comprehensive midterm examination',
      dueDate: '2024-03-01T10:00:00Z',
      duration: 120,
      totalPoints: 100,
      totalQuestions: 40,
      status: 'scheduled',
      submissionsCount: 0,
      totalStudents: 25,
      createdAt: '2024-02-01T11:00:00Z',
      difficulty: 'Hard',
      allowRetake: false,
      randomizeQuestions: true,
      showResultsImmediately: false,
      avgScore: null,
      passRate: null
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'green';
      case 'draft':
        return 'orange';
      case 'scheduled':
        return 'blue';
      case 'completed':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'green';
      case 'Medium':
        return 'orange';
      case 'Hard':
        return 'red';
      default:
        return 'default';
    }
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    const date = moment(dateString);
    const now = moment();
    
    if (date.isBefore(now)) {
      return <Text type="danger">Due {date.format('MMM D, YYYY HH:mm')}</Text>;
    } else if (date.diff(now, 'days') <= 7) {
      return <Text type="warning">Due {date.format('MMM D, YYYY HH:mm')}</Text>;
    } else {
      return <Text>Due {date.format('MMM D, YYYY HH:mm')}</Text>;
    }
  };

  const handleQuizCreate = async (quizData) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newQuiz = {
        id: Date.now().toString(),
        title: quizData.title,
        description: quizData.description,
        dueDate: quizData.dueDate,
        duration: quizData.duration,
        totalPoints: quizData.totalPoints || 50,
        totalQuestions: quizData.questions?.length || 0,
        status: 'draft',
        submissionsCount: 0,
        totalStudents: 25,
        createdAt: new Date().toISOString(),
        difficulty: quizData.difficulty || 'Medium',
        allowRetake: quizData.allowRetake || false,
        randomizeQuestions: quizData.randomizeQuestions || false,
        showResultsImmediately: quizData.showResultsImmediately || false,
        avgScore: null,
        passRate: null
      };

      setQuizItems(prev => [newQuiz, ...prev]);
      setQuizCreateVisible(false);
      message.success('Quiz created successfully!');
    } catch (error) {
      message.error('Failed to create quiz');
      console.error('Error creating quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuizDetail = (quiz) => {
    navigate(`/teacher/classroom/${classId}/quiz/${quiz.id}`);
  };

  const handleViewResults = (quiz) => {
    navigate(`/teacher/classroom/${classId}/quiz/${quiz.id}/results`);
  };

  const handleEditQuiz = (quiz) => {
    navigate(`/teacher/classroom/${classId}/quiz/${quiz.id}/edit`);
  };

  const handleDeleteQuiz = (quiz) => {
    Modal.confirm({
      title: 'Delete Quiz',
      content: `Are you sure you want to delete "${quiz.title}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          setQuizItems(prev => prev.filter(item => item.id !== quiz.id));
          message.success('Quiz deleted successfully');
        } catch (error) {
          message.error('Failed to delete quiz');
        }
      }
    });
  };

  const handlePublishQuiz = async (quiz) => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setQuizItems(prev => prev.map(item => 
        item.id === quiz.id ? { ...item, status: 'published' } : item
      ));
      message.success('Quiz published successfully!');
    } catch (error) {
      message.error('Failed to publish quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={3} className="mb-0">Quiz Management</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setQuizCreateVisible(true)}
        >
          Create Quiz
        </Button>
      </div>

      {/* Stats Overview */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Quizzes" 
              value={quizItems.length} 
              prefix={<QuestionCircleOutlined />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Published" 
              value={quizItems.filter(q => q.status === 'published').length} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Draft" 
              value={quizItems.filter(q => q.status === 'draft').length} 
              prefix={<EditOutlined />} 
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Average Completion" 
              value={78} 
              suffix="%" 
              prefix={<BarChartOutlined />} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quiz Items */}
      {quizItems.length === 0 ? (
        <Card>
          <Empty 
            description="No quizzes created yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <List
          dataSource={quizItems}
          renderItem={(quiz) => (
            <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <QuestionCircleOutlined className="text-green-500 text-xl" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Title level={4} className="mb-1">
                        {quiz.title}
                      </Title>
                      <Space wrap>
                        <Tag color={getStatusColor(quiz.status)} className="capitalize">
                          {quiz.status}
                        </Tag>
                        <Tag color={getDifficultyColor(quiz.difficulty)}>
                          {quiz.difficulty}
                        </Tag>
                        <Text type="secondary">{quiz.totalPoints} points</Text>
                        <Text type="secondary">{quiz.totalQuestions} questions</Text>
                        <Text type="secondary">{quiz.duration} minutes</Text>
                      </Space>
                    </div>
                    
                    <Space>
                      <Tooltip title="View Details">
                        <Button 
                          type="text" 
                          icon={<EyeOutlined />}
                          size="small"
                          onClick={() => handleViewQuizDetail(quiz)}
                        />
                      </Tooltip>
                      
                      <Tooltip title="Edit Quiz">
                        <Button 
                          type="text" 
                          icon={<EditOutlined />}
                          size="small"
                          onClick={() => handleEditQuiz(quiz)}
                        />
                      </Tooltip>
                      
                      {quiz.status === 'published' && (
                        <Tooltip title="View Results">
                          <Button 
                            type="text" 
                            icon={<BarChartOutlined />}
                            size="small"
                            onClick={() => handleViewResults(quiz)}
                            className="text-blue-600 hover:text-blue-700"
                          />
                        </Tooltip>
                      )}
                      
                      {quiz.status === 'draft' && (
                        <Tooltip title="Publish Quiz">
                          <Button 
                            type="text" 
                            icon={<PlayCircleOutlined />}
                            size="small"
                            onClick={() => handlePublishQuiz(quiz)}
                            className="text-green-600 hover:text-green-700"
                          />
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Delete Quiz">
                        <Button 
                          type="text" 
                          icon={<DeleteOutlined />}
                          size="small"
                          danger
                          onClick={() => handleDeleteQuiz(quiz)}
                        />
                      </Tooltip>
                    </Space>
                  </div>

                  {quiz.description && (
                    <Text className="text-gray-600 block mb-3">
                      {quiz.description}
                    </Text>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    {quiz.dueDate && (
                      <div className="flex items-center gap-2">
                        <CalendarOutlined className="text-gray-500" />
                        {formatDueDate(quiz.dueDate)}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <ClockCircleOutlined className="text-gray-500" />
                      <Text type="secondary">Duration: {quiz.duration} minutes</Text>
                    </div>
                    
                    {quiz.status === 'published' && (
                      <div className="flex items-center gap-2">
                        <TeamOutlined className="text-gray-500" />
                        <Text type="secondary">
                          {quiz.submissionsCount}/{quiz.totalStudents} completed
                        </Text>
                        <Progress 
                          percent={Math.round((quiz.submissionsCount / quiz.totalStudents) * 100)} 
                          size="small" 
                          className="ml-2"
                          style={{ width: '100px' }}
                        />
                      </div>
                    )}
                    
                    {quiz.avgScore && (
                      <div className="flex items-center gap-2">
                        <TrophyOutlined className="text-gray-500" />
                        <Text type="secondary">
                          Avg: {quiz.avgScore}/{quiz.totalPoints} ({quiz.passRate}% pass rate)
                        </Text>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <Space>
                      {quiz.allowRetake && (
                        <Tag color="cyan" size="small">Allow Retake</Tag>
                      )}
                      {quiz.randomizeQuestions && (
                        <Tag color="purple" size="small">Randomized</Tag>
                      )}
                      {quiz.showResultsImmediately && (
                        <Tag color="blue" size="small">Instant Results</Tag>
                      )}
                    </Space>
                    
                    <Text type="secondary">
                      Created {moment(quiz.createdAt).fromNow()}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          )}
        />
      )}

      {/* Quiz Create Modal */}
      <QuizCreateModal
        visible={quizCreateVisible}
        onCancel={() => setQuizCreateVisible(false)}
        onSubmit={handleQuizCreate}
        loading={loading}
      />
    </div>
  );
};

export default memo(QuizManagement); 