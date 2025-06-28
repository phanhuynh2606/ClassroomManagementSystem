import React, { useState, useEffect, memo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Progress,
  Avatar,
  Input,
  Select,
  Modal,
  message,
  Tooltip,
  Badge,
  Row,
  Col,
  Statistic,
  Alert,
  Divider,
  Timeline,
  List,
  Checkbox,
  Upload,
  Tabs
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  StarOutlined,
  CommentOutlined,
  SendOutlined,
  AppstoreOutlined,
  ExportOutlined,
  MailOutlined,
  WarningOutlined,
  SyncOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { AssignmentGradingModal } from '../grading';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SubmissionManagement = ({ 
  assignment, 
  onBack,
  visible,
  onCancel 
}) => {
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkGradeModalVisible, setBulkGradeModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('submissions');

  // Mock submission data
  const mockSubmissions = [
    {
      id: 'sub1',
      student: {
        id: 'st1',
        name: 'Nguyễn Văn An',
        email: 'an.nguyen@student.edu',
        avatar: null
      },
      content: `// Bài tập JavaScript - Nguyễn Văn An
function calculateSum(arr) {
  return arr.reduce((sum, num) => sum + num, 0);
}

function findMax(arr) {
  return Math.max(...arr);
}

// Test cases
const numbers = [1, 2, 3, 4, 5];
console.log("Sum:", calculateSum(numbers)); // 15
console.log("Max:", findMax(numbers)); // 5

// Bài tập bổ sung: Sắp xếp mảng
function sortArray(arr, ascending = true) {
  return ascending ? 
    arr.sort((a, b) => a - b) : 
    arr.sort((a, b) => b - a);
}

console.log("Sorted:", sortArray([5, 2, 8, 1, 9]));`,
      attachments: [
        { 
          name: 'javascript_exercises.js', 
          size: '2.3 KB', 
          type: 'application/javascript',
          url: '/files/javascript_exercises.js' 
        },
        { 
          name: 'test_results.png', 
          size: '156 KB', 
          type: 'image/png',
          url: '/files/test_results.png' 
        }
      ],
      submittedAt: '2024-01-24T14:30:00Z',
      grade: 85,
      feedback: 'Bài làm tốt! Code sạch sẽ và logic rõ ràng. Có thể cải thiện thêm error handling.',
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
      content: `Xin chào thầy,

Em đã hoàn thành bài tập theo yêu cầu. Do em mới học JavaScript nên có thể code chưa được tối ưu lắm ạ.

function calculateSum(numbers) {
  let total = 0;
  for (let i = 0; i < numbers.length; i++) {
    total += numbers[i];
  }
  return total;
}

function findMax(numbers) {
  let max = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] > max) {
      max = numbers[i];
    }
  }
  return max;
}

// Test
let testArray = [10, 5, 8, 20, 3];
console.log("Tổng:", calculateSum(testArray));
console.log("Max:", findMax(testArray));

Em cảm ơn thầy!`,
      attachments: [
        { 
          name: 'bai_tap_js.txt', 
          size: '1.1 KB', 
          type: 'text/plain',
          url: '/files/bai_tap_js.txt' 
        }
      ],
      submittedAt: '2024-01-25T16:45:00Z',
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
          name: 'Assignment1_LeMinhCuong.docx', 
          size: '45 KB', 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          url: '/files/Assignment1_LeMinhCuong.docx' 
        },
        { 
          name: 'source_code.zip', 
          size: '3.2 MB', 
          type: 'application/zip',
          url: '/files/source_code.zip' 
        }
      ],
      submittedAt: '2024-01-23T20:15:00Z',
      grade: 92,
      feedback: 'Bài làm xuất sắc! Code được tổ chức tốt, có documentation đầy đủ. Đặc biệt ấn tượng với phần bonus.',
      status: 'graded',
      isLate: false
    },
    {
      id: 'sub4',
      student: {
        id: 'st4',
        name: 'Phạm Thu Hằng',
        email: 'hang.pham@student.edu',
        avatar: null
      },
      content: null,
      attachments: [],
      submittedAt: null,
      grade: null,
      feedback: null,
      status: 'missing',
      isLate: false
    },
    {
      id: 'sub5',
      student: {
        id: 'st5',
        name: 'Hoàng Đức Tài',
        email: 'tai.hoang@student.edu',
        avatar: null
      },
      content: `function sum(a, b) { return a + b; }
function max(arr) { return Math.max(...arr); }
console.log(sum(1,2)); console.log(max([1,2,3,4,5]));`,
      attachments: [],
      submittedAt: '2024-01-24T22:00:00Z',
      grade: null,
      feedback: null,
      status: 'submitted',
      isLate: false
    }
  ];

  useEffect(() => {
    if (visible && assignment) {
      fetchSubmissions();
    }
  }, [visible, assignment]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchText, statusFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmissions(mockSubmissions);
    } catch (error) {
      message.error('Không thể tải dữ liệu submissions');
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    // Search filter
    if (searchText) {
      filtered = filtered.filter(sub =>
        sub.student.name.toLowerCase().includes(searchText.toLowerCase()) ||
        sub.student.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  };

  const getStatusTag = (status, isLate) => {
    switch (status) {
      case 'graded':
        return <Tag color="success" icon={<CheckCircleOutlined />}>Đã chấm</Tag>;
      case 'submitted':
        return (
          <Tag color={isLate ? "warning" : "processing"} icon={<ClockCircleOutlined />}>
            {isLate ? 'Nộp muộn' : 'Chờ chấm'}
          </Tag>
        );
      case 'missing':
        return <Tag color="error" icon={<ExclamationCircleOutlined />}>Chưa nộp</Tag>;
      default:
        return <Tag color="default">Unknown</Tag>;
    }
  };

  const getGradeColor = (grade, maxGrade) => {
    if (!grade) return '#d9d9d9';
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 90) return '#52c41a';
    if (percentage >= 80) return '#1890ff';
    if (percentage >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setGradingModalVisible(true);
  };

  const handleGradeSubmission = async (gradingData) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update submissions
      setSubmissions(prev => prev.map(sub => 
        sub.id === gradingData.submissionId 
          ? { ...sub, grade: gradingData.grade, feedback: gradingData.feedback, status: 'graded' }
          : sub
      ));
      
      message.success('Đã lưu điểm thành công!');
      setGradingModalVisible(false);
      setSelectedSubmission(null);
    } catch (error) {
      message.error('Lỗi khi lưu điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGrade = () => {
    if (selectedRows.length === 0) {
      message.warning('Vui lòng chọn ít nhất một submission');
      return;
    }
    setBulkGradeModalVisible(true);
  };

  const handleExportGrades = () => {
    message.success('Đang xuất file điểm...');
    // Simulate export
    setTimeout(() => {
      message.info('File điểm đã được tải xuống!');
    }, 2000);
  };

  const handleSendReminder = () => {
    const missingStudents = submissions.filter(sub => sub.status === 'missing');
    if (missingStudents.length === 0) {
      message.info('Tất cả học sinh đã nộp bài');
      return;
    }
    
    Modal.confirm({
      title: 'Gửi nhắc nhở',
      content: `Gửi email nhắc nhở đến ${missingStudents.length} học sinh chưa nộp bài?`,
      onOk: () => {
        message.success(`Đã gửi email nhắc nhở đến ${missingStudents.length} học sinh`);
      }
    });
  };

  const columns = [
    {
      title: 'Học sinh',
      dataIndex: 'student',
      key: 'student',
      width: 250,
      render: (student) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src={student.avatar} 
            icon={<UserOutlined />}
            size={40}
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
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => getStatusTag(status, record.isLate),
    },
    {
      title: 'Nội dung nộp',
      key: 'content',
      width: 200,
      render: (_, record) => (
        <div>
          {record.content && (
            <div className="mb-1">
              <FileTextOutlined className="mr-1" />
              <Text>Text content</Text>
            </div>
          )}
          {record.attachments.length > 0 && (
            <div>
              <PaperClipOutlined className="mr-1" />
              <Text>{record.attachments.length} file(s)</Text>
            </div>
          )}
          {!record.content && record.attachments.length === 0 && record.status !== 'missing' && (
            <Text type="secondary">Trống</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Thời gian nộp',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      render: (submittedAt, record) => {
        if (!submittedAt) return <Text type="secondary">-</Text>;
        
        const isLate = moment(submittedAt).isAfter(moment(assignment?.dueDate));
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
      title: 'Điểm',
      dataIndex: 'grade',
      key: 'grade',
      width: 100,
      align: 'center',
      render: (grade, record) => {
        if (record.status === 'missing') return <Text type="secondary">-</Text>;
        if (grade === null) return <Text type="secondary">Chưa chấm</Text>;
        
        const maxGrade = assignment?.totalPoints || 100;
        return (
          <div className="text-center">
            <div 
              className="text-lg font-bold"
              style={{ color: getGradeColor(grade, maxGrade) }}
            >
              {grade}/{maxGrade}
            </div>
            <Progress 
              percent={(grade / maxGrade) * 100}
              size="small"
              showInfo={false}
              strokeColor={getGradeColor(grade, maxGrade)}
            />
          </div>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          {record.status !== 'missing' && (
            <Tooltip title="Xem chi tiết">
              <Button 
                type="text" 
                icon={<EyeOutlined />}
                size="small"
                onClick={() => handleViewSubmission(record)}
              />
            </Tooltip>
          )}
          {record.status === 'submitted' && (
            <Tooltip title="Chấm điểm">
              <Button 
                type="text" 
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleViewSubmission(record)}
                className="text-blue-600"
              />
            </Tooltip>
          )}
          {record.attachments.length > 0 && (
            <Tooltip title="Tải file">
              <Button 
                type="text" 
                icon={<DownloadOutlined />}
                size="small"
                onClick={() => {
                  message.success('Đang tải file...');
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Calculate statistics
  const stats = {
    total: submissions.length,
    submitted: submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length,
    graded: submissions.filter(s => s.status === 'graded').length,
    missing: submissions.filter(s => s.status === 'missing').length,
    late: submissions.filter(s => s.isLate).length,
    avgGrade: submissions.filter(s => s.grade !== null).length > 0 
      ? Math.round(submissions.filter(s => s.grade !== null).reduce((sum, s) => sum + s.grade, 0) / submissions.filter(s => s.grade !== null).length)
      : 0
  };

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys) => {
      setSelectedRows(selectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.status === 'missing',
    }),
  };

  if (!assignment) return null;

  return (
    <Modal
      title={
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrophyOutlined />
            <span>Quản lý submissions</span>
          </div>
          <div className="text-sm text-gray-500 font-normal">
            <span className="cursor-pointer hover:text-blue-600" onClick={onBack}>
              ← Back to Assignment
            </span>
            <span className="mx-2">•</span>
            <span>{assignment.title}</span>
          </div>
        </div>
      }
      open={visible}
      onCancel={onBack}
      footer={null}
      width={1400}
      style={{ top: 20 }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><FileTextOutlined /> Danh sách submissions</span>} key="submissions">
          {/* Statistics */}
          <Row gutter={16} className="mb-6">
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="Tổng số HS"
                  value={stats.total}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="Đã nộp"
                  value={stats.submitted}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="Đã chấm"
                  value={stats.graded}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="Chưa nộp"
                  value={stats.missing}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="Nộp muộn"
                  value={stats.late}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="Điểm TB"
                  value={stats.avgGrade}
                  suffix={`/${assignment.totalPoints || 100}`}
                  prefix={<StarOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters and Actions */}
          <Card className="mb-4">
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Space>
                  <Search
                    placeholder="Tìm kiếm học sinh..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                    allowClear
                  />
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: 150 }}
                  >
                    <Option value="all">Tất cả</Option>
                    <Option value="submitted">Chờ chấm</Option>
                    <Option value="graded">Đã chấm</Option>
                    <Option value="missing">Chưa nộp</Option>
                  </Select>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button 
                    icon={<AppstoreOutlined />}
                    onClick={handleBulkGrade}
                    disabled={selectedRows.length === 0}
                  >
                    Chấm hàng loạt ({selectedRows.length})
                  </Button>
                  <Button 
                    icon={<ExportOutlined />}
                    onClick={handleExportGrades}
                  >
                    Xuất điểm
                  </Button>
                  <Button 
                    icon={<MailOutlined />}
                    onClick={handleSendReminder}
                    type="primary"
                    ghost
                  >
                    Nhắc nhở ({stats.missing})
                  </Button>
                  <Button 
                    icon={<SyncOutlined />}
                    onClick={fetchSubmissions}
                    loading={loading}
                  >
                    Làm mới
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Submissions Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={filteredSubmissions}
              rowKey="id"
              loading={loading}
              rowSelection={rowSelection}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} submissions`,
              }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><StarOutlined /> Analytics</span>} key="analytics">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Phân bố điểm số" className="mb-4">
                {/* Grade distribution chart would go here */}
                <div className="text-center py-8">
                  <Text type="secondary">Biểu đồ phân bố điểm số</Text>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Tiến độ nộp bài" className="mb-4">
                {/* Submission timeline would go here */}
                <div className="text-center py-8">
                  <Text type="secondary">Biểu đồ tiến độ nộp bài</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Grading Modal */}
      <AssignmentGradingModal
        visible={gradingModalVisible}
        onCancel={() => {
          setGradingModalVisible(false);
          setSelectedSubmission(null);
        }}
        onSave={handleGradeSubmission}
        loading={loading}
        assignment={assignment}
        submission={selectedSubmission}
      />

      {/* Bulk Grade Modal */}
      <Modal
        title="Chấm điểm hàng loạt"
        open={bulkGradeModalVisible}
        onCancel={() => setBulkGradeModalVisible(false)}
        onOk={() => {
          message.success('Đã áp dụng điểm cho các submission đã chọn');
          setBulkGradeModalVisible(false);
          setSelectedRows([]);
        }}
      >
        <div className="py-4">
          <Text>Áp dụng điểm và nhận xét cho {selectedRows.length} submissions đã chọn</Text>
          {/* Bulk grading form would go here */}
        </div>
      </Modal>
    </Modal>
  );
};

export default memo(SubmissionManagement); 