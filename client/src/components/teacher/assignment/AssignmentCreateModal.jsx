import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Upload,
  Switch,
  InputNumber,
  Typography,
  Space,
  Card,
  Row,
  Col,
  Divider,
  message,
  Radio,
  Checkbox,
  Button,
  Tooltip,
  Alert
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  CalendarOutlined,
  PaperClipOutlined,
  InfoCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import moment from 'moment';
import CustomQuillEditor from '../../CustomQuillEditor';
import 'react-quill/dist/quill.snow.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AssignmentCreateModal = ({ 
  visible, 
  onCancel, 
  onOk, 
  loading = false,
  initialValues = null,
  mode = 'create' // 'create' | 'edit'
}) => {
  const [form] = Form.useForm();
  const [submissionType, setSubmissionType] = useState('both');
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('published');
  
  // Missing submission policy states
  const [autoGradeWhenOverdue, setAutoGradeWhenOverdue] = useState(false);
  const [allowBulkGrading, setAllowBulkGrading] = useState(true);
  const [notifyStudentsOfMissingSubmission, setNotifyStudentsOfMissingSubmission] = useState(true);

  // Handle initialValues for edit mode
  useEffect(() => {
    if (initialValues?.description) {
      setDescription(initialValues.description);
    }
    if (initialValues?.allowLateSubmission !== undefined) {
      setAllowLateSubmission(initialValues.allowLateSubmission);
    }
    if (initialValues?.submissionSettings?.type) {
      setSubmissionType(initialValues.submissionSettings.type);
    }
    if (initialValues?.visibility) {
      setVisibility(initialValues.visibility);
    }
    // Handle missing submission policy
    if (initialValues?.missingSubmissionPolicy) {
      const policy = initialValues.missingSubmissionPolicy;
      setAutoGradeWhenOverdue(policy.autoGradeWhenOverdue || false);
      setAllowBulkGrading(policy.allowBulkGrading !== undefined ? policy.allowBulkGrading : true);
      setNotifyStudentsOfMissingSubmission(policy.notifyStudentsOfMissingSubmission !== undefined ? policy.notifyStudentsOfMissingSubmission : true);
    }
  }, [initialValues]);

  const handleOk = () => {
    form.validateFields().then(values => {
      // Process form data
      let publishDate = null;
      if (values.visibility === 'published') {
        // Xuất bản ngay - set publishDate = hiện tại
        publishDate = new Date().toISOString();
      } else if (values.visibility === 'scheduled' && values.publishDate) {
        // Lên lịch xuất bản - sử dụng publishDate từ form
        publishDate = values.publishDate.toISOString();
      }
      // Bản nháp - publishDate = null

      const assignmentData = {
        ...values,
        description: description, // Use description from state (rich text content)
        dueDate: values.dueDate?.toISOString(),
        publishDate: publishDate,
        attachments: attachments,
        allowLateSubmission: allowLateSubmission,
        maxLateDays: values.maxLateDays || 7,
        latePenalty: values.latePenalty || 0,
        submissionSettings: {
          type: submissionType,
          maxFileSize: values.maxFileSize || 10,
          allowedFileTypes: values.allowedFileTypes || [],
          textSubmissionRequired: values.textSubmissionRequired || false,
          fileSubmissionRequired: values.fileSubmissionRequired || false
        },
        missingSubmissionPolicy: {
          autoGradeWhenOverdue: autoGradeWhenOverdue,
          autoGradeValue: values.autoGradeValue || 0,
          daysAfterDueForAutoGrade: values.daysAfterDueForAutoGrade || 1,
          allowBulkGrading: allowBulkGrading,
          notifyStudentsOfMissingSubmission: notifyStudentsOfMissingSubmission,
          reminderDaysBeforeDue: values.reminderDaysBeforeDue.sort((a, b) => a - b) || [1, 3]
        }
      };
      
      onOk(assignmentData);
    }).catch(error => {
      console.error('Validation failed:', error);
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setAttachments([]);
    setSubmissionType('both');
    setAllowLateSubmission(false);
    setDescription('');
    setVisibility('published');
    // Reset missing submission policy states
    setAutoGradeWhenOverdue(false);
    setAllowBulkGrading(true);
    setNotifyStudentsOfMissingSubmission(true);
    onCancel();
  };

  const handleUploadChange = ({ fileList }) => {
    setAttachments(fileList);
  };

  const beforeUpload = (file) => {
    const isValidSize = file.size / 1024 / 1024 < 50; // 50MB limit
    if (!isValidSize) {
      message.error('File size must be less than 50MB!');
    }
    return false; // Prevent auto upload
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          {mode === 'create' ? 'Tạo bài tập mới' : 'Chỉnh sửa bài tập'}
        </Space>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      centered
      width={`85vw`}
      okText={mode === 'create' ? 'Tạo bài tập' : 'Cập nhật'}
      cancelText="Hủy"
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          totalPoints: 100,
          allowLateSubmission: false,
          maxLateDays: 7, // Default max late days
          latePenalty: 10,
          maxFileSize: 10,
          visibility: 'published',
          // Missing submission policy defaults
          autoGradeWhenOverdue: false,
          autoGradeValue: 0,
          daysAfterDueForAutoGrade: 1,
          allowBulkGrading: true,
          notifyStudentsOfMissingSubmission: true,
          reminderDaysBeforeDue: [3, 1],
          ...initialValues
        }}
      >
        <Row gutter={24}>
          {/* LEFT COLUMN */}
          <Col span={12}>
            {/* Basic Information */}
            <Card title="📝 Thông tin cơ bản" size="small" className="mb-4">
          <Form.Item
            name="title"
            label="Tiêu đề bài tập"
            rules={[
              { required: true, message: 'Vui lòng nhập tiêu đề bài tập' },
              { min: 5, message: 'Tiêu đề phải có ít nhất 5 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tiêu đề bài tập" />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <Space>
                <span>Mô tả & yêu cầu</span>
                <Tooltip title="Sử dụng trình soạn thảo để định dạng nội dung: đánh số, bullet points, in đậm, in nghiêng, chèn link, v.v...">
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: 'Vui lòng nhập mô tả bài tập' },
              { 
                validator: (_, value) => {
                  // Remove HTML tags to check actual text length
                  const textContent = description.replace(/<[^>]*>/g, '').trim();
                  if (textContent.length < 20) {
                    return Promise.reject(new Error('Mô tả phải có ít nhất 20 ký tự'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <CustomQuillEditor
              value={description}
              onChange={(content) => {
                setDescription(content);
                form.setFieldsValue({ description: content });
              }}
              placeholder="Nhập mô tả chi tiết, yêu cầu và hướng dẫn làm bài..."
              style={{ 
                minHeight: '200px',
                backgroundColor: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: '4px'
              }}
              modules={{
                toolbar: {
                  container: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'align': [] }],
                    ['link', 'blockquote', 'code-block'],
                    ['clean']
                  ],
                },
              }}
              formats={[
                'header', 'bold', 'italic', 'underline', 'strike',
                'list', 'bullet', 'check', 'indent', 'link', 'blockquote',
                'code-block', 'color', 'background', 'align'
              ]}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 Tip: Sử dụng các công cụ định dạng để làm nổi bật yêu cầu quan trọng, tạo danh sách công việc, hoặc chèn code mẫu
              </Text>
            </div>
          </Form.Item>

          <Form.Item
            name="instructions"
            label="Hướng dẫn bổ sung"
          >
            <TextArea
              rows={3}
              placeholder="Hướng dẫn cách làm bài, format nộp bài, tiêu chí chấm điểm..."
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </Card>

            {/* Timing & Scoring */}
            <Card title="⏰ Thời gian & Điểm số" size="small" className="mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="totalPoints"
                label="Tổng điểm"
                rules={[
                  { required: true, message: 'Vui lòng nhập tổng điểm' },
                  { type: 'number', min: 1, max: 1000, message: 'Điểm từ 1-1000' }
                ]}
              >
                <InputNumber
                  min={1}
                  max={1000}
                  style={{ width: '100%' }}
                  placeholder="100"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dueDate"
                label="Hạn nộp bài"
                rules={[{ required: true, message: 'Vui lòng chọn hạn nộp bài' }]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Chọn thời gian"
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < moment().endOf('day')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="publishDate"
                label={
                  <Space>
                    <span>Thời gian công bố</span>
                    {visibility === 'scheduled' && (
                      <Tooltip title="Bài tập sẽ tự động xuất hiện trong danh sách bài tập của học viên vào thời điểm này">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    )}
                  </Space>
                }
                rules={[
                  {
                    required: visibility === 'scheduled',
                    message: 'Vui lòng chọn thời gian công bố'
                  },
                  {
                    validator: (_, value) => {
                      if (visibility === 'scheduled' && value && value.isBefore(moment())) {
                        return Promise.reject(new Error('Thời gian công bố phải trong tương lai'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
                extra={visibility === 'scheduled' && 
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Định dạng: DD/MM/YYYY HH:mm (24 giờ)
                  </Text>
                }
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  placeholder={visibility === 'scheduled' ? 'Chọn thời gian' : 'Ngay lập tức'}
                  style={{ width: '100%' }}
                  disabled={visibility !== 'scheduled'}
                  disabledDate={(current) => current && current < moment().startOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        {/* Attachments */}
        <Card title="📎 File đính kèm" size="small" className="mb-4">
              <Form.Item
                name="attachments"
                label="Tài liệu hướng dẫn (optional)"
              >
                <Upload.Dragger
                  multiple
                  beforeUpload={beforeUpload}
                  onChange={handleUploadChange}
                  fileList={attachments}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                >
                  <p className="ant-upload-drag-icon">
                    <PaperClipOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Kéo thả file hoặc click để chọn
                  </p>
                  <p className="ant-upload-hint">
                    Hỗ trợ: PDF, Word, Excel, PowerPoint, ZIP, RAR (tối đa 50MB mỗi file)
                  </p>
                </Upload.Dragger>
              </Form.Item>
            </Card>
    {/* Submission Settings */}
    <Card title="📤 Cài đặt nộp bài" size="small" className="mb-4">
          <Form.Item
            name="submissionType"
            label="Hình thức nộp bài"
            rules={[{ required: true, message: 'Vui lòng chọn hình thức nộp bài' }]}
          >
            <Radio.Group 
              value={submissionType}
              onChange={(e) => setSubmissionType(e.target.value)}
            >
              <Radio value="text">Chỉ nhập text trực tiếp</Radio>
              <Radio value="file">Chỉ upload file</Radio>
              <Radio value="both">Cả text và file</Radio>
            </Radio.Group>
          </Form.Item>

          {(submissionType === 'file' || submissionType === 'both') && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="maxFileSize"
                  label="Kích thước file tối đa (MB)"
                >
                  <InputNumber
                    min={1}
                    max={100}
                    style={{ width: '100%' }}
                    placeholder="10"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="allowedFileTypes"
                  label="Loại file cho phép"
                >
                  <Select
                    mode="multiple"
                    placeholder="Tất cả file types"
                  >
                    <Option value="pdf">PDF</Option>
                    <Option value="doc">Word</Option>
                    <Option value="xls">Excel</Option>
                    <Option value="ppt">PowerPoint</Option>
                    <Option value="txt">Text</Option>
                    <Option value="zip">ZIP/RAR</Option>
                    <Option value="image">Images</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          <Divider />

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="allowLateSubmission" valuePropName="checked">
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
                >
                  Cho phép nộp muộn
                </Checkbox>
              </Form.Item>
            </Col>
          </Row>
          
          {allowLateSubmission && (
            <Alert
              message="⚠️ Conflict Warning với Auto-Grade"
              description="Khi cho phép nộp muộn, bạn cần cài đặt số ngày tối đa để tránh conflict với chính sách auto-grade. Auto-grade chỉ có thể thực hiện sau khi hết thời gian nộp muộn."
              type="warning"
              showIcon
              className="mb-4"
            />
          )}
          
          {allowLateSubmission && (
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="maxLateDays"
                  label="Số ngày tối đa được nộp muộn"
                  rules={[
                    { required: true, message: 'Bắt buộc nhập số ngày!' },
                    { type: 'number', min: 1, max: 30, message: 'Từ 1-30 ngày' }
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={30}
                    style={{ width: '100%' }}
                    placeholder="7"
                    addonAfter="ngày"
                    onChange={(value) => {
                      // Auto-adjust auto-grade days when max late days changes
                      const currentAutoGradeDays = form.getFieldValue('daysAfterDueForAutoGrade');
                      if (value && autoGradeWhenOverdue && currentAutoGradeDays <= value) {
                        const newAutoGradeDays = value + 1;
                        form.setFieldsValue({
                          daysAfterDueForAutoGrade: newAutoGradeDays
                        });
                        message.info(`Auto-grade đã được điều chỉnh thành ${newAutoGradeDays} ngày để tránh conflict`);
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="latePenalty"
                  label="Phạt điểm nộp muộn (%/ngày)"
                >
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: '100%' }}
                    placeholder="10"
                    addonAfter="%"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <div className="text-center p-3 bg-blue-50 rounded border">
                  <Text strong className="block text-blue-700">Grace Period</Text>
                  <Text type="secondary" className="text-xs">
                    Students có {form.getFieldValue('maxLateDays') || 7} ngày buffer
                  </Text>
                </div>
              </Col>
            </Row>
          )}

          {submissionType === 'both' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="textSubmissionRequired" valuePropName="checked">
                  <Checkbox>Bắt buộc nhập text</Checkbox>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="fileSubmissionRequired" valuePropName="checked">
                  <Checkbox>Bắt buộc upload file</Checkbox>
                </Form.Item>
              </Col>
            </Row>
          )}
        </Card>

          </Col>
          
          {/* RIGHT COLUMN */}
          <Col span={12}>
            

        
            {/* Publishing Settings */}
            <Card 
              title={
                <Space>
                  <span>🌐 Cài đặt xuất bản</span>
                  <Tooltip title="Kiểm soát khi nào bài tập hiển thị cho học viên">
                    <InfoCircleOutlined style={{ fontSize: 16, color: '#8c8c8c' }} />
                  </Tooltip>
                </Space>
              }
              size="small"
              className="mb-6 pb-0"
            >
              {visibility === 'scheduled' && (
                <div style={{ marginBottom: 16, padding: '12px', background: '#e6f7ff', borderRadius: 4, border: '1px solid #91d5ff' }}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space>
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      <Text strong style={{ color: '#1890ff' }}>Lên lịch xuất bản</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      • Bài tập sẽ tự động hiển thị cho học viên vào thời gian đã chọn
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      • Học viên không thể xem bài tập trước thời điểm công bố
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      • Bạn có thể chỉnh sửa hoặc hủy lịch trước khi công bố
                    </Text>
                  </Space>
                </div>
              )}
              {visibility === 'draft' && (
                <div style={{ marginBottom: 16, padding: '12px', background: '#f6f6f6', borderRadius: 4, border: '1px solid #d9d9d9' }}>
                  <Space>
                    <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                    <Text type="secondary">
                      Bài tập ở chế độ nháp sẽ không hiển thị cho học viên cho đến khi bạn xuất bản
                    </Text>
                  </Space>
                </div>
              )}
              
              <Form.Item
                name="visibility"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select
                  onChange={(value) => {
                    setVisibility(value);
                    // Clear publishDate nếu không phải scheduled
                    if (value !== 'scheduled') {
                      form.setFieldValue('publishDate', null);
                    }
                  }}
                >
                  <Option value="draft">
                    <Tooltip title="Lưu bài tập nhưng chưa hiển thị cho học viên">
                      <Space>
                        <InfoCircleOutlined />
                        Bản nháp
                      </Space>
                    </Tooltip>
                  </Option>
                  <Option value="published">
                    <Tooltip title="Bài tập sẽ hiển thị ngay lập tức cho học viên">
                      <Space>
                        <CalendarOutlined />
                        Xuất bản ngay
                      </Space>
                    </Tooltip>
                  </Option>
                  <Option value="scheduled">
                    <Tooltip title="Bài tập sẽ tự động hiển thị vào thời gian đã định">
                      <Space>
                        <SettingOutlined />
                        Lên lịch xuất bản
                      </Space>
                    </Tooltip>
                  </Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="tags"
                label="Tags (optional)"
                className="mb-0"
              >
                <Select
                  mode="tags"
                  placeholder="Thêm tags để dễ tìm kiếm"
                >
                  <Option value="homework">Bài tập về nhà</Option>
                  <Option value="project">Dự án</Option>
                  <Option value="lab">Thực hành</Option>
                  <Option value="essay">Luận văn</Option>
                </Select>
              </Form.Item>
            </Card>

            {/* Missing Submission Policy */}
        <Card 
          title={
            <Space>
              <span>⚙️ Chính sách học sinh chưa nộp bài</span>
              <Tooltip title="Cài đặt cách xử lý khi học sinh không nộp bài đúng hạn">
                <InfoCircleOutlined style={{ fontSize: 16, color: '#8c8c8c' }} />
              </Tooltip>
            </Space>
          }
          size="small"
          className="mb-4"
          style={{ 
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #0ea5e9'
          }}
        >
          <Alert
            message="💡 Cài đặt tự động xử lý missing submissions"
            description="Hệ thống sẽ tự động xử lý các trường hợp học sinh chưa nộp bài theo chính sách bạn thiết lập, giúp tiết kiệm thời gian và đảm bảo công bằng."
            type="info"
            showIcon
            className="mb-6 p-3"
            style={{ borderRadius: '8px' }}
          />

          {/* Auto Grade Section */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <Title level={5} className="text-gray-800 mb-3 flex items-center">
              🤖 <span className="ml-2">Tự động chấm điểm</span>
            </Title>
            
            <Form.Item name="autoGradeWhenOverdue" valuePropName="checked" className="mb-4">
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
                      message.success(`Auto-grade được đặt ${minAutoGradeDays} ngày để tránh conflict với late submission`);
                    } else {
                      form.setFieldsValue({ 
                        autoGradeValue: 0, 
                        daysAfterDueForAutoGrade: 1 
                      });
                    }
                  } else {
                    // Clear auto grade values nếu disable
                    form.setFieldsValue({ 
                      autoGradeValue: 0, 
                      daysAfterDueForAutoGrade: 1 
                    });
                  }
                }}
                style={{ fontSize: '15px' }}
              >
                <Space>
                  <span style={{ fontWeight: 500 }}>Tự động chấm điểm khi quá hạn</span>
                  <Tooltip title="Hệ thống sẽ tự động gán điểm cho học sinh chưa nộp sau X ngày quá hạn. Tiết kiệm thời gian và đảm bảo xử lý đồng nhất.">
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </Space>
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
              />
            )}

            {autoGradeWhenOverdue && (
              <div className="pl-6 border-l-4 border-orange-300 bg-orange-50 p-4 rounded-r-lg">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="autoGradeValue"
                      label={
                        <Space>
                          <span>Điểm tự động gán</span>
                          <Tooltip title="Điểm số sẽ được gán cho tất cả học sinh chưa nộp">
                            <InfoCircleOutlined style={{ color: '#1890ff' }} />
                          </Tooltip>
                        </Space>
                      }
                      rules={[
                        { type: 'number', min: 0, message: 'Điểm không được âm' }
                      ]}
                    >
                      <InputNumber
                        min={0}
                        max={100}
                        style={{ width: '100%' }}
                        placeholder="0"
                        addonAfter="điểm"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="daysAfterDueForAutoGrade"
                      label={
                        <Space>
                          <span>Sau bao nhiêu ngày quá hạn</span>
                          <Tooltip title={
                            allowLateSubmission 
                              ? `Phải lớn hơn ${form.getFieldValue('maxLateDays') || 7} ngày (thời gian nộp muộn) để tránh conflict`
                              : "Hệ thống sẽ đợi X ngày sau deadline rồi mới auto-grade"
                          }>
                            <InfoCircleOutlined style={{ color: '#1890ff' }} />
                          </Tooltip>
                        </Space>
                      }
                      rules={[
                        { type: 'number', min: 1, message: 'Ít nhất 1 ngày' },
                        {
                          validator: (_, value) => {
                            if (allowLateSubmission) {
                              const maxLateDays = form.getFieldValue('maxLateDays');
                              if (maxLateDays && value && value <= maxLateDays) {
                                return Promise.reject(
                                  `Phải lớn hơn ${maxLateDays} ngày (thời gian nộp muộn tối đa) để tránh conflict!`
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
                        style={{ width: '100%' }}
                        placeholder={allowLateSubmission ? (form.getFieldValue('maxLateDays') || 7) + 1 : 1}
                        addonAfter="ngày"
                        size="large"
                        onChange={(value) => {
                          if (allowLateSubmission) {
                            const maxLateDays = form.getFieldValue('maxLateDays');
                            if (maxLateDays && value <= maxLateDays) {
                              message.warning(`Auto-grade phải sau ${maxLateDays} ngày để tránh conflict với late submission!`);
                            }
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Alert
                  message="⚠️ Cảnh báo Auto-Grade"
                  description="Chức năng này sẽ tự động gán điểm cho tất cả học sinh chưa nộp. Hãy cân nhắc kỹ trước khi bật."
                  type="warning"
                  showIcon
                  style={{ borderRadius: '8px',padding: '10px' }}
                  className="mt-3"
                />
              </div>
            )}
          </div>

          {/* Bulk Grading Section */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            
            <Form.Item name="allowBulkGrading" valuePropName="checked" className="mb-2">
              <Checkbox 
                onChange={(e) => setAllowBulkGrading(e.target.checked)}
                style={{ fontSize: '15px' }}
              >
                <Space>
                  <span style={{ fontWeight: 500 }}>Cho phép chấm điểm hàng loạt</span>
                  <Tooltip title="Teacher có thể chọn nhiều học sinh chưa nộp và chấm điểm cùng lúc với điểm số và feedback tùy chỉnh">
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </Space>
              </Checkbox>
            </Form.Item>
            
            <Text type="secondary" className="text-sm block">
              💡 Tính năng này cho phép teacher linh hoạt chấm điểm cho nhóm học sinh theo tiêu chí riêng
            </Text>
          </div>

          {/* Notification Section */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <Title level={5} className="text-gray-800 mb-3 flex items-center">
              🔔 <span className="ml-2">Thông báo & Nhắc nhở</span>
            </Title>
            
            <Form.Item name="notifyStudentsOfMissingSubmission" valuePropName="checked" className="mb-4">
              <Checkbox 
                onChange={(e) => {
                  setNotifyStudentsOfMissingSubmission(e.target.checked);
                  // Clear reminder days nếu disable notification
                  if (!e.target.checked) {
                    form.setFieldsValue({ reminderDaysBeforeDue: [] });
                  }
                }}
                style={{ fontSize: '15px' }}
              >
                <Space>
                  <span style={{ fontWeight: 500 }}>Thông báo cho học sinh chưa nộp</span>
                  <Tooltip title="Gửi email/notification nhắc nhở học sinh chưa nộp bài và các deadline sắp tới">
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </Space>
              </Checkbox>
            </Form.Item>

            {notifyStudentsOfMissingSubmission && (
              <div className="pl-6 border-l-4 border-blue-300 bg-blue-50 p-4 rounded-r-lg">
                <Form.Item
                  name="reminderDaysBeforeDue"
                  label={
                    <Space>
                      <span>Nhắc nhở trước deadline</span>
                      <Tooltip title="Hệ thống sẽ tự động gửi email nhắc nhở vào các ngày được chọn trước deadline">
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  }
                >
                  <Select
                    mode="multiple"
                    placeholder="Chọn các ngày nhắc nhở"
                    style={{ width: '100%' }}
                    size="large"
                    allowClear
                  >
                    <Option value={1}>1 ngày trước</Option>
                    <Option value={2}>2 ngày trước</Option>
                    <Option value={3}>3 ngày trước</Option>
                    <Option value={5}>5 ngày trước</Option>
                    <Option value={7}>7 ngày trước</Option>
                  </Select>
                </Form.Item>
                <Text type="secondary" className="text-sm">
                  📧 Email nhắc nhở sẽ được gửi tự động vào các thời điểm đã chọn
                </Text>
              </div>
            )}

            {!notifyStudentsOfMissingSubmission && (
              <Alert
                message="📧 Thông báo bị tắt"
                description="Học sinh sẽ không nhận được email nhắc nhở về deadline bài tập"
                type="info"
                showIcon
                className="mt-3 p-2"
              />
            )}
          </div>

          {/* Summary Section */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <Title level={5} className="text-blue-700 mb-3 flex items-center">
              📋 <span className="ml-2">Tóm tắt chính sách</span>
            </Title>
            <Row gutter={16}>
              <Col span={8}>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl mb-1">
                    {autoGradeWhenOverdue ? '🤖' : '❌'}
                  </div>
                  <Text strong className="block">Auto-Grade</Text>
                  <Text type="secondary" className="text-xs">
                    {autoGradeWhenOverdue ? 'Đã bật' : 'Tắt'}
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl mb-1">
                    {allowBulkGrading ? '📊' : '❌'}
                  </div>
                  <Text strong className="block">Bulk Grade</Text>
                  <Text type="secondary" className="text-xs">
                    {allowBulkGrading ? 'Cho phép' : 'Không cho phép'}
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl mb-1">
                    {notifyStudentsOfMissingSubmission ? '🔔' : '🔕'}
                  </div>
                  <Text strong className="block">Thông báo</Text>
                  <Text type="secondary" className="text-xs">
                    {notifyStudentsOfMissingSubmission ? 'Đã bật' : 'Tắt'}
                  </Text>
                </div>
              </Col>
                         </Row>
           </div>
         </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default AssignmentCreateModal; 