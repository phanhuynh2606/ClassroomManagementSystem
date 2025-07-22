import React, { useState, useEffect, memo } from 'react';
import { 
  Card, 
  Button, 
  List, 
  Typography, 
  Space, 
  Tag, 
  Dropdown, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  Select,
  Upload,
  Divider,
  Empty,
  Avatar,
  message,
  Spin
} from 'antd';
import {
  PlusOutlined,
  BookOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  DownOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PaperClipOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useNavigate, useParams } from 'react-router-dom';
import { assignmentAPI } from '../../../services/api';

// Import the new modal components
import { AssignmentCreateModal, SubmissionManagement } from '../assignment';
import { AssignmentGradingModal } from '../grading';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Utility function to truncate text
const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Utility function to strip HTML tags
const stripHtml = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

// Truncated Text Component với nhiều tùy chọn
const TruncatedText = ({ 
  text, 
  maxLength = 150, 
  lines = 2, 
  method = 'lines', // 'lines' hoặc 'characters'
  className = "text-gray-600",
  stripHtmlTags = false // new option to strip HTML
}) => {
  if (!text) return null;

  // Strip HTML if needed
  const displayText = stripHtmlTags ? stripHtml(text) : text;
  const titleText = stripHtmlTags ? stripHtml(text) : text;

  if (method === 'characters') {
    return (
      <Text 
        className={className}
        title={titleText}
        style={{ fontSize: '12px' ,fontWeight: 'normal' ,marginBottom: '0px' }}
      >
        {truncateText(displayText, maxLength)}
      </Text>
    );
  }

  // Method = 'lines' (default)
  return (
    <Text 
      className={className}
      style={{
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: '1.2em',
        maxHeight: `${lines * 1.2}em`
      }}
      title={titleText}
    >
      {displayText}
    </Text>
  );
};

const ClassworkTab = ({ classId: propClassId }) => {
  const navigate = useNavigate();
  const { classId: paramClassId } = useParams();
  const classId = propClassId || paramClassId;
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createType, setCreateType] = useState('assignment');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  // New modal states
  const [assignmentCreateVisible, setAssignmentCreateVisible] = useState(false);
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionManagementVisible, setSubmissionManagementVisible] = useState(false);

  // Real data states
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalDocs: 0,
    totalPages: 0
  });

  // States for submissions data
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Fetch assignments data
  useEffect(() => {
    if (classId) {
      fetchAssignments();
    }
  }, [classId]);

  const fetchAssignments = async (page = 1) => {
    try {
      setDataLoading(true);
      const response = await assignmentAPI.getClassroomAssignments(classId, {
        page,
        limit: pagination.limit
      });

      if (response.success) {
        setAssignments(response.data.docs || []);
        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          totalDocs: response.data.totalDocs,
          totalPages: response.data.totalPages
        });
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      message.error('Failed to load assignments');
    } finally {
      setDataLoading(false);
    }
  };

  const fetchAssignmentSubmissions = async (assignmentId) => {
    try {
      setSubmissionsLoading(true);
      const response = await assignmentAPI.getSubmissions(assignmentId);
      
      if (response.success) {
        return response.data.docs || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching submissions:', error);
      message.error('Failed to load submissions');
      return [];
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const createMenuItems = [
    {
      key: 'assignment',
      label: 'Bài tập',
      icon: <BookOutlined />,
      onClick: () => {
        setAssignmentCreateVisible(true);
      }
    },
    // {
    //   key: 'material',
    //   label: 'Tài liệu',
    //   icon: <FileTextOutlined />,
    //   onClick: () => {
    //     setCreateType('material');
    //     setCreateModalVisible(true);
    //   }
    // }
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <BookOutlined className="text-blue-500" />;
      case 'quiz':
        return <QuestionCircleOutlined className="text-green-500" />;
      case 'material':
        return <FileTextOutlined className="text-purple-500" />;
      default:
        return <FileTextOutlined className="text-gray-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'assignment':
        return 'blue';
      case 'quiz':
        return 'green';
      case 'material':
        return 'purple';
      default:
        return 'default';
    }
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    const date = moment(dateString);
    const now = moment();
    
    if (date.isBefore(now)) {
      // Đã quá hạn
      const overdueDays = now.diff(date, 'days');
      return (
        <Space size="small">
          <Tag color="red" icon={<ClockCircleOutlined />}>
            {overdueDays === 0 
              ? 'Quá hạn hôm nay' 
              : `Quá hạn ${overdueDays} ngày`
            }
          </Tag>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {date.format('HH:mm DD/MM/YYYY')}
          </Text>
        </Space>
      );
    } else if (date.diff(now, 'days') <= 7) {
      // Sắp đến hạn (trong 7 ngày)
      const daysLeft = date.diff(now, 'days');
      const hoursLeft = date.diff(now, 'hours') % 24;
      
      return (
        <Space size="small">
          <Tag color="orange" icon={<CalendarOutlined />}>
            {daysLeft === 0 
              ? `Hết hạn trong ${hoursLeft}h`
              : `Còn ${daysLeft} ngày`
            }
          </Tag>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {date.format('HH:mm DD/MM/YYYY')}
          </Text>
        </Space>
      );
    } else {
      // Còn nhiều thời gian
      const daysLeft = date.diff(now, 'days');
      return (
        <Space size="small">
          <Tag color="green" icon={<CalendarOutlined />}>
            Còn {daysLeft} ngày
          </Tag>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {date.format('HH:mm DD/MM/YYYY')}
          </Text>
        </Space>
      );
    }
  };

  const handleCreateSubmit = async (values) => {
    setLoading(true);
    try {
      // This is for material creation - should call appropriate API
      if (createType === 'material') {
        // TODO: Implement material creation API
        message.info('Material creation not yet implemented');
      }
      
      setCreateModalVisible(false);
      form.resetFields();
      
      // Refresh the list
      fetchAssignments(pagination.page);
    } catch (error) {
      console.error('Error creating item:', error);
      message.error('Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCreateModalVisible(false);
    form.resetFields();
  };

  // Handler functions for new modals
  const handleAssignmentCreate = async (assignmentData) => {
    try {
      setLoading(true);
      
      const response = await assignmentAPI.create(classId, assignmentData);
      
      if (response.success) {
        message.success('Assignment created successfully!');
        setAssignmentCreateVisible(false);
        // Refresh assignments list
        fetchAssignments(pagination.page);
      } else {
        message.error(response.message || 'Failed to create assignment');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create assignment');
      console.error('Error creating assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (assignment) => {
    try {
      // Fetch real submissions for this assignment
      const submissions = await fetchAssignmentSubmissions(assignment._id);
      
      // Filter out missing submissions for grading
      const realSubmissions = submissions.filter(sub => 
        !sub._id?.toString().startsWith('missing_') && 
        sub.status !== 'missing'
      );
      
      if (realSubmissions.length > 0) {
        // Get the first ungraded submission, or the first submission if all are graded
        const ungradedSubmission = realSubmissions.find(sub => 
          (sub.grade === null || sub.grade === undefined) && 
          sub.status !== 'missing'
        );
        const submissionToGrade = ungradedSubmission || realSubmissions[0];
        
        setSelectedAssignment(assignment);
        setSelectedSubmission(submissionToGrade);
        setAllSubmissions(submissions); // Keep all submissions for navigation, but start with real one
        setGradingModalVisible(true);
      } else {
        message.info('Không có bài nộp nào để chấm điểm. Tất cả học sinh chưa nộp bài.');
      }
    } catch (error) {
      console.error('Error loading submissions for grading:', error);
      message.error('Failed to load submissions');
    }
  };

  const handleViewAllSubmissions = (assignment) => {
    // Open SubmissionManagement modal instead of navigating
    setSelectedAssignment(assignment);
    setSubmissionManagementVisible(true);
  };

  const handleViewAssignmentDetail = (assignment) => {
    navigate(`/teacher/classroom/${classId}/assignment/${assignment._id}`);
  };

  const handleEditAssignment = (assignment) => {
    navigate(`/teacher/classroom/${classId}/assignment/${assignment._id}/edit`);
  };

  const handleDeleteAssignment = async (assignment) => {
    Modal.confirm({
      title: 'Delete Assignment',
      content: `Are you sure you want to delete "${assignment.title}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await assignmentAPI.delete(assignment._id);
          if (response.success) {
            message.success('Assignment deleted successfully');
            fetchAssignments(pagination.page);
          }
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to delete assignment');
        }
      },
    });
  };

  const handleSaveGrade = async (gradingData) => {
    try {
      setLoading(true);
      
      // Get current submission info for API call (selectedSubmission should be set by grading modal)
      const currentSub = selectedSubmission;
      
      // Call the enhanced API to save the grade with history
      const response = await assignmentAPI.gradeSubmission(
        selectedAssignment._id,
        currentSub._id,
        {
          grade: gradingData.grade,
          feedback: gradingData.feedback,
          rubricGrades: gradingData.rubricGrades,
          annotations: gradingData.annotations,
          allowResubmit: gradingData.allowResubmit,
          hideGradeFromStudent: gradingData.hideGradeFromStudent,
          changeType: gradingData.changeType,
          gradeReason: gradingData.gradeReason
        }
      );
      
      if (response.success) {
        // Handle auto penalty application
        const penaltyInfo = response.data.penaltyInfo;
        
        let successMessage = response.message || 'Grade saved successfully!';
        
        // Show additional penalty info if applied
        if (penaltyInfo?.isLate && penaltyInfo.penalty > 0) {
          message.success(successMessage);
          message.info({
            content: `🎯 Auto Late Penalty Applied`,
            description: `Original grade: ${penaltyInfo.originalGrade} → Final grade: ${penaltyInfo.finalGrade} (-${penaltyInfo.penalty}% for ${penaltyInfo.daysLate} days late)`,
            duration: 6
          });
        } else {
          message.success(successMessage);
        }
        
        // Update the submission in allSubmissions with new grading history
        const updatedSubmissions = allSubmissions.map(sub => 
          sub._id === currentSub._id 
            ? { 
                ...sub, 
                ...response.data,
                // Ensure grading history is preserved
                gradingHistory: response.data.gradingHistory || sub.gradingHistory || []
              }
            : sub
        );
        setAllSubmissions(updatedSubmissions);
        
        // Update the selected submission
        const updatedSubmission = updatedSubmissions.find(
          sub => sub._id === currentSub._id
        );
        if (updatedSubmission) {
          setSelectedSubmission(updatedSubmission);
        }
        
        // Refresh assignments list to update statistics
        fetchAssignments(pagination.page);
        
        // Show grading statistics if available
        if (response.data.gradingStats) {
          const stats = response.data.gradingStats;
        }
        
        // Don't close modal, just show success and let user continue grading
      } else {
        message.error(response.message || 'Failed to save grade');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save grade');
      console.error('Error saving grade:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={3} className="mb-0">Danh sách bài tập</Title>
        <Dropdown 
          menu={{ items: createMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            Tạo mới 
          </Button>
        </Dropdown>
      </div>

      {/* Classwork Items */}
      {dataLoading ? (
        <Card>
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        </Card>
      ) : assignments.length === 0 ? (
        <Card>
          <Empty 
            description="Chưa có bài tập nào được tạo"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <List
          dataSource={assignments}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.totalDocs,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} bài tập`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, page, limit: pageSize }));
              fetchAssignments(page);
            }
          }}
          renderItem={(item) => (
            <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
              <div className="flex items-start gap-4 w-full">
                <div className="mt-1">
                  {getTypeIcon(item.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Title level={4} className="mb-1" style={{ fontSize: '14px',marginBottom: '0px', marginTop: '0px' }}>
                        {item.title}
                      </Title>
                      <Title level={5} style={{ fontSize: '14px',marginBottom: '5px', marginTop: '5px' ,fontWeight: 'normal' }} type='secondary'>
                        Ngày tạo:  {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                      </Title>
                      <Space>
                        <Tag color="blue" className="capitalize">
                          Bài tập
                        </Tag>
                        {item.totalPoints && (
                          <Text type="secondary">{item.totalPoints} điểm</Text>
                        )}
                        <Tag color={
                          item.visibility === 'published' ? 'green' : 
                          item.visibility === 'scheduled' ? 'blue' : 
                          'orange'
                        }>
                          {item.visibility === 'scheduled' && item.publishDate && moment(item.publishDate).isAfter(moment()) ? (
                            <>
                              <ClockCircleOutlined className="mr-1" />
                              Đã lên lịch • {moment(item.publishDate).format('DD/MM HH:mm')}
                            </>
                          ) : (
                            item.visibility === 'published' ? 'Đã đăng' : item.visibility === 'draft' ? 'Bản nháp' : item.visibility
                          )}
                        </Tag>
                      </Space>
                    </div>
                    
                    <Space>
                      <Button 
                        type="text" 
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleViewAssignmentDetail(item)}
                        title="Xem chi tiết"
                      />
                      <Button 
                        type="text" 
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEditAssignment(item)}
                        title="Chỉnh sửa bài tập"
                      />
                      <Button 
                        type="text" 
                        icon={<TrophyOutlined />}
                        size="small"
                        onClick={() => handleGradeSubmission(item)}
                        className="text-green-600 hover:text-green-700"
                      >
                        Chấm điểm
                      </Button>
                      <Button 
                        type="text" 
                        icon={<TeamOutlined />}
                        size="small"
                        onClick={() => handleViewAllSubmissions(item)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Bài nộp
                      </Button>
                      <Button 
                        type="text" 
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => handleDeleteAssignment(item)}
                      />
                    </Space>
                  </div>

                  {item.description && (
                    <div className="mb-0" style={{ fontSize: '12px' ,fontWeight: 'normal' ,marginBottom: '0px' }}>
                      <TruncatedText 
                        text={item.description}
                        maxLength={10}
                        lines={1}
                        method="lines"
                        className="text-gray-600"
                        stripHtmlTags={true}
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      {item.dueDate && (
                        <div className="flex items-center">
                          {formatDueDate(item.dueDate)}
                        </div>
                      )}
                      
                      <Text type="secondary">
                        {item.submissionsCount || 0} bài nộp
                      </Text>
                      
                      {item.attachments && item.attachments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <PaperClipOutlined className="text-gray-500" />
                          <Text type="secondary">{item.attachments.length} tệp đính kèm</Text>
                        </div>
                      )}
                    </div>
                    
                    <Text type="secondary" className="text-sm">
                      Tạo {moment(item.createdAt).fromNow()}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          )}
        />
      )}

      {/* Create Modal */}
      <Modal
        title={`Tạo ${createType === 'assignment' ? 'bài tập' : 'tài liệu'}`}
        open={createModalVisible}
        onOk={() => form.submit()}
        onCancel={handleCancel}
        confirmLoading={loading}
        width={600}
        okText="Tạo mới"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubmit}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder={`Nhập tiêu đề ${createType === 'assignment' ? 'bài tập' : 'tài liệu'}`} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea 
              rows={4} 
              placeholder={`Nhập mô tả ${createType === 'assignment' ? 'bài tập' : 'tài liệu'}`} 
            />
          </Form.Item>

          {createType !== 'material' && (
            <>
              <Form.Item
                name="points"
                label="Điểm tối đa"
              >
                <Input 
                  type="number" 
                  placeholder="Nhập điểm tối đa (không bắt buộc)"
                  min={0}
                />
              </Form.Item>

              <Form.Item
                name="dueDate"
                label="Hạn nộp"
              >
                <DatePicker 
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="Chọn hạn nộp (không bắt buộc)"
                  className="w-full"
                />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="attachments"
            label="Tệp đính kèm"
          >
            <Upload.Dragger
              multiple
              beforeUpload={() => false}
              showUploadList={{ showRemoveIcon: true }}
            >
              <p className="ant-upload-drag-icon">
                <PaperClipOutlined />
              </p>
              <p className="ant-upload-text">
                Bấm hoặc kéo thả tệp để tải lên
              </p>
              <p className="ant-upload-hint">
                Hỗ trợ các loại tài liệu, hình ảnh và tệp khác
              </p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>

      {/* Assignment Create Modal */}
      <AssignmentCreateModal
        visible={assignmentCreateVisible}
        onCancel={() => setAssignmentCreateVisible(false)}
        onOk={handleAssignmentCreate}
        loading={loading}
        mode="create"
      />

      {/* Assignment Grading Modal */}
      <AssignmentGradingModal
        visible={gradingModalVisible}
        onCancel={() => setGradingModalVisible(false)}
        onSave={handleSaveGrade}
        loading={loading}
        assignment={selectedAssignment}
        submission={selectedSubmission}
        allSubmissions={allSubmissions}
      />

      {/* Submission Management Modal */}
      <SubmissionManagement
        visible={submissionManagementVisible}
        onCancel={() => {
          setSubmissionManagementVisible(false);
          setSelectedAssignment(null);
        }}
        onBack={() => {
          setSubmissionManagementVisible(false);
          setSelectedAssignment(null);
        }}
        assignment={selectedAssignment}
      />
    </div>
  );
};

export default memo(ClassworkTab); 