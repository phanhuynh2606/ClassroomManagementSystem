import React, { useState, useEffect } from "react";
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
  message,
  Breadcrumb,
  Spin,
  Badge,
  Empty,
} from "antd";
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
  SettingOutlined,
  TeamOutlined,
  BookOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import moment from "moment";
import { assignmentAPI } from "../../services/api";
import { formatFileSize } from "../../utils/fileUtils";

// Import components
import { AssignmentGradingModal } from "../../components/teacher/grading";
import { SubmissionManagement } from "../../components/teacher/assignment";
import { fixVietnameseEncoding } from "../../utils/convertStr";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const AssignmentDetail = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionManagementVisible, setSubmissionManagementVisible] =
    useState(false);

  // Universal file download function with fallback strategies for all browsers
  const handleFileDownload = async (downloadUrl, fileName) => {
    const hideLoading = message.loading('Downloading file...', 0);
    
    try {
      if (!token) {
        message.error('Authentication required. Please login again.');
        hideLoading();
        return;
      }

      // Strategy 1: Modern Fetch + Blob (Works on all modern browsers)
      if (window.fetch && window.Blob && window.URL?.createObjectURL) {
        await downloadWithFetch(downloadUrl, fileName, token);
        hideLoading();
        message.success('File downloaded successfully!');
        return;
      }

      // Strategy 2: Fallback for older browsers - Direct window open with auth
      if (window.open) {
        await downloadWithWindowOpen(downloadUrl, fileName, token);
        hideLoading();
        message.success('Download initiated. Check your downloads folder.');
        return;
      }

      throw new Error('Browser does not support file downloads');
      
    } catch (error) {
      console.error('Download error:', error);
      hideLoading();
      
      // Ultimate fallback - copy download link
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(downloadUrl);
          message.warning('Download failed. Download URL copied to clipboard. You can paste it in a new tab.');
        } catch {
          message.error('Download failed. Please try a different browser or contact support.');
        }
      } else {
        message.error('Download failed. Please try a different browser or contact support.');
      }
    }
  };

  // Strategy 1: Modern fetch + blob approach (Best for all browsers including Edge)
  const downloadWithFetch = async (downloadUrl, fileName, token) => {
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fixVietnameseEncoding(fileName) || 'download';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 100);
  };

  // Strategy 2: Fallback approach for edge cases
  const downloadWithWindowOpen = async (downloadUrl, fileName, token) => {
    // For older browsers or special cases, open in new window
    // Note: This might open as preview in some browsers but still works
    const newWindow = window.open('', '_blank');
    newWindow.location.href = `${downloadUrl}?t=${Date.now()}`;
    
    // Try to set document title for better UX
    setTimeout(() => {
      if (newWindow.document) {
        newWindow.document.title = `Downloading ${fileName}`;
      }
    }, 100);
  };

  // Browser compatibility detection
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    const isModernBrowser = !!(window.fetch && window.Blob && window.URL?.createObjectURL);
    
    let browserName = 'Unknown';
    if (userAgent.includes('Edge')) browserName = 'Edge';
    else if (userAgent.includes('Chrome')) browserName = 'Chrome';
    else if (userAgent.includes('Firefox')) browserName = 'Firefox';
    else if (userAgent.includes('Safari')) browserName = 'Safari';
    else if (userAgent.includes('Opera')) browserName = 'Opera';
    
    return { browserName, isModernBrowser };
  };

  // Real assignment data
  const [assignmentData, setAssignmentData] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // Fetch assignment data
  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData();
      fetchSubmissions();
    }
  }, [assignmentId]);

  const fetchAssignmentData = async () => {
    try {
      setDataLoading(true);
      const response = await assignmentAPI.getDetail(assignmentId);
      if (response.success) {
        setAssignmentData(response.data);
      } else {
        message.error("Failed to load assignment data");
        navigate(`/teacher/classroom/${classId}#classwork`);
      }
    } catch (error) {
      console.error("Error fetching assignment:", error);
      message.error("Failed to load assignment data");
      navigate(`/teacher/classroom/${classId}#classwork`);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await assignmentAPI.getSubmissions(assignmentId);
      if (response.success) {
        setSubmissions(response.data.docs || []);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  // Get current assignment data with fallback
  const currentAssignmentData = assignmentData || {
    _id: assignmentId,
    title: 'Assignment',
    description: 'Loading...',
    totalPoints: 100,
    dueDate: new Date(),
    allowLateSubmission: false,
    latePenalty: 0,
    classroom: { name: 'Classroom' },
    attachments: [],
    stats: { totalStudents: 0 }
  }; 

  const getStatusTag = (status, isLate) => {
    if (status === "graded") {
      return (
        <Tag color="success" icon={<CheckCircleOutlined />}>
          Đã chấm
        </Tag>
      );
    } else if (status === "submitted") {
      return (
        <Tag
          color={isLate ? "warning" : "processing"}
          icon={<ClockCircleOutlined />}
        >
          {isLate ? "Nộp muộn" : "Chờ chấm"}
        </Tag>
      );
    } else {
      return (
        <Tag color="error" icon={<ExclamationCircleOutlined />}>
          Chưa nộp
        </Tag>
      );
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
      title: "Học sinh",
      dataIndex: "student",
      key: "student",
      render: (student) => (
        <div className="flex items-center gap-3">
          <Avatar src={student.image} icon={<UserOutlined />} size={32} />
          <div>
          <div>
            <div className="font-medium">{student.fullName}</div>
            <Text type="secondary" className="text-xs">{student.email}</Text>
          </div>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => getStatusTag(record.status, record.isLate),
    },
    {
      title: "Điểm",
      dataIndex: "grade",
      key: "grade",
      align: "center",
      render: (grade, record) => {
        if (record.status === "missing") return <Text type="secondary">-</Text>;
        if (grade === null) return <Text type="secondary">Chưa chấm</Text>;

        return (
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {grade}/{currentAssignmentData.totalPoints}
            </div>
            <Progress
              percent={(grade / currentAssignmentData.totalPoints) * 100}
              size="small"
              showInfo={false}
            />
          </div>
        );
      },
    },
    {
      title: "Thời gian nộp",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (submittedAt, record) => {
        if (!submittedAt) return <Text type="secondary">-</Text>;

        const isLate = moment(submittedAt).isAfter(
          moment(currentAssignmentData.dueDate)
        );
        return (
          <div>
            <div>{moment(submittedAt).format("DD/MM HH:mm")}</div>
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
      title: "Hành động",
      key: "actions",
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
            <Tooltip title="Tải file đính kèm của học sinh">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                size="small"
                onClick={() => {
                  if (record.attachments && record.attachments.length > 0) {
                    // Download first attachment, or could show a modal to select which file
                    const firstAttachment = record.attachments[0];
                    if (firstAttachment.downloadUrl) {
                      handleFileDownload(firstAttachment.downloadUrl, firstAttachment.name || 'submission-file');
                    } else {
                      message.warning('Download URL not available for this file');
                    }
                  } else {
                    message.info('No attachments to download');
                  }
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Use statistics from backend (calculated server-side for accuracy)
  const backendStats = currentAssignmentData.stats || {};
  const actualSubmissions = submissions.filter((s) => s.status !== "missing");
  
  const stats = {
    submitted: backendStats.submissionsCount || actualSubmissions.length,
    graded: backendStats.gradedCount, //|| actualSubmissions.filter((s) => s.grade !== null).length,
    pending: backendStats.pendingCount || actualSubmissions.filter((s) => s.status === "submitted").length,
    late: backendStats.lateCount || actualSubmissions.filter((s) => s.isLate).length,
    avgGrade: backendStats.avgGrade !== undefined ? backendStats.avgGrade : 0,
  };

  const isOverdue = moment().isAfter(currentAssignmentData.dueDate);
  const daysUntilDue = moment(currentAssignmentData.dueDate).diff(moment(), 'days');

  const tabItems = [
    {
      key: "overview",
      label: (
        <span>
          <BookOutlined />
          Overview
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          {/* Left Column - Main Content */}
          <Col xs={24} lg={16}>
            {/* Assignment Content */}
            <Card 
              className="mb-6 shadow-lg border-0"
              title={
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <FileTextOutlined className="text-white text-lg" />
                  </div>
                  <div>
                    <Text strong className="text-lg">Assignment Details</Text>
                    <div className="text-sm text-gray-500">Content and instructions</div>
                  </div>
                </div>
              }
            >
              <div className="space-y-4">
                <div>
                  <Title level={4} className="mb-2">{currentAssignmentData.title}</Title>
                  <div 
                    className="ql-editor"
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.8',
                      color: '#4a5568',
                      padding: 0
                    }}
                    dangerouslySetInnerHTML={{ __html: currentAssignmentData.description }}
                  />
                </div>

                {currentAssignmentData.instructions && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-l-4 border-blue-400">
                    <Title level={5} className="text-blue-700 mb-3">
                      📋 Detailed Instructions
                    </Title>
                    <div 
                      style={{ whiteSpace: "pre-wrap", lineHeight: "1.8" }}
                      className="text-gray-700"
                    >
                      {currentAssignmentData.instructions}
                    </div>
                  </div>
                )}

                {currentAssignmentData.attachments && currentAssignmentData.attachments.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-l-4 border-purple-400">
                    <Title level={5} className="text-purple-700 mb-4">
                      📎 Teacher Resources ({currentAssignmentData.attachments.length})
                    </Title>
                    <div className="space-y-3">
                      {currentAssignmentData.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <PaperClipOutlined className="text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <Text strong className="block">{fixVietnameseEncoding(file.name)}</Text>
                            <Text type="secondary" className="text-sm">
                              {formatFileSize(null, file)}
                            </Text>
                          </div>
                          <Tooltip 
                            title={(() => {
                              const { browserName, isModernBrowser } = getBrowserInfo();
                              if (!isModernBrowser) {
                                return `Your browser (${browserName}) has limited download support. File might open in a new tab instead of downloading.`;
                              }
                              if (browserName === 'Edge') {
                                return `✅ Edge - Will download directly to your Downloads folder`;
                              }
                              return `✅ ${browserName} - Will download directly to your Downloads folder`;
                            })()}
                            placement="top"
                          >
                            <Button
                              type="primary"
                              ghost
                              icon={<DownloadOutlined />}
                              size="small"
                              onClick={() => handleFileDownload(file.downloadUrl, file.name)}
                            >
                              Download
                            </Button>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Statistics Cards */}
            <Row gutter={16} className="mb-6">
              <Col span={6}>
                <Card className="text-center shadow-md border-0">
                  <Statistic
                    title="Submitted"
                    value={stats.submitted}
                    suffix={`/${backendStats.totalStudents || submissions.length || 0}`}
                    prefix={<CheckCircleOutlined className="text-green-500" />}
                    valueStyle={{ color: "#22c55e", fontSize: "24px" }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="text-center shadow-md border-0">
                  <Statistic
                    title="Graded"
                    value={stats.graded}
                    suffix={`/${stats.submitted}`}
                    prefix={<TrophyOutlined className="text-blue-500" />}
                    valueStyle={{ color: "#3b82f6", fontSize: "24px" }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="text-center shadow-md border-0">
                  <Statistic
                    title="Pending"
                    value={stats.pending}
                    prefix={<ClockCircleOutlined className="text-orange-500" />}
                    valueStyle={{ color: "#f59e0b", fontSize: "24px" }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="text-center shadow-md border-0">
                  <Statistic
                    title="Avg Grade"
                    value={stats.avgGrade}
                    suffix={`/${currentAssignmentData.totalPoints}`}
                    prefix={<StarOutlined className="text-purple-500" />}
                    valueStyle={{ color: "#8b5cf6", fontSize: "24px" }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Right Column - Quick Info */}
          <Col xs={24} lg={8}>
            {/* Assignment Info */}
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <InfoCircleOutlined className="text-blue-500" />
                  <Text strong>Assignment Info</Text>
                </div>
              }
              className="mb-6 shadow-lg border-0"
              size="small"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Text type="secondary">Points:</Text>
                  <Tag color="blue" className="px-3 py-1 text-base">
                    {currentAssignmentData.totalPoints} pts
                  </Tag>
                </div>
                
                <div className="flex justify-between items-center">
                  <Text type="secondary">Status:</Text>
                  <Tag 
                    color={currentAssignmentData.visibility === 'published' ? 'green' : 'orange'}
                    className="px-3 py-1 text-base"
                  >
                    {currentAssignmentData.visibility?.charAt(0).toUpperCase() + currentAssignmentData.visibility?.slice(1)}
                  </Tag>
                </div>

                <div className="flex justify-between items-center">
                  <Text type="secondary">Submission Type:</Text>
                  <Tag 
                    color="purple" 
                    className="px-3 py-1 text-base"
                    icon={
                      currentAssignmentData.submissionSettings?.type === 'file' ? <PaperClipOutlined /> :
                      currentAssignmentData.submissionSettings?.type === 'text' ? <FileTextOutlined /> :
                      <><FileTextOutlined /> <PaperClipOutlined /></>
                    }
                  >
                    {currentAssignmentData.submissionSettings?.type === 'both' ? 'Text & File' :
                     currentAssignmentData.submissionSettings?.type === 'file' ? 'File Only' :
                     currentAssignmentData.submissionSettings?.type === 'text' ? 'Text Only' :
                     'Both'}
                  </Tag>
                </div>

                <Divider className="my-3" />

                <div className="flex justify-between items-center">
                  <Text type="secondary">Created:</Text>
                  <Text>{moment(currentAssignmentData.createdAt).format('DD/MM/YYYY')}</Text>
                </div>

                {currentAssignmentData.publishDate && (
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Published:</Text>
                    <Text>
                      {moment(currentAssignmentData.publishDate).format('DD/MM/YYYY HH:mm')}
                    </Text>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <Text type="secondary">Submissions:</Text>
                  <Badge count={stats.submitted} showZero color="#52c41a" />
                </div>
              </div>
            </Card>

            {/* Due Date Card */}
            <Card 
              className={`mb-6 shadow-lg border-0 ${isOverdue ? 'border-l-4 border-l-red-400 bg-red-50' : daysUntilDue <= 7 ? 'border-l-4 border-l-orange-400 bg-orange-50' : 'border-l-4 border-l-green-400 bg-green-50'}`}
              size="small"
            >
              <div className="text-center">
                <CalendarOutlined 
                  className={`text-4xl mb-2 ${isOverdue ? 'text-red-500' : daysUntilDue <= 7 ? 'text-orange-500' : 'text-green-500'}`} 
                />
                <Title level={5} className="mb-1">Due Date</Title>
                <Text strong className={`text-lg ${isOverdue ? 'text-red-600' : daysUntilDue <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                  {moment(currentAssignmentData.dueDate).format("DD/MM/YYYY HH:mm")}
                </Text>
                <div className="mt-2">
                  {isOverdue ? (
                    <Tag color="red" icon={<WarningOutlined />}>
                      Overdue
                    </Tag>
                  ) : daysUntilDue <= 7 ? (
                    <Tag color="orange" icon={<ClockCircleOutlined />}>
                      Due Soon ({daysUntilDue} days)
                    </Tag>
                  ) : (
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                      Active
                    </Tag>
                  )}
                </div>
              </div>

              {currentAssignmentData.allowLateSubmission && (
                <Alert
                  message="Late Submission Allowed"
                  description={`Penalty: ${currentAssignmentData.latePenalty}% per day`}
                  type="info"
                  size="small"
                  showIcon
                  className="mt-4"
                />
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: "submissions",
      label: (
        <span>
          <UserOutlined />
          Submissions ({stats.submitted})
        </span>
      ),
      children: (
        <Card className="shadow-lg border-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Title level={3} className="mb-1">📝 Student Submissions</Title>
              <Text type="secondary" className="text-base">
                Monitor and grade student work
              </Text>
            </div>
            <Space>
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={handleViewAllSubmissions}
                className="bg-gradient-to-r from-blue-500 to-blue-600 border-0"
              >
                Advanced Management
              </Button>
            </Space>
          </div>

          {submissions.length > 0 ? (
            <Table
              columns={submissionColumns}
              dataSource={submissions}
              rowKey={(record) => record._id || record.id || record.student?._id}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} submissions`
              }}
              className="shadow-sm"
            />
          ) : (
            <Empty
              description="No submissions yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      ),
    },
  ];

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text type="secondary" className="text-lg">Loading assignment data...</Text>
          </div>
        </div>
      </div>
    );
  }

  if (!assignmentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert
            message="Assignment not found"
            description="The assignment you're looking for doesn't exist or has been deleted."
            type="error"
            showIcon
            action={
              <Button
                type="primary"
                onClick={() => navigate(`/teacher/classroom/${classId}#classwork`)}
              >
                Back to Classwork
              </Button>
            }
            className="shadow-lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header with Glass Effect */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb */}
          <Breadcrumb
            className="mb-4"
            items={[
              {
                title: (
                  <span
                    onClick={() => navigate(`/teacher/classroom/${classId}`)}
                    className="cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    <FileTextOutlined className="mr-1" />
                    {currentAssignmentData.classroom?.name || "Classroom"}
                  </span>
                ),
              },
              {
                title: (
                  <span
                    onClick={() =>
                      navigate(`/teacher/classroom/${classId}#classwork`)
                    }
                    className="cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    Classwork
                  </span>
                ),
              },
              {
                title: (
                  <span className="text-blue-600">
                    <BookOutlined className="mr-1" />
                    {currentAssignmentData.title}
                  </span>
                ),
              },
            ]}
          />

          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`/teacher/classroom/${classId}#classwork`)}
                className="flex items-center hover:shadow-md transition-shadow"
              >
                Back to Classwork
              </Button>
              
              <div className="hidden md:flex items-center gap-3">
                <Badge count={actualSubmissions.length} showZero color="#52c41a">
                  <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    Submissions
                  </div>
                </Badge>
                <Tag color={currentAssignmentData.visibility === 'published' ? 'green' : 'orange'} className="px-3 py-1">
                  {currentAssignmentData.visibility?.charAt(0).toUpperCase() + currentAssignmentData.visibility?.slice(1)}
                </Tag>
                <Tag color={isOverdue ? 'red' : daysUntilDue <= 7 ? 'orange' : 'green'} className="px-3 py-1">
                  {isOverdue ? '⚠️ Overdue' : daysUntilDue <= 7 ? '⏰ Due Soon' : '✅ Active'}
                </Tag>
              </div>
            </div>
            
            <Space>
              <Button 
                icon={<EditOutlined />}
                onClick={() =>
                  navigate(`/teacher/classroom/${classId}/assignment/${assignmentId}/edit`)
                }
                className="hover:shadow-md transition-shadow"
              >
                Edit
              </Button>
              <Button 
                type="primary"
                icon={<TrophyOutlined />}
                onClick={handleViewAllSubmissions}
                className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 hover:shadow-lg transition-all duration-300"
              >
                Grade Submissions
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <Title level={2} className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ marginTop: '0px',marginBottom: '0px' }}>
            {currentAssignmentData.title}
          </Title>
          <Paragraph className="text-gray-600 text-lg">
            {currentAssignmentData.classroom?.name} • Created {moment(currentAssignmentData.createdAt).fromNow()}
          </Paragraph>
        </div>

        {/* Status Alerts */}
        {currentAssignmentData.visibility === 'scheduled' && 
         currentAssignmentData.publishDate && 
         moment(currentAssignmentData.publishDate).isAfter(moment()) && (
          <Alert
            message="📅 Assignment is scheduled"
            description={
              <div>
                <span>
                  This assignment will be automatically published on{' '}
                  <strong>{moment(currentAssignmentData.publishDate).format("DD/MM/YYYY HH:mm")}</strong>.
                  Students cannot see it until then.
                </span>
              </div>
            }
            type="info"
            showIcon
            icon={<ClockCircleOutlined />}
            className="mb-6 shadow-sm"
          />
        )}

        {currentAssignmentData.visibility === 'draft' && (
          <Alert
            message="📝 Assignment is in draft mode"
            description="This assignment is not visible to students. Publish it when you're ready."
            type="warning"
            showIcon
            className="mb-6 shadow-sm"
          />
        )}

        {isOverdue && (
          <Alert
            message="⚠️ Assignment is overdue"
            description={
              <div className="flex items-center justify-between">
                <span>
                  Due: {moment(currentAssignmentData.dueDate).format("DD/MM/YYYY HH:mm")}
                  {currentAssignmentData.allowLateSubmission && 
                    ` • Late submissions allowed with ${currentAssignmentData.latePenalty}% penalty per day`
                  }
                </span>
                <Button size="small" type="link" icon={<SettingOutlined />}>
                  Extend Deadline
                </Button>
              </div>
            }
            type="warning"
            showIcon
            className="mb-6 shadow-sm"
          />
        )}

        {/* Tabs */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          items={tabItems}
          className="bg-white rounded-lg shadow-lg p-6"
          size="large"
        />
      </div>

      {/* Modals */}
      <AssignmentGradingModal
        visible={gradingModalVisible}
        onCancel={() => setGradingModalVisible(false)}
        onSave={(gradingData) => {
          console.log("Saved grade:", gradingData);
          setGradingModalVisible(false);
          message.success("Grade saved successfully!");
        }}
        loading={loading}
        assignment={currentAssignmentData}
        submission={selectedSubmission}
        allSubmissions={submissions.filter(sub => sub.status !== 'missing')}
      />

      <SubmissionManagement
        visible={submissionManagementVisible}
        onCancel={() => setSubmissionManagementVisible(false)}
        onBack={() => setSubmissionManagementVisible(false)}
        assignment={currentAssignmentData}
      />
    </div>
  );
};

export default AssignmentDetail;
