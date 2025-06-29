// components/student/StudentAssignmentsTab.jsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Row, Col, Empty, message, Spin, Tag, Button, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EyeOutlined, FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { assignmentAPI } from '../../services/api';
import moment from 'moment';

const { Text, Title } = Typography;

// Utility function to strip HTML tags
const stripHtml = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const StudentAssignmentList = ({ classroomId, onNavigateTab }) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classroomId) {
      fetchAssignments();
    }
  }, [classroomId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentAPI.getStudentAssignments(classroomId);
      if (response.success) {
        setAssignments(response.data.docs || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      message.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (assignment) => {
    navigate(`/student/classrooms/${classroomId}/assignments/${assignment._id}`);
  };

  const getSubmissionStatus = (assignment) => {
    // Check visibility first
    if (assignment.visibility === 'scheduled' && assignment.publishDate && moment(assignment.publishDate).isAfter(moment())) {
      return {
        status: 'scheduled',
        text: 'Scheduled',
        color: 'blue',
        icon: <ClockCircleOutlined />
      };
    }
    
    if (assignment.visibility === 'draft') {
      return {
        status: 'draft',
        text: 'Draft',
        color: 'default'
      };
    }

    const userSubmission = assignment.userSubmission;
    
    if (!userSubmission) {
      const isOverdue = moment().isAfter(moment(assignment.dueDate));
      return {
        status: isOverdue ? 'overdue' : 'not_submitted',
        text: isOverdue ? 'Overdue' : 'Not submitted',
        color: isOverdue ? 'red' : 'orange'
      };
    }

    switch (userSubmission.status) {
      case 'submitted':
        return { status: 'submitted', text: 'Submitted', color: 'blue' };
      case 'graded':
        return { status: 'graded', text: 'Graded', color: 'green' };
      case 'late':
        return { status: 'late', text: 'Late submission', color: 'orange' };
      default:
        return { status: 'pending', text: 'Pending', color: 'default' };
    }
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return '-';
    const date = moment(dateString);
    const now = moment();
    
    if (date.isBefore(now)) {
      return <Text type="danger">{date.format('MMM D, YYYY HH:mm')}</Text>;
    } else if (date.diff(now, 'days') <= 7) {
      return <Text type="warning">{date.format('MMM D, YYYY HH:mm')}</Text>;
    } else {
      return <Text>{date.format('MMM D, YYYY HH:mm')}</Text>;
    }
  };

  const columns = [
    {
      title: 'Assignment',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-blue-500" />
          <div>
            <Text 
              strong 
              style={{ cursor: 'pointer' }} 
              className="hover:text-blue-600"
              onClick={() => handleNavigate(record)}
            >
              {text}
            </Text>
            {record.description && (
              <div>
                <Tooltip title={stripHtml(record.description)} placement="top">
                  <Text 
                    type="secondary" 
                    className="text-sm"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '300px',
                      lineHeight: '1.5'
                    }}
                  >
                    {stripHtml(record.description.length > 80 ? record.description.substring(0, 80) + '...' : record.description)}
                  </Text>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (dueDate, record) => (
        <div>
          {formatDueDate(dueDate)}
          {record.visibility === 'scheduled' && record.publishDate && moment(record.publishDate).isAfter(moment()) && (
            <div>
              <Text type="secondary" className="text-xs">
                <ClockCircleOutlined /> Available {moment(record.publishDate).format('DD/MM HH:mm')}
              </Text>
            </div>
          )}
        </div>
      ),
      width: 180,
    },
    {
      title: 'Points',
      dataIndex: 'totalPoints',
      key: 'totalPoints',
      render: (points) => <Text>{points || 0} pts</Text>,
      width: 100,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const status = getSubmissionStatus(record);
        return (
          <Tag color={status.color} icon={status.icon}>
            {status.text}
          </Tag>
        );
      },
      width: 120,
    },
    {
      title: 'Grade',
      key: 'grade',
      render: (_, record) => {
        const userSubmission = record.userSubmission;
        if (userSubmission && userSubmission.grade !== null) {
          return (
            <Text strong className="text-green-600">
              {userSubmission.grade}/{record.totalPoints}
            </Text>
          );
        }
        return <Text type="secondary">-</Text>;
      },
      width: 100,
    },
    {
      title: "Graded At",
      key: 'gradedAt',
      render: (_, record) => <Text>{record.userSubmission ? moment(record.userSubmission.gradedAt).format('DD/MM/YYYY HH:mm') : '-'}</Text>,
      width: 180,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleNavigate(record)}
        >
          View
        </Button>
      ),
      width: 80,
    },
  ];

  if (loading) {
    return (
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <div className="flex justify-center items-center py-8">
              <Spin size="large" tip="Loading assignments..." />
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  // Calculate assignment statistics
  const stats = {
    total: assignments.length,
    submitted: assignments.filter(a => a.userSubmission && a.userSubmission.status !== 'pending').length,
    graded: assignments.filter(a => a.userSubmission && a.userSubmission.status === 'graded').length,
    overdue: assignments.filter(a => !a.userSubmission && moment().isAfter(moment(a.dueDate))).length,
  };

  return (
    <Row gutter={[24, 24]}>
      {/* Statistics Cards */}
      <Col span={24}>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-gray-500">Total</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
                <div className="text-gray-500">Submitted</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.graded}</div>
                <div className="text-gray-500">Graded</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                <div className="text-gray-500">Overdue</div>
              </div>
            </Card>
          </Col>
        </Row>
      </Col>

      {/* Assignments Table */}
      <Col span={24}>
        <Card 
          title={
            <div className="flex items-center gap-2">
              <FileTextOutlined />
              <span>My Assignments</span>
            </div>
          }
        >
          {assignments.length > 0 ? (
            <Table
              dataSource={assignments}
              columns={columns}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} assignments`
              }}
              className="assignment-table"
            />
          ) : (
            <Empty 
              description="No assignments available"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default StudentAssignmentList;