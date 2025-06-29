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
import { formatFileSize } from '../../../utils/fileUtils';
import FileViewer from '../common/FileViewer';
import { fixVietnameseEncoding } from '../../../utils/convertStr';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AssignmentGradingModal = ({ 
  visible, 
  onCancel, 
  onSave, 
  loading = false,
  assignment = null,
  submission = null,
  allSubmissions = [] // Add this prop to receive all submissions
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
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);

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

  console.log("submission", {
    submission,
    allSubmissions,
    visible,
    assignment
  });
  useEffect(() => {
    if (submission && visible) {
      // Reset all states when modal opens or submission changes
      setGrade(submission.grade);
      setFeedback(submission.feedback || '');
      setPreviewFile(null);
      setActiveTab('content');
      setRubricGrades(submission.rubricGrades || {});
      setTextHighlights([]);
      setAnnotations([]);
      setZoomLevel(100);
      
      // Find current submission index in allSubmissions
      if (allSubmissions.length > 0) {
        const index = allSubmissions.findIndex(sub => sub._id === submission._id);
        setCurrentSubmissionIndex(index >= 0 ? index : 0);
      }
      
      form.setFieldsValue({
        grade: submission.grade,
        feedback: submission.feedback || '',
        allowResubmit: submission.allowResubmit || false,
        hideGradeFromStudent: submission.hideGradeFromStudent || false
      });
    }
  }, [submission, visible, form, allSubmissions]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setGrade(null);
      setFeedback('');
      setPreviewFile(null);
      setActiveTab('content');
      setRubricGrades({});
      setTextHighlights([]);
      setAnnotations([]);
      setZoomLevel(100);
      setCurrentSubmissionIndex(0);
    }
  }, [visible, form]);

  const handleSave = () => {
    const currentSub = getCurrentSubmission();
    
    // Check if trying to grade a missing submission
    if (currentSub?._id?.toString().startsWith('missing_')) {
      message.error('Không thể chấm điểm cho học sinh chưa nộp bài!');
      return;
    }

    // Check if submission exists and has valid data
    if (!currentSub?._id || currentSub.status === 'missing') {
      message.error('Submission không hợp lệ. Học sinh cần nộp bài trước khi chấm điểm.');
      return;
    }

    form.validateFields().then(values => {
      // Validate grade value
      const gradeValue = values.grade;
      
      // Check if grade is valid number
      if (gradeValue === null || gradeValue === undefined || isNaN(gradeValue)) {
        message.error('Vui lòng nhập điểm hợp lệ!');
        return;
      }

      // Check if grade is within valid range
      const maxGrade = assignment?.totalPoints || 100;
      if (gradeValue < 0 || gradeValue > maxGrade) {
        message.error(`Điểm phải từ 0 đến ${maxGrade}!`);
        return;
      }

      // Check if feedback is provided and valid
      if (!values.feedback || values.feedback.trim().length < 10) {
        message.error('Vui lòng nhập nhận xét ít nhất 10 ký tự!');
        return;
      }

      // Determine change type based on grading history
      let changeType = 'initial';
      if (currentSub?.gradingHistory && currentSub.gradingHistory.length > 0) {
        changeType = 'revision';
      } else if (currentSub?.grade !== null && currentSub?.grade !== undefined) {
        changeType = 'revision';
      }

      // Prepare grading data in the format expected by backend
      const gradingData = {
        grade: Number(gradeValue), // Ensure it's a number
        feedback: values.feedback.trim(),
        rubricGrades: rubricGrades || {},
        annotations: annotations || [],
        allowResubmit: values.allowResubmit || false,
        hideGradeFromStudent: values.hideGradeFromStudent || false,
        changeType: changeType,
        gradeReason: `Grade ${changeType} via grading modal`
      };
      
      console.log('Sending grading data:', gradingData); // Debug log
      onSave(gradingData);
    }).catch(error => {
      console.error('Validation failed:', error);
      message.error('Vui lòng kiểm tra lại thông tin nhập vào!');
    });
  };
  const getFileExtension = (file) => {
    return file.name?.split('.').pop()?.toLowerCase() || '';
  };
  const isTextFile = (file) => {
    const ext = getFileExtension(file);
    return ['txt', 'md', 'csv', 'json', 'xml', 'log'].includes(ext);
  };
  const handleDownloadFile = async (file) => {
    try {
      const fileUrl = file.url || file.downloadUrl;

      // Extract filename from multiple sources
      const getFileName = () => {
        let fileName = null;
        
        // Priority order for filename
        if (file.name) fileName = file.name;
        else if (file.fileName) fileName = file.fileName;
        else if (file.originalName) fileName = file.originalName;
        else if (file.filename) fileName = file.filename;
        
        // If we found a filename, fix encoding and return
        if (fileName) {
          const fixedName = fixVietnameseEncoding(fileName);
          return fixedName;
        }
        
        // Extract from URL if no filename property
        try {
          const urlPath = new URL(fileUrl).pathname;
          const segments = urlPath.split('/');
          let lastSegment = segments[segments.length - 1];
          
          // Decode URL-encoded filename
          if (lastSegment && lastSegment.includes('%')) {
            try {
              lastSegment = decodeURIComponent(lastSegment);
            } catch (decodeError) {
              console.warn('Failed to decode URL segment:', decodeError);
            }
          }
          
          // For Cloudinary URLs, extract original filename
          if (fileUrl.includes('cloudinary.com') && lastSegment) {
            // Cloudinary format: /upload/v123456789/filename.ext
            const cleanName = lastSegment.split('.')[0]; // Remove cloudinary extensions
            const originalExt = file.fileType || file.type || file.mimetype || '';
            
            // Try to get extension from original name or detect from URL
            if (originalExt.includes('/')) {
              const ext = originalExt.split('/')[1];
              return fixVietnameseEncoding(`${cleanName}.${ext}`);
            }
            return fixVietnameseEncoding(lastSegment);
          }
          
          return fixVietnameseEncoding(lastSegment || 'download');
        } catch (urlError) {
          console.warn('Could not extract filename from URL:', urlError);
          return 'download';
        }
      };

      const fileName = getFileName();
      console.log('Determined filename:', fileName);
      
      if (!fileUrl) {
        message.error('URL file không hợp lệ');
        return;
      }

      // Simplified approach - always use direct download for better compatibility
      const downloadWithDirectLink = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // Add to DOM temporarily to ensure compatibility
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success(`Đang tải xuống ${fileName}`);
      };

              // For Cloudinary URLs, try to force download by adding flags
        if (fileUrl.includes('cloudinary.com')) {
          // Add download flag to Cloudinary URL
          const urlParts = fileUrl.split('/upload/');
          if (urlParts.length === 2) {
            const modifiedUrl = `${urlParts[0]}/upload/fl_attachment/${urlParts[1]}`;
            const link = document.createElement('a');
            link.href = modifiedUrl;
            link.download = fileName;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            message.success(`Đang tải xuống ${fileName}`);
            return;
          }
        }

      // Try proxy/cors-anywhere approach for problematic URLs
      const corsProxies = [
        fileUrl, // Direct first
        `https://cors-anywhere.herokuapp.com/${fileUrl}`, // CORS proxy (if available)
      ];

      let downloadSuccessful = false;

      for (const proxyUrl of corsProxies) {
        if (downloadSuccessful) break;
        
        try {
          // Try fetch approach first
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const response = await fetch(proxyUrl, {
            method: 'GET',
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit', // Don't send credentials for CORS
            headers: {
              'Accept': '*/*',
            }
          });

          clearTimeout(timeoutId);

                      if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              
              message.success(`Đang tải xuống ${fileName}`);
              downloadSuccessful = true;
              break;
            }
        } catch (fetchError) {
          console.warn(`Fetch failed for ${proxyUrl}:`, fetchError);
          // Continue to next proxy or fallback
        }
      }

      // If all fetch attempts failed, use direct download as final fallback
      if (!downloadSuccessful) {
        console.log('All fetch attempts failed, using direct download');
        downloadWithDirectLink();
      }

    } catch (error) {
      console.error('Download error:', error);
      
              // Final fallback - open in new tab
        try {
          window.open(fileUrl, '_blank', 'noopener,noreferrer');
          message.info(`Mở file trong tab mới: ${fileName}`);
        } catch (openError) {
          console.error('Even direct open failed:', openError);
          message.error(`Không thể tải xuống file ${fileName}. Vui lòng thử lại sau.`);
        }
    }
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
      case 'csv':
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
    if (!currentSub) return null;
    
    // Check for missing submission first
    if (currentSub._id?.toString().startsWith('missing_') || currentSub.status === 'missing') {
      return { color: 'error', text: 'Chưa nộp bài' };
    }
    
    const dueDate = moment(assignment?.dueDate);
    const submittedDate = moment(currentSub.submittedAt);
    const isLate = submittedDate.isAfter(dueDate);
    
    if (currentSub.grade !== null && currentSub.grade !== undefined) {
      return { color: 'success', text: 'Đã chấm điểm' };
    } else if (currentSub.status === 'graded') {
      return { color: 'success', text: 'Đã chấm điểm' };
    } else if (isLate || currentSub.status === 'late') {
      return { color: 'warning', text: 'Nộp muộn' };
    } else if (currentSub.status === 'submitted') {
      return { color: 'processing', text: 'Chờ chấm điểm' };
    } else {
      return { color: 'default', text: 'Chưa nộp' };
    }
  };

  const handleNavigateSubmission = (direction) => {
    if (allSubmissions.length === 0) return;
    
    // Helper function to find next valid submission (non-missing)
    const findNextValidSubmission = (startIndex, searchDirection) => {
      let index = startIndex;
      const max = allSubmissions.length - 1;
      
      while (index >= 0 && index <= max) {
        const submission = allSubmissions[index];
        // Skip missing submissions
        if (!submission._id?.toString().startsWith('missing_') && submission.status !== 'missing') {
          return index;
        }
        
        if (searchDirection === 'next') {
          index++;
        } else {
          index--;
        }
      }
      
      return null; // No valid submission found
    };
    
    let newIndex = currentSubmissionIndex;
    if (direction === 'prev' && currentSubmissionIndex > 0) {
      const validIndex = findNextValidSubmission(currentSubmissionIndex - 1, 'prev');
      if (validIndex !== null) {
        newIndex = validIndex;
      }
    } else if (direction === 'next' && currentSubmissionIndex < allSubmissions.length - 1) {
      const validIndex = findNextValidSubmission(currentSubmissionIndex + 1, 'next');
      if (validIndex !== null) {
        newIndex = validIndex;
      }
    }
    
    if (newIndex !== currentSubmissionIndex) {
      setCurrentSubmissionIndex(newIndex);
      // Trigger re-render with new submission data
      const newSubmission = allSubmissions[newIndex];
      
      // Update states for new submission
      setGrade(newSubmission.grade);
      setFeedback(newSubmission.feedback || '');
      setRubricGrades(newSubmission.rubricGrades || {});
      
      form.setFieldsValue({
        grade: newSubmission.grade,
        feedback: newSubmission.feedback || '',
        allowResubmit: newSubmission.allowResubmit || false,
        hideGradeFromStudent: newSubmission.hideGradeFromStudent || false
      });
    } else {
      // Show message if no more valid submissions
      if (direction === 'next') {
        message.info('Không có bài nộp tiếp theo để chấm điểm');
      } else {
        message.info('Không có bài nộp trước đó để chấm điểm');
      }
    }
  };

  const getCurrentSubmission = () => {
    if (allSubmissions.length > 0 && currentSubmissionIndex >= 0 && currentSubmissionIndex < allSubmissions.length) {
      return allSubmissions[currentSubmissionIndex];
    }
    return submission;
  };

  const calculateLatePenalty = () => {
    const currentSub = getCurrentSubmission();
    if (!currentSub || !assignment) return 0;
    
    const dueDate = moment(assignment.dueDate);
    const submittedDate = moment(currentSub.submittedAt);
    
    if (submittedDate.isAfter(dueDate)) {
      const daysLate = submittedDate.diff(dueDate, 'days') + 1;
      const penalty = (assignment.latePenalty || 0) * daysLate;
      return Math.min(penalty, 100); // Max 100% penalty
    }
    
    return 0;
  };

  const calculateDaysLate = () => {
    const currentSub = getCurrentSubmission();
    if (!currentSub || !assignment) return 0;
    
    const dueDate = moment(assignment.dueDate);
    const submittedDate = moment(currentSub.submittedAt);
    
    if (submittedDate.isAfter(dueDate)) {
      return submittedDate.diff(dueDate, 'days') + 1;
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

  const currentSub = getCurrentSubmission();
  const status = getSubmissionStatus();
  const latePenalty = calculateLatePenalty();
  const maxGrade = assignment.totalPoints || 100;

  return (
    <Modal
      title={
        <div>
          <div className="flex justify-between items-center">
            <Space>
              <TrophyOutlined />
              Chấm điểm bài tập: {String(assignment?.title || 'Unknown Assignment')}
            </Space>
            {(() => {
              // Count valid submissions (non-missing)
              const validSubmissions = allSubmissions.filter(sub => 
                !sub._id?.toString().startsWith('missing_') && 
                sub.status !== 'missing'
              );
              
              // Find current valid submission index
              const currentValidIndex = validSubmissions.findIndex(sub => 
                sub._id === currentSub?._id
              );
              
              return validSubmissions.length > 1 && (
                <Space className='mr-6'>
                  <Button 
                    size="small" 
                    disabled={currentValidIndex <= 0}
                    onClick={() => handleNavigateSubmission('prev')}
                  >
                    ← Trước
                  </Button>
                  <Text strong>
                    {Math.max(currentValidIndex + 1, 1)} / {validSubmissions.length}
                  </Text>
                  <Button 
                    size="small" 
                    disabled={currentValidIndex >= validSubmissions.length - 1}
                    onClick={() => handleNavigateSubmission('next')}
                  >
                    Sau →
                  </Button>
                </Space>
              );
            })()}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <Space>
              <Text>Học sinh: {
                typeof currentSub?.student === 'object' 
                  ? (currentSub.student.fullName || currentSub.student.name || 'Unknown Student')
                  : String(currentSub?.student || 'Unknown Student')
              }</Text>
              <Tag color={status?.color}>{status?.text}</Tag>
              {currentSub?.grade !== null && currentSub?.grade !== undefined && (
                <Tag color="blue">Điểm: {Number(currentSub.grade || 0)}/{Number(maxGrade || 100)}</Tag>
              )}
            </Space>
          </div>
        </div>
      }
      open={visible}
      onOk={handleSave}
      onCancel={() => {
        // Reset all states when closing
        form.resetFields();
        setGrade(null);
        setFeedback('');
        setPreviewFile(null);
        setActiveTab('content');
        setRubricGrades({});
        setTextHighlights([]);
        setAnnotations([]);
        setZoomLevel(100);
        setCurrentSubmissionIndex(0);
        onCancel();
      }}
      confirmLoading={loading}
      width={1200}
      okText={currentSub?.grade !== null && currentSub?.grade !== undefined ? "Cập nhật điểm" : "Lưu điểm"}
      cancelText="Đóng"
      style={{ top: 20 }}
      footer={[
        <Button key="close" onClick={() => {
          // Reset states and close
          form.resetFields();
          setGrade(null);
          setFeedback('');
          setPreviewFile(null);
          setActiveTab('content');
          setRubricGrades({});
          setTextHighlights([]);
          setAnnotations([]);
          setZoomLevel(100);
          setCurrentSubmissionIndex(0);
          onCancel();
        }}>
          Đóng
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          loading={loading} 
          onClick={handleSave}
          icon={<SaveOutlined />}
          disabled={
            // Disable if missing submission or no grade/feedback
            currentSub?._id?.toString().startsWith('missing_') || 
            currentSub?.status === 'missing' ||
            !grade || 
            isNaN(grade) || 
            !feedback || 
            feedback.trim().length < 10
          }
          title={
            (currentSub?._id?.toString().startsWith('missing_') || currentSub?.status === 'missing')
              ? 'Không thể chấm điểm cho học sinh chưa nộp bài'
              : (!grade || isNaN(grade))
              ? 'Vui lòng nhập điểm hợp lệ'
              : (!feedback || feedback.trim().length < 10)
              ? 'Vui lòng nhập nhận xét ít nhất 10 ký tự'
              : 'Lưu điểm và nhận xét'
          }
        >
          {(currentSub?._id?.toString().startsWith('missing_') || currentSub?.status === 'missing')
            ? 'Chưa nộp bài'
            : (!grade || isNaN(grade) || !feedback || feedback.trim().length < 10)
            ? 'Chưa đủ thông tin'
            : (currentSub?.grade !== null && currentSub?.grade !== undefined ? "Cập nhật điểm" : "Lưu điểm")
          }
        </Button>
      ]}
    >
      <Row gutter={24}>
        {/* Student Info & Submission Details */}
        <Col span={6}>
          <Card title="👤 Thông tin học sinh" size="small" className="mb-4">
            <div className="text-center mb-3">
              <Avatar 
                size={64} 
                src={currentSub?.student?.image} 
                icon={<UserOutlined />}
              />
              <div className="mt-2">
                <Title level={5} className="mb-1">
                  {typeof currentSub?.student === 'object' 
                    ? (currentSub.student.fullName || currentSub.student.name || 'Unknown Student')
                    : String(currentSub?.student || 'Unknown Student')
                  }
                </Title>
                <Text type="secondary">
                  {typeof currentSub?.student === 'object' 
                    ? (currentSub.student.email || 'No email')
                    : 'No email'
                  }
                </Text>
              </div>
            </div>
            
            <Divider />
            
            <Timeline 
              size="small"
              items={[
                {
                  dot: <CalendarOutlined />,
                  color: "blue",
                  children: (
                    <>
                      <Text strong>Hạn nộp:</Text><br />
                      <Text>{moment(assignment.dueDate).format('DD/MM/YYYY HH:mm')}</Text>
                    </>
                  )
                },
                {
                  dot: <ClockCircleOutlined />,
                  color: currentSub?.submittedAt ? (latePenalty > 0 ? 'red' : 'green') : 'gray',
                  children: (
                    <>
                      <Text strong>Thời gian nộp:</Text><br />
                      {currentSub?.submittedAt ? (
                        <>
                          <Text>{moment(currentSub.submittedAt).format('DD/MM/YYYY HH:mm')}</Text>
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
                    </>
                  )
                },
                {
                  dot: <TrophyOutlined />,
                  color: status?.color,
                  children: (
                    <>
                      <Text strong>Trạng thái:</Text><br />
                      <Tag color={status?.color}>{status?.text}</Tag>
                    </>
                  )
                }
              ]}
            />
          </Card>

          {/* Current Grade */}
          <Card title="📊 Điểm số" size="small">
            <div className="text-center mb-3">
              {currentSub?.grade !== null && currentSub?.grade !== undefined ? (
                <>
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{ color: getGradeColor(currentSub.grade, maxGrade) }}
                  >
                    {currentSub.grade}/{maxGrade}
                  </div>
                  <Progress
                    percent={(currentSub.grade / maxGrade) * 100}
                    status={currentSub.grade >= maxGrade * 0.7 ? 'success' : 'exception'}
                    strokeColor={getGradeColor(currentSub.grade, maxGrade)}
                  />
                  <Text type="secondary">
                    {Math.round((currentSub.grade / maxGrade) * 100)}%
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
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: 'content',
                label: <span><FileTextOutlined /> Bài nộp</span>,
                children: (
                  <Card size="small" className="mb-4" style={{ maxHeight: '500px', overflow: 'auto' }}>
                    {/* Text Submission */}
                    {currentSub?.content && (
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
                          {renderContent(String(currentSub.content || ''))}
                        </Card>
                      </div>
                    )}

                    {/* File Attachments */}
                    {currentSub?.attachments && currentSub.attachments.length > 0 && (
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
                          dataSource={currentSub.attachments}
                          renderItem={(file) => (
                            <List.Item
                              actions={[
                                <Button 
                                  size="small" 
                                  icon={<EyeOutlined />}
                                  onClick={() => setPreviewFile(file)}
                                  type="primary"
                                >
                                  Xem
                                </Button>,
                                // <Button 
                                //   size="small" 
                                //   icon={<DownloadOutlined />}
                                //   onClick={() => handleDownloadFile(file)}
                                // >
                                //   Tải
                                // </Button>,
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
                                title={<span className="cursor-pointer hover:text-blue-600" onClick={() => setPreviewFile(file)}>{fixVietnameseEncoding(file.name)}</span>}
                                description={
                                  <Space>
                                    <Text type="secondary">{formatFileSize(file.fileSize || 0)}</Text>
                                    <Text type="secondary">• Click để xem trước</Text>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </div>
                    )}

                    {/* Missing submission alert */}
                    {(currentSub?._id?.toString().startsWith('missing_') || currentSub?.status === 'missing') && (
                      <Alert
                        message="Học sinh chưa nộp bài"
                        description={
                          <div>
                            <p>Học sinh này chưa submit bài assignment.</p>
                            <p>Bạn có thể:</p>
                            <ul>
                              <li>Liên hệ học sinh để nhắc nhở nộp bài</li>
                              <li>Cho điểm 0 nếu đã quá hạn nộp</li>
                              <li>Gia hạn thời gian nộp bài</li>
                            </ul>
                          </div>
                        }
                        type="error"
                        showIcon
                      />
                    )}

                    {/* Empty submission alert - only for submitted but empty submissions */}
                    {currentSub?.status !== 'missing' && 
                     !currentSub?._id?.toString().startsWith('missing_') &&
                     (!currentSub?.content && (!currentSub?.attachments || currentSub.attachments.length === 0)) && (
                      <Alert
                        message="Không có nội dung nộp bài"
                        description="Học sinh đã nộp bài nhưng bài nộp trống."
                        type="warning"
                        showIcon
                      />
                    )}
                  </Card>
                )
              },
              {
                key: 'rubric',
                label: <span><StarOutlined /> Rubric chấm điểm</span>,
                disabled: currentSub?._id?.toString().startsWith('missing_') || currentSub?.status === 'missing',
                children: (
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

                    <Collapse
                      items={mockRubric.map(criteria => ({
                        key: criteria.id,
                        label: (
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
                        ),
                        children: (
                          <div>
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
                          </div>
                        )
                      }))}
                    />
                  </Card>
                )
              },
              {
                key: 'grading',
                label: <span><EditOutlined /> Chấm điểm</span>,
                disabled: currentSub?._id?.toString().startsWith('missing_') || currentSub?.status === 'missing',
                children: (
                  <Card size="small">
                    
                    <Form
                      form={form}
                      layout="vertical"
                      initialValues={{
                        grade: currentSub?.grade,
                        feedback: currentSub?.feedback || ''
                      }}
                    >
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            name="grade"
                            label={`Điểm (/${maxGrade})`}
                            rules={[
                              { required: true, message: 'Vui lòng nhập điểm!' },
                              { type: 'number', min: 0, max: maxGrade, message: `Điểm phải từ 0 đến ${maxGrade}!` },
                              {
                                validator: (_, value) => {
                                  if (value === null || value === undefined || isNaN(value)) {
                                    return Promise.reject(new Error('Điểm phải là số hợp lệ!'));
                                  }
                                  if (value < 0) {
                                    return Promise.reject(new Error('Điểm không được âm!'));
                                  }
                                  if (value > maxGrade) {
                                    return Promise.reject(new Error(`Điểm không được vượt quá ${maxGrade}!`));
                                  }
                                  return Promise.resolve();
                                }
                              }
                            ]}
                          >
                            <InputNumber
                              min={0}
                              max={maxGrade}
                              precision={1}
                              step={0.5}
                              style={{ width: '100%' }}
                              placeholder={`Nhập điểm từ 0 đến ${maxGrade}`}
                              onChange={(value) => {
                                setGrade(value);
                                console.log('Grade changed to:', value); // Debug log
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                  setGrade(value);
                                  form.setFieldsValue({ grade: value });
                                }
                              }}
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
                              message={`⚠️ Tự động trừ phạt nộp muộn`}
                              description={
                                <div>
                                  <div className="space-y-1">
                                    <div>
                                      <Text strong>Penalty: </Text>
                                      <Text type="danger">-{latePenalty}% ({calculateDaysLate()} ngày muộn)</Text>
                                    </div>
                                    <div>
                                      <Text type="secondary">💡 Hệ thống sẽ tự động tính penalty khi lưu điểm</Text>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Điểm bạn nhập → Hệ thống tự trừ penalty → Lưu vào DB
                                    </div>
                                  </div>
                                </div>
                              }
                              type="info"
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
                          { required: true, message: 'Vui lòng nhập nhận xét!' },
                          { min: 10, message: 'Nhận xét phải có ít nhất 10 ký tự!' },
                          { max: 2000, message: 'Nhận xét không được vượt quá 2000 ký tự!' },
                          {
                            validator: (_, value) => {
                              if (!value || value.trim().length === 0) {
                                return Promise.reject(new Error('Nhận xét không được để trống!'));
                              }
                              if (value.trim().length < 10) {
                                return Promise.reject(new Error('Nhận xét quá ngắn, cần ít nhất 10 ký tự có nghĩa!'));
                              }
                              return Promise.resolve();
                            }
                          }
                        ]}
                      >
                        <TextArea
                          rows={8}
                          placeholder="Nhập nhận xét chi tiết về bài làm của học sinh... (ít nhất 10 ký tự)"
                          showCount
                          maxLength={2000}
                          value={feedback}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFeedback(value);
                            console.log('Feedback length:', value.length); // Debug log
                          }}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            setFeedback(value);
                            form.setFieldsValue({ feedback: value });
                          }}
                        />
                      </Form.Item>

                      {/* Quick Feedback Templates */}
                      <div className="mb-3">
                        <Text strong className="mb-2 block">Mẫu nhận xét nhanh:</Text>
                        <Space wrap>
                          <Button 
                            size="small"
                            onClick={() => {
                              const template = 'Bài làm tốt, nội dung đầy đủ và chính xác. Trình bày rõ ràng, logic. Cần chú ý thêm về chính tả và ngôn từ.';
                              setFeedback(template);
                              form.setFieldsValue({ feedback: template });
                            }}
                          >
                            Tốt
                          </Button>
                          <Button 
                            size="small"
                            onClick={() => {
                              const template = 'Bài làm đạt yêu cầu cơ bản. Nội dung đúng nhưng chưa sâu sắc. Nên bổ sung thêm ví dụ và phân tích chi tiết hơn.';
                              setFeedback(template);
                              form.setFieldsValue({ feedback: template });
                            }}
                          >
                            Khá
                          </Button>
                          <Button 
                            size="small"
                            onClick={() => {
                              const template = 'Bài viết hay, thể hiện tư duy tốt và kiến thức vững. Cấu trúc logic, ngôn từ phù hợp. Tiếp tục phát huy!';
                              setFeedback(template);
                              form.setFieldsValue({ feedback: template });
                            }}
                          >
                            Giỏi
                          </Button>
                          <Button 
                            size="small"
                            onClick={() => {
                              const template = 'Bài làm chưa đạt yêu cầu. Thiếu nội dung quan trọng, trình bày chưa rõ ràng. Cần học lại và làm bài mới.';
                              setFeedback(template);
                              form.setFieldsValue({ feedback: template });
                            }}
                          >
                            Cần cải thiện
                          </Button>
                          <Button 
                            size="small"
                            onClick={() => {
                              const template = 'Bài làm xuất sắc! Nội dung sâu sắc, trình bày logic, có tư duy phản biện. Đây là bài mẫu cho cả lớp!';
                              setFeedback(template);
                              form.setFieldsValue({ feedback: template });
                            }}
                          >
                            Xuất sắc
                          </Button>
                          <Button 
                            size="small"
                            onClick={() => {
                              const template = 'File đính kèm rõ nét, đầy đủ. Nội dung được trình bày khoa học. Cần bổ sung thêm phần kết luận.';
                              setFeedback(template);
                              form.setFieldsValue({ feedback: template });
                            }}
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
                )
              },
              {
                key: 'history',
                label: <span><HistoryOutlined /> Lịch sử</span>,
                children: (
                  <Card size="small">
                    <Timeline
                      items={(() => {
                        // Tạo danh sách tất cả events
                        const events = [];
                        
                        // Thêm assignment deadline để có context
                        if (assignment?.dueDate) {
                          events.push({
                            timestamp: new Date(assignment.dueDate),
                            type: 'deadline',
                            children: (
                              <>
                                <Text strong>⏰ Hạn nộp bài</Text><br />
                                <Text type="secondary">{moment(assignment.dueDate).format('DD/MM/YYYY HH:mm')}</Text>
                              </>
                            )
                          });
                        }
                        
                        // Thêm submission event
                        if (currentSub?.submittedAt) {
                          const isLate = assignment?.dueDate && moment(currentSub.submittedAt).isAfter(moment(assignment.dueDate));
                          events.push({
                            timestamp: new Date(currentSub.submittedAt),
                            type: 'submission',
                            isLate: isLate,
                            children: (
                              <>
                                <Text strong>
                                  📝 Học sinh nộp bài
                                  {isLate && <span style={{ color: '#fa8c16' }}> (Muộn)</span>}
                                </Text><br />
                                <Text type="secondary">{moment(currentSub.submittedAt).format('DD/MM/YYYY HH:mm')}</Text>
                                {isLate && assignment?.dueDate && (
                                  <div className="mt-1">
                                    <Tag size="small" color="warning">
                                      ⚠️ Muộn {moment(currentSub.submittedAt).diff(moment(assignment.dueDate), 'hours')} giờ
                                    </Tag>
                                  </div>
                                )}
                                {currentSub?.attachments?.length > 0 && (
                                  <div className="mt-1">
                                    <Text type="secondary">📎 {currentSub.attachments.length} file đính kèm</Text>
                                  </div>
                                )}
                              </>
                            )
                          });
                        }
                        
                        // Thêm grading history events
                        if (currentSub?.gradingHistory && currentSub.gradingHistory.length > 0) {
                          currentSub.gradingHistory.forEach((grading, index) => {
                            events.push({
                              timestamp: new Date(grading.gradedAt),
                              type: 'grading',
                              originalIndex: index,
                              grading: grading,
                              children: (
                                <>
                                  <Text strong>
                                    📊 Chấm điểm ({grading.changeType === 'initial' ? 'Lần đầu' : 
                                                  grading.changeType === 'revision' ? 'Sửa điểm' :
                                                  grading.changeType === 'appeal' ? 'Phúc khảo' :
                                                  grading.changeType === 'correction' ? 'Chỉnh sửa' : 'Cập nhật'}): 
                                    <span style={{ color: getGradeColor(grading.grade, maxGrade) }}>
                                      {" "}{Number(grading.grade || 0)}/{Number(maxGrade || 100)}
                                    </span>
                                    {grading.latePenalty?.applied && (
                                      <span style={{ color: '#fa8c16', fontSize: '12px' }}>
                                        {' '}(Điểm : {grading.originalGrade} - Penalty: - {grading.latePenalty.percentage}%)
                                      </span>
                                    )}
                                  </Text><br />
                                  <Text type="secondary">
                                    {moment(grading.gradedAt).format('DD/MM/YYYY HH:mm')} - {
                                      grading.gradedByName || 
                                      (grading.gradedBy?.fullName || grading.gradedBy?.name) ||
                                      (typeof grading.gradedBy === 'object' ? 'Giáo viên' : grading.gradedBy) ||
                                      'Giáo viên'
                                    }
                                  </Text>
                                  {grading.feedback && (
                                    <div className="mt-1">
                                      <Text type="secondary" className="italic">
                                        "💭 {String(grading.feedback || '').length > 100 ? String(grading.feedback).substring(0, 100) + '...' : String(grading.feedback || '')}"
                                      </Text>
                                    </div>
                                  )}
                                  {grading.rubricGrades && Object.keys(grading.rubricGrades).length > 0 && (
                                    <div className="mt-1">
                                      <Text type="secondary">⭐ Sử dụng Rubric chấm điểm</Text>
                                    </div>
                                  )}
                                  {grading.previousGrade !== null && grading.previousGrade !== undefined && (
                                    <div className="mt-1">
                                      <Tag size="small" color={grading.grade > grading.previousGrade ? 'green' : 'orange'}>
                                        {grading.grade > grading.previousGrade ? '↗️' : '↘️'} 
                                        {grading.previousGrade} → {grading.grade}
                                      </Tag>
                                    </div>
                                  )}
                                </>
                              )
                            });
                          });
                        }
                        
                        // Fallback cho grade hiện tại nếu không có history
                        else if (currentSub?.grade !== null && currentSub?.grade !== undefined) {
                          events.push({
                            timestamp: new Date(currentSub.gradedAt || new Date()),
                            type: 'grading',
                            children: (
                              <>
                                <Text strong>
                                  📊 Chấm điểm: 
                                  <span style={{ color: getGradeColor(currentSub.grade, maxGrade) }}>
                                    {Number(currentSub.grade || 0)}/{Number(maxGrade || 100)}
                                  </span>
                                </Text><br />
                                <Text type="secondary">
                                  {currentSub.gradedAt 
                                    ? moment(currentSub.gradedAt).format('DD/MM/YYYY HH:mm')
                                    : moment().format('DD/MM/YYYY HH:mm')
                                  } - {
                                    typeof currentSub.gradedBy === 'string'
                                      ? currentSub.gradedBy
                                      : 'Giáo viên'
                                  }
                                </Text>
                                {currentSub.feedback && (
                                  <div className="mt-1">
                                    <Text type="secondary" className="italic">
                                      "💭 {String(currentSub.feedback || '').length > 50 ? String(currentSub.feedback).substring(0, 50) + '...' : String(currentSub.feedback || '')}"
                                    </Text>
                                  </div>
                                )}
                              </>
                            )
                          });
                        }
                        
                        // Sort tất cả events theo thời gian (mới nhất trước)
                        events.sort((a, b) => b.timestamp - a.timestamp);
                        
                        // Nếu không có events nào, hiển thị empty state
                        if (events.length === 0) {
                          return [{
                            color: 'gray',
                            children: (
                              <div className="text-center py-4">
                                <Text type="secondary">📋 Chưa có hoạt động nào</Text>
                              </div>
                            )
                          }];
                        }
                        
                        // Assign colors based on chronological order and recency
                        return events.map((event, index) => ({
                          ...event,
                          color: event.type === 'deadline' ? 'volcano' :
                                event.type === 'submission' ? (event.isLate ? 'orange' : 'blue') : 
                                (event.type === 'grading' && index === events.findIndex(e => e.type === 'grading') ? 'green' : 'orange')
                        }));
                      })()}
                    />
                  </Card>
                )
              }
            ]}
          />
        </Col>
      </Row>

      {/* Enhanced File Viewer */}
      <FileViewer
        visible={!!previewFile}
        onCancel={() => setPreviewFile(null)}
        file={previewFile}
        title={previewFile ? `Bài nộp của ${
          typeof currentSub?.student === 'object' 
            ? (currentSub.student.fullName || currentSub.student.name || 'Unknown Student')
            : String(currentSub?.student || 'Unknown Student')
        }: ${fixVietnameseEncoding(previewFile.name) }` : ''}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        showAnnotations={true}
      />

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