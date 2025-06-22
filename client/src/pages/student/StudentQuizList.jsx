import React from 'react';
import { Card, Table, Empty, Typography, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import './student.css';

const { Title, Text } = Typography;

const StudentQuizList = () => {
  const navigate = useNavigate();

  const quizzes = [
    { topic: 'Probability', name: 'Chapter 2 exercises', quizClose: '-', submission: 'submission', grade: '10/10' },
    { topic: 'Discrete Random Variables and Probability Distribution', name: 'Chapter 3 exercises', quizClose: '-', grade: '10/10' },
    { topic: '*** Review for Test 1 ***', name: 'PT 1', quizClose: 'Monday, 21 October 2024, 12:00 AM',  grade: '-' },
    { topic: '*** Review for Test 2 ***', name: 'PT 2', quizClose: 'Monday, 21 October 2024, 12:00 AM', grade: '-' },
    { topic: '*** Review for Test 3 ***', name: 'Review for Progress Test 3', quizClose: 'Wednesday, 6 November 2024, 12:00 AM', grade: '10/10' },
  ];
  const handleQuizStart = (index) => {
    Modal.confirm({
      title: 'Start quiz?',
      content: 'Are you sure you want to begin this quiz? You will be timed.',
      okText: 'Start',
      cancelText: 'Cancel',
      onOk: () => navigate(`/student/quizzes/${index}`),
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
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
    },
  ];

  return (
    <div className="p-6">
      <Title level={3}>Quizzes</Title>
      <Card>
        {quizzes.length > 0 ? (
          <Table
            dataSource={quizzes}
            columns={columns}
            rowKey={(record, index) => index}
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
