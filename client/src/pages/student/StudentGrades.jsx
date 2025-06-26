import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography,
  Statistic,
  Progress,
  Table,
  Tag,
  Avatar,
  Empty,
  Spin,
  Select,
  Input,
  Button,
  Space,
  Tooltip,
  Divider
} from 'antd';
import { 
  TrophyOutlined,
  BookOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  BarChartOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const StudentGrades = () => {
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterClassroom, setFilterClassroom] = useState('all');
  const navigate = useNavigate();

  // Mock data - sẽ được thay thế bằng API call thực tế
  const [studentGrades] = useState({
    student: {
      id: 'st1',
      name: 'Nguyễn Văn An',
      email: 'an.nguyen@student.edu',
      avatar: null
    },
    classrooms: [
      {
        id: 'class1',
        name: 'Web Development',
        subject: 'Computer Science',
        teacher: 'Dr. Smith',
        totalPoints: 400,
        earnedPoints: 342,
        percentage: 85.5
      },
      {
        id: 'class2', 
        name: 'Database Management',
        subject: 'Information Technology',
        teacher: 'Prof. Johnson',
        totalPoints: 300,
        earnedPoints: 240,
        percentage: 80.0
      },
      {
        id: 'class3',
        name: 'Mobile App Development',
        subject: 'Computer Science', 
        teacher: 'Dr. Brown',
        totalPoints: 350,
        earnedPoints: 315,
        percentage: 90.0
      }
    ],
    grades: [
      {
        id: 'g1',
        classroomId: 'class1',
        classroomName: 'Web Development',
        type: 'assignment',
        title: 'React Components Assignment',
        maxPoints: 100,
        earnedPoints: 85,
        percentage: 85,
        submittedAt: '2024-01-20T10:00:00Z',
        gradedAt: '2024-01-22T14:30:00Z',
        feedback: 'Excellent work on component structure. Consider optimizing performance.',
        status: 'graded'
      },
      {
        id: 'g2',
        classroomId: 'class1',
        classroomName: 'Web Development',
        type: 'quiz',
        title: 'HTML/CSS Fundamentals Quiz',
        maxPoints: 50,
        earnedPoints: 47,
        percentage: 94,
        submittedAt: '2024-01-18T14:30:00Z',
        gradedAt: '2024-01-18T14:35:00Z',
        feedback: 'Great understanding of CSS flexbox!',
        status: 'graded'
      },
      {
        id: 'g3',
        classroomId: 'class1',
        classroomName: 'Web Development',
        type: 'assignment',
        title: 'JavaScript Functions Project',
        maxPoints: 100,
        earnedPoints: 92,
        percentage: 92,
        submittedAt: '2024-01-25T16:20:00Z',
        gradedAt: '2024-01-27T09:15:00Z',
        feedback: 'Well implemented functions. Good error handling.',
        status: 'graded'
      },
      {
        id: 'g4',
        classroomId: 'class2',
        classroomName: 'Database Management',
        type: 'assignment',
        title: 'SQL Query Assignment',
        maxPoints: 80,
        earnedPoints: 72,
        percentage: 90,
        submittedAt: '2024-01-19T15:45:00Z',
        gradedAt: '2024-01-21T11:20:00Z',
        feedback: 'Complex queries executed correctly. Minor syntax improvements needed.',
        status: 'graded'
      },
      {
        id: 'g5',
        classroomId: 'class2',
        classroomName: 'Database Management',
        type: 'quiz',
        title: 'Database Design Quiz',
        maxPoints: 40,
        earnedPoints: 35,
        percentage: 87.5,
        submittedAt: '2024-01-16T13:15:00Z',
        gradedAt: '2024-01-16T13:20:00Z',
        feedback: 'Good understanding of normalization principles.',
        status: 'graded'
      },
      {
        id: 'g6',
        classroomId: 'class3',
        classroomName: 'Mobile App Development',
        type: 'assignment',
        title: 'Flutter UI Design',
        maxPoints: 120,
        earnedPoints: 108,
        percentage: 90,
        submittedAt: '2024-01-22T10:45:00Z',
        gradedAt: '2024-01-24T16:30:00Z',
        feedback: 'Beautiful UI design with smooth animations. Excellent work!',
        status: 'graded'
      },
      {
        id: 'g7',
        classroomId: 'class3',
        classroomName: 'Mobile App Development',
        type: 'quiz',
        title: 'Dart Programming Quiz',
        maxPoints: 60,
        earnedPoints: 54,
        percentage: 90,
        submittedAt: '2024-01-15T09:30:00Z',
        gradedAt: '2024-01-15T09:35:00Z',
        feedback: 'Strong grasp of Dart syntax and concepts.',
        status: 'graded'
      },
      {
        id: 'g8',
        classroomId: 'class1',
        classroomName: 'Web Development',
        type: 'assignment',
        title: 'Final Project - E-commerce Website',
        maxPoints: 150,
        earnedPoints: null,
        percentage: null,
        submittedAt: '2024-01-28T18:00:00Z',
        gradedAt: null,
        feedback: null,
        status: 'submitted'
      }
    ]
  });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return '#52c41a';
    if (percentage >= 80) return '#1890ff';
    if (percentage >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const getGradeTag = (percentage) => {
    if (percentage >= 90) return { color: 'green', text: 'Xuất sắc' };
    if (percentage >= 80) return { color: 'blue', text: 'Giỏi' };
    if (percentage >= 70) return { color: 'orange', text: 'Khá' };
    return { color: 'red', text: 'Trung bình' };
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'assignment': return <FileTextOutlined className="text-blue-500" />;
      case 'quiz': return <CheckSquareOutlined className="text-green-500" />;
      case 'exam': return <BookOutlined className="text-red-500" />;
      default: return <FileTextOutlined className="text-gray-500" />;
    }
  };

  const getTypeTag = (type) => {
    switch (type) {
      case 'assignment': return { color: 'blue', text: 'Assignment' };
      case 'quiz': return { color: 'green', text: 'Quiz' };
      case 'exam': return { color: 'red', text: 'Exam' };
      default: return { color: 'default', text: type };
    }
  };

  // Calculate overall statistics
  const overallStats = {
    totalAssignments: studentGrades.grades.filter(g => g.type === 'assignment').length,
    totalQuizzes: studentGrades.grades.filter(g => g.type === 'quiz').length,
    totalItems: studentGrades.grades.length,
    gradedItems: studentGrades.grades.filter(g => g.status === 'graded').length,
    averageScore: Math.round(
      studentGrades.grades
        .filter(g => g.percentage !== null)
        .reduce((sum, g) => sum + g.percentage, 0) /
      studentGrades.grades.filter(g => g.percentage !== null).length
    )
  };

  // Filter grades
  const filteredGrades = studentGrades.grades.filter(grade => {
    const matchesSearch = grade.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         grade.classroomName.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = filterType === 'all' || grade.type === filterType;
    const matchesClassroom = filterClassroom === 'all' || grade.classroomId === filterClassroom;
    
    return matchesSearch && matchesType && matchesClassroom;
  });

  const columns = [
    {
      title: 'Assignment/Quiz',
      key: 'title',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="text-lg">
            {getTypeIcon(record.type)}
          </div>
          <div>
            <div className="font-medium">{record.title}</div>
            <Text type="secondary" className="text-xs">
              {record.classroomName}
            </Text>
            <br />
            <Tag size="small" color={getTypeTag(record.type).color}>
              {getTypeTag(record.type).text}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      align: 'center',
      width: 120,
      render: (_, record) => {
        if (record.status !== 'graded') {
          return (
            <div className="text-center">
              <Tag color="orange">Pending</Tag>
            </div>
          );
        }
        
        return (
          <div className="text-center">
            <div 
              className="text-lg font-bold mb-1"
              style={{ color: getGradeColor(record.percentage) }}
            >
              {record.earnedPoints}/{record.maxPoints}
            </div>
            <Progress 
              percent={record.percentage}
              size="small"
              strokeColor={getGradeColor(record.percentage)}
              showInfo={false}
            />
            <Text className="text-xs">{record.percentage}%</Text>
          </div>
        );
      },
    },
    {
      title: 'Grade',
      key: 'grade',
      align: 'center',
      width: 100,
      render: (_, record) => {
        if (record.status !== 'graded') {
          return <Text type="secondary">-</Text>;
        }
        
        const gradeTag = getGradeTag(record.percentage);
        return (
          <Tag color={gradeTag.color}>
            {gradeTag.text}
          </Tag>
        );
      },
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 120,
      render: (date) => (
        <div className="text-center">
          <div>{moment(date).format('MMM DD')}</div>
          <Text type="secondary" className="text-xs">
            {moment(date).format('HH:mm')}
          </Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 80,
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => {
              // Navigate to assignment/quiz detail
              navigate(`/student/classrooms/${record.classroomId}`);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          📊 My Grades
        </Title>
        <Text type="secondary">
          View all your assignment and quiz grades across all classrooms
        </Text>
      </div>

      {/* Overall Statistics */}
      <Row gutter={[24, 24]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <div className="text-3xl mb-2 text-blue-500">
              <BarChartOutlined />
            </div>
            <Statistic 
              title="Overall Average" 
              value={overallStats.averageScore}
              suffix="%"
              valueStyle={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: getGradeColor(overallStats.averageScore)
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <div className="text-3xl mb-2 text-green-500">
              <TrophyOutlined />
            </div>
            <Statistic 
              title="Graded Items" 
              value={overallStats.gradedItems}
              suffix={`/ ${overallStats.totalItems}`}
              valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <div className="text-3xl mb-2 text-purple-500">
              <FileTextOutlined />
            </div>
            <Statistic 
              title="Assignments" 
              value={overallStats.totalAssignments}
              valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <div className="text-3xl mb-2 text-orange-500">
              <CheckSquareOutlined />
            </div>
            <Statistic 
              title="Quizzes" 
              value={overallStats.totalQuizzes}
              valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Classroom Performance Overview */}
      <Card title="📚 Performance by Classroom" className="mb-6">
        <Row gutter={[16, 16]}>
          {studentGrades.classrooms.map((classroom) => (
            <Col xs={24} md={8} key={classroom.id}>
              <Card size="small" className="h-full">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar 
                    style={{ backgroundColor: '#1890ff' }}
                    icon={<BookOutlined />}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{classroom.name}</div>
                    <Text type="secondary" className="text-xs">
                      {classroom.teacher}
                    </Text>
                  </div>
                </div>
                
                <div className="text-center mb-3">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: getGradeColor(classroom.percentage) }}
                  >
                    {classroom.percentage}%
                  </div>
                  <Progress 
                    percent={classroom.percentage}
                    strokeColor={getGradeColor(classroom.percentage)}
                    size="small"
                    showInfo={false}
                  />
                </div>
                
                <div className="text-center">
                  <Text className="text-xs text-gray-500">
                    {classroom.earnedPoints} / {classroom.totalPoints} points
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Grades Table */}
      <Card 
        title="📋 All Grades"
        extra={
          <Space>
            <Search
              placeholder="Search assignments..."
              allowClear
              style={{ width: 200 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              placeholder="Filter by type"
              style={{ width: 120 }}
              value={filterType}
              onChange={setFilterType}
            >
              <Option value="all">All Types</Option>
              <Option value="assignment">Assignment</Option>
              <Option value="quiz">Quiz</Option>
              <Option value="exam">Exam</Option>
            </Select>
            <Select
              placeholder="Filter by classroom"
              style={{ width: 180 }}
              value={filterClassroom}
              onChange={setFilterClassroom}
            >
              <Option value="all">All Classrooms</Option>
              {studentGrades.classrooms.map(classroom => (
                <Option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </Option>
              ))}
            </Select>
          </Space>
        }
      >
        {filteredGrades.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredGrades}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} grades`
            }}
          />
        ) : (
          <Empty 
            description="No grades found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    </div>
  );
};

export default StudentGrades; 