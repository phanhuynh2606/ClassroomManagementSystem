import React, { useState, memo } from 'react';
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
  message
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
import { useNavigate } from 'react-router-dom';

// Import the new modal components
import { AssignmentCreateModal, SubmissionManagement } from '../assignment';
import { AssignmentGradingModal } from '../grading';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ClassworkTab = () => {
  const navigate = useNavigate();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createType, setCreateType] = useState('assignment');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // New modal states
  const [assignmentCreateVisible, setAssignmentCreateVisible] = useState(false);
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionManagementVisible, setSubmissionManagementVisible] = useState(false);

  // Mock data for classwork items
  const [classworkItems, setClassworkItems] = useState([
    {
      id: '1',
      type: 'assignment',
      title: 'Programming Assignment 1',
      description: 'Complete the basic programming exercises',
      instructions: 'Please complete all exercises in the attached document. Make sure to follow the coding standards discussed in class.',
      dueDate: '2024-01-25T23:59:00Z',
      totalPoints: 100,
      status: 'published',
      submissionsCount: 15,
      totalStudents: 25,
      attachments: [
        { name: 'assignment_template.pdf', size: '245 KB', url: '/files/assignment_template.pdf' }
      ],
      createdAt: '2024-01-15T10:00:00Z',
      allowLateSubmission: true,
      latePenalty: 10
    },
    {
      id: '2',
      type: 'material',
      title: 'Course Syllabus',
      description: 'Complete course syllabus and schedule',
      dueDate: null,
      points: null,
      status: 'published',
      submissionsCount: null,
      totalStudents: 25,
      attachments: [
        { name: 'syllabus.pdf', size: '1.2 MB', url: '/files/syllabus.pdf' }
      ],
      createdAt: '2024-01-05T09:00:00Z'
    }
  ]);

  // Mock student submissions for grading
  const [mockSubmissions] = useState([
    {
      id: 'sub1',
      assignmentId: '1',
      student: {
        id: 'st1',
        name: 'Alice Johnson',
        email: 'alice@student.edu',
        avatar: null
      },
      content: 'I have completed all the exercises as requested. Here is my solution:\n\n1. Function to calculate sum: \n```javascript\nfunction sum(a, b) {\n  return a + b;\n}\n```\n\n2. Array manipulation exercise:\n```javascript\nconst numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2);\nconsole.log(doubled);\n```\n\nI found the exercises challenging but educational. Please let me know if you need any clarification.',
      attachments: [
        { name: 'assignment1_solution.js', size: '2.1 KB', url: '/files/assignment1_solution.js' },
        { name: 'readme.txt', size: '512 B', url: '/files/readme.txt' }
      ],
      submittedAt: '2024-01-24T18:30:00Z',
      grade: null,
      feedback: null,
      status: 'submitted'
    },
    {
      id: 'sub2',
      assignmentId: '1',
      student: {
        id: 'st2',
        name: 'Bob Smith',
        email: 'bob@student.edu',
        avatar: null
      },
      content: 'My assignment submission:\n\nI struggled with some parts but here\'s what I managed to complete:\n\nExercise 1: Basic functions\nExercise 2: Array operations\n\nI couldn\'t finish exercise 3 due to time constraints. Hope to get partial credit.',
      attachments: [
        { name: 'partial_solution.js', size: '1.8 KB', url: '/files/partial_solution.js' }
      ],
      submittedAt: '2024-01-26T10:15:00Z', // Late submission
      grade: 75,
      feedback: 'Good effort on the completed exercises. You showed understanding of basic concepts. For next time, try to start earlier to avoid rushing. The late submission penalty has been applied.',
      status: 'graded'
    }
  ]);

  const createMenuItems = [
    {
      key: 'assignment',
      label: 'Assignment',
      icon: <BookOutlined />,
      onClick: () => {
        setAssignmentCreateVisible(true);
      }
    },
    {
      key: 'material',
      label: 'Material',
      icon: <FileTextOutlined />,
      onClick: () => {
        setCreateType('material');
        setCreateModalVisible(true);
      }
    }
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
      return <Text type="danger">Due {date.format('MMM D, YYYY')}</Text>;
    } else if (date.diff(now, 'days') <= 7) {
      return <Text type="warning">Due {date.format('MMM D, YYYY')}</Text>;
    } else {
      return <Text>Due {date.format('MMM D, YYYY')}</Text>;
    }
  };

  const handleCreateSubmit = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newItem = {
        id: Date.now().toString(),
        type: createType,
        title: values.title,
        description: values.description,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        points: values.points || null,
        status: 'published',
        submissionsCount: 0,
        totalStudents: 25,
        attachments: values.attachments || [],
        createdAt: new Date().toISOString()
      };

      setClassworkItems(prev => [newItem, ...prev]);
      setCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error creating item:', error);
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
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAssignment = {
        id: Date.now().toString(),
        type: 'assignment',
        title: assignmentData.title,
        description: assignmentData.description,
        instructions: assignmentData.instructions,
        dueDate: assignmentData.dueDate,
        totalPoints: assignmentData.totalPoints,
        status: assignmentData.visibility,
        submissionsCount: 0,
        totalStudents: 25,
        attachments: assignmentData.attachments || [],
        createdAt: new Date().toISOString(),
        allowLateSubmission: assignmentData.submissionSettings?.allowLateSubmission || false,
        latePenalty: assignmentData.submissionSettings?.latePenalty || 0
      };

      setClassworkItems(prev => [newAssignment, ...prev]);
      setAssignmentCreateVisible(false);
      message.success('Assignment created successfully!');
    } catch (error) {
      message.error('Failed to create assignment');
      console.error('Error creating assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (assignment) => {
    // Find a submission for this assignment
    const submission = mockSubmissions.find(sub => sub.assignmentId === assignment.id);
    if (submission) {
      setSelectedAssignment(assignment);
      setSelectedSubmission(submission);
      setGradingModalVisible(true);
    } else {
      message.info('No submissions found for this assignment');
    }
  };

  const handleViewAllSubmissions = (assignment) => {
    // Navigate to assignment detail page
    navigate(`/teacher/classroom/1/assignment/${assignment.id}`);
  };

  const handleViewAssignmentDetail = (assignment) => {
    navigate(`/teacher/classroom/1/assignment/${assignment.id}`);
  };

  const handleSaveGrade = async (gradingData) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Grade saved successfully!');
      setGradingModalVisible(false);
      setSelectedAssignment(null);
      setSelectedSubmission(null);
    } catch (error) {
      message.error('Failed to save grade');
      console.error('Error saving grade:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={3} className="mb-0">Classwork</Title>
        <Dropdown 
          menu={{ items: createMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            Create <DownOutlined />
          </Button>
        </Dropdown>
      </div>

      {/* Classwork Items */}
      {classworkItems.length === 0 ? (
        <Card>
          <Empty 
            description="No classwork created yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <List
          dataSource={classworkItems}
          renderItem={(item) => (
            <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getTypeIcon(item.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Title level={4} className="mb-1">
                        {item.title}
                      </Title>
                      <Space>
                        <Tag color={getTypeColor(item.type)} className="capitalize">
                          {item.type}
                        </Tag>
                        {item.totalPoints && (
                          <Text type="secondary">{item.totalPoints} points</Text>
                        )}
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
                      />
                      {item.type === 'assignment' && (
                        <>
                          <Button 
                            type="text" 
                            icon={<TrophyOutlined />}
                            size="small"
                            onClick={() => handleGradeSubmission(item)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Grade
                          </Button>
                          <Button 
                            type="text" 
                            icon={<TeamOutlined />}
                            size="small"
                            onClick={() => handleViewAllSubmissions(item)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Submissions
                          </Button>
                        </>
                      )}
                      <Button 
                        type="text" 
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                      />
                    </Space>
                  </div>

                  {item.description && (
                    <Text className="text-gray-600 block mb-3">
                      {item.description}
                    </Text>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      {item.dueDate && (
                        <div className="flex items-center gap-1">
                          <CalendarOutlined className="text-gray-500" />
                          {formatDueDate(item.dueDate)}
                        </div>
                      )}
                      
                      {item.submissionsCount !== null && (
                        <Text type="secondary">
                          {item.submissionsCount}/{item.totalStudents} submitted
                        </Text>
                      )}
                      
                      {item.attachments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <PaperClipOutlined className="text-gray-500" />
                          <Text type="secondary">{item.attachments.length} attachment(s)</Text>
                        </div>
                      )}
                    </div>
                    
                    <Text type="secondary" className="text-sm">
                      Posted {moment(item.createdAt).fromNow()}
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
        title={`Create ${createType.charAt(0).toUpperCase() + createType.slice(1)}`}
        open={createModalVisible}
        onOk={() => form.submit()}
        onCancel={handleCancel}
        confirmLoading={loading}
        width={600}
        okText="Create"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubmit}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder={`Enter ${createType} title`} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea 
              rows={4} 
              placeholder={`Enter ${createType} description`} 
            />
          </Form.Item>

          {createType !== 'material' && (
            <>
              <Form.Item
                name="points"
                label="Points"
              >
                <Input 
                  type="number" 
                  placeholder="Enter points (optional)"
                  min={0}
                />
              </Form.Item>

              <Form.Item
                name="dueDate"
                label="Due date"
              >
                <DatePicker 
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="Select due date (optional)"
                  className="w-full"
                />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="attachments"
            label="Attachments"
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
                Click or drag files to upload
              </p>
              <p className="ant-upload-hint">
                Support for documents, images, and other files
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
      />

      {/* Submission Management Modal */}
      <SubmissionManagement
        visible={submissionManagementVisible}
        onCancel={() => setSubmissionManagementVisible(false)}
        onBack={() => setSubmissionManagementVisible(false)}
        assignment={selectedAssignment}
      />
    </div>
  );
};

export default memo(ClassworkTab); 