import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Typography,
  Card,
  Row,
  Col,
  Divider,
  Button,
  Tag,
  Space,
  Avatar,
  List,
  message,
  Alert,
  Progress,
  Tooltip,
  Timeline,
  Upload,
  Image,
  Tabs,
  Collapse,
  Rate,
  Select,
  Switch,
  Checkbox,
  Table
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  WarningOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  HighlightOutlined,
  CommentOutlined,
  StarOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileExcelOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  EditOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import moment from 'moment';
import RubricCustomizer from './RubricCustomizer';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;

const AssignmentGradingModal = ({ 
  visible, 
  onCancel, 
  onSave, 
  loading = false,
  assignment = null,
  submission = null 
}) => {
  const [form] = Form.useForm();
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [rubricGrades, setRubricGrades] = useState({});
  const [textHighlights, setTextHighlights] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rubricCustomizerVisible, setRubricCustomizerVisible] = useState(false);

  // Mock rubric data - should be customizable per assignment/subject
  const mockRubric = [
    {
      id: '1',
      criteria: 'Nội dung & Kiến thức',
      description: 'Độ chính xác và đầy đủ của nội dung',
      maxPoints: 40,
      levels: [
        { level: 'Xuất sắc', points: 40, description: 'Nội dung chính xác, đầy đủ, sâu sắc' },
        { level: 'Tốt', points: 32, description: 'Nội dung đúng, khá đầy đủ' },
        { level: 'Trung bình', points: 24, description: 'Nội dung cơ bản, một số thiếu sót' },
        { level: 'Yếu', points: 16, description: 'Nội dung sai nhiều hoặc thiếu' }
      ]
    },
    {
      id: '2',
      criteria: 'Trình bày & Cấu trúc',
      description: 'Cách trình bày, bố cục, ngôn từ',
      maxPoints: 25,
      levels: [
        { level: 'Xuất sắc', points: 25, description: 'Trình bày rõ ràng, logic, ngôn từ chuẩn' },
        { level: 'Tốt', points: 20, description: 'Trình bày tốt, có logic' },
        { level: 'Trung bình', points: 15, description: 'Trình bày bình thường' },
        { level: 'Yếu', points: 10, description: 'Trình bày kém, khó hiểu' }
      ]
    },
    {
      id: '3',
      criteria: 'Tư duy & Phân tích',
      description: 'Khả năng tư duy, phân tích vấn đề',
      maxPoints: 25,
      levels: [
        { level: 'Xuất sắc', points: 25, description: 'Tư duy sâu sắc, phân tích tốt' },
        { level: 'Tốt', points: 20, description: 'Có tư duy, phân tích khá' },
        { level: 'Trung bình', points: 15, description: 'Tư duy cơ bản' },
        { level: 'Yếu', points: 10, description: 'Thiếu tư duy, không phân tích' }
      ]
    },
    {
      id: '4',
      criteria: 'Sáng tạo & Ứng dụng',
      description: 'Tính sáng tạo và khả năng ứng dụng',
      maxPoints: 10,
      levels: [
        { level: 'Xuất sắc', points: 10, description: 'Rất sáng tạo, ứng dụng tốt' },
        { level: 'Tốt', points: 8, description: 'Có sáng tạo, biết ứng dụng' },
        { level: 'Trung bình', points: 6, description: 'Ít sáng tạo' },
        { level: 'Yếu', points: 4, description: 'Không sáng tạo' }
      ]
    }
  ];

  useEffect(() => {
    if (submission && visible) {
      setGrade(submission.grade);
      setFeedback(submission.feedback || '');
      form.setFieldsValue({
        grade: submission.grade,
        feedback: submission.feedback || ''
      });

      // Initialize rubric grades if exists
      if (submission.rubricGrades) {
        setRubricGrades(submission.rubricGrades);
      }
    }
  }, [submission, visible, form]);

  const handleSave = () => {
    form.validateFields().then(values => {
      const gradingData = {
        submissionId: submission?.id,
        studentId: submission?.student?.id,
        assignmentId: assignment?.id,
        grade: values.grade,
        feedback: values.feedback,
        rubricGrades: rubricGrades,
        annotations: annotations,
        gradedAt: new Date().toISOString()
      };
      
      onSave(gradingData);
    }).catch(error => {
      console.error('Validation failed:', error);
    });
  };

  const handleDownloadFile = (fileUrl, fileName) => {
    // Simulate file download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
    message.success(`Đang tải xuống ${fileName}`);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined style={{ color: '#1890ff' }} />;
      case 'ppt':
      case 'pptx':
        return <FilePptOutlined style={{ color: '#fa8c16' }} />;
      case 'xls':
      case 'xlsx':
        return <FileExcelOutlined style={{ color: '#52c41a' }} />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
        return <CodeOutlined style={{ color: '#722ed1' }} />;
      default:
        return <PaperClipOutlined />;
    }
  };

  const handleRubricGrade = (criteriaId, level) => {
    setRubricGrades(prev => ({
      ...prev,
      [criteriaId]: level
    }));

    // Auto calculate total grade from rubric
    const newTotal = mockRubric.reduce((sum, criteria) => {
      const selectedLevel = criteriaId === criteria.id ? level : rubricGrades[criteria.id];
      return sum + (selectedLevel?.points || 0);
    }, 0);

    form.setFieldsValue({ grade: newTotal });
    setGrade(newTotal);
  };

  const calculateRubricTotal = () => {
    return mockRubric.reduce((sum, criteria) => {
      const selectedLevel = rubricGrades[criteria.id];
      return sum + (selectedLevel?.points || 0);
    }, 0);
  };

  const renderCodeHighlight = (content) => {
    // Simple syntax highlighting for code
    if (!content) return content;
    
    return (
      <pre style={{ 
        background: '#f5f5f5',
        padding: '16px',
        borderRadius: '6px',
        overflow: 'auto',
        fontSize: '13px',
        lineHeight: '1.5'
      }}>
        <code dangerouslySetInnerHTML={{ 
          __html: content
            .replace(/\/\*[\s\S]*?\*\//g, '<span style="color: #8c8c8c;">$&</span>') // Comments
            .replace(/\/\/.*$/gm, '<span style="color: #8c8c8c;">$&</span>') // Line comments
            .replace(/\b(function|const|let|var|if|else|for|while|return|class|extends|import|export)\b/g, '<span style="color: #1890ff; font-weight: bold;">$&</span>') // Keywords
            .replace(/"([^"\\]|\\.)*"/g, '<span style="color: #52c41a;">$&</span>') // Strings
            .replace(/\b\d+\b/g, '<span style="color: #fa8c16;">$&</span>') // Numbers
        }} />
      </pre>
    );
  };

  const getSubmissionStatus = () => {
    if (!submission) return null;
    
    const dueDate = moment(assignment?.dueDate);
    const submittedDate = moment(submission.submittedAt);
    const isLate = submittedDate.isAfter(dueDate);
    
    if (submission.grade !== null) {
      return { color: 'success', text: 'Đã chấm điểm' };
    } else if (isLate) {
      return { color: 'warning', text: 'Nộp muộn' };
    } else {
      return { color: 'processing', text: 'Chờ chấm điểm' };
    }
  };

  const calculateLatePenalty = () => {
    if (!submission || !assignment) return 0;
    
    const dueDate = moment(assignment.dueDate);
    const submittedDate = moment(submission.submittedAt);
    
    if (submittedDate.isAfter(dueDate)) {
      const daysLate = submittedDate.diff(dueDate, 'days') + 1;
      const penalty = (assignment.latePenalty || 0) * daysLate;
      return Math.min(penalty, 100); // Max 100% penalty
    }
    
    return 0;
  };

  const getGradeColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return '#52c41a';
    if (percentage >= 80) return '#1890ff';
    if (percentage >= 70) return '#faad14';
    return '#ff4d4f';
  };

  // Detect if content is code or text
  const detectContentType = (content) => {
    if (!content) return 'text';
    
    const codeIndicators = [
      'function', 'class', 'import', 'export', 'const', 'let', 'var',
      'public', 'private', 'protected', 'int', 'string', 'boolean',
      'def ', 'print(', 'cout', '#include', 'using namespace',
      '{', '}', ';', '()', '=>', '==', '!=', '++', '--'
    ];
    
    const codeScore = codeIndicators.reduce((score, indicator) => {
      return score + (content.toLowerCase().includes(indicator.toLowerCase()) ? 1 : 0);
    }, 0);
    
    // If more than 3 code indicators found, treat as code
    return codeScore >= 3 ? 'code' : 'text';
  };

  const renderContent = (content) => {
    if (!content) return null;
    
    const contentType = detectContentType(content);
    
    if (contentType === 'code') {
      return renderCodeHighlight(content);
    } else {
      // Regular text content with better formatting
      return (
        <div style={{ 
          background: '#fafafa',
          padding: '16px',
          borderRadius: '6px',
          border: '1px solid #d9d9d9',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6',
          fontSize: '14px'
        }}>
          {content}
        </div>
      );
    }
  };

  if (!assignment || !submission) {
    return null;
  }

  const status = getSubmissionStatus();
  const latePenalty = calculateLatePenalty();
  const maxGrade = assignment.totalPoints || 100;

  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined />
          Chấm điểm bài tập: {assignment.title}
        </Space>
      }
      open={visible}
      onOk={handleSave}
      onCancel={onCancel}
      confirmLoading={loading}
      width={1200}
      okText="Lưu điểm"
      cancelText="Hủy"
      style={{ top: 20 }}
    >
      <Row gutter={24}>
        {/* Student Info & Submission Details */}
        <Col span={6}>
          <Card title="👤 Thông tin học sinh" size="small" className="mb-4">
            <div className="text-center mb-3">
              <Avatar 
                size={64} 
                src={submission.student?.avatar} 
                icon={<UserOutlined />}
              />
              <div className="mt-2">
                <Title level={5} className="mb-1">{submission.student?.name}</Title>
                <Text type="secondary">{submission.student?.email}</Text>
              </div>
            </div>
            
            <Divider />
            
            <Timeline size="small">
              <Timeline.Item 
                dot={<CalendarOutlined />}
                color="blue"
              >
                <Text strong>Hạn nộp:</Text><br />
                <Text>{moment(assignment.dueDate).format('DD/MM/YYYY HH:mm')}</Text>
              </Timeline.Item>
              
              <Timeline.Item 
                dot={<ClockCircleOutlined />}
                color={submission.submittedAt ? (latePenalty > 0 ? 'red' : 'green') : 'gray'}
              >
                <Text strong>Thời gian nộp:</Text><br />
                {submission.submittedAt ? (
                  <>
                    <Text>{moment(submission.submittedAt).format('DD/MM/YYYY HH:mm')}</Text>
                    {latePenalty > 0 && (
                      <div>
                        <Tag color="warning" className="mt-1">
                          <WarningOutlined /> Muộn {latePenalty}%
                        </Tag>
                      </div>
                    )}
                  </>
                ) : (
                  <Text type="secondary">Chưa nộp</Text>
                )}
              </Timeline.Item>
              
              <Timeline.Item 
                dot={<TrophyOutlined />}
                color={status?.color}
              >
                <Text strong>Trạng thái:</Text><br />
                <Tag color={status?.color}>{status?.text}</Tag>
              </Timeline.Item>
            </Timeline>
          </Card>

          {/* Current Grade */}
          <Card title="📊 Điểm số" size="small">
            <div className="text-center mb-3">
              {submission.grade !== null ? (
                <>
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{ color: getGradeColor(submission.grade, maxGrade) }}
                  >
                    {submission.grade}/{maxGrade}
                  </div>
                  <Progress
                    percent={(submission.grade / maxGrade) * 100}
                    status={submission.grade >= maxGrade * 0.7 ? 'success' : 'exception'}
                    strokeColor={getGradeColor(submission.grade, maxGrade)}
                  />
                  <Text type="secondary">
                    {Math.round((submission.grade / maxGrade) * 100)}%
                  </Text>
                </>
              ) : (
                <Text type="secondary">Chưa chấm điểm</Text>
              )}
            </div>
            
            {/* Rubric Summary */}
            {Object.keys(rubricGrades).length > 0 && (
              <div className="mt-3">
                <Divider />
                <Text strong>Rubric: {calculateRubricTotal()}/{mockRubric.reduce((sum, r) => sum + r.maxPoints, 0)}</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Main Content */}
        <Col span={18}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab={<span><FileTextOutlined /> Bài nộp</span>} key="content">
              <Card size="small" className="mb-4" style={{ maxHeight: '500px', overflow: 'auto' }}>
                {/* Text Submission */}
                {submission.content && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <Title level={5}>📝 Nội dung text:</Title>
                      <Space>
                        <Button 
                          size="small" 
                          icon={<CodeOutlined />}
                          onClick={() => {
                            // Toggle code highlighting
                            message.info('Đã bật syntax highlighting');
                          }}
                        >
                          Code Format
                        </Button>
                        <Button 
                          size="small" 
                          icon={<HighlightOutlined />}
                          onClick={() => {
                            message.info('Chọn text để highlight');
                          }}
                        >
                          Highlight
                        </Button>
                      </Space>
                    </div>
                    
                    <Card size="small" className="bg-gray-50">
                      {renderContent(submission.content)}
                    </Card>
                  </div>
                )}

                {/* File Attachments */}
                {submission.attachments && submission.attachments.length > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <Title level={5}>📎 File đính kèm:</Title>
                      <Space>
                        <Button 
                          size="small" 
                          icon={<ZoomInOutlined />}
                          onClick={() => setZoomLevel(prev => Math.min(prev + 25, 200))}
                        />
                        <span>{zoomLevel}%</span>
                        <Button 
                          size="small" 
                          icon={<ZoomOutOutlined />}
                          onClick={() => setZoomLevel(prev => Math.max(prev - 25, 50))}
                        />
                      </Space>
                    </div>
                    
                    <List
                      size="small"
                      dataSource={submission.attachments}
                      renderItem={(file) => (
                        <List.Item
                          actions={[
                            <Button 
                              size="small" 
                              icon={<EyeOutlined />}
                              onClick={() => setPreviewFile(file)}
                            >
                              Xem
                            </Button>,
                            <Button 
                              size="small" 
                              icon={<DownloadOutlined />}
                              onClick={() => handleDownloadFile(file.url, file.name)}
                            >
                              Tải
                            </Button>,
                            <Button 
                              size="small" 
                              icon={<CommentOutlined />}
                              onClick={() => {
                                // Add annotation
                                message.info('Thêm ghi chú cho file');
                              }}
                            >
                              Ghi chú
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={getFileIcon(file.name)}
                            title={file.name}
                            description={`${file.size} • ${file.type || 'File'}`}
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                )}

                {(!submission.content && (!submission.attachments || submission.attachments.length === 0)) && (
                  <Alert
                    message="Không có nội dung nộp bài"
                    description="Học sinh chưa nộp bài hoặc bài nộp trống."
                    type="warning"
                    showIcon
                  />
                )}
              </Card>
            </TabPane>

            <TabPane tab={<span><StarOutlined /> Rubric chấm điểm</span>} key="rubric">
              <Card size="small">
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <Text strong>Tổng điểm rubric: {calculateRubricTotal()}/{mockRubric.reduce((sum, r) => sum + r.maxPoints, 0)}</Text>
                    <Button 
                      size="small" 
                      className="ml-2"
                      onClick={() => {
                        const total = calculateRubricTotal();
                        form.setFieldsValue({ grade: total });
                        setGrade(total);
                      }}
                    >
                      Áp dụng vào điểm chính
                    </Button>
                  </div>
                  <Button 
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setRubricCustomizerVisible(true)}
                  >
                    Tùy chỉnh Rubric
                  </Button>
                </div>

                <Collapse>
                  {mockRubric.map(criteria => (
                    <Panel 
                      header={
                        <div className="flex justify-between items-center">
                          <span>
                            <strong>{criteria.criteria}</strong> ({criteria.maxPoints} điểm)
                          </span>
                          {rubricGrades[criteria.id] && (
                            <Tag color="blue">
                              {rubricGrades[criteria.id].points}/{criteria.maxPoints}
                            </Tag>
                          )}
                        </div>
                      } 
                      key={criteria.id}
                    >
                      <Text type="secondary" className="block mb-3">
                        {criteria.description}
                      </Text>
                      
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {criteria.levels.map(level => (
                          <Card 
                            key={level.level}
                            size="small"
                            className={`cursor-pointer ${
                              rubricGrades[criteria.id]?.level === level.level 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'hover:border-gray-400'
                            }`}
                            onClick={() => handleRubricGrade(criteria.id, level)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <Text strong>{level.level}</Text> - {level.points} điểm
                                <br />
                                <Text type="secondary">{level.description}</Text>
                              </div>
                              {rubricGrades[criteria.id]?.level === level.level && (
                                <CheckCircleOutlined style={{ color: '#1890ff' }} />
                              )}
                            </div>
                          </Card>
                        ))}
                      </Space>
                    </Panel>
                  ))}
                </Collapse>
              </Card>
            </TabPane>

            <TabPane tab={<span><EditOutlined /> Chấm điểm</span>} key="grading">
              <Card size="small">
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{
                    grade: submission.grade,
                    feedback: submission.feedback || ''
                  }}
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        name="grade"
                        label={`Điểm (/${maxGrade})`}
                        rules={[
                          { required: true, message: 'Vui lòng nhập điểm' },
                          { type: 'number', min: 0, max: maxGrade, message: `Điểm từ 0-${maxGrade}` }
                        ]}
                      >
                        <InputNumber
                          min={0}
                          max={maxGrade}
                          style={{ width: '100%' }}
                          placeholder="Nhập điểm"
                          onChange={(value) => setGrade(value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <div className="mb-2">
                        <Text strong>Phần trăm: </Text>
                        <Text type={grade >= maxGrade * 0.7 ? 'success' : 'danger'}>
                          {grade ? Math.round((grade / maxGrade) * 100) : 0}%
                        </Text>
                      </div>
                      {latePenalty > 0 && (
                        <Alert
                          message={`Phạt nộp muộn: -${latePenalty}%`}
                          type="warning"
                          size="small"
                          showIcon
                        />
                      )}
                    </Col>
                    <Col span={8}>
                      <div className="mb-2">
                        <Text strong>Xếp loại: </Text>
                        {grade && (
                          <Tag color={
                            grade >= maxGrade * 0.9 ? 'green' :
                            grade >= maxGrade * 0.8 ? 'blue' :
                            grade >= maxGrade * 0.7 ? 'orange' : 'red'
                          }>
                            {grade >= maxGrade * 0.9 ? 'Xuất sắc' :
                             grade >= maxGrade * 0.8 ? 'Giỏi' :
                             grade >= maxGrade * 0.7 ? 'Khá' : 'Trung bình'}
                          </Tag>
                        )}
                      </div>
                    </Col>
                  </Row>

                  <Form.Item
                    name="feedback"
                    label="Nhận xét chi tiết"
                    rules={[
                      { required: true, message: 'Vui lòng nhập nhận xét' },
                      { min: 10, message: 'Nhận xét phải có ít nhất 10 ký tự' }
                    ]}
                  >
                    <TextArea
                      rows={8}
                      placeholder="Nhập nhận xét chi tiết về bài làm của học sinh..."
                      showCount
                      maxLength={2000}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </Form.Item>

                  {/* Quick Feedback Templates */}
                  <div className="mb-3">
                    <Text strong className="mb-2 block">Mẫu nhận xét nhanh:</Text>
                    <Space wrap>
                      <Button 
                        size="small"
                        onClick={() => setFeedback('Bài làm tốt, nội dung đầy đủ và chính xác. Trình bày rõ ràng, logic. Cần chú ý thêm về chính tả và ngôn từ.')}
                      >
                        Tốt
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => setFeedback('Bài làm đạt yêu cầu cơ bản. Nội dung đúng nhưng chưa sâu sắc. Nên bổ sung thêm ví dụ và phân tích chi tiết hơn.')}
                      >
                        Khá
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => setFeedback('Bài viết hay, thể hiện tư duy tốt và kiến thức vững. Cấu trúc logic, ngôn từ phù hợp. Tiếp tục phát huy!')}
                      >
                        Giỏi
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => setFeedback('Bài làm chưa đạt yêu cầu. Thiếu nội dung quan trọng, trình bày chưa rõ ràng. Cần học lại và làm bài mới.')}
                      >
                        Cần cải thiện
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => setFeedback('Bài làm xuất sắc! Nội dung sâu sắc, trình bày logic, có tư duy phản biện. Đây là bài mẫu cho cả lớp!')}
                      >
                        Xuất sắc
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => setFeedback('File đính kèm rõ nét, đầy đủ. Nội dung được trình bày khoa học. Cần bổ sung thêm phần kết luận.')}
                      >
                        Tốt (File)
                      </Button>
                    </Space>
                  </div>

                  {/* Additional Options */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="allowResubmit" valuePropName="checked">
                        <Checkbox>Cho phép nộp lại</Checkbox>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="hideGradeFromStudent" valuePropName="checked">
                        <Checkbox>Ẩn điểm khỏi học sinh</Checkbox>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </TabPane>

            <TabPane tab={<span><HistoryOutlined /> Lịch sử</span>} key="history">
              <Card size="small">
                <Timeline>
                  <Timeline.Item>
                    <Text strong>Học sinh nộp bài</Text><br />
                    <Text type="secondary">{moment(submission.submittedAt).format('DD/MM/YYYY HH:mm')}</Text>
                  </Timeline.Item>
                  {submission.grade !== null && (
                    <Timeline.Item>
                      <Text strong>Giáo viên chấm điểm: {submission.grade}/{maxGrade}</Text><br />
                      <Text type="secondary">{moment().format('DD/MM/YYYY HH:mm')}</Text>
                    </Timeline.Item>
                  )}
                </Timeline>
              </Card>
            </TabPane>
          </Tabs>
        </Col>
      </Row>

      {/* File Preview Modal */}
      {previewFile && (
        <Modal
          title={`Xem trước: ${previewFile.name}`}
          open={!!previewFile}
          onCancel={() => setPreviewFile(null)}
          footer={[
            <Button key="download" icon={<DownloadOutlined />} onClick={() => handleDownloadFile(previewFile.url, previewFile.name)}>
              Tải xuống
            </Button>,
            <Button key="annotate" icon={<CommentOutlined />}>
              Thêm ghi chú
            </Button>,
            <Button key="close" onClick={() => setPreviewFile(null)}>
              Đóng
            </Button>
          ]}
          width={900}
        >
          <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
            {previewFile.type?.includes('image') ? (
              <Image src={previewFile.url} alt={previewFile.name} style={{ maxWidth: '100%' }} />
            ) : previewFile.name.endsWith('.pdf') ? (
              <div className="text-center p-8">
                <FilePdfOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
                <div className="mt-2">
                  <Text>PDF Preview</Text><br />
                  <Text type="secondary">Click "Tải xuống" để xem đầy đủ</Text>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                {getFileIcon(previewFile.name)}
                <div className="mt-2">
                  <Text>Không thể xem trước file này</Text><br />
                  <Text type="secondary">Vui lòng tải xuống để xem</Text>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Rubric Customizer Modal */}
      <RubricCustomizer
        visible={rubricCustomizerVisible}
        onCancel={() => setRubricCustomizerVisible(false)}
        onSave={(rubricData) => {
          // Update mockRubric with new data
          console.log('Saved rubric:', rubricData);
          setRubricCustomizerVisible(false);
        }}
        assignment={assignment}
        initialRubric={mockRubric}
      />
    </Modal>
  );
};

export default AssignmentGradingModal; 