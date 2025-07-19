import React from 'react';
import { Card, Table, Empty, Typography, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import quizAPI from '../../services/api/quiz.api';
import { useEffect } from 'react';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const StudentQuizList = ({ classroomId, onNavigateTab }) => {
  const navigate = useNavigate();
  const [dataQuizzes, setDataQuizzes] = useState([]);
  useEffect(() => {
    fetchQuizzes();
  }, [classroomId]);

  const fetchQuizzes = async () => {
    try {
      // Simulate fetching quizzes data
     const response = await quizAPI.getByClassroom(classroomId);
      setDataQuizzes(response.data);
    } catch (error) {
      message.error('Failed to load quizzes');
    }
  };

  console.log('Data Quizzes:', dataQuizzes);
  

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
  title: 'Title',
  dataIndex: 'title',
  key: 'title',
  render: (text, record) => {
    const isExpired = dayjs().isAfter(dayjs(record.endTime));

    if (record.isArchived) {
      return <Text type="secondary">{text}</Text>;
    }

    if (isExpired) {
      return <Text type="danger">{text} (Expired)</Text>;
    }

    return (
      <Text
        type="success"
        style={{ cursor: 'pointer' }}
        onClick={() => handleQuizStart(record._id)}
      >
        {text}
      </Text>
    );
  },
},
  {
    title: 'Category',
    dataIndex: 'category',
    key: 'category',
    render: (text) => <Text>{text || '-'}</Text>,
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    render: (text) => <Text>{text || '-'}</Text>,
  },
  {
    title: 'Deadline',
    dataIndex: 'endTime',
    key: 'endTime',
    render: (text) => {
      if (!text) return <Text>-</Text>;
      const isExpired = dayjs().isAfter(dayjs(text));
      return (
        <Text type={isExpired ? 'danger' : 'success'}>
          {dayjs(text).format('YYYY-MM-DD HH:mm')} ({isExpired ? 'Expired' : 'Available'})
        </Text>
      );
    },
  },
  {
    title: 'Status',
    dataIndex: 'isArchived',
    key: 'isArchived',
    render: (isArchived) => (
      <Text type={isArchived ? 'secondary' : 'success'}>
        {isArchived ? 'Archived' : 'Active'}
      </Text>
    ),
  },
  {
    title: 'Grade',
    key: 'grade',
    render: (text, record) => (
      <Text>
        {record.submissions && record.submissions.length > 0
          ? `${record.submissions[0].grade} / ${record.questions.length}`
          : '-'}
      </Text>
    ),
  }
];

  return (
    <div className="p-6">
      <Title level={3}>Quizzes</Title>
      <Card styles={{ body: { padding: 12 } }}>
        {dataQuizzes.length > 0 ? (
          <Table
            dataSource={dataQuizzes}
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
