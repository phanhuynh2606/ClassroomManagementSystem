import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Space,
  Breadcrumb,
  Spin,
  Alert,
  message,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  Radio,
  Checkbox,
  Upload,
  Row,
  Col,
  Divider,
  Badge,
  Tag,
  Progress,
  Steps,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UploadOutlined,
  PaperClipOutlined,
  DeleteOutlined,
  FileTextOutlined,
  CalendarOutlined,
  SettingOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  FileOutlined,
  GlobalOutlined,
  RobotOutlined,
  BellOutlined,
  AlertOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { assignmentAPI } from "../../services/api";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const AssignmentEdit = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [assignmentData, setAssignmentData] = useState(null);
  const [submissionType, setSubmissionType] = useState("both");
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Missing submission policy states
  const [autoGradeWhenOverdue, setAutoGradeWhenOverdue] = useState(false);
  const [allowBulkGrading, setAllowBulkGrading] = useState(true);
  const [
    notifyStudentsOfMissingSubmission,
    setNotifyStudentsOfMissingSubmission,
  ] = useState(true);

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
        const assignment = response.data;
        setAssignmentData(assignment);

        // Populate form with existing data
        form.setFieldsValue({
          title: assignment.title,
          description: assignment.description,
          instructions: assignment.instructions,
          totalPoints: assignment.totalPoints,
          dueDate: assignment.dueDate ? dayjs(assignment.dueDate) : null,
          publishDate: assignment.publishDate
            ? dayjs(assignment.publishDate)
            : null,
          visibility: assignment.visibility || "published",
          submissionType: assignment.submissionSettings?.type || "both",
          allowLateSubmission: assignment?.allowLateSubmission || false,
          maxLateDays: assignment?.maxLateDays || 7,
          latePenalty: assignment?.latePenalty || 0,
          maxFileSize: assignment.submissionSettings?.maxFileSize || 10,
          allowedFileTypes:
            assignment.submissionSettings?.allowedFileTypes || [],
          textSubmissionRequired:
            assignment.submissionSettings?.textSubmissionRequired || false,
          fileSubmissionRequired:
            assignment.submissionSettings?.fileSubmissionRequired || false,
          tags: assignment.tags || [],
          // Missing submission policy
          autoGradeWhenOverdue:
            assignment.missingSubmissionPolicy?.autoGradeWhenOverdue || false,
          autoGradeValue:
            assignment.missingSubmissionPolicy?.autoGradeValue || 0,
          daysAfterDueForAutoGrade:
            assignment.missingSubmissionPolicy?.daysAfterDueForAutoGrade || 1,
          allowBulkGrading:
            assignment.missingSubmissionPolicy?.allowBulkGrading !== undefined
              ? assignment.missingSubmissionPolicy.allowBulkGrading
              : true,
          notifyStudentsOfMissingSubmission:
            assignment.missingSubmissionPolicy
              ?.notifyStudentsOfMissingSubmission !== undefined
              ? assignment.missingSubmissionPolicy
                  .notifyStudentsOfMissingSubmission
              : true,
          reminderDaysBeforeDue: assignment.missingSubmissionPolicy
            ?.reminderDaysBeforeDue || [3, 1],
        });

        // Set state variables
        setSubmissionType(assignment.submissionSettings?.type || "both");
        setAllowLateSubmission(assignment?.allowLateSubmission || false);

        // Set missing submission policy states
        setAutoGradeWhenOverdue(
          assignment.missingSubmissionPolicy?.autoGradeWhenOverdue || false
        );
        setAllowBulkGrading(
          assignment.missingSubmissionPolicy?.allowBulkGrading !== undefined
            ? assignment.missingSubmissionPolicy.allowBulkGrading
            : true
        );
        setNotifyStudentsOfMissingSubmission(
          assignment.missingSubmissionPolicy
            ?.notifyStudentsOfMissingSubmission !== undefined
            ? assignment.missingSubmissionPolicy
                .notifyStudentsOfMissingSubmission
            : true
        );

        // Convert existing attachments to upload format
        if (assignment.attachments && assignment.attachments.length > 0) {
          const existingAttachments = assignment.attachments.map(
            (file, index) => ({
              uid: `-${index}`,
              name: file.name,
              status: "done",
              url: file.url,
              response: file,
            })
          );
          setAttachments(existingAttachments);
        }

        // Calculate initial progress
        setTimeout(() => {
          setProgressPercent(calculateProgress());
        }, 100);
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

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log(values);
      setLoading(true);
      console.log("Values", values);
      // Prepare assignment data
      const assignmentData = {
        ...values,
        dueDate: values.dueDate?.toISOString(),
        publishDate: values.publishDate?.toISOString(),
        attachments: attachments.map((file) => {
          // Keep existing attachments or new uploaded files
          if (file.response) {
            return file.response;
          }
          return {
            name: file.name,
            url: file.url,
            type: file.type || "file",
            size: file.size,
          };
        }),
        allowLateSubmission: allowLateSubmission,
        maxLateDays: values.maxLateDays || 7,
        latePenalty: values.latePenalty || 0,
        submissionSettings: {
          type: submissionType,
          maxFileSize: values.maxFileSize || 10,
          allowedFileTypes: values.allowedFileTypes || [],
          textSubmissionRequired: values.textSubmissionRequired || false,
          fileSubmissionRequired: values.fileSubmissionRequired || false,
        },
        missingSubmissionPolicy: {
          autoGradeWhenOverdue: autoGradeWhenOverdue,
          autoGradeValue: values.autoGradeValue || 0,
          daysAfterDueForAutoGrade: values.daysAfterDueForAutoGrade || 0,
          allowBulkGrading: allowBulkGrading,
          notifyStudentsOfMissingSubmission: notifyStudentsOfMissingSubmission,
          reminderDaysBeforeDue: values.reminderDaysBeforeDue?.sort((a, b) => a - b) || [1, 3],
        },
      };

      const response = await assignmentAPI.update(assignmentId, assignmentData);

      if (response.success) {
        message.success("Assignment updated successfully!");
        navigate(`/teacher/classroom/${classId}/assignment/${assignmentId}`);
      } else {
        message.error(response.message || "Failed to update assignment");
      }
    } catch (error) {
      if (error.errorFields) {
        message.error("Please check the form for errors");
      } else {
        message.error(
          error.response?.data?.message || "Failed to update assignment"
        );
        console.error("Error updating assignment:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = ({ fileList }) => {
    setAttachments(fileList);
  };

  const beforeUpload = (file) => {
    const isValidSize = file.size / 1024 / 1024 < 50; // 50MB limit
    if (!isValidSize) {
      message.error("File size must be less than 50MB!");
    }
    return false; // Prevent auto upload
  };

  // Calculate form completion percentage
  const calculateProgress = () => {
    const values = form.getFieldsValue();
    let totalWeight = 0;
    let completedWeight = 0;

    // Required fields with weights
    const fieldChecks = [
      // Essential fields (high weight)
      {
        field: "title",
        weight: 20,
        check: (val) => val && val.trim().length >= 5,
      },
      {
        field: "description",
        weight: 20,
        check: (val) => val && val.trim().length >= 20,
      },
      { field: "totalPoints", weight: 15, check: (val) => val && val > 0 },
      {
        field: "dueDate",
        weight: 15,
        check: (val) => val !== null && val !== undefined,
      },
      {
        field: "visibility",
        weight: 10,
        check: (val) =>
          val && ["draft", "published", "scheduled"].includes(val),
      },

      // Important fields (medium weight)
      {
        field: "submissionType",
        weight: 10,
        check: (val) => val && ["text", "file", "both"].includes(val),
      },
      {
        field: "instructions",
        weight: 5,
        check: (val) => val && val.trim().length > 0,
      },

      // Optional but valuable fields (low weight)
      { field: "publishDate", weight: 2.5, check: (val) => true }, // Always considered complete (optional)
      { field: "tags", weight: 2.5, check: (val) => true }, // Always considered complete (optional)
    ];

    fieldChecks.forEach(({ field, weight, check }) => {
      totalWeight += weight;
      if (check(values[field])) {
        completedWeight += weight;
      }
    });

    return Math.round((completedWeight / totalWeight) * 100);
  };

  // Calculate section completion status
  const getSectionStatus = () => {
    const values = form.getFieldsValue();

    const basicInfoComplete =
      values.title?.trim()?.length >= 5 &&
      values.description?.trim()?.length >= 20;

    const settingsComplete =
      values.totalPoints > 0 && values.dueDate && values.submissionType;

    const filesComplete = true; // Files are optional

    const publishComplete =
      values.visibility &&
      ["draft", "published", "scheduled"].includes(values.visibility);

    return {
      basicInfoComplete,
      settingsComplete,
      filesComplete,
      publishComplete,
    };
  };

  const sectionStatus = getSectionStatus();

  const steps = [
    {
      title: "Thông tin cơ bản",
      icon: sectionStatus.basicInfoComplete ? (
        <CheckCircleOutlined />
      ) : (
        <FileTextOutlined />
      ),
      description: "Tiêu đề, mô tả & hướng dẫn",
      status: sectionStatus.basicInfoComplete ? "finish" : "process",
    },
    {
      title: "Cài đặt",
      icon: sectionStatus.settingsComplete ? (
        <CheckCircleOutlined />
      ) : (
        <SettingOutlined />
      ),
      description: "Điểm số, ngày & loại nộp bài",
      status: sectionStatus.settingsComplete ? "finish" : "process",
    },
    {
      title: "Tệp đính kèm",
      icon: sectionStatus.filesComplete ? (
        <CheckCircleOutlined />
      ) : (
        <CloudUploadOutlined />
      ),
      description: "Tệp đính kèm & cài đặt tệp",
      status: sectionStatus.filesComplete ? "finish" : "process",
    },
    {
      title: "Xuất bản",
      icon: sectionStatus.publishComplete ? (
        <CheckCircleOutlined />
      ) : (
        <GlobalOutlined />
      ),
      description: "Tính năng & thẻ",
      status: sectionStatus.publishComplete ? "finish" : "process",
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
            message="Bài tập không tìm thấy"
            description="Bài tập bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."
            type="error"
            showIcon
            action={
              <Button
                type="primary"
                onClick={() =>
                  navigate(`/teacher/classroom/${classId}#classwork`)
                }
              >
                Quay lại Bài tập
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
                    {assignmentData.classroom?.name || "Lớp học"}
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
                    Bài tập
                  </span>
                ),
              },
              {
                title: (
                  <span
                    onClick={() =>
                      navigate(
                        `/teacher/classroom/${classId}/assignment/${assignmentId}`
                      )
                    }
                    className="cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    {assignmentData.title}
                  </span>
                ),
              },
              {
                title: (
                  <span className="text-blue-600">
                    <EditOutlined className="mr-1" />
                    Chỉnh sửa
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
                  navigate(
                    `/teacher/classroom/${classId}/assignment/${assignmentId}`
                  )
                }
                className="flex items-center hover:shadow-md transition-shadow"
              >
                Quay lại Bài tập
              </Button>

              <div className="hidden md:flex items-center gap-3">
                <Badge
                  count={assignmentData.submissions?.length || 0}
                  showZero
                  color="#52c41a"
                >
                  <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    Bài nộp
                  </div>
                </Badge>
                <Tag
                  color={
                    assignmentData.visibility === "published"
                      ? "green"
                      : "orange"
                  }
                  className="px-3 py-1"
                >
                  {assignmentData.visibility?.charAt(0).toUpperCase() +
                    assignmentData.visibility?.slice(1)}
                </Tag>
              </div>
            </div>

            <Space>
              <Button
                onClick={() =>
                  navigate(
                    `/teacher/classroom/${classId}/assignment/${assignmentId}`
                  )
                }
                className="hover:shadow-md transition-shadow"
              >
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={loading}
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 hover:shadow-lg transition-all duration-300 px-6"
                size="large"
              >
                Lưu thay đổi
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title & Progress */}
        <div className="text-center mb-8">
          <Title
            level={2}
            className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            <EditOutlined className="mr-3" />
            Chỉnh sửa Bài tập
          </Title>
          <Paragraph className="text-gray-600 text-lg mb-6">
            Cập nhật chi tiết, cài đặt và yêu cầu của bài tập
          </Paragraph>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex items-center gap-3">
              <Text type="secondary">Hoàn thành:</Text>
              <Progress
                percent={progressPercent}
                size="small"
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
                className="flex-1"
              />
              <Text strong className="text-blue-600">
                {progressPercent}%
              </Text>
            </div>
          </div>

          {/* Steps Navigation */}
          <div className="max-w-4xl mx-auto mb-8">
            <Steps
              current={currentStep}
              onChange={setCurrentStep}
              items={steps}
              className="hidden md:flex"
            />
          </div>
        </div>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          size="large"
          onValuesChange={() => {
            // Debounced progress update
            setTimeout(() => {
              setProgressPercent(calculateProgress());
            }, 200);
          }}
        >
          <Row gutter={[24, 24]}>
            {/* Left Column - Main Content */}
            <Col xs={24} lg={16}>
              {/* Basic Information */}
              <Card
                title={
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <FileTextOutlined className="text-white text-lg" />
                    </div>
                    <div>
                      <Text strong className="text-lg">
                        Thông tin cơ bản
                      </Text>
                      <div className="text-sm text-gray-500">
                        Chi tiết cơ bản của bài tập
                      </div>
                    </div>
                  </div>
                }
                className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0"
                bodyStyle={{ padding: "24px" }}
              >
                <Form.Item
                  name="title"
                  label={<Text strong>Tiêu đề bài tập</Text>}
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập tiêu đề bài tập",
                    },
                    { min: 5, message: "Tiêu đề phải có ít nhất 5 ký tự" },
                  ]}
                >
                  <Input
                    placeholder="Nhập một tiêu đề rõ ràng, mô tả..."
                    className="rounded-lg"
                    prefix={<EditOutlined className="text-gray-400" />}
                  />
                </Form.Item>

                <Form.Item
                  name="description"
                  label={<Text strong>Mô tả</Text>}
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập mô tả bài tập",
                    },
                    {
                      min: 20,
                      message: "Mô tả phải có ít nhất 20 ký tự",
                    },
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Cung cấp một tổng quan rõ ràng về những gì học sinh cần làm..."
                    showCount
                    maxLength={2000}
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  name="instructions"
                  label={<Text strong>Hướng dẫn chi tiết</Text>}
                  extra="Cung cấp hướng dẫn bước nhảy, tiêu chí đánh giá và yêu cầu nộp bài"
                >
                  <TextArea
                    rows={3}
                    placeholder="Nhập hướng dẫn chi tiết, hướng dẫn và tiêu chí đánh giá..."
                    showCount
                    maxLength={3000}
                    className="rounded-lg"
                  />
                </Form.Item>
              </Card>

              {/* Submission Settings */}
              <Card
                title={
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <SettingOutlined className="text-white text-lg" />
                    </div>
                    <div>
                      <Text strong className="text-lg">
                        Cài đặt nộp bài
                      </Text>
                      <div className="text-sm text-gray-500">
                        Cấu hình cách học sinh nộp bài của mình
                      </div>
                    </div>
                  </div>
                }
                className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0"
              >
                <Form.Item
                  name="submissionType"
                  label={<Text strong>Loại nộp bài</Text>}
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn loại nộp bài",
                    },
                  ]}
                >
                  <Radio.Group
                    value={submissionType}
                    onChange={(e) => setSubmissionType(e.target.value)}
                    className="w-full"
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <Radio.Button
                          value="text"
                          className="w-full text-center h-20 flex items-center justify-center"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <FileTextOutlined className="text-xl block mb-1" />
                            <div>Chỉ nộp văn bản</div>
                          </div>
                        </Radio.Button>
                      </Col>
                      <Col span={8}>
                        <Radio.Button
                          value="file"
                          className="w-full text-center h-20 flex items-center justify-center"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <FileOutlined className="text-xl block mb-1" />
                            <div>Chỉ nộp tệp</div>
                          </div>
                        </Radio.Button>
                      </Col>
                      <Col span={8}>
                        <Radio.Button
                          value="both"
                          className="w-full text-center h-20 flex items-center justify-center"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <CloudUploadOutlined className="text-xl block mb-1" />
                            <div>Cả hai</div>
                          </div>
                        </Radio.Button>
                      </Col>
                    </Row>
                  </Radio.Group>
                </Form.Item>

                {(submissionType === "file" || submissionType === "both") && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="maxFileSize"
                        label={<Text strong>Dung lượng tệp tối đa (MB)</Text>}
                      >
                        <InputNumber
                          min={1}
                          max={100}
                          style={{ width: "100%" }}
                          placeholder="10"
                          className="rounded-lg"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="allowedFileTypes"
                        label={<Text strong>Các loại tệp được phép</Text>}
                      >
                        <Select
                          mode="multiple"
                          placeholder="Tất cả các loại tệp"
                          className="rounded-lg"
                        >
                          <Option value="pdf">📄 PDF</Option>
                          <Option value="doc">📝 Word</Option>
                          <Option value="xls">📊 Excel</Option>
                          <Option value="ppt">📰 PowerPoint</Option>
                          <Option value="txt">📄 Text</Option>
                          <Option value="zip">🗜️ ZIP/RAR</Option>
                          <Option value="image">🖼️ Hình ảnh</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                )}

                <Divider />

                <Row gutter={24} className="flex items-center">
                  <Col span={24} className="flex items-center">
                    <Form.Item
                      name="allowLateSubmission"
                      valuePropName="checked"
                      className="mb-0"
                    >
                      <Checkbox
                        onChange={(e) => {
                          setAllowLateSubmission(e.target.checked);
                          if (!e.target.checked) {
                            // Reset auto-grade settings when disabling late submission
                            setAutoGradeWhenOverdue(false);
                            form.setFieldsValue({
                              autoGradeWhenOverdue: false,
                              maxLateDays: 7,
                              daysAfterDueForAutoGrade: 1
                            });
                          }
                        }}
                        className="text-base"
                      >
                        <ClockCircleOutlined className="mr-1" />
                        Cho phép nộp muộn
                      </Checkbox>
                    </Form.Item>
                  </Col>
                </Row>
                
                {allowLateSubmission && (
                  <Alert
                    message="⚠️ Cảnh báo xung đột với Auto-Grade"
                    description="Khi cho phép nộp muộn, bạn cần cài đặt số ngày tối đa để tránh xung đột với chính sách auto-grade. Auto-grade chỉ có thể thực hiện sau khi hết thời gian nộp muộn."
                    type="warning"
                    showIcon
                    className="mb-4"
                  />
                )}
                
                {allowLateSubmission && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="maxLateDays"
                        label={<Text strong>Số ngày tối đa được nộp muộn</Text>}
                        rules={[
                          { required: true, message: 'Vui lòng cài đặt số ngày tối đa được nộp muộn!' },
                          { type: 'number', min: 1, max: 30, message: 'Phải là 1-30 ngày' }
                        ]}
                      >
                        <InputNumber
                          min={1}
                          max={30}
                          style={{ width: "100%" }}
                          placeholder="7"
                          className="rounded-lg"
                          addonAfter="ngày"
                          onChange={(value) => {
                            // Auto-adjust auto-grade days when max late days changes
                            const currentAutoGradeDays = form.getFieldValue('daysAfterDueForAutoGrade');
                            if (value && autoGradeWhenOverdue && currentAutoGradeDays <= value) {
                              const newAutoGradeDays = value + 1;
                              form.setFieldsValue({
                                daysAfterDueForAutoGrade: newAutoGradeDays
                              });
                              message.info(`Auto-grade được đặt ${newAutoGradeDays} ngày để tránh xung đột`);
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="latePenalty"
                        label={<Text strong>Phạt nộp muộn (%/ngày)</Text>}
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          style={{ width: "100%" }}
                          placeholder="10"
                          className="rounded-lg"
                          addonAfter="%"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                )}

                {submissionType === "both" && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="textSubmissionRequired"
                        valuePropName="checked"
                      >
                        <Checkbox className="text-base">
                          <CheckCircleOutlined className="mr-1" />
                          Yêu cầu nộp văn bản
                        </Checkbox>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="fileSubmissionRequired"
                        valuePropName="checked"
                      >
                        <Checkbox className="text-base">
                          <CheckCircleOutlined className="mr-1" />
                          <span className="text-base">Yêu cầu nộp tệp</span>
                        </Checkbox>
                      </Form.Item>
                    </Col>
                  </Row>
                )}
              </Card>

              {/* Attachments */}
              <Card
                title={
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <PaperClipOutlined className="text-white text-lg" />
                    </div>
                    <div>
                      <Text strong className="text-lg">
                        Tệp đính kèm
                      </Text>
                      <div className="text-sm text-gray-500">
                        Thêm tài liệu tham khảo và tài nguyên
                      </div>
                    </div>
                  </div>
                }
                className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0"
              >
                <Form.Item
                  name="attachments"
                  label={<Text strong>Tải lên tệp (tùy chọn)</Text>}
                  extra="Cung cấp thêm tài nguyên, mẫu hoặc tài liệu tham khảo"
                >
                  <Upload.Dragger
                    multiple
                    beforeUpload={beforeUpload}
                    onChange={handleUploadChange}
                    fileList={attachments}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                    className="rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
                  >
                    <p className="ant-upload-drag-icon">
                      <CloudUploadOutlined className="text-blue-500 text-4xl" />
                    </p>
                    <p className="ant-upload-text text-lg font-medium">
                      Kéo hoặc thả tệp để tải lên
                    </p>
                    <p className="ant-upload-hint text-gray-500">
                      Hỗ trợ: PDF, Word, Excel, PowerPoint, ZIP, RAR (tối đa 50MB
                      mỗi tệp)
                    </p>
                  </Upload.Dragger>
                </Form.Item>
              </Card>
            </Col>

            {/* Right Column - Quick Settings */}
            <Col xs={24} lg={8}>
              {/* Timing & Scoring */}
              <Card
                title={
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <TrophyOutlined className="text-white text-sm" />
                    </div>
                    <Text strong>Thời gian & Điểm số</Text>
                  </div>
                }
                className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0"
                size="small"
              >
                <Form.Item
                  name="totalPoints"
                  label={<Text strong>Tổng điểm</Text>}
                  rules={[
                    { required: true, message: "Vui lòng nhập tổng điểm" },
                    {
                      type: "number",
                      min: 1,
                      max: 1000,
                      message: "Điểm phải là 1-1000",
                    },
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={1000}
                    style={{ width: "100%" }}
                    placeholder="100"
                    className="rounded-lg"
                    prefix={<TrophyOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  name="dueDate"
                  label={<Text strong>Ngày hết hạn</Text>}
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày hết hạn" },
                  ]}
                >
                  <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    placeholder="Chọn ngày hết hạn"
                    style={{ width: "100%" }}
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  name="publishDate"
                  label={<Text strong>Ngày xuất bản</Text>}
                >
                  <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    placeholder="Xuất bản ngay lập tức"
                    style={{ width: "100%" }}
                    className="rounded-lg"
                  />
                </Form.Item>
              </Card>

              {/* Publishing Settings */}
              <Card
                title={
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <GlobalOutlined className="text-white text-sm" />
                    </div>
                    <Text strong>Xuất bản</Text>
                  </div>
                }
                className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0"
                size="small"
              >
                <Form.Item
                  name="visibility"
                  label={<Text strong>Trạng thái</Text>}
                  rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                  <Select className="rounded-lg">
                    <Option value="draft">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        Nháp
                      </div>
                    </Option>
                    <Option value="published">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Xuất bản
                      </div>
                    </Option>
                    <Option value="scheduled">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Lên lịch
                      </div>
                    </Option>
                  </Select>
                </Form.Item>

                <Form.Item name="tags" label={<Text strong>Thẻ</Text>}>
                  <Select
                    mode="tags"
                    placeholder="Thêm thẻ để dễ tìm kiếm"
                    className="rounded-lg"
                  >
                    <Option value="homework">📚 Bài tập</Option>
                    <Option value="project">🚀 Dự án</Option>
                    <Option value="lab">🔬 Thí nghiệm</Option>
                    <Option value="essay">✍️ Bài viết</Option>
                  </Select>
                </Form.Item>
              </Card>

              {/* Missing Submission Policy */}
              <Card
                title={
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                      <RobotOutlined className="text-white text-sm" />
                    </div>
                    <Text strong>Bài nộp bị thiếu</Text>
                  </div>
                }
                className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0"
                size="small"
              >
                <Form.Item
                  name="autoGradeWhenOverdue"
                  valuePropName="checked"
                  className="mb-3"
                >
                  <Checkbox
                    disabled={allowLateSubmission && !form.getFieldValue('maxLateDays')}
                    onChange={(e) => {
                      // Check conflict với late submission
                      if (allowLateSubmission && !form.getFieldValue('maxLateDays')) {
                        message.warning('Bạn cần cài đặt số ngày tối đa nộp muộn trước khi bật auto-grade!');
                        return;
                      }
                      
                      setAutoGradeWhenOverdue(e.target.checked);
                      
                      if (e.target.checked) {
                        // Auto-adjust daysAfterDueForAutoGrade để tránh conflict
                        const maxLateDays = form.getFieldValue('maxLateDays');
                        if (allowLateSubmission && maxLateDays) {
                          const minAutoGradeDays = maxLateDays + 1;
                          form.setFieldsValue({ 
                            autoGradeValue: 0, 
                            daysAfterDueForAutoGrade: minAutoGradeDays 
                          });
                          message.success(`Auto-grade được đặt ${minAutoGradeDays} ngày để tránh xung đột với late submission`);
                        } else {
                          form.setFieldsValue({ 
                            autoGradeValue: 0, 
                            daysAfterDueForAutoGrade: 1 
                          });
                        }
                      } else {
                        form.setFieldsValue({
                          autoGradeValue: 0,
                          daysAfterDueForAutoGrade: 1,
                        });
                      }
                    }}
                    className="text-sm"
                  >
                    <RobotOutlined className="mr-1" />
                    Auto-grade khi hết hạn
                  </Checkbox>
                </Form.Item>
                
                {/* Conflict Warning */}
                {allowLateSubmission && !form.getFieldValue('maxLateDays') && (
                  <Alert
                    message="⚠️ Auto-Grade bị vô hiệu hóa"
                    description="Bạn cần cài đặt 'Số ngày tối đa được nộp muộn' trước khi có thể bật tính năng auto-grade."
                    type="warning"
                    showIcon
                    className="mb-4"
                    style={{ fontSize: "11px", padding: "8px" }}
                  />
                )}

                {autoGradeWhenOverdue && (
                  <div className="pl-4 border-l-2 border-orange-300 bg-orange-50 p-3 rounded-r mb-3">
                    <Row gutter={12}>
                      <Col span={12}>
                        <Form.Item
                          name="autoGradeValue"
                          label={
                            <Text strong className="text-xs">
                              Điểm
                            </Text>
                          }
                          className="mb-2"
                        >
                          <InputNumber
                            min={0}
                            max={100}
                            style={{ width: "100%" }}
                            placeholder="0"
                            size="small"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="daysAfterDueForAutoGrade"
                          label={
                            <Text strong className="text-xs">
                              Ngày
                            </Text>
                          }
                          className="mb-2"
                          rules={[
                            {
                              validator: (_, value) => {
                                if (allowLateSubmission) {
                                  const maxLateDays = form.getFieldValue('maxLateDays');
                                  if (maxLateDays && value && value <= maxLateDays) {
                                    return Promise.reject(
                                      `Phải lớn hơn ${maxLateDays} ngày (số ngày tối đa được nộp muộn)`
                                    );
                                  }
                                }
                                return Promise.resolve();
                              }
                            }
                          ]}
                        >
                          <InputNumber
                            min={allowLateSubmission ? (form.getFieldValue('maxLateDays') || 7) + 1 : 1}
                            max={30}
                            style={{ width: "100%" }}
                            placeholder={allowLateSubmission ? (form.getFieldValue('maxLateDays') || 7) + 1 : 1}
                            size="small"
                            onChange={(value) => {
                              if (allowLateSubmission) {
                                const maxLateDays = form.getFieldValue('maxLateDays');
                                if (maxLateDays && value <= maxLateDays) {
                                  message.warning(`Auto-grade phải sau ${maxLateDays} ngày để tránh xung đột với late submission!`);
                                }
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Alert
                      message="Sẽ auto-grade sau ngày hết hạn"
                      type="warning"
                      showIcon
                      className="mt-2"
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                    />
                  </div>
                )}

                <Form.Item
                  name="allowBulkGrading"
                  valuePropName="checked"
                  className="mb-3"
                >
                  <Checkbox
                    onChange={(e) => setAllowBulkGrading(e.target.checked)}
                    className="text-sm"
                  >
                    <TeamOutlined className="mr-1" />
                    Cho phép đánh giá nhiều học sinh
                  </Checkbox>
                </Form.Item>

                <Form.Item
                  name="notifyStudentsOfMissingSubmission"
                  valuePropName="checked"
                  className="mb-3"
                >
                  <Checkbox
                    onChange={(e) => {
                      setNotifyStudentsOfMissingSubmission(e.target.checked);
                      if (!e.target.checked) {
                        form.setFieldsValue({ reminderDaysBeforeDue: [] });
                      }
                    }}
                    className="text-sm"
                  >
                    <BellOutlined className="mr-1" />
                    Thông báo cho học sinh
                  </Checkbox>
                </Form.Item>

                {notifyStudentsOfMissingSubmission && (
                  <div className="pl-4 border-l-2 border-blue-300 bg-blue-50 p-3 rounded-r">
                    <Form.Item
                      name="reminderDaysBeforeDue"
                      label={
                        <Text strong className="text-xs">
                          Ngày nhắc nhở
                        </Text>
                      }
                      className="mb-0"
                    >
                      <Select
                        mode="multiple"
                        placeholder="Chọn ngày"
                        style={{ width: "100%" }}
                        size="small"
                        allowClear
                      >
                        <Option value={1}>1 ngày</Option>
                        <Option value={2}>2 ngày</Option>
                        <Option value={3}>3 ngày</Option>
                        <Option value={5}>5 ngày</Option>
                        <Option value={7}>7 ngày</Option>
                      </Select>
                    </Form.Item>
                  </div>
                )}
              </Card>

              {/* Quick Stats */}
              <Card
                title={<Text strong>Thống kê nhanh</Text>}
                className="shadow-lg border-0"
                size="small"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Trạng thái hiện tại:</Text>
                    <Tag
                      color={
                        assignmentData.visibility === "published"
                          ? "green"
                          : "orange"
                      }
                    >
                      {assignmentData.visibility?.charAt(0).toUpperCase() +
                        assignmentData.visibility?.slice(1)}
                    </Tag>
                  </div>
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Bài nộp:</Text>
                    <Badge
                      count={assignmentData.submissions?.length || 0}
                      showZero
                      color="#52c41a"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Tạo lúc:</Text>
                    <Text>
                      {dayjs(assignmentData.createdAt).format(
                        "HH:mm DD/MM/YYYY"
                      )}
                    </Text>
                  </div>

                  {/* Editing Restrictions Warning */}
                  {assignmentData.visibility === "published" &&
                    assignmentData.submissions?.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <Alert
                          message="⚠️ Hạn chế chỉnh sửa"
                          description={
                            <div className="text-xs">
                              <div>• Không thể thay đổi loại nộp bài</div>
                              <div>• Không thể rút ngắn ngày hết hạn</div>
                              <div>
                                • Không thể giảm điểm tổng nếu đã đánh giá
                              </div>
                            </div>
                          }
                          type="warning"
                          showIcon
                          style={{ fontSize: "11px", padding: "8px" }}
                        />
                      </div>
                    )}
                </div>
              </Card>
            </Col>
          </Row>
        </Form>

        {/* Bottom Actions */}
        <div className="text-center mt-8 pt-8 border-t border-gray-200">
          <Space size="large">
            <Button
              size="large"
              onClick={() =>
                navigate(
                  `/teacher/classroom/${classId}/assignment/${assignmentId}`
                )
              }
              className="px-8 hover:shadow-md transition-shadow"
            >
              Hủy bỏ thay đổi
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 hover:shadow-lg transition-all duration-300 px-12"
            >
              {loading ? "Đang lưu..." : "Lưu bài tập"}
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default AssignmentEdit;
