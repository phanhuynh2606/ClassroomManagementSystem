import React from 'react';
import { Card, Table, Empty, Typography, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const StudentQuizList = ({ classroomId, onNavigateTab }) => {
  const navigate = useNavigate();

  const quizzes = [
    { id : '1', topic: 'Probability', name: 'Chapter 2 exercises', quizClose: '-', submission: 'submission', grade: '10/10' },
    { id : '2',topic: 'Discrete Random Variables and Probability Distribution', name: 'Chapter 3 exercises', quizClose: '-', grade: '10/10' },
    { id : '3',topic: '*** Review for Test 1 ***', name: 'PT 1', quizClose: 'Monday, 21 October 2024, 12:00 AM', grade: '-' },
    { id : '4',topic: '*** Review for Test 2 ***', name: 'PT 2', quizClose: 'Monday, 21 October 2024, 12:00 AM', grade: '-' },
    { id : '5',topic: '*** Review for Test 3 ***', name: 'Review for Progress Test 3', quizClose: 'Wednesday, 6 November 2024, 12:00 AM', grade: '10/10' },
  ];

  const handleQuizStart = (index) => {
    Modal.confirm({
      title: 'Start Quiz',
      content: 'Are you sure you want to begin this quiz? You will be timed.',
      okText: 'Start',
      cancelText: 'Cancel',
      onOk: () => navigate(`/student/classrooms/${classroomId}/quizzes/${index}`),
    });
  };

  const columns = [
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
      render: (text) => <Text>{text || '-'}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record, index) => (
        <Text
          type="danger"
          style={{ cursor: 'pointer' }}
          onClick={() => handleQuizStart(index)}
        >
          {text}
        </Text>
      ),
    },
    {
      title: 'Quiz Close',
      dataIndex: 'quizClose',
      key: 'quizClose',
      render: (text) => <Text>{text || '-'}</Text>,
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
      render: (text) => <Text>{text || '-'}</Text>,
    },
  ];

  return (
    <div className="p-6">
      <Title level={3}>Quizzes</Title>
      <Card styles={{ body: { padding: 12 } }}>
        {quizzes.length > 0 ? (
          <Table
            dataSource={quizzes}
            columns={columns}
            rowKey="id"
            pagination={false}
            bordered
          />
        ) : (
          <Empty description="No quizzes available" />
        )}
      </Card>
    </div>
  );
};

export default StudentQuizList;
