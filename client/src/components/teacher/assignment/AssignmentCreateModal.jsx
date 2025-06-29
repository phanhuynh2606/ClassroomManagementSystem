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
        latePenalty: values.latePenalty || 0,
        submissionSettings: {
          type: submissionType,
          maxFileSize: values.maxFileSize || 10,
          allowedFileTypes: values.allowedFileTypes || [],
          textSubmissionRequired: values.textSubmissionRequired || false,
          fileSubmissionRequired: values.fileSubmissionRequired || false
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
      width={900}
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
          latePenalty: 10,
          maxFileSize: 10,
          visibility: 'published',
          ...initialValues
        }}
      >
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
            <Col span={12}>
              <Form.Item name="allowLateSubmission" valuePropName="checked">
                <Checkbox 
                  onChange={(e) => setAllowLateSubmission(e.target.checked)}
                >
                  Cho phép nộp muộn
                </Checkbox>
              </Form.Item>
            </Col>
            {allowLateSubmission && (
              <Col span={12}>
                <Form.Item
                  name="latePenalty"
                  label="Phạt điểm nộp muộn (%/ngày)"
                >
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: '100%' }}
                    placeholder="10"
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

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
          <Row gutter={16}>
            <Col span={12}>
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
            </Col>
            <Col span={12}>
              <Form.Item
                name="tags"
                label="Tags (optional)"
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
            </Col>
          </Row>
        </Card>
      </Form>
    </Modal>
  );
};

export default AssignmentCreateModal; 