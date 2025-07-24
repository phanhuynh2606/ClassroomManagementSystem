import React, { memo, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Tag, 
  Descriptions, 
  List, 
  Button, 
  Spin, 
  Divider,
  Badge,
  Space,
  Statistic,
  Progress,
  Tooltip,
  Avatar,
  Tabs
} from 'antd';
import { 
  ClockCircleOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  EditOutlined, 
  PlayCircleOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  FileTextOutlined,
  TeamOutlined,
  TrophyOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { quizAPI } from '../../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

function QuizDetail() {
  const [quizDetail, setQuizDetail] = useState();
  const [loading, setLoading] = useState(true);
  const { classId, quizId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizDetail();
  }, [classId, quizId]);
  const fetchQuizDetail = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getById(quizId);
      if (response.success) {
        setQuizDetail(response.data);
      } 
      setLoading(false);
    }
    catch (error) {
      console.error("Failed to fetch quiz detail:", error);
      setLoading(false);
    }
  }
  console.log("Quiz Detail:", quizDetail);
  
  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'Không giới hạn';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'orange',
      'published': 'green',
      'archived': 'gray'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      'draft': 'Bản nháp',
      'published': 'Đã xuất bản',
      'archived': 'Đã lưu trữ'
    };
    return texts[status] || status;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'easy': 'green',
      'medium': 'orange',
      'hard': 'red'
    };
    return colors[difficulty] || 'default';
  };

  const getDifficultyText = (difficulty) => {
    const texts = {
      'easy': 'Dễ',
      'medium': 'Trung bình',
      'hard': 'Khó'
    };
    return texts[difficulty] || difficulty;
  };

  const getCategoryText = (category) => {
    const texts = {
      'MID_TERM_EXAM': 'Kiểm tra giữa kỳ',
      'FINAL_EXAM': 'Kiểm tra cuối kỳ',
      'PROGRESS_TEST': 'Kiểm tra tiến độ',
      'QUIZ': 'Bài kiểm tra nhỏ',
      'PRACTICE': 'Luyện tập'
    };
    return texts[category] || category;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSubmissionStats = (submissions) => {
    const completed = submissions.filter(sub => sub.status === 'completed');
    const totalScore = completed.reduce((sum, sub) => sum + sub.score, 0);
    const totalPossible = quizDetail?.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0;
    const passed = completed.filter(sub => {
      const percentage = totalPossible > 0 ? (sub.score / totalPossible) * 100 : 0;
      return percentage >= quizDetail.passingScore;
    });

    return {
      totalSubmissions: completed.length,
      averageScore: completed.length > 0 ? (totalScore / completed.length).toFixed(1) : 0,
      passRate: completed.length > 0 ? Math.round((passed.length / completed.length) * 100) : 0,
      uniqueStudents: [...new Set(completed.map(sub => sub.student._id))].length
    };
  };

  const submissionStats = getSubmissionStats(quizDetail?.submissions || []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!quizDetail) {
    return (
      <div className="text-center py-8">
        <Text type="secondary">Không tìm thấy bài kiểm tra</Text>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          Quay lại
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <Title level={2} className="mb-2">
              {quizDetail.title}
              <Tag color={getStatusColor(quizDetail.visibility)} className="ml-3">
                {getStatusText(quizDetail.visibility)}
              </Tag>
            </Title>
            <Space size="middle">
              <Text type="secondary">
                <CalendarOutlined /> Lớp: {quizDetail.classroom?.name}
              </Text>
              <Text type="secondary">
                <UserOutlined /> Tạo bởi: {quizDetail.createdBy?.email}
              </Text>
              <Text type="secondary">
                <ClockCircleOutlined /> {formatDate(quizDetail.createdAt)}
              </Text>
            </Space>
          </div>
          
          <Space>
            {/* <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => navigate(`/teacher/class/${classId}/quiz/${quizId}/edit`)}
            >
              Chỉnh sửa
            </Button> */}
            {/* <Button 
              icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/teacher/class/${classId}/quiz/${quizId}/preview`)}
            >
              Xem trước
            </Button>
            <Button icon={<SettingOutlined />}>
              Cài đặt
            </Button> */}
          </Space>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column - Main Info */}
        <Col span={16}>
          {/* Basic Information */}
          <Card title="📋 Thông tin cơ bản" className="mb-6">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Tiêu đề" span={2}>
                {quizDetail.title}
              </Descriptions.Item>
              <Descriptions.Item label="Danh mục">
                <Tag color="blue">{getCategoryText(quizDetail.category)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian làm bài">
                <Text strong>{quizDetail.duration} phút</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Điểm qua môn">
                <Text strong>{quizDetail.passingScore} điểm</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số lần làm tối đa">
                <Text strong>{quizDetail.maxAttempts} lần</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>
                {quizDetail.description || <Text type="secondary">Không có mô tả</Text>}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Time Settings */}
          <Card title="⏰ Cài đặt thời gian" className="mb-6">
            <Row gutter={16}>
              <Col span={12}>
                <div className="text-center p-4 border rounded-lg">
                  <CalendarOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <div className="mt-2">
                    <Text strong>Thời gian bắt đầu</Text>
                    <div>{formatDate(quizDetail.startTime)}</div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="text-center p-4 border rounded-lg">
                  <CalendarOutlined style={{ fontSize: 24, color: '#f5222d' }} />
                  <div className="mt-2">
                    <Text strong>Thời gian kết thúc</Text>
                    <div>{formatDate(quizDetail.endTime)}</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Questions and Submissions Tabs */}
          <Card>
            <Tabs defaultActiveKey="1" size="large">
              <TabPane 
                tab={
                  <span>
                    <QuestionCircleOutlined />
                    Danh sách câu hỏi ({quizDetail.questions?.length || 0})
                  </span>
                } 
                key="1"
              >
                <List
                  dataSource={quizDetail.questions || []}
                  renderItem={(question, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            style={{ backgroundColor: '#1890ff' }}
                            size="large"
                          >
                            {index + 1}
                          </Avatar>
                        }
                        title={
                          <div className="flex items-center gap-2">
                            <Text strong>{question.content}</Text>
                            <Tag color={getDifficultyColor(question.difficulty)}>
                              {getDifficultyText(question.difficulty)}
                            </Tag>
                            <Tag>{question.points} điểm</Tag>
                            {question.isAI && <Tag color="orange">AI</Tag>}
                          </div>
                        }
                        description={
                          <div className="mt-2">
                            {question.options?.map((option, optIndex) => (
                              <div 
                                key={option._id} 
                                className={`p-2 mb-1 rounded ${
                                  option.isCorrect 
                                    ? 'bg-green-50 border border-green-200 text-green-700' 
                                    : 'bg-gray-50'
                                }`}
                              >
                                <span className="font-medium mr-2">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                {option.content}
                                {option.isCorrect && (
                                  <CheckCircleOutlined className="ml-2 text-green-500" />
                                )}
                              </div>
                            ))}
                            {question.explanation && (
                              <div className="mt-2 p-2 bg-blue-50 rounded">
                                <Text type="secondary">
                                  <QuestionCircleOutlined /> Giải thích: {question.explanation}
                                </Text>
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </TabPane>

              <TabPane 
                tab={
                  <span>
                    <FileTextOutlined />
                    Danh sách nộp bài ({quizDetail.submissions?.filter(sub => sub.status === 'completed').length || 0})
                  </span>
                } 
                key="2"
              >
                {quizDetail.submissions && quizDetail.submissions.length > 0 ? (
                  <List
                    dataSource={quizDetail.submissions
                      .filter(sub => sub.status === 'completed')
                      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))}
                    renderItem={(submission) => {
                      const totalPossible = quizDetail.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0;
                      const percentage = totalPossible > 0 ? Math.round((submission.score / totalPossible) * 100) : 0;
                      const passed = percentage >= quizDetail.passingScore;
                      const timeTaken = submission.submittedAt && submission.startedAt 
                        ? Math.round((new Date(submission.submittedAt) - new Date(submission.startedAt)) / 1000)
                        : 0;

                      return (
                        <List.Item
                          actions={[
                            <Button 
                              type="link" 
                              icon={<EyeOutlined />} 
                              size="small"
                              onClick={() => navigate(`/teacher/class/${classId}/quiz/${quizId}/submission/${submission._id}`)}
                            >
                              Xem chi tiết
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              <Avatar 
                                style={{ 
                                  backgroundColor: passed ? '#52c41a' : '#ff4d4f',
                                  fontSize: '16px'
                                }}
                                icon={passed ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                              />
                            }
                            title={
                              <div className="flex items-center gap-2">
                                <Text strong>{submission.student.fullName || submission.student.email}</Text>
                                <Tag color={passed ? 'success' : 'error'}>
                                  {submission.score}/{totalPossible} ({percentage}%)
                                </Tag>
                                <Tag color="blue">Lần {submission.attempt}</Tag>
                                {passed && <Tag color="green" icon={<TrophyOutlined />}>Đạt</Tag>}
                              </div>
                            }
                            description={
                              <div>
                                <Space size="middle">
                                  <Text type="secondary">
                                    <CalendarOutlined /> {formatDate(submission.submittedAt)}
                                  </Text>
                                  <Text type="secondary">
                                    <ClockCircleOutlined /> {formatTime(timeTaken)}
                                  </Text>
                                  <Text type="secondary">
                                    <UserOutlined /> {submission.student.email}
                                  </Text>
                                </Space>
                                <div className="mt-2">
                                  <Progress 
                                    percent={percentage} 
                                    strokeColor={passed ? '#52c41a' : '#ff4d4f'}
                                    size="small"
                                    format={percent => `${percent}%`}
                                  />
                                </div>
                              </div>
                            }
                          />
                        </List.Item>
                      );
                    }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: false,
                      showQuickJumper: true,
                      showTotal: (total, range) => 
                        `${range[0]}-${range[1]} của ${total} bài nộp`
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Text type="secondary">Chưa có bài nộp nào</Text>
                  </div>
                )}
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* Right Column - Statistics & Settings */}
        <Col span={8}>
          {/* Statistics */}
          <Card title="📊 Thống kê" className="mb-6">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Tổng câu hỏi"
                  value={quizDetail.questions?.length || 0}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Tổng điểm"
                  value={quizDetail.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Lượt nộp bài"
                  value={submissionStats.totalSubmissions}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Tỷ lệ qua môn"
                  value={submissionStats.passRate}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Học sinh tham gia"
                  value={submissionStats.uniqueStudents}
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Điểm trung bình"
                  value={submissionStats.averageScore}
                  prefix={<BarChartOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* Quiz Settings */}
          <Card title="⚙️ Cài đặt bài kiểm tra" className="mb-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Text>Hiện kết quả ngay</Text>
                <Badge 
                  status={quizDetail.showResults ? "success" : "default"} 
                  text={quizDetail.showResults ? "Có" : "Không"} 
                />
              </div>
              <div className="flex justify-between items-center">
                <Text>Cho phép xem lại</Text>
                <Badge 
                  status={quizDetail.allowReview ? "success" : "default"} 
                  text={quizDetail.allowReview ? "Có" : "Không"} 
                />
              </div>
              <div className="flex justify-between items-center">
                <Text>Trộn câu hỏi</Text>
                <Badge 
                  status={quizDetail.shuffleQuestions ? "success" : "default"} 
                  text={quizDetail.shuffleQuestions ? "Có" : "Không"} 
                />
              </div>
              <div className="flex justify-between items-center">
                <Text>Trộn đáp án</Text>
                <Badge 
                  status={quizDetail.shuffleOptions ? "success" : "default"} 
                  text={quizDetail.shuffleOptions ? "Có" : "Không"} 
                />
              </div>
              <div className="flex justify-between items-center">
                <Text>Toàn màn hình</Text>
                <Badge 
                  status={quizDetail.fullScreen ? "success" : "default"} 
                  text={quizDetail.fullScreen ? "Có" : "Không"} 
                />
              </div>
              <div className="flex justify-between items-center">
                <Text>Chặn copy/paste</Text>
                <Badge 
                  status={!quizDetail.copyAllowed ? "success" : "default"} 
                  text={!quizDetail.copyAllowed ? "Có" : "Không"} 
                />
              </div>
              <div className="flex justify-between items-center">
                <Text>Phát hiện chuyển tab</Text>
                <Badge 
                  status={quizDetail.checkTab ? "success" : "default"} 
                  text={quizDetail.checkTab ? "Có" : "Không"} 
                />
              </div>
            </div>
          </Card>

          {/* Question Distribution */}
          <Card title="📈 Phân bố câu hỏi theo độ khó" className="mb-6">
            {(() => {
              const distribution = (quizDetail.questions || []).reduce((acc, q) => {
                acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
                return acc;
              }, {});
              const total = quizDetail.questions?.length || 1;
              
              return (
                <div className="space-y-3">
                  {Object.entries(distribution).map(([difficulty, count]) => (
                    <div key={difficulty}>
                      <div className="flex justify-between mb-1">
                        <Text>{getDifficultyText(difficulty)}</Text>
                        <Text>{count} câu</Text>
                      </div>
                      <Progress 
                        percent={Math.round((count / total) * 100)} 
                        strokeColor={
                          difficulty === 'easy' ? '#52c41a' :
                          difficulty === 'medium' ? '#faad14' : '#f5222d'
                        }
                        size="small"
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </Card>

          {/* Submission Summary */}
          {quizDetail.submissions && quizDetail.submissions.length > 0 && (
            <Card title="📊 Tóm tắt bài nộp">
              <div className="space-y-4">
                <div className="text-center">
                  <Progress
                    type="circle"
                    percent={submissionStats.passRate}
                    strokeColor='#52c41a'
                    format={percent => `${percent}%`}
                    size={80}
                  />
                  <div className="mt-2">
                    <Text strong>Tỷ lệ đạt</Text>
                  </div>
                </div>
                
                <Divider />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text type="secondary">Học sinh tham gia:</Text>
                    <Text strong>{submissionStats.uniqueStudents}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text type="secondary">Tổng lượt làm:</Text>
                    <Text strong>{submissionStats.totalSubmissions}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text type="secondary">Điểm TB:</Text>
                    <Text strong>{submissionStats.averageScore}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text type="secondary">Số học sinh đạt:</Text>
                    <Text strong style={{ color: '#52c41a' }}>
                      {Math.round(submissionStats.totalSubmissions * submissionStats.passRate / 100)}
                    </Text>
                  </div>
                </div>

                {/* <Button 
                  type="primary" 
                  block 
                  icon={<BarChartOutlined />}
                  onClick={() => navigate(`/teacher/class/${classId}/quiz/${quizId}/analytics`)}
                >
                  Xem báo cáo chi tiết
                </Button> */}
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default memo(QuizDetail);