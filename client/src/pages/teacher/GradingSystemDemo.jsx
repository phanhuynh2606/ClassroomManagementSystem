import React, { useState } from 'react';
import {
  Card,
  Steps,
  Typography,
  Row,
  Col,
  Button,
  Alert,
  Divider,
  Tag,
  Space,
  Image,
  Collapse,
  Timeline,
  List,
  Progress,
  Tooltip,
  Modal
} from 'antd';
import {
  FileTextOutlined,
  PaperClipOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  EditOutlined,
  StarOutlined,
  CommentOutlined,
  DownloadOutlined,
  CodeOutlined,
  HighlightOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  MailOutlined,
  FilePdfOutlined
} from '@ant-design/icons';

// Import the PDF viewer component
import PDFViewerModal from './components/PDFViewerModal';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

const GradingSystemDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoModalVisible, setDemoModalVisible] = useState(false);
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  
  // Mock data for PDF demo
  const mockStudent = {
    id: 'st1',
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan@student.edu'
  };
  
  const mockAssignment = {
    id: 'assign1',
    title: 'Bài tập lập trình JavaScript',
    totalPoints: 100
  };
  
  // Your Google Drive PDF link
  const googleDrivePDFUrl = 'https://drive.google.com/file/d/1dpfAD499ejTyfXJYXhgBuaMeNQ1kwedL/view?usp=sharing';

  const gradingSteps = [
    {
      title: 'Học sinh nộp bài',
      content: 'Học sinh có thể nộp bài bằng text hoặc file',
      icon: <FileTextOutlined />
    },
    {
      title: 'Giáo viên xem submission',
      content: 'Xem nội dung bài nộp và file đính kèm',
      icon: <EyeOutlined />
    },
    {
      title: 'Chấm điểm với công cụ',
      content: 'Sử dụng rubric, syntax highlighting, annotation',
      icon: <TrophyOutlined />
    },
    {
      title: 'Feedback và hoàn thành',
      content: 'Nhận xét chi tiết và lưu điểm',
      icon: <CheckCircleOutlined />
    }
  ];

  const textSubmissionFeatures = [
    {
      title: 'Smart Text Display',
      description: 'Tự động nhận diện và format code, hoặc hiển thị text thường',
      icon: <EditOutlined style={{ color: '#1890ff' }} />
    },
    {
      title: 'Text Annotation',
      description: 'Highlight và comment trực tiếp trên text bài làm',
      icon: <HighlightOutlined style={{ color: '#fa8c16' }} />
    },
    {
      title: 'Quick Feedback',
      description: 'Mẫu nhận xét nhanh cho mọi môn học',
      icon: <CommentOutlined style={{ color: '#52c41a' }} />
    },
    {
      title: 'Flexible Rubric',
      description: 'Tùy chỉnh rubric theo từng môn học và assignment',
      icon: <StarOutlined style={{ color: '#722ed1' }} />
    }
  ];

  const fileSubmissionFeatures = [
    {
      title: 'Multi-format Preview',
      description: 'Xem trước PDF, Word, PowerPoint, hình ảnh',
      icon: <EyeOutlined style={{ color: '#ff4d4f' }} />
    },
    {
      title: 'File Annotation',
      description: 'Thêm ghi chú và comment trên file',
      icon: <CommentOutlined style={{ color: '#fa8c16' }} />
    },
    {
      title: 'Zoom & Download',
      description: 'Zoom in/out và tải file về máy',
      icon: <DownloadOutlined style={{ color: '#52c41a' }} />
    },
    {
      title: 'File Type Recognition',
      description: 'Icon và xử lý đặc biệt cho từng loại file',
      icon: <PaperClipOutlined style={{ color: '#722ed1' }} />
    }
  ];

  const rubricExample = [
    {
      criteria: 'Nội dung & Kiến thức (40 điểm)',
      levels: [
        { name: 'Xuất sắc', points: 40, desc: 'Nội dung chính xác, đầy đủ, sâu sắc' },
        { name: 'Tốt', points: 32, desc: 'Nội dung đúng, khá đầy đủ' },
        { name: 'Khá', points: 24, desc: 'Nội dung cơ bản, một số thiếu sót' },
        { name: 'Yếu', points: 16, desc: 'Nội dung sai nhiều hoặc thiếu' }
      ]
    },
    {
      criteria: 'Trình bày & Cấu trúc (30 điểm)',
      levels: [
        { name: 'Xuất sắc', points: 30, desc: 'Trình bày rõ ràng, logic, ngôn từ chuẩn' },
        { name: 'Tốt', points: 24, desc: 'Trình bày tốt, có logic' },
        { name: 'Khá', points: 18, desc: 'Trình bày bình thường' },
        { name: 'Yếu', points: 12, desc: 'Trình bày kém, khó hiểu' }
      ]
    },
    {
      criteria: 'Tư duy & Phân tích (30 điểm)',
      levels: [
        { name: 'Xuất sắc', points: 30, desc: 'Tư duy sâu sắc, phân tích tốt' },
        { name: 'Tốt', points: 24, desc: 'Có tư duy, phân tích khá' },
        { name: 'Khá', points: 18, desc: 'Tư duy cơ bản' },
        { name: 'Yếu', points: 12, desc: 'Thiếu tư duy, không phân tích' }
      ]
    }
  ];

  const batchGradingFeatures = [
    'Chọn nhiều submission để chấm cùng lúc',
    'Áp dụng điểm và feedback giống nhau',
    'Gửi email nhắc nhở học sinh chưa nộp',
    'Xuất file Excel/CSV điểm số',
    'Thống kê và phân tích submission'
  ];

  const handlePDFGradeDemo = () => {
    setPdfViewerVisible(true);
  };

  const handleSavePDFGrade = (gradingData) => {
    console.log('PDF Grading Data:', gradingData);
    setPdfViewerVisible(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <Title level={1}>🎯 Hệ thống Chấm điểm Assignment</Title>
        <Paragraph className="text-lg text-gray-600">
          Công cụ chấm điểm linh hoạt cho mọi môn học - hỗ trợ text, file, và rubric tùy chỉnh
        </Paragraph>
      </div>

      {/* Process Overview */}
      <Card className="mb-8">
        <Title level={2}>📋 Quy trình chấm điểm</Title>
        <Steps current={currentStep} className="mb-6">
          {gradingSteps.map((step, index) => (
            <Step 
              key={index}
              title={step.title} 
              description={step.content}
              icon={step.icon}
            />
          ))}
        </Steps>
        <div className="text-center">
          <Space>
            <Button 
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Trước
            </Button>
            <Button 
              type="primary"
              disabled={currentStep === gradingSteps.length - 1}
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Tiếp
            </Button>
            <Button onClick={() => setDemoModalVisible(true)}>
              Xem Demo
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Text Submission */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1890ff' }} />
                <span>📝 Text Submission</span>
              </Space>
            }
            className="h-full"
          >
            <Alert
              message="Dành cho câu trả lời text, essay, bài viết, hoặc code"
              type="info"
              className="mb-4"
              showIcon
            />

            <Title level={4}>✨ Tính năng chính:</Title>
            <List
              dataSource={textSubmissionFeatures}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={item.icon}
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />

            <Divider />

            <Title level={4}>🖥️ Ví dụ hiển thị code:</Title>
            <Card size="small" className="bg-gray-50">
              <pre style={{ 
                background: '#f5f5f5',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '13px',
                margin: 0
              }}>
                <code dangerouslySetInnerHTML={{ 
                  __html: `<span style="color: #8c8c8c;">// Bài tập JavaScript</span>
<span style="color: #1890ff; font-weight: bold;">function</span> calculateSum(arr) {
  <span style="color: #1890ff; font-weight: bold;">return</span> arr.reduce((sum, num) => sum + num, <span style="color: #fa8c16;">0</span>);
}

<span style="color: #8c8c8c;">// Test case</span>
<span style="color: #1890ff; font-weight: bold;">const</span> numbers = [<span style="color: #fa8c16;">1</span>, <span style="color: #fa8c16;">2</span>, <span style="color: #fa8c16;">3</span>, <span style="color: #fa8c16;">4</span>, <span style="color: #fa8c16;">5</span>];
console.log(<span style="color: #52c41a;">"Sum:"</span>, calculateSum(numbers));`
                }} />
              </pre>
            </Card>
          </Card>
        </Col>

        {/* File Submission */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <PaperClipOutlined style={{ color: '#52c41a' }} />
                <span>📎 File Submission</span>
              </Space>
            }
            className="h-full"
          >
            <Alert
              message="Dành cho bài tập file Word, PDF, code project, hình ảnh"
              type="success"
              className="mb-4"
              showIcon
            />

            <Title level={4}>✨ Tính năng chính:</Title>
            <List
              dataSource={fileSubmissionFeatures}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={item.icon}
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />

            <Divider />

            <Title level={4}>📁 Các loại file hỗ trợ:</Title>
            <Space wrap>
              <Tag color="red" icon={<FileTextOutlined />}>PDF</Tag>
              <Tag color="blue" icon={<FileTextOutlined />}>Word</Tag>
              <Tag color="orange" icon={<FileTextOutlined />}>PowerPoint</Tag>
              <Tag color="green" icon={<FileTextOutlined />}>Excel</Tag>
              <Tag color="purple" icon={<CodeOutlined />}>Code Files</Tag>
              <Tag color="cyan" icon={<PaperClipOutlined />}>Images</Tag>
              <Tag color="magenta" icon={<PaperClipOutlined />}>ZIP/RAR</Tag>
            </Space>

            <Divider />

            <Title level={4}>🚀 Demo với Google Drive PDF:</Title>
            <Alert
              message="Test với link PDF thực tế"
              description="Nhấn nút dưới để demo xem và chấm file PDF từ Google Drive"
              type="warning"
              showIcon
              className="mb-3"
            />
            <Button 
              type="primary" 
              icon={<FilePdfOutlined />}
              onClick={handlePDFGradeDemo}
              size="large"
              className="w-full"
            >
              🎯 Demo chấm PDF từ Google Drive
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Advanced Features */}
      <Row gutter={[24, 24]} className="mt-8">
        {/* Rubric System */}
        <Col span={12}>
          <Card title={<><StarOutlined style={{ color: '#faad14' }} /> 🏆 Hệ thống Rubric</>}>
            <Paragraph>
              Chấm điểm theo tiêu chí cụ thể, tự động tính tổng điểm
            </Paragraph>

            <Collapse>
              {rubricExample.map((criteria, index) => (
                <Panel header={criteria.criteria} key={index}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {criteria.levels.map((level, idx) => (
                      <Card key={idx} size="small" className="cursor-pointer hover:border-blue-400">
                        <div className="flex justify-between">
                          <div>
                            <Text strong>{level.name}</Text> - {level.points} điểm
                            <br />
                            <Text type="secondary">{level.desc}</Text>
                          </div>
                          <CheckCircleOutlined style={{ color: '#1890ff', opacity: 0.3 }} />
                        </div>
                      </Card>
                    ))}
                  </Space>
                </Panel>
              ))}
            </Collapse>
          </Card>
        </Col>

        {/* Batch Grading */}
        <Col span={12}>
                     <Card title={<><AppstoreOutlined style={{ color: '#722ed1' }} /> ⚡ Chấm điểm hàng loạt</>}>
            <Paragraph>
              Quản lý và chấm điểm nhiều submission cùng lúc
            </Paragraph>

            <Title level={4}>📊 Thống kê submission:</Title>
            <Row gutter={8} className="mb-4">
              <Col span={6}>
                <Card size="small" className="text-center">
                  <div className="text-2xl font-bold text-blue-600">25</div>
                  <div className="text-xs">Tổng HS</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <div className="text-2xl font-bold text-green-600">22</div>
                  <div className="text-xs">Đã nộp</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <div className="text-2xl font-bold text-orange-600">18</div>
                  <div className="text-xs">Đã chấm</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <div className="text-2xl font-bold text-red-600">3</div>
                  <div className="text-xs">Chưa nộp</div>
                </Card>
              </Col>
            </Row>

            <Title level={4}>🔧 Tính năng:</Title>
            <List
              size="small"
              dataSource={batchGradingFeatures}
              renderItem={(item) => (
                <List.Item>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> {item}
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Demo Modal */}
      <Modal
        title="🎬 Demo hệ thống chấm điểm"
        open={demoModalVisible}
        onCancel={() => setDemoModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDemoModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        <Timeline>
          <Timeline.Item 
            dot={<UserOutlined />}
            color="blue"
          >
            <Text strong>Học sinh nộp bài</Text>
            <div className="mt-2">
              <Text>Học sinh "Nguyễn Văn An" nộp bài JavaScript exercise</Text>
              <div className="flex gap-2 mt-1">
                <Tag color="blue">Text content: 245 dòng code</Tag>
                <Tag color="green">2 files: .js và .png</Tag>
              </div>
            </div>
          </Timeline.Item>

          <Timeline.Item 
            dot={<EyeOutlined />}
            color="green"
          >
            <Text strong>Giáo viên xem submission</Text>
            <div className="mt-2">
              <Text>Mở modal chấm điểm, xem code với syntax highlighting</Text>
              <br />
              <Text type="secondary">• Code được format đẹp với màu sắc</Text>
              <br />
              <Text type="secondary">• Preview file đính kèm</Text>
            </div>
          </Timeline.Item>

          <Timeline.Item 
            dot={<StarOutlined />}
            color="orange"
          >
            <Text strong>Chấm điểm bằng Rubric</Text>
            <div className="mt-2">
              <Text>Chọn mức điểm cho từng tiêu chí:</Text>
              <div className="mt-1">
                <Tag color="success">Tính chính xác: 24/30 điểm</Tag>
                <Tag color="success">Trình bày: 16/20 điểm</Tag>
                <Tag color="warning">Sáng tạo: 9/15 điểm</Tag>
              </div>
              <Text strong>Tổng: 49/65 điểm</Text>
            </div>
          </Timeline.Item>

          <Timeline.Item 
            dot={<CommentOutlined />}
            color="red"
          >
            <Text strong>Feedback chi tiết</Text>
            <div className="mt-2">
              <Card size="small" className="bg-blue-50">
                <Text>
                  "Bài làm tốt! Code sạch sẽ và logic rõ ràng. 
                  Có thể cải thiện thêm error handling và optimization. 
                  Phần bonus rất sáng tạo!"
                </Text>
              </Card>
            </div>
          </Timeline.Item>

          <Timeline.Item 
            dot={<CheckCircleOutlined />}
            color="green"
          >
            <Text strong>Hoàn thành & Thông báo</Text>
            <div className="mt-2">
              <Text>Lưu điểm và gửi thông báo cho học sinh</Text>
              <br />
              <Progress percent={75} status="success" className="mt-2" />
              <Text type="secondary">Điểm: 49/65 (75%)</Text>
            </div>
          </Timeline.Item>
        </Timeline>
      </Modal>

      {/* Call to Action */}
      <Card className="mt-8 text-center bg-gradient-to-r from-blue-50 to-purple-50">
        <Title level={3}>🚀 Bắt đầu sử dụng hệ thống chấm điểm</Title>
        <Paragraph className="text-lg">
          Hệ thống chấm điểm thông minh giúp giáo viên tiết kiệm thời gian và chấm điểm công bằng, chính xác hơn.
        </Paragraph>
        <Space size="large">
          <Button type="primary" size="large" icon={<TrophyOutlined />}>
            Thử ngay
          </Button>
          <Button size="large" icon={<FileTextOutlined />}>
            Xem hướng dẫn
          </Button>
          <Button 
            size="large" 
            icon={<FilePdfOutlined />}
            onClick={handlePDFGradeDemo}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Demo PDF Google Drive
          </Button>
        </Space>
      </Card>

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        visible={pdfViewerVisible}
        onCancel={() => setPdfViewerVisible(false)}
        onSave={handleSavePDFGrade}
        pdfUrl={googleDrivePDFUrl}
        fileName="Database.pdf"
        student={mockStudent}
        assignment={mockAssignment}
      />
    </div>
  );
};

export default GradingSystemDemo; 