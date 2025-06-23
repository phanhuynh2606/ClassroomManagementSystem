import React, { useState } from 'react';
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
  Button
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

  const handleOk = () => {
    form.validateFields().then(values => {
      // Process form data
      const assignmentData = {
        ...values,
        dueDate: values.dueDate?.toISOString(),
        publishDate: values.publishDate?.toISOString(),
        attachments: attachments,
        submissionSettings: {
          type: submissionType,
          allowLateSubmission: allowLateSubmission,
          latePenalty: values.latePenalty || 0,
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
            label="Mô tả & yêu cầu"
            rules={[
              { required: true, message: 'Vui lòng nhập mô tả bài tập' },
              { min: 20, message: 'Mô tả phải có ít nhất 20 ký tự' }
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Nhập mô tả chi tiết, yêu cầu và hướng dẫn làm bài..."
              showCount
              maxLength={2000}
            />
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
                label="Thời gian công bố"
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Ngay lập tức"
                  style={{ width: '100%' }}
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
        <Card title="🌐 Cài đặt xuất bản" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="visibility"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select>
                  <Option value="draft">Bản nháp</Option>
                  <Option value="published">Xuất bản ngay</Option>
                  <Option value="scheduled">Lên lịch xuất bản</Option>
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