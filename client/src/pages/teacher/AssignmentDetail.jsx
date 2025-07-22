import React, { useState, useEffect, useCallback, lazy } from "react";
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
  Avatar,
  Table,
  Tooltip,
  message,
  Breadcrumb,
  Spin,
  Badge,
  Empty,
  Modal,
  List,
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
  BookOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { assignmentAPI } from "../../services/api";
import {
  formatFileSize,
  downloadAssignmentAttachment,
  downloadSubmissionAttachment,
  getBrowserInfo,
} from "../../utils/fileUtils";
import { AssignmentGradingModal } from "../../components/teacher/grading";
const SubmissionManagement = lazy(() =>
  import("../../components/teacher/assignment/SubmissionManagement")
);
import { fixVietnameseEncoding } from "../../utils/convertStr";

const { Title, Text, Paragraph } = Typography;

const AssignmentDetail = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionManagementVisible, setSubmissionManagementVisible] =
    useState(false);
  const [fileDownloadModalVisible, setFileDownloadModalVisible] =
    useState(false);
  const [selectedSubmissionForDownload, setSelectedSubmissionForDownload] =
    useState(null);
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());

  // Real assignment data
  const [assignmentData, setAssignmentData] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // Fetch assignment data
  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData();
    }
  }, [assignmentId]);

  const fetchAssignmentData = async () => {
    try {
      setDataLoading(true);
      const response = await assignmentAPI.getDetail(assignmentId);
      if (response.success) {
        setAssignmentData(response.data);
        setSubmissions(response.data.submissions);
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

  // Get current assignment data with fallback
  const currentAssignmentData = assignmentData || {
    _id: assignmentId,
    title: "Assignment",
    description: "Loading...",
    totalPoints: 100,
    dueDate: new Date(),
    allowLateSubmission: false,
    latePenalty: 0,
    classroom: { name: "Classroom" },
    attachments: [],
    stats: { totalStudents: 0 },
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

  // 🚀 Preload SubmissionManagement on hover for better UX
  const handleAdvancedManagementHover = useCallback(() => {
    // Preload the heavy component before user clicks
    import("../../components/teacher/assignment/SubmissionManagement");
  }, []);

  // Handle file download for submissions with multiple attachments
  const handleDownloadSubmissionFiles = useCallback((submission) => {
    if (!submission.attachments || submission.attachments.length === 0) {
      message.info("No attachments to download");
      return;
    }

    if (submission.attachments.length === 1) {
      // Single file - download directly
      handleSingleFileDownload(submission, 0);
    } else {
      // Multiple files - show selection modal
      setSelectedSubmissionForDownload(submission);
      setFileDownloadModalVisible(true);
    }
  }, []);

  const handleSingleFileDownload = useCallback(
    async (submission, attachmentIndex) => {
      const fileId = `${submission._id}-${attachmentIndex}`;

      if (downloadingFiles.has(fileId)) {
        message.warning("Download already in progress...");
        return;
      }

      setDownloadingFiles((prev) => new Set(prev).add(fileId));

      try {
        const attachment = submission.attachments[attachmentIndex];
        await downloadSubmissionAttachment(
          assignmentId,
          submission._id,
          attachmentIndex,
          attachment.name || `submission-file-${attachmentIndex + 1}`,
          attachment
        );
      } catch (error) {
        console.error("Download failed:", error);
      } finally {
        setDownloadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    },
    [assignmentId, downloadingFiles]
  );

  const handleDownloadAllFiles = useCallback(
    async (submission) => {
      if (!submission.attachments || submission.attachments.length === 0)
        return;

      message.info(
        `Starting download of ${submission.attachments.length} files...`
      );

      // Download files with delay to avoid overwhelming the browser
      for (let i = 0; i < submission.attachments.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, i * 500)); // 500ms delay between downloads
        await handleSingleFileDownload(submission, i);
      }

      setFileDownloadModalVisible(false);
    },
    [handleSingleFileDownload]
  );

  const handleSaveGrade = async (gradingData) => {
    // Save reference for potential rollback
    const submissionBeingGraded = selectedSubmission;

    try {
      setGradingLoading(true);

      if (!selectedSubmission || !selectedSubmission._id) {
        message.error("Không tìm thấy thông tin submission!");
        return;
      }

      if (!assignmentId) {
        message.error("Không tìm thấy assignment ID!");
        return;
      }

      // Optimistic update: Update UI immediately
      const updatedSubmissions = submissions.map((sub) => {
        if (sub._id === selectedSubmission._id) {
          return {
            ...sub,
            grade: gradingData.grade,
            feedback: gradingData.feedback,
            status: "graded",
            gradedAt: new Date().toISOString(),
            allowResubmit: gradingData.allowResubmit,
            hideGradeFromStudent: gradingData.hideGradeFromStudent,
            // Add grading history
            gradingHistory: [
              ...(sub.gradingHistory || []).map((h) => ({
                ...h,
                isLatest: false,
              })),
              {
                grade: gradingData.grade,
                originalGrade: gradingData.grade,
                feedback: gradingData.feedback,
                gradedAt: new Date().toISOString(),
                gradedBy: null, // Current teacher
                gradedByName: "Current Teacher",
                isLatest: true,
                gradeReason:
                  gradingData.gradeReason || "Manual grade via grading modal",
                changeType: gradingData.changeType || "initial",
              },
            ],
          };
        }
        return sub;
      });

      // Update local state immediately (optimistic update)
      setSubmissions(updatedSubmissions);

      // Update assignment data to reflect new stats (optimistic)
      if (assignmentData && selectedSubmission.status !== "graded") {
        setAssignmentData((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            gradedCount: (prev.stats?.gradedCount || 0) + 1,
            pendingCount: Math.max((prev.stats?.pendingCount || 0) - 1, 0),
          },
        }));
      }

      // Close modal immediately for better UX
      setGradingModalVisible(false);
      setSelectedSubmission(null);
      message.success("Chấm điểm thành công!");

      // Call assignment API to grade submission in background
      const response = await assignmentAPI.gradeSubmission(
        assignmentId,
        submissionBeingGraded._id,
        gradingData
      );

      if (response.success) {
        // Only refresh submissions data in background, no UI flash
        fetchSubmissions().catch(console.error);
      } else {
        throw new Error(response.message || "Failed to save grade");
      }
    } catch (error) {
      console.error("❌ Error saving grade:", error);

      // Rollback optimistic update on error
      await fetchSubmissions();

      // Reopen modal and show error if API failed
      setGradingModalVisible(true);
      setSelectedSubmission(submissionBeingGraded);

      message.error(
        `Lỗi khi chấm điểm: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`
      );
    } finally {
      setGradingLoading(false);
    }
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
              <Text type="secondary" className="text-xs">
                {student.email}
              </Text>
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
            <Tooltip
              title={
                record.attachments.length === 1
                  ? `Download: ${fixVietnameseEncoding(
                      record.attachments[0].name
                    )}`
                  : `Download ${record.attachments.length} files`
              }
            >
              <Button
                type="text"
                icon={<DownloadOutlined />}
                size="small"
                onClick={() => handleDownloadSubmissionFiles(record)}
                loading={Array.from(
                  { length: record.attachments.length },
                  (_, i) => downloadingFiles.has(`${record._id}-${i}`)
                ).some(Boolean)}
              >
                {record.attachments.length > 1 && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1 rounded">
                    {record.attachments.length}
                  </span>
                )}
              </Button>
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
    pending:
      backendStats.pendingCount ||
      actualSubmissions.filter((s) => s.status === "submitted").length,
    late:
      backendStats.lateCount ||
      actualSubmissions.filter((s) => s.isLate).length,
    avgGrade: backendStats.avgGrade !== undefined ? backendStats.avgGrade : 0,
  };

  const isOverdue = moment().isAfter(currentAssignmentData.dueDate);
  const daysUntilDue = moment(currentAssignmentData.dueDate).diff(
    moment(),
    "days"
  );

  const tabItems = [
    {
      key: "overview",
      label: (
        <span>
          <BookOutlined />
          Tổng quan
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
                    <Text strong className="text-lg">
                      Chi tiết bài tập
                    </Text>
                    <div className="text-sm text-gray-500">
                      Nội dung và hướng dẫn
                    </div>
                  </div>
                </div>
              }
            >
              <div className="space-y-4">
                <div>
                  <Title level={4} className="mb-2">
                    {currentAssignmentData.title}
                  </Title>
                  <div
                    className="ql-editor"
                    style={{
                      fontSize: "16px",
                      lineHeight: "1.8",
                      color: "#4a5568",
                      padding: 0,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: currentAssignmentData.description,
                    }}
                  />
                </div>

                {currentAssignmentData.instructions && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-l-4 border-blue-400">
                    <Title level={5} className="text-blue-700 mb-3">
                      📋 Hướng dẫn chi tiết
                    </Title>
                    <div
                      style={{ whiteSpace: "pre-wrap", lineHeight: "1.8" }}
                      className="text-gray-700"
                    >
                      {currentAssignmentData.instructions}
                    </div>
                  </div>
                )}

                {currentAssignmentData.attachments &&
                  currentAssignmentData.attachments.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-l-4 border-purple-400">
                      <Title level={5} className="text-purple-700 mb-4">
                        📎 Tài liệu đính kèm của giáo viên (
                        {currentAssignmentData.attachments.length})
                      </Title>
                      <div className="space-y-3">
                        {currentAssignmentData.attachments.map(
                          (file, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <PaperClipOutlined className="text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <Text strong className="block">
                                  {fixVietnameseEncoding(file.name)}
                                </Text>
                                <Text type="secondary" className="text-sm">
                                  {formatFileSize(null, file)}
                                </Text>
                              </div>
                              <Tooltip
                                title={(() => {
                                  const { browserName, isModernBrowser } =
                                    getBrowserInfo();
                                  if (!isModernBrowser) {
                                    return `Your browser (${browserName}) has limited download support. File might open in a new tab instead of downloading.`;
                                  }
                                  if (browserName === "Edge") {
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
                                  onClick={async () => {
                                    try {
                                      await downloadAssignmentAttachment(
                                        assignmentId,
                                        index,
                                        file.name,
                                        file
                                      );
                                    } catch (error) {
                                      console.error("Download failed:", error);
                                    }
                                  }}
                                >
                                  Download
                                </Button>
                              </Tooltip>
                            </div>
                          )
                        )}
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
                    title="Đã nộp"
                    value={stats.submitted}
                    suffix={`/${
                      backendStats.totalStudents || submissions.length || 0
                    }`}
                    prefix={<CheckCircleOutlined className="text-green-500" />}
                    valueStyle={{ color: "#22c55e", fontSize: "24px" }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="text-center shadow-md border-0">
                  <Statistic
                    title="Đã chấm"
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
                    title="Chờ chấm"
                    value={stats.pending}
                    prefix={<ClockCircleOutlined className="text-orange-500" />}
                    valueStyle={{ color: "#f59e0b", fontSize: "24px" }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="text-center shadow-md border-0">
                  <Statistic
                    title="Điểm TB"
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
                  <Text strong>Thông tin bài tập</Text>
                </div>
              }
              className="mb-6 shadow-lg border-0"
              size="small"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Text type="secondary">Điểm tối đa:</Text>
                  <Tag color="blue" className="px-3 py-1 text-base">
                    {currentAssignmentData.totalPoints} điểm
                  </Tag>
                </div>

                <div className="flex justify-between items-center">
                  <Text type="secondary">Trạng thái:</Text>
                  <Tag
                    color={
                      currentAssignmentData.visibility === "published"
                        ? "green"
                        : "orange"
                    }
                    className="px-3 py-1 text-base"
                  >
                    {currentAssignmentData.visibility === 'published' ? 'Đã đăng' : currentAssignmentData.visibility === 'draft' ? 'Bản nháp' : currentAssignmentData.visibility === 'scheduled' ? 'Đã lên lịch' : currentAssignmentData.visibility}
                  </Tag>
                </div>

                <div className="flex justify-between items-center">
                  <Text type="secondary">Hình thức nộp:</Text>
                  <Tag
                    color="purple"
                    className="px-3 py-1 text-base"
                    icon={
                      currentAssignmentData.submissionSettings?.type ===
                      "file" ? (
                        <PaperClipOutlined />
                      ) : currentAssignmentData.submissionSettings?.type ===
                        "text" ? (
                        <FileTextOutlined />
                      ) : (
                        <>
                          <FileTextOutlined /> <PaperClipOutlined />
                        </>
                      )
                    }
                  >
                    {currentAssignmentData.submissionSettings?.type === "both"
                      ? "Văn bản & Tệp"
                      : currentAssignmentData.submissionSettings?.type ===
                        "file"
                      ? "Chỉ tệp"
                      : currentAssignmentData.submissionSettings?.type ===
                        "text"
                      ? "Chỉ văn bản"
                      : "Văn bản & Tệp"}
                  </Tag>
                </div>

                <Divider className="my-3" />

                <div className="flex justify-between items-center">
                  <Text type="secondary">Ngày tạo:</Text>
                  <Text>
                    {moment(currentAssignmentData.createdAt).format(
                      "DD/MM/YYYY"
                    )}
                  </Text>
                </div>

                {currentAssignmentData.publishDate && (
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Ngày đăng:</Text>
                    <Text>
                      {moment(currentAssignmentData.publishDate).format(
                        "DD/MM/YYYY HH:mm"
                      )}
                    </Text>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <Text type="secondary">Số bài nộp:</Text>
                  <Badge count={stats.submitted} showZero color="#52c41a" />
                </div>
              </div>
            </Card>

            {/* Due Date Card */}
            <Card
              className={`mb-6 shadow-lg border-0 ${
                isOverdue
                  ? "border-l-4 border-l-red-400 bg-red-50"
                  : daysUntilDue <= 7
                  ? "border-l-4 border-l-orange-400 bg-orange-50"
                  : "border-l-4 border-l-green-400 bg-green-50"
              }`}
              size="small"
            >
              <div className="text-center">
                <CalendarOutlined
                  className={`text-4xl mb-2 ${
                    isOverdue
                      ? "text-red-500"
                      : daysUntilDue <= 7
                      ? "text-orange-500"
                      : "text-green-500"
                  }`}
                />
                <Title level={5} className="mb-1">
                  Hạn nộp
                </Title>
                <Text
                  strong
                  className={`text-lg ${
                    isOverdue
                      ? "text-red-600"
                      : daysUntilDue <= 7
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {moment(currentAssignmentData.dueDate).format(
                    "DD/MM/YYYY HH:mm"
                  )}
                </Text>
                <div className="mt-2">
                  {isOverdue ? (
                    <Tag color="red" icon={<WarningOutlined />}>
                      Quá hạn
                    </Tag>
                  ) : daysUntilDue <= 7 ? (
                    <Tag color="orange" icon={<ClockCircleOutlined />}>
                      Sắp đến hạn ({daysUntilDue} ngày)
                    </Tag>
                  ) : (
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                      Đang mở
                    </Tag>
                  )}
                </div>
              </div>

              {currentAssignmentData.allowLateSubmission && (
                <Alert
                  message="Cho phép nộp muộn"
                  description={`Cho phép nộp muộn${
                    currentAssignmentData.maxLateDays
                      ? ` tối đa ${currentAssignmentData.maxLateDays} ngày. `
                      : ""
                  }Phạt: ${currentAssignmentData.latePenalty}% mỗi ngày`}
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
          Bài nộp ({stats.submitted})
        </span>
      ),
      children: (
        <Card className="shadow-lg border-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Title level={3} className="mb-1">
                📝 Danh sách bài nộp
              </Title>
              <Text type="secondary" className="text-base">
                Theo dõi và chấm điểm bài làm của học sinh
              </Text>
            </div>
            <Space>
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={handleViewAllSubmissions}
                onMouseEnter={handleAdvancedManagementHover}
                className="bg-gradient-to-r from-blue-500 to-blue-600 border-0"
              >
                Quản lý nâng cao
              </Button>
            </Space>
          </div>

          {submissions.length > 0 ? (
            <Table
              columns={submissionColumns}
              dataSource={submissions}
              rowKey={(record) =>
                record._id || record.id || record.student?._id
              }
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} bài nộp`,
              }}
              className="shadow-sm"
            />
          ) : (
            <Empty
              description="Chưa có bài nộp nào"
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
            <Text type="secondary" className="text-lg">
              Đang tải dữ liệu bài tập...
            </Text>
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
            message="Không tìm thấy bài tập"
            description="Bài tập bạn tìm kiếm không tồn tại hoặc đã bị xóa."
            type="error"
            showIcon
            action={
              <Button
                type="primary"
                onClick={() =>
                  navigate(`/teacher/classroom/${classId}#classwork`)
                }
              >
                Quay lại danh sách bài tập
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
                onClick={() =>
                  navigate(`/teacher/classroom/${classId}#classwork`)
                }
                className="flex items-center hover:shadow-md transition-shadow"
              >
                Quay lại danh sách bài tập
              </Button>

              <div className="hidden md:flex items-center gap-3">
                <Badge
                  count={actualSubmissions.length}
                  showZero
                  color="#52c41a"
                >
                  <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    Bài nộp
                  </div>
                </Badge>
                <Tag
                  color={
                    currentAssignmentData.visibility === "published"
                      ? "green"
                      : "orange"
                  }
                  className="px-3 py-1"
                >
                  {currentAssignmentData.visibility === 'published' ? 'Đã đăng' : currentAssignmentData.visibility === 'draft' ? 'Bản nháp' : currentAssignmentData.visibility === 'scheduled' ? 'Đã lên lịch' : currentAssignmentData.visibility}
                </Tag>
                <Tag
                  color={
                    isOverdue ? "red" : daysUntilDue <= 7 ? "orange" : "green"
                  }
                  className="px-3 py-1"
                >
                  {isOverdue
                    ? "⚠️ Quá hạn"
                    : daysUntilDue <= 7
                    ? "⏰ Sắp đến hạn"
                    : "✅ Đang mở"}
                </Tag>
              </div>
            </div>

            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() =>
                  navigate(
                    `/teacher/classroom/${classId}/assignment/${assignmentId}/edit`
                  )
                }
                className="hover:shadow-md transition-shadow"
              >
                Chỉnh sửa
              </Button>
              <Button
                type="primary"
                icon={<TrophyOutlined />}
                onClick={handleViewAllSubmissions}
                onMouseEnter={handleAdvancedManagementHover}
                className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 hover:shadow-lg transition-all duration-300"
              >
                Chấm điểm bài nộp
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <Title
            level={2}
            className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            style={{ marginTop: "0px", marginBottom: "0px" }}
          >
            {currentAssignmentData.title}
          </Title>
          <Paragraph className="text-gray-600 text-lg">
            {currentAssignmentData.classroom?.name} • Created{" "}
            {moment(currentAssignmentData.createdAt).fromNow()}
          </Paragraph>
        </div>

        {/* Status Alerts */}
        {currentAssignmentData.visibility === "scheduled" &&
          currentAssignmentData.publishDate &&
          moment(currentAssignmentData.publishDate).isAfter(moment()) && (
            <Alert
              message="📅 Bài tập đã lên lịch"
              description={
                <div>
                  <span>
                    Bài tập này sẽ được tự động đăng ký vào{" "}
                    <strong>
                      {moment(currentAssignmentData.publishDate).format(
                        "DD/MM/YYYY HH:mm"
                      )}
                    </strong>
                    . Học sinh không thể xem được cho đến thời điểm đó.
                  </span>
                </div>
              }
              type="info"
              showIcon
              icon={<ClockCircleOutlined />}
              className="mb-6 shadow-sm"
            />
          )}

        {currentAssignmentData.visibility === "draft" && (
          <Alert
            message="📝 Bài tập đang ở chế độ nháp"
            description="Bài tập này chưa được hiển thị cho học sinh. Hãy đăng nó khi bạn đã sẵn sàng."
            type="warning"
            showIcon
            className="mb-6 shadow-sm"
          />
        )}

        {isOverdue && (
          <Alert
            message="⚠️ Bài tập đã quá hạn"
            description={
              <div className="flex items-center justify-between">
                <span>
                  Hạn:{" "}
                  {moment(currentAssignmentData.dueDate).format(
                    "DD/MM/YYYY HH:mm"
                  )}
                  {currentAssignmentData.allowLateSubmission &&
                    ` • Cho phép nộp muộn${
                      currentAssignmentData.maxLateDays
                        ? ` tối đa ${currentAssignmentData.maxLateDays} ngày`
                        : ""
                    } với phạt ${
                      currentAssignmentData.latePenalty
                    }% mỗi ngày`}
                </span>
                <Button size="small" type="link" icon={<SettingOutlined />}>
                  Gia hạn hạn
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
        onSave={handleSaveGrade}
        loading={gradingLoading}
        assignment={currentAssignmentData}
        submission={selectedSubmission}
        allSubmissions={submissions.filter((sub) => sub.status !== "missing")}
      />

      <SubmissionManagement
        visible={submissionManagementVisible}
        onCancel={() => setSubmissionManagementVisible(false)}
        onBack={() => setSubmissionManagementVisible(false)}
        assignment={currentAssignmentData}
      />

      {/* File Download Selection Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <DownloadOutlined className="text-blue-500" />
            <span>Tải file bài nộp</span>
            <Badge
              count={selectedSubmissionForDownload?.attachments?.length || 0}
              showZero={false}
              color="#1890ff"
            />
          </div>
        }
        open={fileDownloadModalVisible}
        onCancel={() => setFileDownloadModalVisible(false)}
        width={600}
        footer={[
          <Button
            key="cancel"
            onClick={() => setFileDownloadModalVisible(false)}
          >
            Hủy
          </Button>,
          <Button
            key="download-all"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() =>
              handleDownloadAllFiles(selectedSubmissionForDownload)
            }
            disabled={!selectedSubmissionForDownload?.attachments?.length}
          >
            Tải tất cả (
            {selectedSubmissionForDownload?.attachments?.length || 0} tệp)
          </Button>,
        ]}
      >
        {selectedSubmissionForDownload && (
          <div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Avatar
                  src={selectedSubmissionForDownload.student?.image}
                  icon={<UserOutlined />}
                  size={24}
                />
                <Text strong>
                  {selectedSubmissionForDownload.student?.fullName}
                </Text>
              </div>
              <Text type="secondary">
                Submitted:{" "}
                {moment(selectedSubmissionForDownload.submittedAt).format(
                  "DD/MM/YYYY HH:mm"
                )}
              </Text>
            </div>

            <List
              dataSource={selectedSubmissionForDownload.attachments || []}
              renderItem={(attachment, index) => {
                const fileId = `${selectedSubmissionForDownload._id}-${index}`;
                const isDownloading = downloadingFiles.has(fileId);

                return (
                  <List.Item
                    actions={[
                      <Button
                        key="download"
                        type="primary"
                        size="small"
                        icon={<DownloadOutlined />}
                        loading={isDownloading}
                        onClick={() =>
                          handleSingleFileDownload(
                            selectedSubmissionForDownload,
                            index
                          )
                        }
                      >
                        {isDownloading ? "Đang tải..." : "Tải về"}
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <PaperClipOutlined className="text-blue-600" />
                        </div>
                      }
                      title={
                        <div className="flex items-center gap-2">
                          <Text strong className="flex-1">
                            {fixVietnameseEncoding(attachment.name)}
                          </Text>
                          <Tag color="blue" className="text-xs">
                            {attachment.name?.split(".").pop()?.toUpperCase() ||
                              "FILE"}
                          </Tag>
                        </div>
                      }
                      description={
                        <Text type="secondary" className="text-sm">
                          {formatFileSize(null, attachment)} • File {index + 1}{" "}
                          of {selectedSubmissionForDownload.attachments.length}
                        </Text>
                      }
                    />
                  </List.Item>
                );
              }}
              className="max-h-96 overflow-y-auto"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssignmentDetail;
