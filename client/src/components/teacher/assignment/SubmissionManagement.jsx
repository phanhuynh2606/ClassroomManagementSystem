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
import { assignmentAPI } from '../../../services/api';

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

  useEffect(() => {
    if (visible && assignment) {
      fetchSubmissions();
    }
  }, [visible, assignment]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchText, statusFilter]);

  const fetchSubmissions = async () => {
    if (!assignment?._id) return;
    
    setLoading(true);
    try {
      // Call real API to get submissions with enhanced data
      const response = await assignmentAPI.getSubmissions(assignment._id, { 
        includeHistory: true,
        page: 1,
        limit: 1000 // Get all submissions for this view
      });
      
      if (response.success) {
        // Format the data to match expected structure
        const formattedSubmissions = response.data.docs.map(submission => {
          // Skip missing submissions (virtual ones created by backend)
          if (submission._id?.toString().startsWith('missing_') || submission.status === 'missing') {
            return {
              _id: submission._id,
              id: submission._id,
              student: {
                _id: submission.student._id,
                id: submission.student._id,
                name: submission.student.fullName || submission.student.name,
                fullName: submission.student.fullName,
                email: submission.student.email,
                image: submission.student.image
              },
              content: null,
              attachments: [],
              submittedAt: null,
              grade: null,
              feedback: null,
              status: 'missing',
              isLate: false,
              gradedAt: null,
              rubricGrades: {},
              gradingHistory: []
            };
          }

          // Format real submissions
          return {
            _id: submission._id,
            id: submission._id, // Keep both for compatibility
            student: {
              _id: submission.student._id,
              id: submission.student._id,
              name: submission.student.fullName || submission.student.name,
              fullName: submission.student.fullName,
              email: submission.student.email,
              image: submission.student.image
            },
            content: submission.content || '',
            attachments: submission.attachments || [],
            submittedAt: submission.submittedAt,
            grade: submission.grade,
            feedback: submission.feedback,
            status: submission.status,
            isLate: submission.status === 'late' || (submission.submittedAt && moment(submission.submittedAt).isAfter(moment(assignment.dueDate))),
            gradedAt: submission.gradedAt,
            rubricGrades: submission.rubricGrades || {},
            gradingHistory: submission.gradingHistory || [],
            gradingStats: submission.gradingStats || {}
          };
        });
        
        setSubmissions(formattedSubmissions);
      } else {
        message.error(response.message || 'Không thể tải dữ liệu submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      message.error(error.response?.data?.message || 'Không thể tải dữ liệu submissions');
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
      case 'late':
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Nộp muộn</Tag>;
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
    // Prevent viewing missing submissions
    if (submission._id?.toString().startsWith('missing_') || submission.status === 'missing') {
      message.warning('Không thể xem chi tiết submission này vì học sinh chưa nộp bài');
      return;
    }

    setSelectedSubmission(submission);
    setGradingModalVisible(true);
  };

  const handleGradeSubmission = async (gradingData) => {
    try {
      setLoading(true);
      
      // Get assignment and submission IDs from current context
      const assignmentId = assignment?._id;
      const submissionId = selectedSubmission?._id;
      
      if (!assignmentId || !submissionId) {
        message.error('Không thể xác định assignment hoặc submission');
        return;
      }
      
      // Call the enhanced API to save the grade with history
      const response = await assignmentAPI.gradeSubmission(
        assignmentId,
        submissionId,
        {
          grade: gradingData.grade,
          feedback: gradingData.feedback,
          rubricGrades: gradingData.rubricGrades,
          annotations: gradingData.annotations,
          allowResubmit: gradingData.allowResubmit,
          hideGradeFromStudent: gradingData.hideGradeFromStudent,
          changeType: gradingData.changeType,
          gradeReason: gradingData.gradeReason
        }
      );
      
      if (response.success) {
        const changeType = gradingData.changeType || 'initial';
        const successMessage = changeType === 'initial' 
          ? 'Đã lưu điểm thành công!' 
          : `Đã cập nhật điểm thành công (${changeType})!`;
        
        message.success(successMessage);
        
        // Update submissions list with new grading history
        setSubmissions(prev => prev.map(sub => 
          sub._id === submissionId 
            ? { 
                ...sub, 
                ...response.data,
                // Ensure grading history is preserved
                gradingHistory: response.data.gradingHistory || sub.gradingHistory || []
              }
            : sub
        ));
        
        // Update selected submission to reflect changes
        setSelectedSubmission(prev => ({
          ...prev,
          ...response.data,
          gradingHistory: response.data.gradingHistory || prev.gradingHistory || []
        }));
        
        // Show grading statistics if available
        if (response.data.gradingStats) {
          const stats = response.data.gradingStats;
        }
      } else {
        message.error(response.message || 'Lỗi khi lưu điểm');
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      message.error(error.response?.data?.message || 'Lỗi khi lưu điểm');
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
            src={student?.image} 
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
      render: (_, record) => {
        // Helper function to detect content type
        const detectContentType = (content) => {
          if (!content) return null;
          
          // Check if content looks like CSV data
          const lines = content.split('\n').filter(line => line.trim());
          if (lines.length > 1) {
            const firstLine = lines[0];
            const secondLine = lines[1];
            
            // Check if it has comma separators and consistent column count
            const firstCols = firstLine.split(',').length;
            const secondCols = secondLine.split(',').length;
            
            if (firstCols > 1 && secondCols > 1 && Math.abs(firstCols - secondCols) <= 1) {
              return 'csv';
            }
          }
          
          // Check if content looks like JSON
          try {
            JSON.parse(content);
            return 'json';
          } catch (e) {
            // Not JSON, continue
          }
          
          // Check if content contains code patterns
          const codePatterns = [
            'function', 'class', 'import', 'export', 'const', 'let', 'var',
            'public', 'private', 'def ', 'print(', '#include'
          ];
          
          const lowerContent = content.toLowerCase();
          if (codePatterns.some(pattern => lowerContent.includes(pattern))) {
            return 'code';
          }
          
          return 'text';
        };

        const contentType = record.content ? detectContentType(record.content) : null;

        return (
          <div>
            {/* File Attachments */}
            {record.attachments && record.attachments.length > 0 && (
              <div className="mb-1">
                <PaperClipOutlined className="mr-1" />
                <Text>
                  {record.attachments.length} file(s)
                  {record.attachments.length === 1 && record.attachments[0].name && (
                    <span className="text-xs text-gray-500">
                      {' '}({record.attachments[0].name.split('.').pop()?.toUpperCase()})
                    </span>
                  )}
                  {record.attachments.length > 1 && (
                    <span className="text-xs text-gray-500">
                      {' '}({record.attachments.map(f => f.name?.split('.').pop()?.toUpperCase()).filter(Boolean).join(', ')})
                    </span>
                  )}
                </Text>
              </div>
            )}
            
            {/* Text/Code Content */}
            {record.content && (
              <div className="mb-1">
                {contentType === 'csv' && (
                  <>
                    <FileTextOutlined className="mr-1" style={{ color: '#52c41a' }} />
                    <Text>CSV data</Text>
                  </>
                )}
                {contentType === 'json' && (
                  <>
                    <FileTextOutlined className="mr-1" style={{ color: '#1890ff' }} />
                    <Text>JSON data</Text>
                  </>
                )}
                {contentType === 'code' && (
                  <>
                    <FileTextOutlined className="mr-1" style={{ color: '#722ed1' }} />
                    <Text>Code content</Text>
                  </>
                )}
                {contentType === 'text' && (
                  <>
                    <FileTextOutlined className="mr-1" />
                    <Text>Text content</Text>
                  </>
                )}
              </div>
            )}
            
            {/* Empty state */}
            {!record.content && (!record.attachments || record.attachments.length === 0) && record.status !== 'missing' && (
              <Text type="secondary">Trống</Text>
            )}
          </div>
        );
      },
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
      render: (_, record) => {
        const isMissing = record._id?.toString().startsWith('missing_') || record.status === 'missing';
        
        return (
          <Space>
            {!isMissing && (
              <Tooltip title="Xem chi tiết">
                <Button 
                  type="text" 
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={() => handleViewSubmission(record)}
                />
              </Tooltip>
            )}
            {!isMissing && (record.status === 'submitted' || record.status === 'graded') && (
              <Tooltip title={record.status === 'graded' ? 'Chỉnh sửa điểm' : 'Chấm điểm'}>
                <Button 
                  type="text" 
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleViewSubmission(record)}
                  className="text-blue-600"
                />
              </Tooltip>
            )}
            {!isMissing && record.attachments && record.attachments.length > 0 && (
              <Tooltip title="Tải file">
                <Button 
                  type="text" 
                  icon={<DownloadOutlined />}
                  size="small"
                  onClick={() => {
                    message.success('Đang tải file...');
                    // TODO: Implement actual file download
                  }}
                />
              </Tooltip>
            )}
            {isMissing && (
              <Tooltip title="Học sinh chưa nộp bài">
                <Button 
                  type="text" 
                  icon={<MailOutlined />}
                  size="small"
                  onClick={() => {
                    message.info(`Gửi nhắc nhở đến ${record.student.name}`);
                    // TODO: Implement send reminder to specific student
                  }}
                  className="text-orange-600"
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  // Calculate statistics
  const stats = {
    total: submissions.length,
    submitted: submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length,
    graded: submissions.filter(s => s.status === 'graded').length,
    missing: submissions.filter(s => s.status === 'missing').length,
    late: submissions.filter(s => s.isLate).length,
    avgGrade: (() => {
      // Filter submissions with valid grades (must be number and not null/undefined)
      const validGrades = submissions.filter(s => 
        s.grade !== null && 
        s.grade !== undefined && 
        typeof s.grade === 'number' && 
        !isNaN(s.grade)
      );
      
      // Debug logging
      console.log('📊 Grade Statistics Debug:', {
        totalSubmissions: submissions.length,
        allGrades: submissions.map(s => ({ 
          student: s.student?.name, 
          grade: s.grade, 
          type: typeof s.grade 
        })),
        validGrades: validGrades.length,
        validGradeValues: validGrades.map(s => s.grade)
      });
      
      if (validGrades.length === 0) return 0;
      
      const sum = validGrades.reduce((total, s) => total + Number(s.grade), 0);
      const average = sum / validGrades.length;
      
      console.log('📊 Average calculation:', { sum, validGrades: validGrades.length, average });
      
      // Return rounded average, ensuring it's a valid number
      return isNaN(average) ? 0 : Math.round(average * 10) / 10; // Round to 1 decimal place
    })()
  };

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys) => {
      setSelectedRows(selectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record._id?.toString().startsWith('missing_') || record.status === 'missing',
      name: record.student.name,
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
              rowKey="_id"
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
        allSubmissions={submissions.filter(sub => 
          sub.status !== 'missing' && 
          !sub._id?.toString().startsWith('missing_')
        )}
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