import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Button, 
  Typography, 
  Space,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Divider,
  Tag,
  Timeline,
  Avatar,
  Table,
  Tooltip,
  Modal,
  message
} from 'antd';
import { 
  ArrowLeftOutlined,
  EditOutlined,
  TrophyOutlined,
  UserOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  EyeOutlined,
  DownloadOutlined,
  StarOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';

// Import components
import AssignmentGradingModal from './components/AssignmentGradingModal';
import SubmissionManagement from './components/SubmissionManagement';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const AssignmentDetail = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionManagementVisible, setSubmissionManagementVisible] = useState(false);

  // Mock assignment data
  const [assignmentData] = useState({
    id: assignmentId,
    title: 'Programming Assignment 1: Basic JavaScript',
    description: 'Complete the basic programming exercises covering variables, functions, and arrays.',
    instructions: `
**Assignment Instructions:**

1. **Variables and Data Types** (25 points)
   - Create variables of different data types
   - Demonstrate type conversion
   - Use const, let, and var appropriately

2. **Functions** (35 points)
   - Write at least 3 functions with different purposes
   - Use both arrow functions and regular functions
   - Include function parameters and return values

3. **Arrays and Objects** (40 points)
   - Create and manipulate arrays
   - Use array methods (map, filter, reduce)
   - Work with objects and object methods

**Submission Guidelines:**
- Submit your code as .js file
- Include comments explaining your logic
- Test your code before submission
- Follow JavaScript naming conventions

**Grading Criteria:**
- Code functionality (50%)
- Code quality and comments (30%)
- Following instructions (20%)
    `,
    dueDate: '2024-02-15T23:59:00Z',
    totalPoints: 100,
    status: 'published',
    submissionsCount: 18,
    totalStudents: 25,
    gradedCount: 12,
    attachments: [
      { 
        name: 'assignment_template.js', 
        size: '2.1 KB', 
        url: '/files/assignment_template.js',
        type: 'application/javascript'
      },
      { 
        name: 'requirements.pdf', 
        size: '245 KB', 
        url: '/files/requirements.pdf',
        type: 'application/pdf'
      }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    allowLateSubmission: true,
    latePenalty: 5,
    classroom: {
      id: classId,
      name: 'Web Development Fundamentals',
      subject: 'Computer Science'
    }
  });

  // Mock submissions data
  const [submissions] = useState([
    {
      id: 'sub1',
      student: {
        id: 'st1',
        name: 'Nguyễn Văn An',
        email: 'an.nguyen@student.edu',
        avatar: null
      },
      content: `// Assignment 1 - Nguyễn Văn An
// Variables and Data Types
const studentName = "Nguyễn Văn An";
let age = 20;
var isStudent = true;

// Functions
function calculateSum(a, b) {
  return a + b;
}

const multiplyNumbers = (x, y) => x * y;

function greetStudent(name) {
  return \`Hello, \${name}! Welcome to programming.\`;
}

// Arrays and Objects
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const evenNumbers = numbers.filter(n => n % 2 === 0);

const student = {
  name: studentName,
  age: age,
  courses: ['JavaScript', 'HTML', 'CSS'],
  introduce: function() {
    return \`I'm \${this.name}, \${this.age} years old\`;
  }
};

// Testing the code
console.log(calculateSum(5, 3));
console.log(multiplyNumbers(4, 6));
console.log(greetStudent(studentName));
console.log('Doubled numbers:', doubled);
console.log('Even numbers:', evenNumbers);
console.log(student.introduce());`,
      attachments: [
        { 
          name: 'assignment1_solution.js', 
          size: '1.8 KB', 
          type: 'application/javascript',
          url: '/files/assignment1_solution.js' 
        }
      ],
      submittedAt: '2024-02-14T18:30:00Z',
      grade: 85,
      feedback: 'Bài làm tốt! Code sạch sẽ và logic rõ ràng. Có thể cải thiện thêm error handling và thêm comment chi tiết hơn.',
      status: 'graded',
      isLate: false
    },
    {
      id: 'sub2',
      student: {
        id: 'st2',
        name: 'Trần Thị Bình',
        email: 'binh.tran@student.edu',
        avatar: null
      },
      content: `Hello teacher,

I have completed the assignment. Since I'm new to JavaScript, my code might not be optimal.

// Variables
let name = "Trần Thị Bình";
let studentAge = 19;
const isEnrolled = true;

// Functions
function addTwoNumbers(num1, num2) {
  let result = num1 + num2;
  return result;
}

function sayHello(personName) {
  console.log("Hello " + personName);
}

// Arrays
let myNumbers = [10, 20, 30, 40, 50];
let sum = 0;
for (let i = 0; i < myNumbers.length; i++) {
  sum = sum + myNumbers[i];
}

// Object
let studentInfo = {
  name: name,
  age: studentAge,
  subjects: ["Math", "Science", "Programming"]
};

console.log("Sum of numbers:", sum);
console.log("Student:", studentInfo.name);

Thank you!`,
      attachments: [
        { 
          name: 'my_assignment.txt', 
          size: '945 B', 
          type: 'text/plain',
          url: '/files/my_assignment.txt' 
        }
      ],
      submittedAt: '2024-02-16T10:15:00Z',
      grade: null,
      feedback: null,
      status: 'submitted',
      isLate: true
    },
    {
      id: 'sub3',
      student: {
        id: 'st3',
        name: 'Lê Minh Cường',
        email: 'cuong.le@student.edu',
        avatar: null
      },
      content: '',
      attachments: [
        { 
          name: 'Assignment1_LeMinhCuong.zip', 
          size: '3.2 MB', 
          type: 'application/zip',
          url: '/files/Assignment1_LeMinhCuong.zip' 
        },
        { 
          name: 'documentation.pdf', 
          size: '1.1 MB', 
          type: 'application/pdf',
          url: '/files/documentation.pdf' 
        }
      ],
      submittedAt: '2024-02-13T20:15:00Z',
      grade: 92,
      feedback: 'Bài làm xuất sắc! Code được tổ chức tốt, có documentation đầy đủ. Đặc biệt ấn tượng với phần bonus exercises.',
      status: 'graded',
      isLate: false
    }
  ]);

  const getStatusTag = (status, isLate) => {
    if (status === 'graded') {
      return <Tag color="success" icon={<CheckCircleOutlined />}>Đã chấm</Tag>;
    } else if (status === 'submitted') {
      return (
        <Tag color={isLate ? "warning" : "processing"} icon={<ClockCircleOutlined />}>
          {isLate ? 'Nộp muộn' : 'Chờ chấm'}
        </Tag>
      );
    } else {
      return <Tag color="error" icon={<ExclamationCircleOutlined />}>Chưa nộp</Tag>;
    }
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setGradingModalVisible(true);
  };

  const handleViewAllSubmissions = () => {
    setSubmissionManagementVisible(true);
  };

  const submissionColumns = [
    {
      title: 'Học sinh',
      dataIndex: 'student',
      key: 'student',
      render: (student) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src={student.avatar} 
            icon={<UserOutlined />}
            size={32}
          />
          <div>
            <div className="font-medium">{student.name}</div>
            <Text type="secondary" className="text-xs">{student.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => getStatusTag(record.status, record.isLate),
    },
    {
      title: 'Điểm',
      dataIndex: 'grade',
      key: 'grade',
      align: 'center',
      render: (grade, record) => {
        if (record.status === 'missing') return <Text type="secondary">-</Text>;
        if (grade === null) return <Text type="secondary">Chưa chấm</Text>;
        
        return (
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {grade}/{assignmentData.totalPoints}
            </div>
            <Progress 
              percent={(grade / assignmentData.totalPoints) * 100}
              size="small"
              showInfo={false}
            />
          </div>
        );
      },
    },
    {
      title: 'Thời gian nộp',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (submittedAt, record) => {
        if (!submittedAt) return <Text type="secondary">-</Text>;
        
        const isLate = moment(submittedAt).isAfter(moment(assignmentData.dueDate));
        return (
          <div>
            <div>{moment(submittedAt).format('DD/MM HH:mm')}</div>
            {isLate && (
              <Tag color="warning" size="small">
                <WarningOutlined /> Muộn
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem & Chấm điểm">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleGradeSubmission(record)}
            />
          </Tooltip>
          {record.attachments?.length > 0 && (
            <Tooltip title="Tải file">
              <Button 
                type="text" 
                icon={<DownloadOutlined />}
                size="small"
                onClick={() => message.success('Đang tải file...')}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Calculate statistics
  const stats = {
    submitted: submissions.length,
    graded: submissions.filter(s => s.grade !== null).length,
    pending: submissions.filter(s => s.status === 'submitted').length,
    late: submissions.filter(s => s.isLate).length,
    avgGrade: submissions.filter(s => s.grade !== null).length > 0 
      ? Math.round(submissions.filter(s => s.grade !== null).reduce((sum, s) => sum + s.grade, 0) / submissions.filter(s => s.grade !== null).length)
      : 0
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <FileTextOutlined />
          Tổng quan
        </span>
      ),
      children: (
        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <Row gutter={24}>
              <Col span={16}>
                <Title level={4}>{assignmentData.title}</Title>
                <Text className="text-gray-600 block mb-4">{assignmentData.description}</Text>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Title level={5}>📋 Hướng dẫn chi tiết:</Title>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {assignmentData.instructions}
                  </div>
                </div>

                {assignmentData.attachments.length > 0 && (
                  <div className="mt-4">
                    <Title level={5}>📎 File đính kèm:</Title>
                    {assignmentData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded mb-2">
                        <PaperClipOutlined />
                        <span>{file.name}</span>
                        <Text type="secondary">({file.size})</Text>
                        <Button size="small" type="link" icon={<DownloadOutlined />}>
                          Tải xuống
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Col>
              
              <Col span={8}>
                <Card size="small" className="mb-4">
                  <Statistic
                    title="Điểm tối đa"
                    value={assignmentData.totalPoints}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
                
                <Card size="small" className="mb-4">
                  <Statistic
                    title="Hạn nộp"
                    value={moment(assignmentData.dueDate).format('DD/MM/YYYY HH:mm')}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ 
                      color: moment().isAfter(assignmentData.dueDate) ? '#ff4d4f' : '#52c41a',
                      fontSize: '16px'
                    }}
                  />
                </Card>

                {assignmentData.allowLateSubmission && (
                  <Alert
                    message="Cho phép nộp muộn"
                    description={`Phạt ${assignmentData.latePenalty}% mỗi ngày`}
                    type="info"
                    size="small"
                    showIcon
                  />
                )}
              </Col>
            </Row>
          </Card>

          {/* Statistics */}
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Đã nộp"
                  value={stats.submitted}
                  suffix={`/${assignmentData.totalStudents}`}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Đã chấm"
                  value={stats.graded}
                  suffix={`/${stats.submitted}`}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Chờ chấm"
                  value={stats.pending}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Điểm TB"
                  value={stats.avgGrade}
                  suffix={`/${assignmentData.totalPoints}`}
                  prefix={<StarOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'submissions',
      label: (
        <span>
          <UserOutlined />
          Bài nộp ({submissions.length})
        </span>
      ),
      children: (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <Title level={4}>📝 Danh sách bài nộp</Title>
            <Button 
              type="primary"
              icon={<SettingOutlined />}
              onClick={handleViewAllSubmissions}
            >
              Quản lý chi tiết
            </Button>
          </div>
          
          <Table
            columns={submissionColumns}
            dataSource={submissions}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    }
  ];

  return (
    <div className="p-6" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/teacher/classroom/${classId}`)}
        >
          Quay lại lớp học
        </Button>
        
        <div>
          <Title level={2} className="mb-0">{assignmentData.title}</Title>
          <Text type="secondary">{assignmentData.classroom.name}</Text>
        </div>

        <div className="ml-auto">
          <Space>
            <Button 
              icon={<EditOutlined />}
              onClick={() => navigate(`/teacher/classroom/${classId}/assignment/${assignmentId}/edit`)}
            >
              Chỉnh sửa
            </Button>
            <Button 
              type="primary"
              icon={<TrophyOutlined />}
              onClick={handleViewAllSubmissions}
            >
              Chấm điểm
            </Button>
          </Space>
        </div>
      </div>

      {/* Status Alert */}
      {moment().isAfter(assignmentData.dueDate) && (
        <Alert
          message="Assignment đã hết hạn nộp"
          description={`Hạn nộp: ${moment(assignmentData.dueDate).format('DD/MM/YYYY HH:mm')}`}
          type="warning"
          showIcon
          className="mb-6"
        />
      )}

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      {/* Grading Modal */}
      <AssignmentGradingModal
        visible={gradingModalVisible}
        onCancel={() => setGradingModalVisible(false)}
        onSave={(gradingData) => {
          console.log('Saved grade:', gradingData);
          setGradingModalVisible(false);
          message.success('Đã lưu điểm thành công!');
        }}
        loading={loading}
        assignment={assignmentData}
        submission={selectedSubmission}
      />

      {/* Submission Management Modal */}
      <SubmissionManagement
        visible={submissionManagementVisible}
        onCancel={() => setSubmissionManagementVisible(false)}
        onBack={() => setSubmissionManagementVisible(false)}
        assignment={assignmentData}
      />
    </div>
  );
};

export default AssignmentDetail; 