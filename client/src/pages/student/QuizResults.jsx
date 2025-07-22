import React, { useEffect, useState } from 'react'
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Tag, 
  List, 
  Avatar, 
  Progress, 
  Spin, 
  message,
  Badge,
  Space,
  Divider,
  Button,
  Collapse,
  Timeline
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  TrophyOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PercentageOutlined,
  NumberOutlined,
  EyeOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { quizAPI } from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Panel } = Collapse;

function QuizResults() {
  const [quizResults, setQuizResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const { quizId } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    fetchQuizResults(quizId);
  }, [quizId]);
  
  const fetchQuizResults = async (quizId) => {
    try {
      setLoading(true);
      const response = await quizAPI.viewResults(quizId);
      if (response.data) {
        setQuizResults(response.data);
      }
    } catch (error) {
      message.error('Failed to load quiz results');
      console.error('Error fetching quiz results:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#52c41a';
    if (percentage >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getBestAttempt = (results) => {
    if (!results || results.length === 0) return null;
    return results.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  };

  const getLatestAttempt = (results) => {
    if (!results || results.length === 0) return null;
    return results.reduce((latest, current) => 
      new Date(current.submittedAt) > new Date(latest.submittedAt) ? current : latest
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!quizResults || quizResults.length === 0) {
    return (
      <div className="p-6 text-center">
        <Text type="secondary">Không có kết quả bài kiểm tra nào</Text>
      </div>
    );
  }
  console.log(quizResults);

  const bestAttempt = getBestAttempt(quizResults);
  const latestAttempt = getLatestAttempt(quizResults);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          Quay lại
        </Button>
        
        <Title level={2} className="mb-4">
          Kết quả bài kiểm tra
        </Title>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[24, 24]} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số lần làm"
              value={quizResults.length}
              prefix={<NumberOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Điểm cao nhất"
              value={`${bestAttempt?.score || 0}/${bestAttempt?.totalPossibleScore || 0}`}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: getScoreColor(bestAttempt?.percentage || 0) }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Phần trăm cao nhất"
              value={bestAttempt?.percentage || 0}
              suffix="%"
              prefix={<PercentageOutlined />}
              valueStyle={{ color: getScoreColor(bestAttempt?.percentage || 0) }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Trạng thái"
              value={bestAttempt?.passed ? "Đạt" : "Chưa đạt"}
              prefix={bestAttempt?.passed ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              valueStyle={{ 
                color: bestAttempt?.passed ? '#52c41a' : '#ff4d4f' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Best Attempt Details */}
      {bestAttempt && (
        <Card title="Lần làm bài tốt nhất" className="mb-6">
          <Row gutter={16}>
            <Col span={8}>
              <div className="text-center">
                <Progress
                  type="circle"
                  percent={Math.round(bestAttempt.percentage)}
                  strokeColor={getScoreColor(bestAttempt.percentage)}
                  format={percent => `${percent}%`}
                />
                <div className="mt-2">
                  <Text strong>Điểm số: {bestAttempt.score}/{bestAttempt.totalPossibleScore}</Text>
                </div>
              </div>
            </Col>
            <Col span={16}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text strong>Thời gian làm bài: </Text>
                  <Tag icon={<ClockCircleOutlined />}>
                    {formatTime(bestAttempt.timeTaken)}
                  </Tag>
                </div>
                <div>
                  <Text strong>Thời gian nộp: </Text>
                  <Tag icon={<CalendarOutlined />}>
                    {formatDate(bestAttempt.submittedAt)}
                  </Tag>
                </div>
                <div>
                  <Text strong>Điểm qua môn: </Text>
                  <Tag color="blue">{bestAttempt.passingScore}%</Tag>
                </div>
                <div>
                  <Badge 
                    status={bestAttempt.passed ? "success" : "error"} 
                    text={bestAttempt.passed ? "Đạt yêu cầu" : "Chưa đạt yêu cầu"}
                  />
                </div>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* All Attempts Timeline */}
      <Card title="Lịch sử các lần làm bài" className="mb-6">
        <Timeline mode="left">
          {quizResults.map((result, index) => (
            <Timeline.Item
              key={result.submissionId}
              color={result.passed ? 'green' : 'red'}
              label={
                <div>
                  <Text strong>Lần {quizResults.length - index}</Text>
                  <br />
                  <Text type="secondary">{formatDate(result.submittedAt)}</Text>
                </div>
              }
            >
              <div>
                <Space>
                  <Tag color={result.passed ? 'success' : 'error'}>
                    {result.score}/{result.totalPossibleScore} điểm
                  </Tag>
                  <Tag>{Math.round(result.percentage)}%</Tag>
                  <Tag icon={<ClockCircleOutlined />}>
                    {formatTime(result.timeTaken)}
                  </Tag>
                </Space>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>

      {/* Detailed Results for Each Attempt */}
      <Card title="Chi tiết từng lần làm bài">
        <Collapse accordion>
          {quizResults.map((result, index) => (
            <Panel
              header={
                <div className="flex justify-between items-center w-full">
                  <div>
                    <Text strong>Lần {quizResults.length - index} - {formatDate(result.submittedAt)}</Text>
                  </div>
                  <div>
                    <Space>
                      <Tag color={result.passed ? 'success' : 'error'}>
                        {result.score}/{result.totalPossibleScore}
                      </Tag>
                      <Tag>{Math.round(result.percentage)}%</Tag>
                      <Badge 
                        status={result.passed ? "success" : "error"} 
                        text={result.passed ? "Đạt" : "Chưa đạt"}
                      />
                    </Space>
                  </div>
                </div>
              }
              key={result.submissionId}
            >
              <div className="mt-4">
                <Row gutter={[16, 16]} className="mb-4">
                  <Col span={6}>
                    <Statistic
                      title="Điểm số"
                      value={`${result.score}/${result.totalPossibleScore}`}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Phần trăm"
                      value={Math.round(result.percentage)}
                      suffix="%"
                      valueStyle={{ 
                        fontSize: '18px',
                        color: getScoreColor(result.percentage)
                      }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Thời gian"
                      value={formatTime(result.timeTaken)}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Trạng thái"
                      value={result.passed ? "Đạt" : "Chưa đạt"}
                      valueStyle={{ 
                        fontSize: '18px',
                        color: result.passed ? '#52c41a' : '#ff4d4f'
                      }}
                    />
                  </Col>
                </Row>

                <Divider>Chi tiết câu trả lời</Divider>

                <List
                  dataSource={result.answers}
                  renderItem={(answer, answerIndex) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            style={{ 
                              backgroundColor: answer.isCorrect ? '#52c41a' : '#ff4d4f',
                              fontSize: '16px'
                            }}
                            icon={answer.isCorrect ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                          >
                            {answerIndex + 1}
                          </Avatar>
                        }
                        title={
                          <div>
                            <Text strong>{answer.questionContent}</Text>
                            <Tag 
                              color={answer.isCorrect ? 'success' : 'error'} 
                              className="ml-2"
                            >
                              {answer.isCorrect ? 'Đúng' : 'Sai'}
                            </Tag>
                          </div>
                        }
                        description={
                          <div className="mt-2">
                            <div className="space-y-1">
                              {answer.questionOptions.map((option, optIndex) => {
                                const isSelected = option.content === answer.selectedOption;
                                const isCorrect = option.isCorrect;
                                
                                return (
                                  <div
                                    key={option._id || optIndex}
                                    className={`p-2 rounded border ${
                                      isCorrect 
                                        ? 'bg-green-50 border-green-200 text-green-700'
                                        : isSelected 
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <Space>
                                      <Text strong>{String.fromCharCode(65 + optIndex)}.</Text>
                                      <Text>{option.content}</Text>
                                      {isCorrect && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                      {isSelected && !isCorrect && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                                      {isSelected && <Text strong>(Bạn đã chọn)</Text>}
                                    </Space>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            </Panel>
          ))}
        </Collapse>
      </Card>
    </div>
  );
}

export default QuizResults