import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Input,
  Form,
  Rate,
  message,
  Spin,
  Alert,
  Tooltip,
  Slider,
  Divider,
  Tag,
  Select
} from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  CommentOutlined,
  HighlightOutlined,
  EditOutlined,
  SaveOutlined,
  RotateRightOutlined,
  PrinterOutlined,
  FileTextOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PDFViewerModal = ({ 
  visible, 
  onCancel, 
  onSave,
  pdfUrl, 
  fileName,
  student,
  assignment 
}) => {
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [annotations, setAnnotations] = useState([]);
  const [grade, setGrade] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [embedMethod, setEmbedMethod] = useState('preview'); // preview, embed, direct, demo
  const [form] = Form.useForm();

  // Convert Google Drive link to embeddable format
  const getEmbeddablePDFUrl = (url) => {
    if (url.includes('drive.google.com')) {
      // Extract file ID from Google Drive URL
      const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (fileId) {
        // Try different embedding approaches for Google Drive
        return {
          preview: `https://drive.google.com/file/d/${fileId}/preview`,
          embed: `https://drive.google.com/file/d/${fileId}/view?embedded=true`,
          direct: `https://docs.google.com/gview?url=https://drive.google.com/uc?id=${fileId}&embedded=true`
        };
      }
    }
    return { preview: url, embed: url, direct: url };
  };

  const embeddableUrls = getEmbeddablePDFUrl(pdfUrl);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      // Try to load the PDF, if it fails, fall back to demo
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, embedMethod]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleAddAnnotation = () => {
    const newAnnotation = {
      id: Date.now(),
      type: 'comment',
      content: 'Ghi chú mới',
      x: 50,
      y: 50
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  const handleSaveGrade = () => {
    if (!grade) {
      message.error('Vui lòng nhập điểm');
      return;
    }

    const gradingData = {
      grade,
      feedback,
      annotations,
      viewedAt: new Date().toISOString(),
      fileName,
      pdfUrl
    };

    onSave(gradingData);
    message.success('Đã lưu điểm thành công!');
  };

  const handleDownload = () => {
    if (pdfUrl.includes('drive.google.com')) {
      const fileId = pdfUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (fileId) {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        window.open(downloadUrl, '_blank');
      }
    } else {
      window.open(pdfUrl, '_blank');
    }
    message.success('Đang tải xuống file PDF...');
  };

  const quickFeedbacks = [
    'Bài làm tốt, nội dung đầy đủ và rõ ràng.',
    'Cần cải thiện cách trình bày và bố cục.',
    'Nội dung chính xác nhưng thiếu chi tiết.',
    'Bài viết hay, thể hiện tư duy tốt.',
    'Cần bổ sung thêm ví dụ minh họa.'
  ];

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <Space>
            <FileTextOutlined />
            <span>Xem & Chấm PDF: {fileName}</span>
          </Space>
          <Space>
            <Text type="secondary">
              {student?.name} • {assignment?.title}
            </Text>
          </Space>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width="95vw"
      style={{ top: 20 }}
      footer={null}
      destroyOnHidden
    >
      <Row gutter={24} style={{ height: '80vh',overflow:"auto" }}>
        {/* PDF Viewer */}
        <Col span={16}>
          <Card 
            title={
              <div className="flex justify-between items-center">
                <span>📄 {fileName}</span>
                <Space>
                  <Text type="secondary">Zoom: {zoom}%</Text>
                  <Button.Group>
                    <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
                    <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
                    <Button icon={<RotateRightOutlined />} onClick={handleRotate} />
                    <Button icon={<FullscreenOutlined />} />
                  </Button.Group>
                </Space>
              </div>
            }
                         extra={
               <Space>
                 <Select
                   value={embedMethod}
                   onChange={setEmbedMethod}
                   style={{ width: 150 }}
                   size="small"
                 >
                   <Option value="preview">Google Preview</Option>
                   <Option value="embed">Google Embed</Option>
                   <Option value="direct">Google Viewer</Option>
                   <Option value="demo">Demo Mode</Option>
                 </Select>
                 <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                   Tải xuống
                 </Button>
                 <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
                   In
                 </Button>
               </Space>
             }
            className="h-full"
          >
            <div 
              className="relative overflow-auto bg-gray-100 flex items-center justify-center"
              style={{ 
                height: 'calc(80vh - 120px)',
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              {loading ? (
                <div className="text-center">
                  <Spin size="large" />
                  <div className="mt-4">
                    <Text>Đang tải PDF...</Text>
                  </div>
                </div>
              ) : (
                                 <>
                   {/* PDF Display based on method */}
                   {embedMethod === 'demo' ? (
                     /* Demo Mode */
                     <div className="w-full h-full">
                       <Alert
                         message="Demo Mode - Google Drive PDF"
                         description={
                           <div>
                             <Text>
                               Đây là demo mode. Chuyển sang mode khác để thử load PDF thật.
                             </Text>
                             <br />
                             <Text type="secondary">
                               Link gốc: <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                 {fileName}
                               </a>
                             </Text>
                           </div>
                         }
                         type="info"
                         showIcon
                         className="mb-4"
                       />
                       
                       {/* Demo PDF Content */}
                       <div className="bg-white p-8 rounded shadow-lg" style={{ minHeight: '600px' }}>
                         <div className="text-center mb-6">
                           <Title level={3}>📄 {fileName}</Title>
                           <Text type="secondary">Học sinh: {student?.name}</Text>
                         </div>
                         
                         <div className="space-y-4">
                           <div>
                             <Title level={4}>1. Giới thiệu</Title>
                             <Text>
                               Bài tập này yêu cầu sinh viên thiết kế và xây dựng cơ sở dữ liệu 
                               cho hệ thống quản lý thư viện.
                             </Text>
                           </div>
                           
                           <div>
                             <Title level={4}>2. Yêu cầu</Title>
                             <ul>
                               <li>Thiết kế ERD cho hệ thống thư viện</li>
                               <li>Tạo các bảng với các ràng buộc phù hợp</li>
                               <li>Viết các câu truy vấn SQL cơ bản và nâng cao</li>
                               <li>Tối ưu hóa hiệu suất cơ sở dữ liệu</li>
                             </ul>
                           </div>
                           
                           <div>
                             <Title level={4}>3. Thiết kế ERD</Title>
                             <div className="bg-gray-50 p-4 rounded">
                               <Text>Các entity chính:</Text>
                               <ul>
                                 <li>Book (BookID, Title, Author, ISBN, PublishYear)</li>
                                 <li>Reader (ReaderID, FullName, Email, Phone)</li>
                                 <li>Borrow (BorrowID, BookID, ReaderID, BorrowDate, ReturnDate)</li>
                               </ul>
                             </div>
                           </div>
                           
                           <div>
                             <Title level={4}>4. Kết luận</Title>
                             <Text>
                               Em đã hoàn thành thiết kế cơ sở dữ liệu với đầy đủ các ràng buộc 
                               và tối ưu hóa hiệu suất truy vấn.
                             </Text>
                           </div>
                         </div>
                       </div>
                     </div>
                   ) : (
                     /* Try to embed real PDF */
                     <div className="w-full h-full relative">
                       <Alert
                         message={`Đang thử load PDF từ Google Drive (${embedMethod} mode)`}
                         description={
                           <div>
                             <Text>
                               Nếu PDF không hiển thị, có thể do giới hạn quyền truy cập của Google Drive.
                             </Text>
                             <br />
                             <Text type="secondary">
                               <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                 Mở PDF trong tab mới
                               </a>
                             </Text>
                           </div>
                         }
                         type="warning"
                         showIcon
                         className="mb-4"
                       />
                       
                       <iframe
                         src={embeddableUrls[embedMethod]}
                         width="100%"
                         height="calc(100% - 100px)"
                         frameBorder="0"
                         title="PDF Viewer"
                         onError={() => {
                           message.warning('Không thể tải PDF. Chuyển sang Demo mode.');
                           setEmbedMethod('demo');
                         }}
                         onLoad={() => {
                           message.success('PDF đã tải thành công!');
                         }}
                       />
                     </div>
                   )}
                  
                  {/* Annotation Overlay */}
                  {annotations.map(annotation => (
                    <div
                      key={annotation.id}
                      className="absolute bg-yellow-200 p-2 rounded shadow cursor-pointer"
                      style={{
                        left: `${annotation.x}%`,
                        top: `${annotation.y}%`,
                        zIndex: 10
                      }}
                    >
                      <CommentOutlined /> {annotation.content}
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </Col>

        {/* Grading Panel */}
        <Col span={8}>
          <Card title="🎯 Chấm điểm" className="h-full">
            <Form form={form} layout="vertical">
              {/* Student Info */}
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <Text strong>👤 {student?.name}</Text>
                <br />
                <Text type="secondary">{student?.email}</Text>
              </div>

              {/* Quick Grade Buttons */}
              <div className="mb-4">
                <Text strong className="block mb-2">Chấm nhanh:</Text>
                <Space wrap>
                  {[10, 9, 8, 7, 6, 5].map(score => (
                    <Button 
                      key={score}
                      size="small"
                      type={grade === score ? "primary" : "default"}
                      onClick={() => setGrade(score)}
                      className={`${score >= 8 ? 'text-green-600' : score >= 6 ? 'text-orange-600' : 'text-red-600'}`}
                    >
                      {score}/10
                    </Button>
                  ))}
                </Space>
              </div>

              {/* Detailed Grade */}
              <Form.Item label="Điểm chi tiết" name="grade">
                <div className="flex items-center gap-2">
                  <Slider
                    min={0}
                    max={10}
                    step={0.5}
                    value={grade || 0}
                    onChange={setGrade}
                    style={{ flex: 1 }}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={grade}
                    onChange={(e) => setGrade(parseFloat(e.target.value))}
                    style={{ width: 80 }}
                    suffix="/10"
                  />
                </div>
                {grade && (
                  <div className="mt-2">
                    <Rate
                      disabled
                      allowHalf
                      value={grade / 2}
                      style={{ fontSize: 16 }}
                    />
                    <Tag 
                      color={grade >= 8 ? 'success' : grade >= 6 ? 'warning' : 'error'}
                      className="ml-2"
                    >
                      {grade >= 8 ? 'Giỏi' : grade >= 6 ? 'Khá' : 'Trung bình'}
                    </Tag>
                  </div>
                )}
              </Form.Item>

              <Divider />

              {/* Feedback */}
              <Form.Item label="Nhận xét" name="feedback">
                <TextArea
                  rows={6}
                  placeholder="Nhập nhận xét chi tiết về bài làm..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              {/* Quick Feedback */}
              <div className="mb-4">
                <Text strong className="block mb-2">Nhận xét nhanh:</Text>
                <div className="space-y-1">
                  {quickFeedbacks.map((text, index) => (
                    <Button 
                      key={index}
                      size="small"
                      block
                      className="text-left text-xs"
                      onClick={() => setFeedback(text)}
                    >
                      {text}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Annotation Tools */}
              <div className="mb-4">
                <Text strong className="block mb-2">Công cụ ghi chú:</Text>
                <Space>
                  <Button 
                    size="small"
                    icon={<CommentOutlined />}
                    onClick={handleAddAnnotation}
                  >
                    Thêm ghi chú
                  </Button>
                  <Button 
                    size="small"
                    icon={<HighlightOutlined />}
                  >
                    Highlight
                  </Button>
                </Space>
              </div>

              {/* Save Button */}
              <Button 
                type="primary" 
                block 
                size="large"
                icon={<SaveOutlined />}
                onClick={handleSaveGrade}
                disabled={!grade}
              >
                Lưu điểm ({grade || 0}/10)
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default PDFViewerModal; 