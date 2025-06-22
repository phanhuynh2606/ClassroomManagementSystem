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
  Image
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
  CheckCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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

  useEffect(() => {
    if (submission && visible) {
      setGrade(submission.grade);
      setFeedback(submission.feedback || '');
      form.setFieldsValue({
        grade: submission.grade,
        feedback: submission.feedback || ''
      });
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
      width={1000}
      okText="Lưu điểm"
      cancelText="Hủy"
      style={{ top: 20 }}
    >
      <Row gutter={24}>
        {/* Student Info & Submission Details */}
        <Col span={8}>
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
          {submission.grade !== null && (
            <Card title="📊 Điểm hiện tại" size="small">
              <div className="text-center">
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
              </div>
            </Card>
          )}
        </Col>

        {/* Submission Content */}
        <Col span={16}>
          <Card title="📝 Bài nộp" size="small" className="mb-4">
            {/* Text Submission */}
            {submission.content && (
              <div className="mb-4">
                <Title level={5}>Nội dung text:</Title>
                <Card size="small" className="bg-gray-50">
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                    {submission.content}
                  </Paragraph>
                </Card>
              </div>
            )}

            {/* File Attachments */}
            {submission.attachments && submission.attachments.length > 0 && (
              <div className="mb-4">
                <Title level={5}>File đính kèm:</Title>
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
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<PaperClipOutlined />}
                        title={file.name}
                        description={`${file.size} • ${file.type}`}
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

          {/* Grading Form */}
          <Card title="🎯 Chấm điểm & Nhận xét" size="small">
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
                  rows={6}
                  placeholder="Nhập nhận xét chi tiết về bài làm của học sinh..."
                  showCount
                  maxLength={1000}
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
                    onClick={() => setFeedback('Bài làm tốt, đầy đủ yêu cầu. Cần cải thiện cách trình bày.')}
                  >
                    Tốt
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => setFeedback('Bài làm đạt yêu cầu cơ bản. Nên tham khảo thêm tài liệu để hoàn thiện.')}
                  >
                    Trung bình
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => setFeedback('Bài làm chưa đạt yêu cầu. Cần làm lại theo hướng dẫn.')}
                  >
                    Cần cải thiện
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => setFeedback('Bài làm xuất sắc, đạt điểm tối đa. Chúc mừng!')}
                  >
                    Xuất sắc
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
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
            <Button key="close" onClick={() => setPreviewFile(null)}>
              Đóng
            </Button>
          ]}
          width={800}
        >
          {previewFile.type?.includes('image') ? (
            <Image src={previewFile.url} alt={previewFile.name} style={{ maxWidth: '100%' }} />
          ) : (
            <div className="text-center p-8">
              <PaperClipOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />
              <div className="mt-2">
                <Text>Không thể xem trước file này</Text><br />
                <Text type="secondary">Vui lòng tải xuống để xem</Text>
              </div>
            </div>
          )}
        </Modal>
      )}
    </Modal>
  );
};

export default AssignmentGradingModal; 