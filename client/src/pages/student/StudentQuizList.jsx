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
      const response = await quizAPI.getByClassroom(classroomId);
      if (response.data) {
        setDataQuizzes(response.data);
      }
    } catch (error) {
      message.error('Failed to load quizzes');
    }
  };

  const getVisibilityProps = (visibility) => {
    switch (visibility) {
      case 'published':
        return { type: 'success', text: 'Published' };
      case 'scheduled':
        return { type: 'processing', text: 'Scheduled' };
      default:
        return { type: 'secondary', text: visibility };
    }
  };


  const handleQuizStart = (index) => {
    if (index.visibility === 'scheduled' && dayjs().isBefore(dayjs(index.startTime))) {
      message.warning('This quiz is scheduled to start in the future.');
      return;
    }
    if (index.submissions && index.submissions.length >= index.maxAttempts) {
      message.warning('You have reached the maximum number of attempts.');
      return;
    }
    Modal.confirm({
      title: 'Start Quiz',
      content: 'Are you sure you want to begin this quiz? You will be timed.',
      okText: 'Start',
      cancelText: 'Cancel',
      onOk: () => navigate(`/student/classrooms/${classroomId}/quizzes/${index._id}`),
    });
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => {
        const isExpired = dayjs().isAfter(dayjs(record.endTime));

        if (record.isArchived) {
          return <Text type="secondary">{text}</Text>;
        }

        if (isExpired) {
          return <Text type="danger">{text} (Expired)</Text>;
        }

        return (
          <Text type="success" style={{ cursor: "pointer" }} onClick={() => handleQuizStart(record)}>
            {text}
          </Text>
        );
      },
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (text) => <Text>{text || "-"}</Text>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => <Text>{text || "-"}</Text>,
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (text) => {
        if (!text) return <Text>-</Text>;
        return <Text>{text} min</Text>;
      },
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      key: "startTime",
      render: (text) => {
        if (!text) return <Text>-</Text>;
        return <Text type="success">{dayjs(text).format("YYYY-MM-DD HH:mm")}</Text>;
      },
    },
    {
      title: "Deadline",
      dataIndex: "endTime",
      key: "endTime",
      render: (text) => {
        if (!text) return <Text>-</Text>;
        const isExpired = dayjs().isAfter(dayjs(text));
        return (
          <Text type={isExpired ? "danger" : "success"}>
            {dayjs(text).format("YYYY-MM-DD HH:mm")} ({isExpired ? "Expired" : "Available"})
          </Text>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "visibility",
      key: "visibility",
      render: (visibility) => {
        const { type, text } = getVisibilityProps(visibility);
        return <Text type={type}>{text}</Text>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          {record.allowReview ? (
            <Text
              type="primary"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/student/classrooms/${classroomId}/quizzes/${record._id}/results`)}
            >
              View Result
            </Text>
          ) : (
            <Text type="primary" style={{ cursor: "pointer" }}
              onClick={() => message.warning('Giáo viên chưa bật tính năng xem lại đáp án')}>
              View Result
            </Text>
          )}
        </>
      ),
    },
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
