import React, { useState, memo } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Space, 
  Typography, 
  Progress, 
  Tag, 
  Select, 
  Tooltip,
  Modal,
  Form,
  InputNumber,
  message,
  Statistic,
  Row,
  Col,
  Avatar
} from 'antd';
import {
  DownloadOutlined,
  UploadOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  SearchOutlined,
  UserOutlined,
  TrophyOutlined,
  BarChartOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  LineChartOutlined,
  PieChartOutlined,
  PrinterOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const GradesTab = () => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterAssignment, setFilterAssignment] = useState('all');

  // Export functions
  const handleExportExcel = () => {
    // Simulate Excel export
    message.success('Đang xuất file Excel...');
    setTimeout(() => {
      message.info('File Excel đã được tạo và tải xuống!');
    }, 2000);
  };

  const handleExportPDF = () => {
    // Simulate PDF export  
    message.success('Đang xuất báo cáo PDF...');
    setTimeout(() => {
      message.info('Báo cáo PDF đã được tạo và tải xuống!');
    }, 2000);
  };

  const handleExportCSV = () => {
    // Simulate CSV export
    message.success('Đang xuất file CSV...');
    setTimeout(() => {
      message.info('File CSV đã được tạo và tải xuống!');
    }, 2000);
  };

  const handlePrintReport = () => {
    // Simulate print
    window.print();
  };

  // Mock data
  const assignments = [
    { id: '1', title: 'Assignment 1', maxPoints: 100, type: 'assignment' },
    { id: '2', title: 'Quiz 1', maxPoints: 50, type: 'quiz' },
    { id: '3', title: 'Midterm Exam', maxPoints: 150, type: 'exam' },
    { id: '4', title: 'Assignment 2', maxPoints: 100, type: 'assignment' }
  ];

  const studentsGrades = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@student.edu',
      avatar: null,
      grades: {
        '1': { score: 85, maxPoints: 100, submittedAt: '2024-01-20T10:00:00Z' },
        '2': { score: 45, maxPoints: 50, submittedAt: '2024-01-18T14:30:00Z' },
        '3': { score: null, maxPoints: 150, submittedAt: null },
        '4': { score: 92, maxPoints: 100, submittedAt: '2024-01-25T16:20:00Z' }
      }
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@student.edu',
      avatar: null,
      grades: {
        '1': { score: 78, maxPoints: 100, submittedAt: '2024-01-19T15:45:00Z' },
        '2': { score: 42, maxPoints: 50, submittedAt: '2024-01-18T16:00:00Z' },
        '3': { score: 128, maxPoints: 150, submittedAt: '2024-01-22T11:20:00Z' },
        '4': { score: null, maxPoints: 100, submittedAt: null }
      }
    },
    {
      id: '3',
      name: 'Carol Davis',
      email: 'carol@student.edu',
      avatar: null,
      grades: {
        '1': { score: 95, maxPoints: 100, submittedAt: '2024-01-19T09:30:00Z' },
        '2': { score: 48, maxPoints: 50, submittedAt: '2024-01-18T13:15:00Z' },
        '3': { score: 142, maxPoints: 150, submittedAt: '2024-01-22T10:45:00Z' },
        '4': { score: 88, maxPoints: 100, submittedAt: '2024-01-25T14:10:00Z' }
      }
    }
  ];

  const calculateStudentAverage = (grades) => {
    const validGrades = Object.values(grades).filter(g => g.score !== null);
    if (validGrades.length === 0) return 0;
    
    const totalScore = validGrades.reduce((sum, g) => sum + g.score, 0);
    const totalMax = validGrades.reduce((sum, g) => sum + g.maxPoints, 0);
    
    return Math.round((totalScore / totalMax) * 100);
  };

  const getGradeColor = (score, maxPoints) => {
    const percentage = (score / maxPoints) * 100;
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'processing';
    if (percentage >= 70) return 'warning';
    return 'exception';
  };

  const handleEditGrade = (student, assignment) => {
    setSelectedStudent(student);
    setSelectedAssignment(assignment);
    const currentGrade = student.grades[assignment.id];
    form.setFieldsValue({
      score: currentGrade?.score,
      feedback: currentGrade?.feedback || ''
    });
    setEditModalVisible(true);
  };

  const handleSaveGrade = async (values) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Grade updated successfully');
      setEditModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to update grade');
    }
  };

  // Create dynamic columns
  const columns = [
    {
      title: 'Student',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src={record.avatar} 
            icon={!record.avatar && <UserOutlined />}
            size={32}
          />
          <div>
            <div className="font-medium">{text}</div>
            <Text type="secondary" className="text-xs">{record.email}</Text>
          </div>
        </div>
      ),
    },
    ...assignments.map(assignment => ({
      title: (
        <div className="text-center">
          <div className="font-medium">{assignment.title}</div>
          <Text type="secondary" className="text-xs">
            /{assignment.maxPoints} pts
          </Text>
        </div>
      ),
      dataIndex: ['grades', assignment.id],
      key: assignment.id,
      width: 120,
      align: 'center',
      render: (grade, student) => {
        if (!grade || grade.score === null) {
          return (
            <div className="text-center">
              <Text type="secondary">-</Text>
              <br />
              <Button 
                type="link" 
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditGrade(student, assignment)}
              >
                Grade
              </Button>
            </div>
          );
        }
        
        return (
          <div className="text-center">
            <div className="mb-1">
              <Text strong>{grade.score}</Text>
              <Text type="secondary">/{grade.maxPoints}</Text>
            </div>
            <Progress 
              percent={(grade.score / grade.maxPoints) * 100}
              size="small"
              status={getGradeColor(grade.score, grade.maxPoints)}
              showInfo={false}
            />
            <Button 
              type="link" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditGrade(student, assignment)}
            >
              Edit
            </Button>
          </div>
        );
      }
    })),
    {
      title: 'Average',
      key: 'average',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const avg = calculateStudentAverage(record.grades);
        return (
          <div className="text-center">
            <div className="text-lg font-bold">{avg}%</div>
            <Progress 
              percent={avg}
              size="small"
              status={getGradeColor(avg, 100)}
              showInfo={false}
            />
          </div>
        );
      }
    }
  ];

  const filteredStudents = studentsGrades.filter(student =>
    student.name.toLowerCase().includes(searchText.toLowerCase()) ||
    student.email.toLowerCase().includes(searchText.toLowerCase())
  );

  // Calculate class statistics
  const classAverage = Math.round(
    filteredStudents.reduce((sum, student) => 
      sum + calculateStudentAverage(student.grades), 0
    ) / filteredStudents.length
  );

  const highestScore = Math.max(
    ...filteredStudents.map(student => calculateStudentAverage(student.grades))
  );

  const lowestScore = Math.min(
    ...filteredStudents.map(student => calculateStudentAverage(student.grades))
  );

  // Calculate additional statistics
  const submissionStats = assignments.map(assignment => {
    const submitted = filteredStudents.filter(student => 
      student.grades[assignment.id]?.score !== null
    ).length;
    return {
      assignment: assignment.title,
      submitted,
      total: filteredStudents.length,
      percentage: Math.round((submitted / filteredStudents.length) * 100)
    };
  });

  const gradeDistribution = {
    excellent: filteredStudents.filter(s => calculateStudentAverage(s.grades) >= 90).length,
    good: filteredStudents.filter(s => {
      const avg = calculateStudentAverage(s.grades);
      return avg >= 80 && avg < 90;
    }).length,
    average: filteredStudents.filter(s => {
      const avg = calculateStudentAverage(s.grades);
      return avg >= 70 && avg < 80;
    }).length,
    poor: filteredStudents.filter(s => calculateStudentAverage(s.grades) < 70).length
  };

  const totalGradedAssignments = assignments.reduce((sum, assignment) => {
    return sum + filteredStudents.filter(student => 
      student.grades[assignment.id]?.score !== null
    ).length;
  }, 0);

  const totalPossibleSubmissions = assignments.length * filteredStudents.length;
  const overallSubmissionRate = Math.round((totalGradedAssignments / totalPossibleSubmissions) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={3} className="mb-0">📊 Bảng điểm & Thống kê</Title>
        <Space.Compact>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            type="primary"
          >
            Xuất Excel
          </Button>
          <Button 
            icon={<FilePdfOutlined />}
            onClick={handleExportPDF}
          >
            Báo cáo PDF
          </Button>
          <Button 
            icon={<DownloadOutlined />}
            onClick={handleExportCSV}
          >
            CSV
          </Button>
          <Button 
            icon={<PrinterOutlined />}
            onClick={handlePrintReport}
          >
            In
          </Button>
          <Button 
            icon={<UploadOutlined />}
            type="dashed"
          >
            Import
          </Button>
        </Space.Compact>
      </div>

      {/* Statistics Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Điểm trung bình lớp"
              value={classAverage}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: classAverage >= 80 ? '#3f8600' : classAverage >= 70 ? '#fa8c16' : '#cf1322' }}
            />
            <Progress 
              percent={classAverage} 
              size="small" 
              showInfo={false}
              strokeColor={classAverage >= 80 ? '#3f8600' : classAverage >= 70 ? '#fa8c16' : '#cf1322'}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Điểm cao nhất"
              value={highestScore}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Tỷ lệ nộp bài"
              value={overallSubmissionRate}
              suffix="%"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: overallSubmissionRate >= 80 ? '#3f8600' : '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Tổng học sinh"
              value={filteredStudents.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Analytics */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="📈 Phân bố điểm số" size="small">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Text>Xuất sắc (90-100%)</Text>
                <div className="flex items-center gap-2">
                  <Progress 
                    percent={(gradeDistribution.excellent / filteredStudents.length) * 100}
                    size="small"
                    strokeColor="#52c41a"
                    style={{ width: 100 }}
                  />
                  <Text strong>{gradeDistribution.excellent} HS</Text>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Text>Khá (80-89%)</Text>
                <div className="flex items-center gap-2">
                  <Progress 
                    percent={(gradeDistribution.good / filteredStudents.length) * 100}
                    size="small"
                    strokeColor="#1890ff"
                    style={{ width: 100 }}
                  />
                  <Text strong>{gradeDistribution.good} HS</Text>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Text>Trung bình (70-79%)</Text>
                <div className="flex items-center gap-2">
                  <Progress 
                    percent={(gradeDistribution.average / filteredStudents.length) * 100}
                    size="small"
                    strokeColor="#faad14"
                    style={{ width: 100 }}
                  />
                  <Text strong>{gradeDistribution.average} HS</Text>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Text>Cần cải thiện (&lt;70%)</Text>
                <div className="flex items-center gap-2">
                  <Progress 
                    percent={(gradeDistribution.poor / filteredStudents.length) * 100}
                    size="small"
                    strokeColor="#ff4d4f"
                    style={{ width: 100 }}
                  />
                  <Text strong>{gradeDistribution.poor} HS</Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="📊 Tiến độ nộp bài theo assignment" size="small">
            <div className="space-y-3">
              {submissionStats.map((stat, index) => (
                <div key={index} className="flex justify-between items-center">
                  <Text className="truncate" style={{ maxWidth: 150 }}>{stat.assignment}</Text>
                  <div className="flex items-center gap-2">
                    <Progress 
                      percent={stat.percentage}
                      size="small"
                      strokeColor={stat.percentage >= 90 ? '#52c41a' : stat.percentage >= 70 ? '#faad14' : '#ff4d4f'}
                      style={{ width: 100 }}
                    />
                    <Text strong className="text-xs">
                      {stat.submitted}/{stat.total}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

              {/* Filters & Search */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <Space>
              <Search
                placeholder="Tìm kiếm học sinh..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
                allowClear
              />
              <Select
                value={filterAssignment}
                onChange={setFilterAssignment}
                style={{ width: 180 }}
                placeholder="Lọc theo bài tập"
              >
                <Option value="all">Tất cả bài tập</Option>
                {assignments.map(assignment => (
                  <Option key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </Option>
                ))}
              </Select>
            </Space>
            <Space>
              <Text type="secondary" className="text-sm">
                Hiển thị {filteredStudents.length} / {studentsGrades.length} học sinh
              </Text>
            </Space>
          </div>

        {/* Grades Table */}
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} students`,
          }}
        />
      </Card>

      {/* Edit Grade Modal */}
      <Modal
        title={`Edit Grade - ${selectedStudent?.name} - ${selectedAssignment?.title}`}
        open={editModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        okText="Save Grade"
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveGrade}
        >
          <Form.Item
            name="score"
            label={`Score (out of ${selectedAssignment?.maxPoints} points)`}
            rules={[
              { required: true, message: 'Please enter a score' },
              { type: 'number', min: 0, max: selectedAssignment?.maxPoints, 
                message: `Score must be between 0 and ${selectedAssignment?.maxPoints}` }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter score"
              min={0}
              max={selectedAssignment?.maxPoints}
            />
          </Form.Item>

          <Form.Item
            name="feedback"
            label="Feedback (optional)"
          >
            <Input.TextArea
              rows={4}
              placeholder="Enter feedback for the student"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default memo(GradesTab); 