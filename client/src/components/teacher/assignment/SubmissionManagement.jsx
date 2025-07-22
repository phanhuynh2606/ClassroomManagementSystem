import React, { useState, useEffect, memo } from "react";
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
  Col,
  Statistic,
  Checkbox,
  Tabs,
  Form,
  InputNumber,
  Alert,
  Row,
  List,
  Badge,
  Spin,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  AppstoreOutlined,
  ExportOutlined,
  MailOutlined,
  WarningOutlined,
  SyncOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  SettingOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { AssignmentAnalytics, AssignmentGradingModal } from "../grading";
import { assignmentAPI } from "../../../services/api";
import { useSelector } from "react-redux";
import { downloadSubmissionAttachment, exportGradesToExcel } from "../../../utils/fileUtils";
import { useCallback } from "react";


const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;
const { Option } = Select;

const SubmissionManagement = ({ assignment, onBack, visible, onCancel }) => {
  // 🚨 ALL HOOKS MUST BE DECLARED BEFORE ANY EARLY RETURNS
  // Basic state hooks
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkGradeModalVisible, setBulkGradeModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("submissions");
  
  // Bulk grading states
  const [bulkGradingModalVisible, setBulkGradingModalVisible] = useState(false);
  const [autoGradingLoading, setAutoGradingLoading] = useState(false);
  const [bulkGradingLoading, setBulkGradingLoading] = useState(false);

  // File download states
  const [fileDownloadModalVisible, setFileDownloadModalVisible] = useState(false);
  const [selectedSubmissionForDownload, setSelectedSubmissionForDownload] = useState(null);
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());

  // Redux hooks
  const { user, token } = useSelector((state) => state.auth);

  // 🚨 ALL useCallback and useEffect hooks MUST be before early return
  
  // Core functions that are called in useEffects
  const fetchSubmissions = useCallback(async () => {
    if (!assignment?._id) return;

    setLoading(true);
    try {
      // Call real API to get submissions with enhanced data
      const response = await assignmentAPI.getSubmissions(assignment._id, {
        includeHistory: true,
        page: 1,
        limit: 1000, // Get all submissions for this view
      });

      if (response.success) {
        // Format the data to match expected structure
        const formattedSubmissions = response.data.docs.map((submission) => {
          // Skip missing submissions (virtual ones created by backend)
          if (
            submission._id?.toString().startsWith("missing_") ||
            submission.status === "missing"
          ) {
            return {
              _id: submission._id,
              id: submission._id,
              student: {
                _id: submission.student._id,
                id: submission.student._id,
                name: submission.student.fullName || submission.student.name,
                fullName: submission.student.fullName,
                email: submission.student.email,
                image: submission.student.image,
              },
              content: null,
              attachments: [],
              submittedAt: null,
              grade: null,
              feedback: null,
              status: "missing",
              isLate: false,
              gradedAt: null,
              rubricGrades: {},
              gradingHistory: [],
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
              image: submission.student.image,
            },
            content: submission.content || "",
            attachments: submission.attachments || [],
            submittedAt: submission.submittedAt,
            grade: submission.grade,
            feedback: submission.feedback,
            status: submission.status,
            isLate:
              submission.status === "late" ||
              (submission.submittedAt &&
                assignment?.dueDate &&
                moment(submission.submittedAt).isAfter(
                  moment(assignment.dueDate)
                )),
            gradedAt: submission.gradedAt,
            rubricGrades: submission.rubricGrades || {},
            gradingHistory: submission.gradingHistory || [],
            gradingStats: submission.gradingStats || {},
          };
        });

        setSubmissions(formattedSubmissions);
      } else {
        message.error(response.message || "Không thể tải dữ liệu submissions");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      message.error(
        error.response?.data?.message || "Không thể tải dữ liệu submissions"
      );
    } finally {
      setLoading(false);
    }
  }, [assignment?._id]);

  const filterSubmissions = useCallback(() => {
    let filtered = submissions;

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (sub) =>
          sub.student.name.toLowerCase().includes(searchText.toLowerCase()) ||
          sub.student.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchText, statusFilter]);

  // Enhanced download system for multiple files
  const handleSingleFileDownload = useCallback(async (submission, attachmentIndex) => {
    if (!assignment?._id) {
      message.error('Assignment data not available');
      return;
    }

    const fileId = `${submission._id}-${attachmentIndex}`;
    
    if (downloadingFiles.has(fileId)) {
      message.warning('Download already in progress...');
      return;
    }

    setDownloadingFiles(prev => new Set(prev).add(fileId));

    try {
      const attachment = submission.attachments[attachmentIndex];
      await downloadSubmissionAttachment(
        assignment?._id, // Use optional chaining for safety
        submission._id,
        attachmentIndex,
        attachment.name || `submission-file-${attachmentIndex + 1}`,
        token,
        attachment
      );
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  }, [assignment?._id, token, downloadingFiles]);

  const handleDownloadAllFiles = useCallback(async (submission) => {
    if (!submission.attachments || submission.attachments.length === 0) return;

    message.info(`Starting download of ${submission.attachments.length} files...`);
    
    // Download files with delay to avoid overwhelming the browser
    for (let i = 0; i < submission.attachments.length; i++) {
      await new Promise(resolve => setTimeout(resolve, i * 500)); // 500ms delay between downloads
      await handleSingleFileDownload(submission, i);
    }
    
    setFileDownloadModalVisible(false);
  }, [handleSingleFileDownload]);

  const handleDownloadSubmissionFiles = useCallback((submission) => {
    if (!submission.attachments || submission.attachments.length === 0) {
      message.info('No attachments to download');
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
  }, [handleSingleFileDownload]);

  // Effects
  useEffect(() => {
    if (visible && assignment) {
      fetchSubmissions();
    }
  }, [visible, assignment, fetchSubmissions]);

  useEffect(() => {
    filterSubmissions();
  }, [filterSubmissions]);


  // Early return AFTER all hooks are declared
  if (!assignment) {
    return (
      <Modal
        title="Loading Assignment..."
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={400}
        className="text-center"
      >
        <div className="py-8">
          <Spin size="large" />
          <div className="mt-4">
            <Text type="secondary">Loading assignment data...</Text>
          </div>
        </div>
      </Modal>
    );
  }



  const getStatusTag = (status, isLate) => {
    switch (status) {
      case "graded":
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Đã chấm
          </Tag>
        );
      case "submitted":
        return (
          <Tag
            color={isLate ? "warning" : "processing"}
            icon={<ClockCircleOutlined />}
          >
            {isLate ? "Nộp muộn" : "Chờ chấm"}
          </Tag>
        );
      case "missing":
        return (
          <Tag color="error" icon={<ExclamationCircleOutlined />}>
            Chưa nộp
          </Tag>
        );
      case "late":
        return (
          <Tag color="warning" icon={<ClockCircleOutlined />}>
            Nộp muộn
          </Tag>
        );
      default:
        return <Tag color="default">Unknown</Tag>;
    }
  };

  const getGradeColor = (grade, maxGrade) => {
    if (!grade) return "#d9d9d9";
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 90) return "#52c41a";
    if (percentage >= 80) return "#1890ff";
    if (percentage >= 70) return "#faad14";
    return "#ff4d4f";
  };

  const handleViewSubmission = (submission) => {
    // Prevent viewing missing submissions
    if (
      submission._id?.toString().startsWith("missing_") ||
      submission.status === "missing"
    ) {
      message.warning(
        "Không thể xem chi tiết submission này vì học sinh chưa nộp bài"
      );
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
        message.error("Không thể xác định assignment hoặc submission");
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
          gradeReason: gradingData.gradeReason,
        }
      );

      if (response.success) {
        const changeType = gradingData.changeType || "initial";
        const successMessage =
          changeType === "initial"
            ? "Đã lưu điểm thành công!"
            : `Đã cập nhật điểm thành công (${changeType})!`;

        message.success(successMessage);

        // Update submissions list with new grading history
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub._id === submissionId
              ? {
                  ...sub,
                  ...response.data,
                  // Ensure grading history is preserved
                  gradingHistory:
                    response.data.gradingHistory || sub.gradingHistory || [],
                }
              : sub
          )
        );

        // Update selected submission to reflect changes
        setSelectedSubmission((prev) => ({
          ...prev,
          ...response.data,
          gradingHistory:
            response.data.gradingHistory || prev.gradingHistory || [],
        }));

        // Show grading statistics if available
        if (response.data.gradingStats) {
          const stats = response.data.gradingStats;
        }
      } else {
        message.error(response.message || "Lỗi khi lưu điểm");
      }
    } catch (error) {
      console.error("Error saving grade:", error);
      message.error(error.response?.data?.message || "Lỗi khi lưu điểm");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGrade = () => {
    if (selectedRows.length === 0) {
      message.warning("Vui lòng chọn ít nhất một submission");
      return;
    }
    setBulkGradeModalVisible(true);
  };

  const handleExportGrades = () => {
    exportGradesToExcel(
      submissions,
      assignment,
      `Assignment-Grades-${assignment?.title || ''}.xlsx`
    );
  };

  const handleSendReminder = async () => {
    const policy = assignment?.missingSubmissionPolicy || {};
    
    // Check if notifications are enabled
    if (!policy.notifyStudentsOfMissingSubmission) {
      message.warning("Notification feature is disabled for this assignment. Enable in assignment settings to send reminders.");
      return;
    }
    
    const missingStudents = submissions.filter(
      (sub) => sub.status === "missing"
    );
    if (missingStudents.length === 0) {
      message.info("Tất cả học sinh đã nộp bài");
      return;
    }

    Modal.confirm({
      title: "Gửi nhắc nhở",
      content: (
        <div>
          <p>Gửi email nhắc nhở đến {missingStudents.length} học sinh chưa nộp bài?</p>
          {policy.reminderDaysBeforeDue && policy.reminderDaysBeforeDue.length > 0 && (
            <p className="text-sm text-gray-600">
              📅 Reminder schedule: {policy.reminderDaysBeforeDue.sort((a, b) => a - b).join(', ')} days before deadline
            </p>
          )}
        </div>
      ),
      onOk: async () => {
        try {
          const res = await assignmentAPI.sendReminderEmails(
            assignment._id,
            missingStudents.map(s => s.student._id)
          );
          if (res && res.success) {
            message.success(`Đã gửi email nhắc nhở đến ${missingStudents.length} học sinh`);
          } else {
            message.error(res?.message || 'Gửi email nhắc nhở thất bại!');
          }
        } catch (err) {
          message.error('Gửi email nhắc nhở thất bại!');
        }
      },
    });
  };

  // Get missing submissions (students who haven't submitted)
  const getMissingSubmissions = () => {
    return submissions.filter((sub) => sub.status === "missing");
  };

  // Check if assignment is overdue
  const isAssignmentOverdue = () => {
    return moment().isAfter(moment(assignment?.dueDate));
  };

  const getDaysOverdue = () => {
    if (!isAssignmentOverdue()) return 0;
    return moment().diff(moment(assignment?.dueDate), "days");
  };

  // Auto-grade missing submissions with policy checks
  const handleAutoGradeMissing = async () => {
    const policy = assignment?.missingSubmissionPolicy || {};
    const daysOverdue = getDaysOverdue();
    
    if (!isAssignmentOverdue()) {
      message.warning(
        "Assignment is not yet overdue. Auto-grading only available for overdue assignments."
      );
      return;
    }

    // Check if auto-grading is enabled and enough time has passed
    if (policy.autoGradeWhenOverdue && policy.daysAfterDueForAutoGrade !== undefined) {
      const requiredDays = policy.daysAfterDueForAutoGrade || 0;
      
      if (daysOverdue < requiredDays) {
        if (requiredDays === 0) {
          message.warning(
            `Auto-grading is set to trigger immediately after due date. Assignment is ${daysOverdue} days overdue.`
          );
        } else {
          message.warning(
            `Auto-grading is scheduled for ${requiredDays} days after due date. Currently ${daysOverdue} days overdue.`
          );
        }
        return;
      }
    }

    const missingCount = getMissingSubmissions().length;
    if (missingCount === 0) {
      message.info(
        "No missing submissions found. All students have submitted."
      );
      return;
    }

    // Determine grade value based on policy
    const gradeValue = policy.autoGradeWhenOverdue ? (policy.autoGradeValue || 0) : 0;

    Modal.confirm({
      title: "Auto-Grade Missing Submissions",
      content: (
        <div>
          <p>
            This will automatically assign a grade of <strong>{gradeValue}</strong> to{" "}
            <strong>{missingCount}</strong> student(s) who haven't submitted
            their assignment.
          </p>
          <p className="text-orange-600">
            Assignment is <strong>{daysOverdue}</strong> day(s) overdue.
          </p>
          {policy.autoGradeWhenOverdue ? (
            <p className="text-blue-600">
              ✅ Auto-grading policy is enabled for this assignment.
            </p>
          ) : (
            <p className="text-yellow-600">
              ⚠️ Auto-grading policy is disabled. This is a manual override.
            </p>
          )}
          <p>This action cannot be undone. Are you sure?</p>
        </div>
      ),
      okText: `Auto-Grade with ${gradeValue}`,
      okType: "danger",
      cancelText: "Cancel",
      width: "50%",
      onOk: async () => {
        try {
          setAutoGradingLoading(true);
          const response = await assignmentAPI.autoGradeMissingSubmissions(
            assignment?._id
          );

          if (response.success) {
            message.success(response.message);
            fetchSubmissions(); // Refresh data
          } else {
            message.error(
              response.message || "Failed to auto-grade missing submissions"
            );
          }
        } catch (error) {
          console.error("Auto-grading error:", error);
          message.error(
            error.response?.data?.message ||
              "Failed to auto-grade missing submissions"
          );
        } finally {
          setAutoGradingLoading(false);
        }
      },
    });
  };

  // Bulk grade missing submissions (custom grade)
  const handleBulkGradeMissing = (gradingData) => {
    const {
      grade,
      feedback,
      selectedStudents,
      allowResubmit,
      hideGradeFromStudent,
    } = gradingData;

    const missingSubmissions = getMissingSubmissions();
    const targetStudents =
      selectedStudents?.length > 0
        ? selectedStudents
        : missingSubmissions.map((sub) => sub.student._id);

    if (targetStudents.length === 0) {
      message.warning("No students selected for bulk grading.");
      return;
    }

    Modal.confirm({
      title: "Bulk Grade Missing Submissions",
      content: (
        <div>
          <p>
            This will assign a grade of <strong>{grade}</strong> to{" "}
            <strong>{targetStudents.length}</strong> student(s) who haven't
            submitted their assignment.
          </p>
          {isAssignmentOverdue() && (
            <p className="text-orange-600">
              Assignment is <strong>{getDaysOverdue()}</strong> day(s) overdue.
            </p>
          )}
          <p>Feedback: "{feedback}"</p>
          <p>This action cannot be undone. Are you sure?</p>
        </div>
      ),
      okText: `Bulk Grade ${targetStudents.length} Student(s)`,
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setBulkGradingLoading(true);
          const response = await assignmentAPI.bulkGradeMissingSubmissions(
            assignment?._id,
            {
              grade: Number(grade),
              feedback: feedback,
              studentIds: targetStudents,
              allowResubmit: allowResubmit,
              hideGradeFromStudent: hideGradeFromStudent,
            }
          );

          if (response.success) {
            message.success(response.message);
            setBulkGradingModalVisible(false);
            fetchSubmissions(); // Refresh data
          } else {
            message.error(
              response.message || "Failed to bulk grade missing submissions"
            );
          }
        } catch (error) {
          console.error("Bulk grading error:", error);
          message.error(
            error.response?.data?.message ||
              "Failed to bulk grade missing submissions"
          );
        } finally {
          setBulkGradingLoading(false);
        }
      },
    });
  };

  const columns = [
    {
      title: "Học sinh",
      dataIndex: "student",
      key: "student",
      width: 250,
      render: (student) => (
        <div className="flex items-center gap-3">
          <Avatar src={student?.image} icon={<UserOutlined />} size={40} />
          <div>
            <div className="font-medium">{student.name}</div>
            <Text type="secondary" className="text-xs">
              {student.email}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status, record) => getStatusTag(status, record.isLate),
    },
    {
      title: "Nội dung nộp",
      key: "content",
      width: 200,
      render: (_, record) => {
        // Helper function to detect content type
        const detectContentType = (content) => {
          if (!content) return null;

          // Check if content looks like CSV data
          const lines = content.split("\n").filter((line) => line.trim());
          if (lines.length > 1) {
            const firstLine = lines[0];
            const secondLine = lines[1];

            // Check if it has comma separators and consistent column count
            const firstCols = firstLine.split(",").length;
            const secondCols = secondLine.split(",").length;

            if (
              firstCols > 1 &&
              secondCols > 1 &&
              Math.abs(firstCols - secondCols) <= 1
            ) {
              return "csv";
            }
          }

          // Check if content looks like JSON
          try {
            JSON.parse(content);
            return "json";
          } catch (e) {
            // Not JSON, continue
          }

          // Check if content contains code patterns
          const codePatterns = [
            "function",
            "class",
            "import",
            "export",
            "const",
            "let",
            "var",
            "public",
            "private",
            "def ",
            "print(",
            "#include",
          ];

          const lowerContent = content.toLowerCase();
          if (codePatterns.some((pattern) => lowerContent.includes(pattern))) {
            return "code";
          }

          return "text";
        };

        const contentType = record.content
          ? detectContentType(record.content)
          : null;

        return (
          <div>
            {/* File Attachments */}
            {record.attachments && record.attachments.length > 0 && (
              <div className="mb-1">
                <PaperClipOutlined className="mr-1" />
                <Text>
                  {record.attachments.length} file(s)
                  {record.attachments.length === 1 &&
                    record.attachments[0].name && (
                      <span className="text-xs text-gray-500">
                        {" "}
                        (
                        {record.attachments[0].name
                          .split(".")
                          .pop()
                          ?.toUpperCase()}
                        )
                      </span>
                    )}
                  {record.attachments.length > 1 && (
                    <span className="text-xs text-gray-500">
                      {" "}
                      (
                      {record.attachments
                        .map((f) => f.name?.split(".").pop()?.toUpperCase())
                        .filter(Boolean)
                        .join(", ")}
                      )
                    </span>
                  )}
                </Text>
              </div>
            )}

            {/* Text/Code Content */}
            {record.content && (
              <div className="mb-1">
                {contentType === "csv" && (
                  <>
                    <FileTextOutlined
                      className="mr-1"
                      style={{ color: "#52c41a" }}
                    />
                    <Text>CSV data</Text>
                  </>
                )}
                {contentType === "json" && (
                  <>
                    <FileTextOutlined
                      className="mr-1"
                      style={{ color: "#1890ff" }}
                    />
                    <Text>JSON data</Text>
                  </>
                )}
                {contentType === "code" && (
                  <>
                    <FileTextOutlined
                      className="mr-1"
                      style={{ color: "#722ed1" }}
                    />
                    <Text>Code content</Text>
                  </>
                )}
                {contentType === "text" && (
                  <>
                    <FileTextOutlined className="mr-1" />
                    <Text>Text content</Text>
                  </>
                )}
              </div>
            )}

            {/* Empty state */}
            {!record.content &&
              (!record.attachments || record.attachments.length === 0) &&
              record.status !== "missing" && (
                <Text type="secondary">Trống</Text>
              )}
          </div>
        );
      },
    },
    {
      title: "Thời gian nộp",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 150,
      render: (submittedAt, record) => {
        if (!submittedAt) return <Text type="secondary">-</Text>;

        const isLate = moment(submittedAt).isAfter(moment(assignment?.dueDate));
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
      title: "Điểm",
      dataIndex: "grade",
      key: "grade",
      width: 100,
      align: "center",
      render: (grade, record) => {
        if (record.status === "missing") return <Text type="secondary">-</Text>;
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
      title: "Hành động",
      key: "actions",
      width: 150,
      render: (_, record) => {
        const isMissing =
          record._id?.toString().startsWith("missing_") ||
          record.status === "missing";

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
            {!isMissing &&
              (record.status === "submitted" || record.status === "graded") && (
                <Tooltip
                  title={
                    record.status === "graded" ? "Chỉnh sửa điểm" : "Chấm điểm"
                  }
                >
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => handleViewSubmission(record)}
                    className="text-blue-600"
                  />
                </Tooltip>
              )}
            {!isMissing &&
              record.attachments &&
              record.attachments.length > 0 && (
                <Tooltip 
                  title={
                    record.attachments.length === 1 
                      ? `Download: ${record.attachments[0].name}`
                      : `Download ${record.attachments.length} files`
                  }
                >
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    size="small"
                    onClick={() => handleDownloadSubmissionFiles(record)}
                    loading={Array.from({ length: record.attachments.length }, (_, i) => 
                      downloadingFiles.has(`${record._id}-${i}`)
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
            {isMissing && (
              <Tooltip 
                title={
                  assignment?.missingSubmissionPolicy?.notifyStudentsOfMissingSubmission 
                    ? "Gửi nhắc nhở cá nhân" 
                    : "Notification feature is disabled for this assignment"
                }
              >
                <Button
                  type="text"
                  icon={<MailOutlined />}
                  size="small"
                  disabled={!assignment?.missingSubmissionPolicy?.notifyStudentsOfMissingSubmission}
                  onClick={() => {
                    if (assignment?.missingSubmissionPolicy?.notifyStudentsOfMissingSubmission) {
                      message.info(`Gửi nhắc nhở đến ${record.student.name}`);
                      // TODO: Implement send reminder to specific student
                    } else {
                      message.warning("Notification feature is disabled for this assignment");
                    }
                  }}
                  className={
                    assignment?.missingSubmissionPolicy?.notifyStudentsOfMissingSubmission 
                      ? "text-orange-600" 
                      : "text-gray-400"
                  }
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
    submitted: submissions.filter(
      (s) => s.status === "submitted" || s.status === "graded"
    ).length,
    graded: submissions.filter((s) => s.status === "graded").length,
    missing: submissions.filter((s) => s.status === "missing").length,
    late: submissions.filter((s) => s.isLate).length,
    avgGrade: (() => {
      // Filter submissions with valid grades (must be number and not null/undefined)
      const validGrades = submissions.filter(
        (s) =>
          s.grade !== null &&
          s.grade !== undefined &&
          typeof s.grade === "number" &&
          !isNaN(s.grade)
      );

      if (validGrades.length === 0) return 0;

      const sum = validGrades.reduce((total, s) => total + Number(s.grade), 0);
      const average = sum / validGrades.length;

      // Return rounded average, ensuring it's a valid number
      return isNaN(average) ? 0 : Math.round(average * 10) / 10; // Round to 1 decimal place
    })(),
  };

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys) => {
      setSelectedRows(selectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled:
        record._id?.toString().startsWith("missing_") ||
        record.status === "missing",
      name: record.student.name,
    }),
  };

  // Enhanced header actions with policy checks
  const renderHeaderActions = () => {
    const missingCount = getMissingSubmissions().length;
    const isOverdue = isAssignmentOverdue();
    const policy = assignment?.missingSubmissionPolicy || {};

    return (
      <Space size="small" className="mr-5">
        {/* Missing submissions actions */}
        {missingCount > 0 && (
          <>
            {/* Auto-Grade Missing - only if policy allows and assignment is overdue */}
            {isOverdue && policy.autoGradeWhenOverdue && (
              <Button
                type="primary"
                danger
                icon={<ClockCircleOutlined />}
                onClick={handleAutoGradeMissing}
                loading={autoGradingLoading}
                size="middle"
              >
                Auto-Grade Missing ({missingCount}) with {policy.autoGradeValue || 0}
              </Button>
            )}

            {/* Manual Auto-Grade for overdue assignments without policy */}
            {isOverdue && !policy.autoGradeWhenOverdue && (
              <Tooltip title="Auto-grading is disabled for this assignment. Enable in assignment settings to use this feature.">
                <Button
                  type="primary"
                  danger
                  icon={<ClockCircleOutlined />}
                  onClick={handleAutoGradeMissing}
                  loading={autoGradingLoading}
                  size="middle"
                  disabled={false} // Allow manual override
                >
                  Auto-Grade Missing ({missingCount}) with 0
                </Button>
              </Tooltip>
            )}

            {/* Bulk Grade Missing - only if policy allows */}
            {policy.allowBulkGrading && (
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={() => setBulkGradingModalVisible(true)}
                size="small"
              >
                Bulk Grade Missing ({missingCount})
              </Button>
            )}

            {/* Disabled Bulk Grade with tooltip */}
            {!policy.allowBulkGrading && (
              <Tooltip title="Bulk grading is disabled for this assignment. Enable in assignment settings to use this feature.">
                <Button
                  type="default"
                  icon={<EditOutlined />}
                  disabled
                  size="small"
                >
                  Bulk Grade Missing ({missingCount})
                </Button>
              </Tooltip>
            )}
          </>
        )}

        <Button
          icon={<ReloadOutlined />}
          onClick={fetchSubmissions}
          loading={loading}
          size="small"
        >
          Refresh
        </Button>
      </Space>
    );
  };

  if (!assignment) return null;

  return (
    <Modal
      title={
        <div className="flex justify-between items-center">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack} />
            <Title level={4} className="mb-0">
              📊 Quản lý bài nộp: {assignment?.title}
            </Title>
          </Space>
          {renderHeaderActions()}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1400}
      style={{ top: 20 }}
    >
      {/* Missing Submission Policy Status */}
      <Row gutter={[16, 16]} className="mb-4">
        {/* Missing submissions alert */}
        {getMissingSubmissions().length > 0 && (
          <Col span={24}>
            <Alert
              message={`${getMissingSubmissions().length} học sinh chưa nộp bài`}
              description={
                <div>
                  {isAssignmentOverdue() ? (
                    <span className="text-red-600">
                      ⚠️ Assignment đã quá hạn {getDaysOverdue()} ngày. Bạn có thể
                      tự động chấm điểm 0 hoặc chấm điểm tùy chỉnh cho các học sinh
                      chưa nộp.
                    </span>
                  ) : (
                    <span>
                      📝 Một số học sinh chưa nộp bài. Bạn có thể chấm điểm trước
                      cho họ nếu cần.
                    </span>
                  )}
                </div>
              }
              type={isAssignmentOverdue() ? "error" : "warning"}
              showIcon
              className="p-3"
            />
          </Col>
        )}

        {/* Missing Submission Policy Information */}
        <Col span={24}>
          <Card size="small" className="bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SettingOutlined className="text-blue-600" />
                <Text strong className="text-blue-800">Missing Submission Policy</Text>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {/* Auto-Grade Status */}
                <div className="flex items-center gap-1">
                  {assignment?.missingSubmissionPolicy?.autoGradeWhenOverdue ? (
                    <>
                      <CheckCircleOutlined className="text-green-600" />
                      <span className="text-green-700">
                        Auto-Grade: {assignment?.missingSubmissionPolicy?.autoGradeValue || 0} 
                        ({assignment?.missingSubmissionPolicy?.daysAfterDueForAutoGrade || 1} days)
                      </span>
                    </>
                  ) : (
                    <>
                      <ExclamationCircleOutlined className="text-gray-500" />
                      <span className="text-gray-600">Auto-Grade: Disabled</span>
                    </>
                  )}
                </div>

                {/* Bulk Grade Status */}
                <div className="flex items-center gap-1">
                  {assignment?.missingSubmissionPolicy?.allowBulkGrading ? (
                    <>
                      <CheckCircleOutlined className="text-green-600" />
                      <span className="text-green-700">Bulk Grade: Enabled</span>
                    </>
                  ) : (
                    <>
                      <ExclamationCircleOutlined className="text-gray-500" />
                      <span className="text-gray-600">Bulk Grade: Disabled</span>
                    </>
                  )}
                </div>

                {/* Notification Status */}
                <div className="flex items-center gap-1">
                  {assignment?.missingSubmissionPolicy?.notifyStudentsOfMissingSubmission ? (
                    <>
                      <CheckCircleOutlined className="text-green-600" />
                      <span className="text-green-700">
                        Notifications: Enabled
                        {assignment?.missingSubmissionPolicy?.reminderDaysBeforeDue?.length > 0 && (
                          <span className="text-xs ml-1">
                            ({assignment?.missingSubmissionPolicy?.reminderDaysBeforeDue.sort((a, b) => a - b).join(', ')} days)
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <ExclamationCircleOutlined className="text-gray-500" />
                      <span className="text-gray-600">Notifications: Disabled</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "submissions",
            label: (
              <span>
                <FileTextOutlined /> Danh sách submissions
              </span>
            ),
            children: (
              <>
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
                        valueStyle={{ color: "#3f8600" }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic
                        title="Đã chấm"
                        value={stats.graded}
                        prefix={<TrophyOutlined />}
                        valueStyle={{ color: "#1890ff" }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic
                        title="Chưa nộp"
                        value={stats.missing}
                        prefix={<ExclamationCircleOutlined />}
                        valueStyle={{ color: "#cf1322" }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic
                        title="Nộp muộn"
                        value={stats.late}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: "#fa8c16" }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic
                        title="Điểm TB"
                        value={stats.avgGrade}
                        suffix={`/${assignment?.totalPoints || 100}`}
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
                        {/* Send Reminder - check policy */}
                        {assignment?.missingSubmissionPolicy?.notifyStudentsOfMissingSubmission ? (
                          <Button
                            icon={<MailOutlined />}
                            onClick={handleSendReminder}
                            type="primary"
                            ghost
                          >
                            Nhắc nhở ({stats.missing})
                          </Button>
                        ) : (
                          <Tooltip title="Notification feature is disabled for this assignment">
                            <Button
                              icon={<MailOutlined />}
                              disabled
                              type="primary"
                              ghost
                            >
                              Nhắc nhở ({stats.missing})
                            </Button>
                          </Tooltip>
                        )}
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
              </>
            ),
          },
          {
            key: "analytics",
            label: (
              <span>
                <StarOutlined /> Analytics
              </span>
            ),
            disabled: stats.graded < 3,
            children: (
              <div className="analytics-tab">
                {stats.graded >= 3 ? (
                  <AssignmentAnalytics
                    assignmentId={assignment._id}
                    assignment={assignment}
                    submissions={submissions}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <BarChartOutlined 
                        style={{ fontSize: '64px', color: '#d9d9d9' }} 
                      />
                    </div>
                    <Title level={3} type="secondary">
                      Analytics Coming Soon
                    </Title>
                    <Text type="secondary" className="text-lg">
                      Analytics will be available once you have at least 3 graded submissions.
                    </Text>
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Text strong>Current Status:</Text>
                      <div className="mt-2 space-y-1">
                        <div>📝 Total Submissions: {stats.submitted}</div>
                        <div>📊 Graded Submissions: {stats.graded}</div>
                        <div>⏳ Need {Math.max(3 - stats.graded, 0)} more graded submissions</div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Button
                        type="primary"
                        icon={<TrophyOutlined />}
                        onClick={() => setActiveTab("submissions")}
                        size="large"
                      >
                        Start Grading Submissions
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />

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
        allSubmissions={submissions.filter(
          (sub) =>
            sub.status !== "missing" &&
            !sub._id?.toString().startsWith("missing_")
        )}
      />

      {/* Bulk Grade Modal */}
      <Modal
        title="Chấm điểm hàng loạt"
        open={bulkGradeModalVisible}
        onCancel={() => setBulkGradeModalVisible(false)}
        onOk={() => {
          message.success("Đã áp dụng điểm cho các submission đã chọn");
          setBulkGradeModalVisible(false);
          setSelectedRows([]);
        }}
      >
        <div className="py-4">
          <Text>
            Áp dụng điểm và nhận xét cho {selectedRows.length} submissions đã
            chọn
          </Text>
          {/* Bulk grading form would go here */}
        </div>
      </Modal>

      {/* Bulk Grading Modal */}
      <BulkGradingModal
        visible={bulkGradingModalVisible}
        onCancel={() => setBulkGradingModalVisible(false)}
        onSubmit={handleBulkGradeMissing}
        loading={bulkGradingLoading}
        assignment={assignment}
        missingSubmissions={getMissingSubmissions()}
        isOverdue={isAssignmentOverdue()}
        daysOverdue={getDaysOverdue()}
      />

      {/* File Download Selection Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <DownloadOutlined className="text-blue-500" />
            <span>Download Submission Files</span>
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
          <Button key="cancel" onClick={() => setFileDownloadModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="download-all" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadAllFiles(selectedSubmissionForDownload)}
            disabled={!selectedSubmissionForDownload?.attachments?.length}
          >
            Download All ({selectedSubmissionForDownload?.attachments?.length || 0} files)
          </Button>
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
                <Text strong>{selectedSubmissionForDownload.student?.fullName}</Text>
              </div>
              <Text type="secondary">
                Submitted: {selectedSubmissionForDownload.submittedAt ? 
                  moment(selectedSubmissionForDownload.submittedAt).format('DD/MM/YYYY HH:mm') : 
                  'No submission date'
                }
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
                        onClick={() => handleSingleFileDownload(selectedSubmissionForDownload, index)}
                      >
                        {isDownloading ? 'Downloading...' : 'Download'}
                      </Button>
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
                            {attachment.name}
                          </Text>
                          <Tag color="blue" className="text-xs">
                            {attachment.name?.split('.').pop()?.toUpperCase() || 'FILE'}
                          </Tag>
                        </div>
                      }
                      description={
                        <Text type="secondary" className="text-sm">
                          {attachment.fileSize ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'} • File {index + 1} of {selectedSubmissionForDownload.attachments.length}
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
    </Modal>
  );
};

// Bulk Grading Modal Component
const BulkGradingModal = ({
  visible,
  onCancel,
  onSubmit,
  loading,
  assignment,
  missingSubmissions,
  isOverdue,
  daysOverdue,
}) => {
  const [form] = Form.useForm();
  const [selectedStudents, setSelectedStudents] = useState([]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit({
        ...values,
        selectedStudents: selectedStudents,
      });
    });
  };

  const rowSelection = {
    selectedRowKeys: selectedStudents,
    onChange: (selectedRowKeys) => {
      setSelectedStudents(selectedRowKeys);
    },
  };

  const columns = [
    {
      title: "Học sinh",
      dataIndex: "student",
      key: "student",
      render: (student) => (
        <div className="flex items-center gap-2">
          <Avatar src={student.image} icon={<UserOutlined />} size={32} />
          <div>
            <div className="font-medium">
              {student.fullName || student.name}
            </div>
            <div className="text-sm text-gray-500">{student.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: () => (
        <Tag color="volcano" icon={<ExclamationCircleOutlined />}>
          Chưa nộp bài
        </Tag>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div>
          <div className="flex items-center gap-2 mb-2">
            <EditOutlined className="text-blue-600" />
            <span>Bulk Grade Missing Submissions</span>
          </div>
          {isOverdue && (
            <div className="text-sm text-orange-600">
              ⚠️ Assignment quá hạn {daysOverdue} ngày
            </div>
          )}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      okText="Bulk Grade Selected"
      cancelText="Cancel"
    >
      <div className="space-y-4">
        {/* Grading Form */}
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            grade: 0,
            feedback: isOverdue
              ? `No submission received. Assignment was due ${daysOverdue} day(s) ago.`
              : "No submission received.",
            allowResubmit: false,
            hideGradeFromStudent: false,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="grade"
                label={`Điểm (/${assignment?.totalPoints || 100})`}
                rules={[
                  { required: true, message: "Vui lòng nhập điểm!" },
                  {
                    type: "number",
                    min: 0,
                    max: assignment?.totalPoints || 100,
                    message: `Điểm phải từ 0 đến ${
                      assignment?.totalPoints || 100
                    }!`,
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  max={assignment?.totalPoints || 100}
                  style={{ width: "100%" }}
                  placeholder="Nhập điểm"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <div className="mb-2">
                <Text strong>Tùy chọn:</Text>
              </div>
              <Form.Item name="allowResubmit" valuePropName="checked">
                <Checkbox>Cho phép nộp lại</Checkbox>
              </Form.Item>
              <Form.Item name="hideGradeFromStudent" valuePropName="checked">
                <Checkbox>Ẩn điểm khỏi học sinh</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="feedback"
            label="Nhận xét"
            rules={[
              { required: true, message: "Vui lòng nhập nhận xét!" },
              { min: 10, message: "Nhận xét phải có ít nhất 10 ký tự!" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập nhận xét cho các học sinh chưa nộp bài..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>

        {/* Student Selection */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <Text strong>
              Chọn học sinh ({selectedStudents.length}/
              {missingSubmissions.length})
            </Text>
            <Space>
              <Button
                size="small"
                onClick={() =>
                  setSelectedStudents(
                    missingSubmissions.map((sub) => sub.student._id)
                  )
                }
              >
                Chọn tất cả
              </Button>
              <Button size="small" onClick={() => setSelectedStudents([])}>
                Bỏ chọn
              </Button>
            </Space>
          </div>

          <Table
            rowSelection={rowSelection}
            dataSource={missingSubmissions}
            columns={columns}
            pagination={false}
            scroll={{ y: 300 }}
            size="small"
            rowKey={(record) => record.student._id}
          />
        </div>
      </div>
    </Modal>
  );
};

export default memo(SubmissionManagement);
