import React, { useState, memo } from 'react';
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
  Progress
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  BookOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const TeacherTodo = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assignments');

  // Mock data for to-do items
  const assignments = [
    {
      id: '1',
      title: 'Programming Assignment 1',
      classroomName: 'Web Development',
      classroomId: 'class1',
      submissionsCount: 15,
      totalStudents: 25,
      dueDate: '2024-01-25T23:59:00Z',
      priority: 'high',
      type: 'assignment'
    },
    {
      id: '2', 
      title: 'Chapter Quiz 1-3',
      classroomName: 'Programming Fundamentals',
      classroomId: 'class2',
      submissionsCount: 22,
      totalStudents: 30,
      dueDate: '2024-01-20T15:00:00Z',
      priority: 'medium',
      type: 'quiz'
    },
    {
      id: '3',
      title: 'Final Project Proposal',
      classroomName: 'Advanced Web Dev',
      classroomId: 'class3',
      submissionsCount: 8,
      totalStudents: 20,
      dueDate: '2024-01-28T23:59:00Z',
      priority: 'low',
      type: 'assignment'
    }
  ];

  const questions = [
    {
      id: '1',
      student: 'Alice Johnson',
      question: 'I need help with the React hooks assignment',
      classroomName: 'Web Development',
      classroomId: 'class1',
      createdAt: '2024-01-18T10:30:00Z',
      isAnswered: false
    },
    {
      id: '2',
      student: 'Bob Smith', 
      question: 'When is the next assignment due?',
      classroomName: 'Programming Fundamentals',
      classroomId: 'class2',
      createdAt: '2024-01-17T14:20:00Z',
      isAnswered: false
    },
    {
      id: '3',
      student: 'Carol Davis',
      question: 'Can you explain the concept of closures again?',
      classroomName: 'Advanced Web Dev',
      classroomId: 'class3',
      createdAt: '2024-01-16T09:15:00Z',
      isAnswered: true
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
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
    navigate(`/teacher/classroom/${assignment.classroomId}?tab=grades&assignment=${assignment.id}`);
  };

  const handleAnswerQuestion = (question) => {
    navigate(`/teacher/classroom/${question.classroomId}?tab=stream&question=${question.id}`);
  };

  const getProgressPercentage = (submitted, total) => {
    return Math.round((submitted / total) * 100);
  };

  const pendingAssignments = assignments.filter(a => a.submissionsCount < a.totalStudents);
  const pendingQuestions = questions.filter(q => !q.isAnswered);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={2} className="mb-0">Việc cần làm</Title>
        <Space>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500 mb-2">
              {pendingAssignments.length}
            </div>
            <Text type="secondary">Bài tập cần chấm</Text>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">
              {pendingQuestions.length}
            </div>
            <Text type="secondary">Câu hỏi chưa trả lời</Text>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {assignments.reduce((sum, a) => sum + a.submissionsCount, 0)}
            </div>
            <Text type="secondary">Bài đã nộp</Text>
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
                        Chấm điểm
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={getTypeIcon(assignment.type)}
                      title={
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{assignment.title}</span>
                          <Tag color={getPriorityColor(assignment.priority)} className="capitalize">
                            {assignment.priority} priority
                          </Tag>
                        </div>
                      }
                      description={
                        <Space direction="vertical" size={2} className="w-full">
                          <Text type="secondary">{assignment.classroomName}</Text>
                          <div className="flex items-center gap-4">
                            <Text type="secondary">
                              <CalendarOutlined className="mr-1" />
                              Due {moment(assignment.dueDate).format('MMM DD, YYYY')}
                            </Text>
                            <Text type="secondary">
                              {assignment.submissionsCount}/{assignment.totalStudents} submitted
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
                        <Avatar icon={<UserOutlined />} size={40} />
                      }
                      title={
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{question.student}</span>
                          <Tag color="orange">Chưa trả lời</Tag>
                        </div>
                      }
                      description={
                        <Space direction="vertical" size={2} className="w-full">
                          <Text className="text-gray-700">{question.question}</Text>
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
              Đã hoàn thành
            </span>
          } 
          key="completed"
        >
          <Card>
            <Empty 
              description="Lịch sử công việc đã hoàn thành"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default memo(TeacherTodo); 