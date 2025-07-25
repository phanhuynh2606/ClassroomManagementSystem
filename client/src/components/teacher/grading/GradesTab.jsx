import React, { useState, useEffect, memo } from 'react';
import { useParams } from 'react-router-dom';
import classroomAPI from '../../../services/api/classroom.api';
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
  Avatar,
  Spin,
  Alert
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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
// Thêm import cho jsPDF và autotable
import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import "../common/dejavu-sans-normal"
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const GradesTab = ({ classroomId, className }) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterAssignment, setFilterAssignment] = useState('all');
  const [filterAssignmentType, setFilterAssignmentType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [studentsGrades, setStudentsGrades] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await classroomAPI.getGradesStatistics(classroomId);
        console.log("res", res);
        setStudentsGrades(res.students || []);
        setAssignments(res.assignments || []);
        setStatistics(res.statistics || {});
      } catch (err) {
        setError('Không thể tải dữ liệu bảng điểm');
      } finally {
        setLoading(false);
      }
    };
    if (classroomId) fetchData();
  }, [classroomId]);

  // Export functions
  const handleExportExcel = () => {
    // Chuẩn bị dữ liệu
    const data = studentsGrades.map(student => {
      const row = {
        'Họ tên': student.name,
        'Email': student.email,
      };
      assignments.forEach(assignment => {
        const grade = student.grades[assignment.id];
        row[assignment.title] = grade && grade.score !== null ? `${grade.score}/${assignment.maxPoints}` : '';
      });
      row['Trung bình (%)'] = calculateStudentAverage(student.grades);
      return row;
    });
    // Tạo worksheet và workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `BangDiem_${className}`);
    // Xuất file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), `BangDiem_${className}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFont('DejaVuSans');
    // Tiêu đề
    doc.setFontSize(16);
    doc.text(`Grades Report - ${className || ''}`, 14, 14);
    // Chuẩn bị header
    const header = ['Họ tên', 'Email', ...assignments.map(a => a.title), 'Trung bình (%)'];
    // Chuẩn bị data
    const data = studentsGrades.map(student => {
      const row = [student.name, student.email];
      assignments.forEach(assignment => {
        const grade = student.grades[assignment.id];
        row.push(grade && grade.score !== null ? `${grade.score}/${assignment.maxPoints}` : '');
      });
      row.push(calculateStudentAverage(student.grades));
      return row;
    });
    // Xuất bảng
    autoTable(doc, {
      head: [header],
      body: data,
      startY: 22,
      styles: { font: 'DejaVuSans', fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto',
    });
    doc.save(`BangDiem_${className || 'Lop'}.pdf`);
  };

  const handleExportCSV = () => {
    const data = studentsGrades.map(student => {
      const row = {
        'Họ tên': student.name,
        'Email': student.email,
      };
      assignments.forEach(assignment => {
        const grade = student.grades[assignment.id];
        row[assignment.title] = grade && grade.score !== null ? grade.score : '';
      });
      row['Trung bình (%)'] = calculateStudentAverage(student.grades);
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ',', RS: '\r\n' });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `BangDiem_${className}.csv`);
  };

  const handlePrintReport = () => {
    // Simulate print
    window.print();
  };

  // Tính điểm trung bình học sinh
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

  // Filter assignments by type
  const filteredAssignments = assignments.filter(a =>
    filterAssignmentType === 'all' ? true : a.type === filterAssignmentType
  );

  // Create dynamic columns
  const columns = [
    {
      title: 'Học sinh',
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
    ...filteredAssignments.map(assignment => ({
      title: (
        <div className="text-center">
          <div className="font-medium">{assignment.title}</div>
          <Text type="secondary" className="text-xs">
            /{assignment.maxPoints} điểm
          </Text>
          <Tag color={assignment.type === 'assignment' ? 'blue' : 'purple'} style={{ marginTop: 4 }}>
            {assignment.type === 'assignment' ? 'Bài tập' : 'Quiz'}
          </Tag>
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
              {/* <br />
              <Button 
                type="link" 
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditGrade(student, assignment)}
              >
                Grade
              </Button> */}
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
            {/* <Button 
              type="link" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditGrade(student, assignment)}
            >
              Sửa điểm
            </Button> */}
          </div>
        );
      }
    })),
    {
      title: 'Trung bình',
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

  // Lọc học sinh
  const filteredStudents = studentsGrades.filter(student =>
    student.name.toLowerCase().includes(searchText.toLowerCase()) ||
    student.email.toLowerCase().includes(searchText.toLowerCase())
  );

  // Thống kê
  const classAverage = statistics.classAverage || 0;
  const highestScore = statistics.highestScore || 0;
  const lowestScore = statistics.lowestScore || 0;
  const overallSubmissionRate = statistics.submissionRate || 0;
  const gradeDistribution = statistics.gradeDistribution || { excellent: 0, good: 0, average: 0, poor: 0 };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Spin size="large" tip="Đang tải dữ liệu bảng điểm..." /></div>;
  }
  if (error) {
    return <Alert message="Lỗi tải dữ liệu" description={error} type="error" showIcon />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={3} className="mb-0">Bảng điểm & Thống kê</Title>
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
            Xuất CSV
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
          <Card title="📊 Tiến độ nộp bài theo bài" size="small">
            <div className="space-y-3">
              {/* This section will need to be updated to use actual data */}
              {/* For now, it will show a placeholder or empty */}
              <Text type="secondary">Tiến độ nộp bài theo bài sẽ được cập nhật sau khi tải dữ liệu.</Text>
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
                value={filterAssignmentType}
                onChange={setFilterAssignmentType}
                style={{ width: 160 }}
                placeholder="Lọc theo loại bài"
              >
                <Option value="all">Tất cả loại</Option>
                <Option value="assignment">Bài tập</Option>
                <Option value="quiz">Quiz</Option>
              </Select>
              <Select
                value={filterAssignment}
                onChange={setFilterAssignment}
                style={{ width: 180 }}
                placeholder="Lọc theo bài"
              >
                <Option value="all">Tất cả bài</Option>
                {assignments
                  .filter(a => filterAssignmentType === 'all' ? true : a.type === filterAssignmentType)
                  .map(assignment => (
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
        title={`Sửa điểm - ${selectedStudent?.name} - ${selectedAssignment?.title}`}
        open={editModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        okText="Lưu điểm"
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveGrade}
        >
          <Form.Item
            name="score"
            label={`Điểm (trên ${selectedAssignment?.maxPoints} điểm)`}
            rules={[
              { required: true, message: 'Vui lòng nhập điểm' },
              { type: 'number', min: 0, max: selectedAssignment?.maxPoints, 
                message: `Điểm phải nằm trong khoảng 0 và ${selectedAssignment?.maxPoints}` }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Nhập điểm"
              min={0}
              max={selectedAssignment?.maxPoints}
            />
          </Form.Item>

          <Form.Item
            name="feedback"
            label="Phản hồi (tùy chọn)"
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập phản hồi cho học sinh"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default memo(GradesTab); 