import React, { useState, memo, useEffect } from 'react';
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
  BarChartOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  BookOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

// Import the quiz modal component
import CreateQuizModal from './QuizModal/QuizCreateModal';
import quizAPI from '../../../services/api/quiz.api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const QuizManagement = ({ classId }) => {
  const navigate = useNavigate();
  const [quizCreateVisible, setQuizCreateVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [quizItems, setQuizItems] = useState([]);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getAll(classId);
      if (response && response.data) {
        setQuizItems(response.data);
      } else {
        setQuizItems([]);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      message.error('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (visibility) => {
    switch (visibility) {
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

  const getCategoryColor = (category) => {
    switch (category) {
      case 'PROGRESS_TEST':
        return 'blue';
      case 'MID_TERM_EXAM':
        return 'red';
      case 'FINAL_EXAM':
        return 'purple';
      case 'ASSIGNMENT':
        return 'green';
      case 'QUIZ':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'PROGRESS_TEST':
        return <ExperimentOutlined />;
      case 'MID_TERM_EXAM':
        return <BookOutlined />;
      case 'FINAL_EXAM':
        return <TrophyOutlined />;
      case 'ASSIGNMENT':
        return <FileTextOutlined />;
      case 'QUIZ':
        return <QuestionCircleOutlined />;
      default:
        return <QuestionCircleOutlined />;
    }
  };

  const formatCategoryName = (category) => {
    switch (category) {
      case 'PROGRESS_TEST':
        return 'Progress Test';
      case 'MID_TERM_EXAM':
        return 'Mid-term Exam';
      case 'FINAL_EXAM':
        return 'Final Exam';
      case 'ASSIGNMENT':
        return 'Assignment';
      case 'QUIZ':
        return 'Quiz';
      default:
        return category;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    const date = moment(dateString);
    const now = moment();

    if (date.isBefore(now)) {
      return <Text type="danger">{date.format('MMM D, YYYY HH:mm')}</Text>;
    } else if (date.diff(now, 'hours') <= 24) {
      return <Text type="warning">{date.format('MMM D, YYYY HH:mm')}</Text>;
    } else {
      return <Text>{date.format('MMM D, YYYY HH:mm')}</Text>;
    }
  };

  const isQuizActive = (startTime, endTime) => {
    const now = moment();
    const start = moment(startTime);
    const end = moment(endTime);

    return now.isBetween(start, end);
  };

  const getQuizStatus = (quiz) => {
    const now = moment();
    const startTime = moment(quiz.startTime);
    const endTime = moment(quiz.endTime);

    if (quiz.visibility === 'draft') return 'draft';
    if (quiz.visibility === 'published' && (!quiz.startTime || !quiz.endTime)) return 'published';
    if (quiz.visibility === 'scheduled' && isQuizActive(quiz.startTime, quiz.endTime)) return 'scheduled';
    if (now.isBefore(startTime)) return 'scheduled';
    if (now.isBetween(startTime, endTime)) return 'active';
    if (now.isAfter(endTime)) return 'completed';

    return quiz.visibility;
  };

  const calculateQuizStats = (quiz) => {
    const totalQuestions = quiz.questions?.length || 0;
    const totalPoints = quiz.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;
    const totalAttempts = quiz.questions?.reduce((sum, q) => sum + (q.statistics?.totalAttempts || 0), 0) || 0;
    const correctAttempts = quiz.questions?.reduce((sum, q) => sum + (q.statistics?.correctAttempts || 0), 0) || 0;
    const averageScore = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    return {
      totalQuestions,
      totalPoints,
      totalAttempts,
      correctAttempts,
      averageScore
    };
  };

  const handleQuizCreate = async (quizData) => {
    const newQuiz = {
      ...quizData,
      classroom: classId,
    };
    try {
      const response = await quizAPI.create(newQuiz);
      if (response.success) {
        setQuizCreateVisible(false);
        message.success('Quiz created successfully!');
        fetchQuizzes();
      }
    } catch (error) {
      message.error('Failed to create quiz');
      console.error('Error creating quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuizDetail = (quiz) => {
    navigate(`/teacher/classroom/${classId}/quiz/${quiz._id}`);
  };

  const handleViewResults = (quiz) => {
    navigate(`/teacher/classroom/${classId}/quiz/${quiz._id}/results`);
  };

  const handleEditQuiz = (quiz) => {
    navigate(`/teacher/classroom/${classId}/quiz/${quiz._id}/edit`);
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
          const response = await quizAPI.delete(quiz._id);
          if (response.success) {
            message.success('Quiz deleted successfully!');
            fetchQuizzes();
          }
        } catch (error) {
          message.error('Failed to delete quiz');
        }
      }
    });
  };

  const handleChangeVisibilityQuiz = async (id, visibility) => {
    try {
      setLoading(true);
      const response = await quizAPI.changeVisibility(id, { visibility });
      if (response.success) {
        message.success(`Quiz visibility changed to ${visibility}`);
        fetchQuizzes();
      }
    } catch (error) {
      message.error('Failed to publish quiz');
    } finally {
      setLoading(false);
    }
  };

  const publishedQuizzes = quizItems.filter(q => q.visibility === 'published');
  const draftQuizzes = quizItems.filter(q => q.visibility === 'draft');
  const scheduledQuizzes = quizItems.filter(q => q.visibility === 'scheduled');

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
              value={quizItems?.length || 0}
              prefix={<QuestionCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Published"
              value={publishedQuizzes.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Draft"
              value={draftQuizzes.length}
              prefix={<EditOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Scheduled"
              value={scheduledQuizzes.length}
              prefix={<CalendarOutlined />}
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
          loading={loading}
          dataSource={quizItems}
          renderItem={(quiz) => {
            const stats = calculateQuizStats(quiz);
            const status = getQuizStatus(quiz);

            return (
              <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="mt-1 text-xl">
                    {getCategoryIcon(quiz.category)}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Title level={4} className="mb-1">
                          {quiz.title}
                        </Title>
                        <Space wrap>
                          <Tag color={getStatusColor(status)} className="capitalize">
                            {status}
                          </Tag>
                          <Tag color={getCategoryColor(quiz.category)}>
                            {formatCategoryName(quiz.category)}
                          </Tag>
                          <Text type="secondary">{stats.totalPoints} points</Text>
                          <Text type="secondary">{stats.totalQuestions} questions</Text>
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

                        {quiz.visibility === 'published' && (
                          <Tooltip title="View Results">
                            <Button
                              type="text"
                              icon={<BarChartOutlined />}
                              size="small"
                              onClick={() => handleViewResults(quiz?._id, "draft")}
                              className="text-blue-600 hover:text-blue-700"
                            />
                          </Tooltip>
                        )}

                        {(quiz.visibility === 'published' || quiz.visibility === 'scheduled') && (
                          <Tooltip title="Unpublish Quiz">
                            <Button
                              type="text"
                              icon={<StopOutlined />}
                              size="small"
                              onClick={() => handleChangeVisibilityQuiz(quiz?._id, "draft")}
                              className="text-red-600 hover:text-red-700"
                            />
                          </Tooltip>
                        )}

                        {quiz.visibility === 'draft' && (
                          <Tooltip title="Publish Quiz">
                            <Button
                              type="text"
                              icon={<PlayCircleOutlined />}
                              size="small"
                              onClick={() => handleChangeVisibilityQuiz(quiz?._id, "published")}
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
                      {quiz.startTime && (
                        <div className="flex items-center gap-2">
                          <CalendarOutlined className="text-gray-500" />
                          <Text type="secondary">Start: </Text>
                          {formatDateTime(quiz.startTime)}
                        </div>
                      )}

                      {quiz.endTime && (
                        <div className="flex items-center gap-2">
                          <CalendarOutlined className="text-gray-500" />
                          <Text type="secondary">End: </Text>
                          {formatDateTime(quiz.endTime)}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <ClockCircleOutlined className="text-gray-500" />
                        <Text type="secondary">Duration: {quiz.duration} minutes</Text>
                      </div>

                      <div className="flex items-center gap-2">
                        <TrophyOutlined className="text-gray-500" />
                        <Text type="secondary">Passing Score: {quiz.passingScore}%</Text>
                      </div>

                      {quiz.maxAttempts && (
                        <div className="flex items-center gap-2">
                          <TeamOutlined className="text-gray-500" />
                          <Text type="secondary">Max Attempts: {quiz.maxAttempts}</Text>
                        </div>
                      )}

                      {stats.totalAttempts > 0 && (
                        <div className="flex items-center gap-2">
                          <BarChartOutlined className="text-gray-500" />
                          <Text type="secondary">
                            Success Rate: {stats.averageScore}%
                          </Text>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <Space>
                        {quiz.allowReview && (
                          <Tag color="cyan" size="small">Allow Review</Tag>
                        )}
                        {quiz.shuffleQuestions && (
                          <Tag color="purple" size="small">Shuffle Questions</Tag>
                        )}
                        {quiz.shuffleOptions && (
                          <Tag color="purple" size="small">Shuffle Options</Tag>
                        )}
                        {quiz.fullScreen && (
                          <Tag color="red" size="small">Full Screen</Tag>
                        )}
                        {quiz.showResults && (
                          <Tag color="blue" size="small">Show Results</Tag>
                        )}
                        {!quiz.copyAllowed && (
                          <Tag color="orange" size="small">Copy Disabled</Tag>
                        )}
                        {quiz.checkTab && (
                          <Tag color="red" size="small">Tab Monitoring</Tag>
                        )}
                      </Space>

                      <Space direction="vertical" size="small" className="text-right">
                        <Text type="secondary">
                          Created by: {quiz.createdBy?.email || 'Unknown'}
                        </Text>
                        <Text type="secondary">
                          Created {moment(quiz.createdAt).fromNow()}
                        </Text>
                      </Space>
                    </div>
                  </div>
                </div>
              </Card>
            );
          }}
        />
      )}

      <CreateQuizModal
        visible={quizCreateVisible}
        onCancel={() => setQuizCreateVisible(false)}
        onOk={handleQuizCreate}
        loading={loading}
      />
    </div>
  );
};

export default memo(QuizManagement);