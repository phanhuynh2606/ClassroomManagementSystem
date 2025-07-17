import React, { useState, useEffect, memo } from 'react';
import { 
  Card, 
  List, 
  Button, 
  Typography, 
  Space, 
  Tag, 
  Avatar, 
  Badge,
  Tabs,
  Empty,
  Tooltip,
  Progress,
  Spin,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  BookOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { teacherTodoAPI } from '../../services/api';
import { HtmlContent } from '../../components/common';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const TeacherTodo = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assignments');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    assignments: [],
    questions: [],
    stats: {
      pendingAssignments: 0,
      pendingQuestions: 0,
      totalSubmissions: 0,
      totalGradedSubmissions: 0,
      completionRate: 0
    }
  });

  // Fetch teacher todos
  const fetchTeacherTodos = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await teacherTodoAPI.getTeacherTodos();
      
      if (response.success) {
        setData(response.data);
      } else {
        message.error(response.message || 'Không thể tải dữ liệu');
      }
    } catch (error) {
      console.error('Error fetching teacher todos:', error);
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeacherTodos();
  }, []);

  const handleRefresh = () => {
    fetchTeacherTodos(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'overdue': return 'red';
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'overdue': return 'Quá hạn';
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Không xác định';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'assignment': return <BookOutlined className="text-blue-500" />;
      case 'quiz': return <FileTextOutlined className="text-green-500" />;
      default: return <FileTextOutlined className="text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    return moment(dateString).fromNow();
  };

  const handleGradeAssignment = (assignment) => {
    navigate(`/teacher/classroom/${assignment.classroomId}/assignment/${assignment.id}`);
  };

  const handleAnswerQuestion = (question) => {
    if (question.type === 'student_post') {
      navigate(`/teacher/classroom/${question.classroomId}?tab=stream&post=${question.id}`);
    } else {
      navigate(`/teacher/classroom/${question.classroomId}?tab=stream&comment=${question.id}`);
    }
  };

  const getProgressPercentage = (submitted, total) => {
    if (total === 0) return 0;
    return Math.round((submitted / total) * 100);
  };

  const pendingAssignments = data.assignments || [];
  const pendingQuestions = data.questions || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={2} className="mb-0">Việc cần làm</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={refreshing}
          >
            Làm mới
          </Button>
          <Badge count={pendingAssignments.length} color="red">
            <Button icon={<BookOutlined />}>
              Bài tập cần chấm
            </Button>
          </Badge>
          <Badge count={pendingQuestions.length} color="orange">
            <Button icon={<MessageOutlined />}>
              Câu hỏi chưa trả lời
            </Button>
          </Badge>
        </Space>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500 mb-2">
              {data.stats.pendingAssignments}
            </div>
            <Text type="secondary">Bài tập cần chấm</Text>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">
              {data.stats.pendingQuestions}
            </div>
            <Text type="secondary">Câu hỏi chưa trả lời</Text>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {data.stats.totalGradedSubmissions}
            </div>
            <Text type="secondary">Bài đã chấm</Text>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {data.stats.completionRate}%
            </div>
            <Text type="secondary">Tỷ lệ hoàn thành</Text>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <BookOutlined />
              Bài tập cần chấm ({pendingAssignments.length})
            </span>
          } 
          key="assignments"
        >
          <Card>
            {pendingAssignments.length === 0 ? (
              <Empty 
                description="Không có bài tập nào cần chấm"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={pendingAssignments}
                renderItem={(assignment) => (
                  <List.Item
                    actions={[
                      <Button 
                        key="grade"
                        type="primary" 
                        onClick={() => handleGradeAssignment(assignment)}
                      >
                        Chấm điểm ({assignment.ungradedCount || 0})
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={getTypeIcon(assignment.type)}
                      title={
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{assignment.title}</span>
                          <Tag color={getPriorityColor(assignment.priority)} className="capitalize">
                            {getPriorityText(assignment.priority)}
                          </Tag>
                        </div>
                      }
                      description={
                        <Space direction="vertical" size={2} className="w-full">
                          <Text type="secondary">{assignment.classroomName}</Text>
                          <div className="flex items-center gap-4">
                            <Text type="secondary">
                              <CalendarOutlined className="mr-1" />
                              Hạn nộp: {moment(assignment.dueDate).format('DD/MM/YYYY HH:mm')}
                            </Text>
                            <Text type="secondary">
                              {assignment.submissionsCount}/{assignment.totalStudents} đã nộp
                            </Text>
                          </div>
                          <Progress 
                            percent={getProgressPercentage(assignment.submissionsCount, assignment.totalStudents)}
                            size="small"
                            status={assignment.submissionsCount === assignment.totalStudents ? 'success' : 'active'}
                          />
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <MessageOutlined />
              Câu hỏi ({pendingQuestions.length})
            </span>
          } 
          key="questions"
        >
          <Card>
            {pendingQuestions.length === 0 ? (
              <Empty 
                description="Không có câu hỏi nào cần trả lời"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={pendingQuestions}
                renderItem={(question) => (
                  <List.Item
                    actions={[
                      <Button 
                        key="answer"
                        type="primary" 
                        onClick={() => handleAnswerQuestion(question)}
                      >
                        Trả lời
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar src={question.studentAvatar} icon={<UserOutlined />} size={40} />
                      }
                      title={
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{question.student}</span>
                          <Tag color="orange">
                            {question.type === 'student_post' ? 'Bài viết' : 'Bình luận'}
                          </Tag>
                        </div>
                      }
                      description={
                        <Space direction="vertical" size={2} className="w-full">
                          <HtmlContent 
                            content={question.content || question.question}
                            className="text-gray-700 -mt-4"
                            ellipsis={true}
                            maxLines={2}
                          />
                          <div className="flex items-center gap-4">
                            <Text type="secondary">{question.classroomName}</Text>
                            <Text type="secondary">
                              <ClockCircleOutlined className="mr-1" />
                              {formatTimeAgo(question.createdAt)}
                            </Text>
                          </div>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <CheckCircleOutlined />
              Thống kê tổng quan
            </span>
          } 
          key="overview"
        >
          <Card>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text type="secondary">Tổng số lớp học</Text>
                      <div className="text-2xl font-bold text-blue-600">
                        {data.stats.totalClassrooms || 0}
                      </div>
                    </div>
                    <BookOutlined className="text-blue-500 text-2xl" />
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text type="secondary">Tổng bài nộp</Text>
                      <div className="text-2xl font-bold text-green-600">
                        {data.stats.totalSubmissions || 0}
                      </div>
                    </div>
                    <FileTextOutlined className="text-green-500 text-2xl" />
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text type="secondary">Đã chấm điểm</Text>
                      <div className="text-2xl font-bold text-purple-600">
                        {data.stats.totalGradedSubmissions || 0}
                      </div>
                    </div>
                    <CheckCircleOutlined className="text-purple-500 text-2xl" />
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text type="secondary">Tỷ lệ hoàn thành</Text>
                      <div className="text-2xl font-bold text-orange-600">
                        {data.stats.completionRate || 0}%
                      </div>
                    </div>
                    <ExclamationCircleOutlined className="text-orange-500 text-2xl" />
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Title level={4}>Tiến độ chấm điểm</Title>
                <Progress 
                  percent={data.stats.completionRate || 0}
                  status="active"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <Text type="secondary" className="mt-2 block">
                  Đã chấm {data.stats.totalGradedSubmissions || 0} / {data.stats.totalSubmissions || 0} bài nộp
                </Text>
              </div>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default memo(TeacherTodo); 