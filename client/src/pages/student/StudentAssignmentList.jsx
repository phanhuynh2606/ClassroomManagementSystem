import React from 'react';
import { Card, Table, Empty, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import './student.css';

const { Title, Text } = Typography;

const StudentAssignmentList = () => {
  const navigate = useNavigate();

  const assignments = [
    { topic: '', assignment: 'Computer project', dueDate: 'Friday, 8 November 2024, 11:59 PM', submission: 'No submission', grade: '-' },
    { topic: 'Probability', assignment: 'Chapter 2 exercises', dueDate: '-', submission: 'submission', grade: '10/10' },
    { topic: 'Discrete Random Variables and Probability Distribution', assignment: 'Chapter 3 exercises', dueDate: '-', submission: 'submission', grade: '10/10' },
    { topic: 'Statistical Intervals for a Single Sample', assignment: 'Assignment 2', dueDate: 'Monday, 21 October 2024, 12:00 AM', submission: 'No submission', grade: '-' },
    { topic: 'Statistical Intervals for a Single Sample', assignment: 'Assignment 2', dueDate: 'Monday, 21 October 2024, 12:00 AM', submission: 'No submission', grade: '-' },
    { topic: '*** Review for Test 3 ***', assignment: 'Review for Progress Test 3', dueDate: 'Wednesday, 6 November 2024, 12:00 AM', submission: 'submission', grade: '10/10' },
  ];

  const columns = [
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
      render: (text) => <Text>{text || '-'}</Text>,
    },
    {
      title: 'Assignments',
      dataIndex: 'assignment',
      key: 'assignment',
      render: (text, record, index) => (
        <Text
          type="danger"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/student/assignments/${index}`)}
        >
          {text}
        </Text>
      ),
    },
    {
      title: 'Due date',
      dataIndex: 'dueDate',
      key: 'dueDate',
    },
    {
      title: 'Submission',
      dataIndex: 'submission',
      key: 'submission',
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
    },
  ];

  return (
    <div className="p-6">
      <Title level={3}>Assignments</Title>
      <Card>
        {assignments.length > 0 ? (
          <Table
            dataSource={assignments}
            columns={columns}
            rowKey={(record, index) => index}
            pagination={false}
            bordered
          />
        ) : (
          <Empty description="No assignments available" />
        )}
      </Card>
    </div>
  );
};

export default StudentAssignmentList;
