  import React, { useEffect, useState } from 'react';
  import axios from 'axios';
  import { Table, Spin, Tag, Typography, Row, Col, Card, Tabs, Tooltip, Select } from 'antd';
  import {
    TrophyOutlined,
    FileTextOutlined,
    CheckSquareOutlined,
    FilterOutlined,
  } from '@ant-design/icons';
  import dayjs from 'dayjs';
  import assignmentAPI from '../../services/api/assignment.api';
  import quizAPI from '../../services/api/quiz.api';

  const { Title } = Typography;
  const { TabPane } = Tabs;
  const { Option } = Select;

  const StudentGrades = () => {
    const [assignmentList, setAssignmentList] = useState([]);
    const [quizList, setQuizList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClassroom, setSelectedClassroom] = useState(null);

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');

          const [assignmentRes, quizRes] = await Promise.all([
            assignmentAPI.getAssignmentStatsByStudent(),
            quizAPI.getQuizStatsByStudent(),
          ]);

          setAssignmentList(assignmentRes.data || []);
          setQuizList(quizRes.data || []);
        } catch (err) {
          console.error('Error fetching student grades:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, []);

    const getClassroomOptions = () => {
      const allItems = [...assignmentList, ...quizList];
      const names = [...new Set(allItems.map(item => item.classroom?.name).filter(Boolean))];
      return names.map(name => ({ label: name, value: name }));
    };

    const filterByClassroom = (list) => {
      return selectedClassroom
        ? list.filter(item => item.classroom?.name === selectedClassroom)
        : list;
    };

    const getGradedCount = () => {
      const all = [...assignmentList, ...quizList];
      return all.filter(item => item.submission?.grade !== undefined && item.submission?.grade !== null).length;
    };

    const getTotalCount = () => assignmentList.length + quizList.length;

    const getColumns = (type) => [
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        width: 250,
        ellipsis: true,
        fixed: 'left',
        render: (text) => <Tooltip title={text}>{text}</Tooltip>,
      },
      {
        title: 'Classroom',
        dataIndex: ['classroom', 'name'],
        key: 'classroom',
        width: 200,
        ellipsis: true,
        fixed: 'left',
        render: (text) => <Tooltip title={text}>{text}</Tooltip>,
      },
      {
        title: type === 'quiz' ? 'Start Time' : 'Due Date',
        dataIndex: type === 'quiz' ? 'startTime' : 'dueDate',
        key: type === 'quiz' ? 'startTime' : 'dueDate',
        width: 180,
        render: (date) =>
          date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'No Date',
      },
      {
        title: type === 'quiz' ? 'Score' : 'Grade',
        dataIndex: 'submission',
        key: 'grade',
        width: 150,
        render: (submission, record) => {
          if (!submission) return <Tag color="red">Not Submitted</Tag>;

          const score = submission.grade ?? submission.score;
          const total = record.totalPoints ?? record.totalQuestions ?? 100;

          return (
            <span style={{ color: 'green', fontWeight: 600 }}>
              {score} / {total}
            </span>
          );
        },
      },
      {
        title: type === 'quiz' ? 'End Time' : 'Graded At',
        key: 'endTimeOrGradedAt',
        width: 200,
        render: (_, record) => {
          if (type === 'quiz') {
            return record.endTime
              ? dayjs(record.endTime).format('DD/MM/YYYY HH:mm')
              : 'N/A';
          }

          return record.submission?.gradedAt
            ? dayjs(record.submission.gradedAt).format('DD/MM/YYYY HH:mm')
            : 'N/A';
        },
      },
      {
        title: 'Status',
        dataIndex: ['submission', 'status'],
        key: 'status',
        width: 150,
        render: (status) =>
          status ? (
            <Tag color="blue">{status}</Tag>
          ) : (
            <Tag color="red">No Submission</Tag>
          ),
      },
    ];

    return (
      <div style={{ padding: 24 }}>
        <Title level={3}>Student Grades</Title>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card bordered style={{ textAlign: 'center', borderRadius: 10 }}>
              <TrophyOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <div style={{ color: 'gray', marginTop: 8 }}>Graded Items</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
                {getGradedCount()} / {getTotalCount()}
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card bordered style={{ textAlign: 'center', borderRadius: 10 }}>
              <FileTextOutlined style={{ fontSize: 32, color: '#9254de' }} />
              <div style={{ color: 'gray', marginTop: 8 }}>Assignments</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
                {assignmentList.length}
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card bordered style={{ textAlign: 'center', borderRadius: 10 }}>
              <CheckSquareOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
              <div style={{ color: 'gray', marginTop: 8 }}>Quizzes</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
                {quizList.length}
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card bordered>
              <Title level={5}><FilterOutlined /> Filter by Classroom</Title>
              <Select
                placeholder="Select Classroom"
                style={{ width: '100%' }}
                allowClear
                value={selectedClassroom}
                onChange={value => setSelectedClassroom(value)}
                options={getClassroomOptions()}
              />
            </Card>
          </Col>
        </Row>

        {loading ? (
          <Spin size="large" />
        ) : (
          <Tabs defaultActiveKey="assignments">
            <TabPane tab="Assignments" key="assignments">
              <Table
                dataSource={filterByClassroom(assignmentList)}
                columns={getColumns('assignment')}
                rowKey="_id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: 1200, y: 400 }}
                sticky
              />
            </TabPane>
            <TabPane tab="Quizzes" key="quizzes">
              <Table
                dataSource={filterByClassroom(quizList)}
                columns={getColumns('quiz')}
                rowKey="_id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: 1200, y: 400 }}
                sticky
              />
            </TabPane>
          </Tabs>
        )}
      </div>
    );
  };

  export default StudentGrades;