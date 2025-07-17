import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Statistic,
  Alert,
  Divider,
  Tag,
  Breadcrumb,
  Spin,
  Form,
  Input,
  Upload,
  message,
  Modal,
  Avatar,
  Progress,
  Badge,
  Empty,
  Timeline,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  TrophyOutlined,
  PaperClipOutlined,
  UploadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  SendOutlined,
  BookOutlined,
  InfoCircleOutlined,
  UserOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  EditOutlined,
  CloudUploadOutlined,
  StarOutlined,
  EyeInvisibleOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import moment from "moment";
import { assignmentAPI } from "../../services/api";
import { formatFileSize, downloadGenericFile, getBrowserInfo } from "../../utils/fileUtils";
import { fixVietnameseEncoding } from "../../utils/convertStr";
import { StudentSubmissionModal } from "../../components/student/submission";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const StudentAssignmentDetail = () => {
  const { classroomId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const [form] = Form.useForm();

  // Simple file download using fileUtils
  const handleFileDownload = async (downloadUrl, fileName) => {
    try {
      await downloadGenericFile({
        downloadUrl: downloadUrl,
        url: downloadUrl,
        name: fileName
      });
    } catch (error) {
      console.error('Download error:', error);
      // Error handling is already done in downloadGenericFile
    }
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);



  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetail();
    }
  }, [assignmentId]);

  const fetchAssignmentDetail = async () => {
    try {
      setLoading(true);
      const response = await assignmentAPI.getStudentAssignmentDetail(
        assignmentId
      );
      if (response.success) {
        const assignmentData = response.data;
        setAssignment(assignmentData);

        // Find current user's submission
        const userSubmission = assignmentData.submissions?.find(
          (sub) => sub.student._id === user._id
        );
        setSubmission(userSubmission || null);
      } else {
        message.error("Failed to load assignment");
        navigate(`/student/classroom/${classroomId}#assignments`);
      }
    } catch (error) {
      console.error("Error fetching assignment:", error);
      message.error("Failed to load assignment");
      navigate(`/student/classroom/${classroomId}#assignments`);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = () => {
    if (!submission) {
      const isOverdue = moment().isAfter(moment(assignment.dueDate));
      return {
        status: isOverdue ? "overdue" : "not_submitted",
        text: isOverdue ? "Overdue - No submission" : "Not submitted",
        color: isOverdue ? "red" : "orange",
        icon: <ExclamationCircleOutlined />,
      };
    }

    switch (submission.status) {
      case "submitted":
        return {
          status: "submitted",
          text: "Submitted - Waiting for grade",
          color: "blue",
          icon: <ClockCircleOutlined />,
        };
      case "graded":
        return {
          status: "graded",
          text: "Graded",
          color: "green",
          icon: <CheckCircleOutlined />,
        };
      case "late":
        return {
          status: "late",
          text: "Late submission",
          color: "orange",
          icon: <ExclamationCircleOutlined />,
        };
      default:
        return {
          status: "pending",
          text: "Pending",
          color: "default",
          icon: <ClockCircleOutlined />,
        };
    }
  };

  const canSubmit = () => {
    if (assignment.visibility !== "published") return false;
    if (!assignment.isActive) return false;

    // Check if late submission is allowed
    const isOverdue = moment().isAfter(moment(assignment.dueDate));
    
    // If no submission yet
    if (!submission) {
      return !isOverdue || assignment.allowLateSubmission;
    }
    
    // If already submitted, check if resubmission is allowed
    if (submission && submission.allowResubmit) {
      return !isOverdue || assignment.allowLateSubmission;
    }
    
    // Already submitted and no resubmission allowed
    return false;
  };

  const canResubmit = () => {
    return submission && submission.allowResubmit && canSubmit();
  };

  const handleSubmissionSubmit = async (submissionData) => {
    try {
      setSubmitting(true);
      const isResubmission = canResubmit();
      
      const response = await assignmentAPI.submit(assignmentId, submissionData);

      if (response.success) {
        if (isResubmission) {
          message.success("Assignment resubmitted successfully!");
        } else {
          message.success("Assignment submitted successfully!");
        }
        setSubmitModalVisible(false);
        fetchAssignmentDetail();
      } else {
        message.error(response.message || "Failed to submit assignment");
      }
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to submit assignment"
      );
      console.error("Error submitting assignment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text type="secondary" className="text-lg">Loading assignment...</Text>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert
            message="Assignment not found"
            description="The assignment you're looking for doesn't exist or is not available."
            type="error"
            showIcon
            action={
              <Button
                type="primary"
                onClick={() =>
                  navigate(`/student/classroom/${classroomId}#assignments`)
                }
              >
                Back to Assignments
              </Button>
            }
            className="shadow-lg"
          />
        </div>
      </div>
    );
  }

  const status = getSubmissionStatus();
  const isOverdue = moment().isAfter(moment(assignment.dueDate));
  const daysUntilDue = moment(assignment.dueDate).diff(moment(), 'days');
  const timeRemaining = moment(assignment.dueDate).fromNow();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
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
                    onClick={() => navigate(`/student/classroom/${classroomId}`)}
                    className="cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    <BookOutlined className="mr-1" />
                    Classroom
                  </span>
                ),
              },
              {
                title: (
                  <span
                    onClick={() =>
                      navigate(`/student/classroom/${classroomId}#assignments`)
                    }
                    className="cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    Assignments
                  </span>
                ),
              },
              {
                title: (
                  <span className="text-blue-600">
                    <FileTextOutlined className="mr-1" />
                    {assignment.title}
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
                onClick={() =>
                  navigate(`/student/classroom/${classroomId}#assignments`)
                }
                className="flex items-center hover:shadow-md transition-shadow"
              >
                Back to Assignments
              </Button>
              
              <div className="hidden md:flex items-center gap-3">
                <Tag color={status.color} className="px-3 py-1 text-base">
                  {status.icon} {status.text}
                </Tag>
                <Tag 
                  color={isOverdue ? 'red' : daysUntilDue <= 3 ? 'orange' : 'green'} 
                  className="px-3 py-1"
                >
                  {isOverdue ? '⚠️ Overdue' : daysUntilDue <= 3 ? '⏰ Due Soon' : '✅ Active'}
                </Tag>
              </div>
            </div>

            <div>
              {canSubmit() && (
                <Button 
                  type="primary" 
                  icon={canResubmit() ? <RedoOutlined /> : <SendOutlined />}
                  onClick={() => setSubmitModalVisible(true)}
                  className={`${canResubmit() ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-green-500 to-green-600'} border-0 hover:shadow-lg transition-all duration-300 px-6`}
                  size="large"
                >
                  {canResubmit() ? 'Resubmit Assignment' : 'Submit Assignment'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <Title level={2} className="mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent" style={{ marginTop: '0px', marginBottom: '0px' }}>
            {assignment.title}
          </Title>
          <Paragraph className="text-gray-600 text-lg">
            {assignment.classroom?.name} • Due {timeRemaining}
          </Paragraph>
        </div>

        {/* Status Alerts */}
        {assignment.visibility === 'scheduled' && 
         assignment.publishDate && 
         moment(assignment.publishDate).isAfter(moment()) && (
          <Alert
            message="📅 Assignment is scheduled"
            description={
              <div>
                <span>
                  This assignment will be available on{' '}
                  <strong>{moment(assignment.publishDate).format("DD/MM/YYYY HH:mm")}</strong>.
                  You cannot submit until then.
                </span>
              </div>
            }
            type="info"
            showIcon
            icon={<ClockCircleOutlined />}
            className="mb-6 shadow-sm"
          />
        )}

        {assignment.visibility === 'draft' && (
          <Alert
            message="📝 Assignment is in draft mode"
            description="This assignment is not yet available. Your teacher is still preparing it."
            type="warning"
            showIcon
            className="mb-6 shadow-sm"
          />
        )}

        {isOverdue && !submission && (
          <Alert
            message="⚠️ Assignment is overdue"
            description={
              assignment.allowLateSubmission
                ? `Due: ${moment(assignment.dueDate).format(
                    "DD/MM/YYYY HH:mm"
                  )} - Late submission allowed${
                    assignment.maxLateDays ? ` for up to ${assignment.maxLateDays} days` : ''
                  } with ${assignment.latePenalty}% penalty per day`
                : `Due: ${moment(assignment.dueDate).format(
                    "DD/MM/YYYY HH:mm"
                  )} - Late submission not allowed`
            }
            type="warning"
            showIcon
            className="mb-6 shadow-sm"
          />
        )}

        <Row gutter={[24, 24]}>
          {/* Left Column - Main Content */}
          <Col xs={24} lg={16}>
            {/* Assignment Description */}
            <Card 
              className="mb-6 shadow-lg border-0"
              title={
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <FileTextOutlined className="text-white text-lg" />
                  </div>
                  <div>
                    <Text strong className="text-lg">Assignment Details</Text>
                    <div className="text-sm text-gray-500">Instructions and requirements</div>
                  </div>
                </div>
              }
            >
              <div className="space-y-4">
                <div>
                  <Title level={4} className="mb-3">Description</Title>
                  <div 
                    className="ql-editor"
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.8',
                      color: '#4a5568',
                      padding: 0
                    }}
                    dangerouslySetInnerHTML={{ __html: assignment.description }}
                  />
                </div>

                {assignment.instructions && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-l-4 border-blue-400">
                    <Title level={5} className="text-blue-700 mb-3">
                      📋 Instructions
                    </Title>
                    <div 
                      style={{ whiteSpace: "pre-wrap", lineHeight: "1.8" }}
                      className="text-gray-700"
                    >
                      {assignment.instructions}
                    </div>
                  </div>
                )}

                {assignment.attachments && assignment.attachments.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-l-4 border-purple-400">
                    <Title level={5} className="text-purple-700 mb-4">
                      📎 Teacher's Resources ({assignment.attachments.length})
                    </Title>
                    <div className="space-y-3">
                      {assignment.attachments.map((file, index) => (
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

            {/* My Submission Section */}
            <Card 
              className="shadow-lg border-0"
              title={
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <UserOutlined className="text-white text-lg" />
                  </div>
                  <div>
                    <Text strong className="text-lg">My Submission</Text>
                    <div className="text-sm text-gray-500">Your work and progress</div>
                  </div>
                </div>
              }
            >
              {submission ? (
                <div className="space-y-6">
                  {/* Submission Status */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        icon={status.icon} 
                        className={`${status.color === 'green' ? 'bg-green-500' : status.color === 'blue' ? 'bg-blue-500' : 'bg-orange-500'}`}
                      />
                      <div>
                        <Text strong className="text-lg">{status.text}</Text>
                        <div className="text-sm text-gray-600">
                          Submitted: {moment(submission.submittedAt).format("DD/MM/YYYY HH:mm")}
                        </div>
                      </div>
                    </div>
                    <Tag color={status.color} className="px-4 py-2 text-base">
                      {status.text}
                    </Tag>
                  </div>

                  {/* Submission Content */}
                  {submission.content && (
                    <div>
                      <Title level={5} className="mb-3">📝 Your Answer:</Title>
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <Text className="whitespace-pre-wrap leading-relaxed">{submission.content}</Text>
                      </div>
                    </div>
                  )}

                  {/* Submitted Files */}
                  {submission.attachments && submission.attachments.length > 0 && (
                    <div>
                      <Title level={5} className="mb-3">📎 Submitted Files:</Title>
                      <div className="space-y-2">
                        {submission.attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                          >
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <PaperClipOutlined className="text-green-600" />
                            </div>
                            <div className="flex-1">
                              <Text strong>{fixVietnameseEncoding(file.name)}</Text>
                            </div>
                            <Button
                              size="small"
                              type="link"
                              icon={<EyeOutlined />}
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grade Section */}
                  {submission.status === "graded" && submission.grade !== null && submission.grade !== undefined && (
                    <div className="p-6 border-2 border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-green-600 mb-1">
                              {submission.grade}
                            </div>
                            <Text type="secondary">Your Score</Text>
                          </div>
                          <div className="text-2xl text-gray-400">/</div>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-gray-600 mb-1">
                              {assignment.totalPoints}
                            </div>
                            <Text type="secondary">Total Points</Text>
                          </div>
                        </div>
                        <Progress
                          percent={(submission.grade / assignment.totalPoints) * 100}
                          strokeColor={{
                            '0%': '#22c55e',
                            '100%': '#16a34a',
                          }}
                          className="mb-4"
                        />
                        <div className="flex items-center justify-center gap-2">
                          <StarOutlined className="text-yellow-500" />
                          <Text strong className="text-lg">
                            {Math.round((submission.grade / assignment.totalPoints) * 100)}% Score
                          </Text>
                        </div>
                      </div>
                      
                      {submission.feedback && (
                        <div>
                          <Title level={5} className="mb-3">💬 Teacher's Feedback:</Title>
                          <div className="p-4 bg-white rounded-lg border">
                            <Text className="text-gray-700 leading-relaxed">{submission.feedback}</Text>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grade Hidden Message */}
                  {submission.status === "graded" && (submission.grade === null || submission.grade === undefined) && (
                    <div className="p-6 border-2 border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <EyeInvisibleOutlined className="text-2xl text-blue-600" />
                        </div>
                        <Title level={4} className="text-blue-700 mb-2">Assignment Graded</Title>
                        <Text className="text-blue-600">
                          Your assignment has been graded by the teacher, but the grade is currently hidden. 
                          Please contact your teacher for more information.
                        </Text>
                      </div>
                    </div>
                  )}

                  {/* Resubmission Section */}
                  {canResubmit() && (
                    <div className="p-4 border-2 border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <RedoOutlined className="text-orange-600" />
                          </div>
                          <div>
                            <Text strong className="text-orange-700">Resubmission Allowed</Text>
                            <div className="text-sm text-orange-600">
                              Your teacher has allowed you to submit this assignment again.
                              {submission.resubmissionCount > 0 && (
                                <span> (This would be resubmission #{(submission.resubmissionCount || 0) + 1})</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          type="primary" 
                          icon={<RedoOutlined />}
                          onClick={() => setSubmitModalVisible(true)}
                          className="bg-orange-500 border-orange-500 hover:bg-orange-600"
                        >
                          Resubmit
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ExclamationCircleOutlined className="text-4xl text-orange-500" />
                    </div>
                    <Title level={3} className="mb-2">No submission yet</Title>
                    <Paragraph className="text-gray-600 text-lg">
                      {canSubmit()
                        ? "Ready to submit your work? Click the submit button above!"
                        : isOverdue && !assignment.allowLateSubmission
                        ? "The submission deadline has passed"
                        : "This assignment is not available for submission"}
                    </Paragraph>
                  </div>
                  
                  {canSubmit() && (
                    <Button 
                      type="primary" 
                      size="large"
                      icon={<SendOutlined />}
                      onClick={() => setSubmitModalVisible(true)}
                      className="bg-gradient-to-r from-green-500 to-green-600 border-0 px-8 py-3 h-auto"
                    >
                      Submit Your Work
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </Col>

          {/* Right Column - Assignment Info */}
          <Col xs={24} lg={8}>
            {/* Quick Stats */}
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
                <div className="text-center">
                  <Statistic
                    title="Total Points"
                    value={assignment.totalPoints}
                    prefix={<TrophyOutlined className="text-yellow-500" />}
                    valueStyle={{ color: "#f59e0b", fontSize: "28px" }}
                  />
                </div>
                
                <Divider />
                
                <div className="flex justify-between items-center">
                  <Text type="secondary">Submission Type:</Text>
                  <Tag 
                    color="purple" 
                    className="px-3 py-1"
                    icon={
                      assignment.submissionSettings?.type === 'file' ? <PaperClipOutlined /> :
                      assignment.submissionSettings?.type === 'text' ? <FileTextOutlined /> :
                      <><FileTextOutlined /> <PaperClipOutlined /></>
                    }
                  >
                    {assignment.submissionSettings?.type === 'both' ? 'Text & File' :
                     assignment.submissionSettings?.type === 'file' ? 'File Only' :
                     assignment.submissionSettings?.type === 'text' ? 'Text Only' :
                     'Both'}
                  </Tag>
                </div>
                
                <div className="flex justify-between items-center">
                  <Text type="secondary">Status:</Text>
                  <Tag color={assignment.visibility === 'published' ? 'green' : 'orange'} className="px-3 py-1">
                    {assignment.visibility?.charAt(0).toUpperCase() + assignment.visibility?.slice(1)}
                  </Tag>
                </div>

                {assignment.submissionSettings?.maxFileSize && (
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Max File Size:</Text>
                    <Text>{assignment.submissionSettings.maxFileSize}MB</Text>
                  </div>
                )}

                {assignment.publishDate && (
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Published:</Text>
                    <Text>{moment(assignment.publishDate).format('DD/MM HH:mm')}</Text>
                  </div>
                )}

                {/* Submission Requirements */}
                {(() => {
                  const submissionSettings = assignment.submissionSettings || {};
                  const requirements = [];
                  
                  if (submissionSettings.textSubmissionRequired) {
                    requirements.push({ icon: "📝", text: "Text required", color: "blue" });
                  }
                  if (submissionSettings.fileSubmissionRequired) {
                    requirements.push({ icon: "📎", text: "File required", color: "green" });
                  }
                  if (submissionSettings.allowedFileTypes && submissionSettings.allowedFileTypes.length > 0) {
                    requirements.push({ 
                      icon: "🔧", 
                      text: `Types: ${submissionSettings.allowedFileTypes.slice(0, 3).join(', ')}${submissionSettings.allowedFileTypes.length > 3 ? '...' : ''}`, 
                      color: "purple" 
                    });
                  }

                  return requirements.length > 0 && (
                    <>
                      <Divider />
                      <div>
                        <Text type="secondary" className="block mb-2">Requirements:</Text>
                        <div className="space-y-2">
                          {requirements.map((req, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-sm">{req.icon}</span>
                              <Tag color={req.color} size="small" className="text-xs">
                                {req.text}
                              </Tag>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>

            {/* Due Date Card */}
            <Card 
              className={`mb-6 shadow-lg border-0 ${isOverdue ? 'border-l-4 border-l-red-400 bg-red-50' : daysUntilDue <= 3 ? 'border-l-4 border-l-orange-400 bg-orange-50' : 'border-l-4 border-l-green-400 bg-green-50'}`}
              size="small"
            >
              <div className="text-center">
                <CalendarOutlined 
                  className={`text-4xl mb-3 ${isOverdue ? 'text-red-500' : daysUntilDue <= 3 ? 'text-orange-500' : 'text-green-500'}`} 
                />
                <Title level={5} className="mb-2">Due Date</Title>
                <Text strong className={`text-lg block mb-3 ${isOverdue ? 'text-red-600' : daysUntilDue <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                  {moment(assignment.dueDate).format("DD/MM/YYYY HH:mm")}
                </Text>
                <Text type="secondary" className="block mb-3">
                  {timeRemaining}
                </Text>
                
                <div className="mt-3">
                  {isOverdue ? (
                    <Tag color="red" icon={<WarningOutlined />} className="px-3 py-1">
                      Overdue
                    </Tag>
                  ) : daysUntilDue <= 3 ? (
                    <Tag color="orange" icon={<ClockCircleOutlined />} className="px-3 py-1">
                      Due Soon ({daysUntilDue} days)
                    </Tag>
                  ) : (
                    <Tag color="green" icon={<CheckCircleOutlined />} className="px-3 py-1">
                      Active
                    </Tag>
                  )}
                </div>
              </div>

              {assignment.allowLateSubmission && (
                <Alert
                  message="Late Submission Allowed"
                  description={`${assignment.maxLateDays ? `Up to ${assignment.maxLateDays} days late. ` : ''}Penalty: ${assignment.latePenalty}% per day`}
                  type="info"
                  size="small"
                  showIcon
                  className="mt-4"
                />
              )}
            </Card>

            {/* Submission Timeline */}
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-green-500" />
                  <Text strong>Timeline</Text>
                </div>
              }
              className="shadow-lg border-0"
              size="small"
            >
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <div>
                        <Text strong>Assignment Published</Text>
                        <div className="text-sm text-gray-500">
                          {moment(assignment.createdAt).format('DD/MM/YYYY HH:mm')}
                        </div>
                      </div>
                    ),
                  },
                  ...(submission ? [{
                    color: submission.status === 'graded' ? 'green' : 'blue',
                    children: (
                      <div>
                        <Text strong>You Submitted</Text>
                        <div className="text-sm text-gray-500">
                          {moment(submission.submittedAt).format('DD/MM/YYYY HH:mm')}
                        </div>
                      </div>
                    ),
                  }] : []),
                  ...(submission?.status === 'graded' ? [{
                    color: 'green',
                    children: (
                      <div>
                        <Text strong>Assignment Graded</Text>
                        <div className="text-sm text-gray-500">
                          Score: {submission.grade}/{assignment.totalPoints}
                        </div>
                      </div>
                    ),
                  }] : []),
                  {
                    color: isOverdue ? 'red' : 'gray',
                    children: (
                      <div>
                        <Text strong>Due Date</Text>
                        <div className="text-sm text-gray-500">
                          {moment(assignment.dueDate).format('DD/MM/YYYY HH:mm')}
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Submit Modal */}
      <StudentSubmissionModal
        visible={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        onSubmit={handleSubmissionSubmit}
        assignment={assignment}
        loading={submitting}
        user={user}
      />
    </div>
  );
};

export default StudentAssignmentDetail;
