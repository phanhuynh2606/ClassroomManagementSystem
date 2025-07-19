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
  Avatar
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
  FileTextOutlined
} from '@ant-design/icons';
import { quizAPI } from '../../../services/api';

const { Title, Text } = Typography;

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
      'QUIZ': 'Bài kiểm tra nhỏ',
      'PRACTICE': 'Luyện tập'
    };
    return texts[category] || category;
  };

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
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => navigate(`/teacher/class/${classId}/quiz/${quizId}/edit`)}
            >
              Chỉnh sửa
            </Button>
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

          {/* Questions List */}
          <Card 
            title={`❓ Danh sách câu hỏi (${quizDetail.questions?.length || 0} câu)`}
            extra={
              <Button type="primary" icon={<EditOutlined />} size="small">
                Chỉnh sửa câu hỏi
              </Button>
            }
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
                  value={quizDetail.submissions?.length || 0}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Tỷ lệ qua môn"
                  value={0}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
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
          <Card title="📈 Phân bố câu hỏi theo độ khó">
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
        </Col>
      </Row>
    </div>
  );
}

export default memo(QuizDetail);