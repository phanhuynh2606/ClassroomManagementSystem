// components/student/StudentAssignmentsTab.jsx
import React from 'react';
import { Card, Table, Typography, Row, Col, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const StudentAssignmentList = ({ classroomId, onNavigateTab }) => {
  const navigate = useNavigate();

  const assignments = [
    { id: '1', topic: '', assignment: 'Computer project', dueDate: 'Friday, 8 November 2024, 11:59 PM', submission: 'No submission', grade: '-' },
    { id: '2', topic: 'Probability', assignment: 'Chapter 2 exercises', dueDate: '-', submission: 'submission', grade: '10/10' },
    { id: '3', topic: 'Discrete Random Variables and Probability Distribution', assignment: 'Chapter 3 exercises', dueDate: '-', submission: 'submission', grade: '10/10' },
    { id: '4',topic: 'Statistical Intervals for a Single Sample', assignment: 'Assignment 2', dueDate: 'Monday, 21 October 2024, 12:00 AM', submission: 'No submission', grade: '-' },
    { id: '5',topic: '*** Review for Test 3 ***', assignment: 'Review for Progress Test 3', dueDate: 'Wednesday, 6 November 2024, 12:00 AM', submission: 'submission', grade: '10/10' },
  ];

  const handleNavigate = (index) => {
    navigate(`/student/classrooms/${classroomId}/assignments/${index}`);
  };

  const renderText = (text) => <Text>{text || '-'}</Text>;

  const columns = [
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
      render: renderText,
    },
    {
      title: 'Assignment',
      dataIndex: 'assignment',
      key: 'assignment',
      render: (text, record, index) => (
        <Text type="danger" style={{ cursor: 'pointer' }} onClick={() => handleNavigate(index)}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Due date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: renderText,
    },
    {
      title: 'Submission',
      dataIndex: 'submission',
      key: 'submission',
      render: renderText,
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
      render: renderText,
    },
  ];

  return (
    <Row gutter={[24, 24]}>
      <Col span={24}>
        <Card styles={{ body: { padding: 12 } }}>
          {assignments.length > 0 ? (
            <Table
              dataSource={assignments}
              columns={columns}
              rowKey="id"
              pagination={false}
              bordered
            />
          ) : (
            <Empty description="No assignments available" />
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default StudentAssignmentList;