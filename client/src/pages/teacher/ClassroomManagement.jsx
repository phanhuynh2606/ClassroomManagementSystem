import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Button, 
  Badge, 
  Row, 
  Col, 
  Typography,
  message,
  Spin 
} from 'antd';
import { 
  UserOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CreateClassForm from './CreateClassForm';
import classroomAPI from '../../services/api/classroom.api';
import './teacher.css';

const { Title, Text } = Typography;

const ClassroomManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const response = await classroomAPI.getAllByTeacher();
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setClasses(response.data.data);
      } else if (Array.isArray(response.data)) {
        setClasses(response.data);
      } else if (Array.isArray(response)) {
        setClasses(response);
      } else {
        setClasses([]);
      }
    } catch (error) {
      message.error('Failed to fetch classrooms');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { status: "success", text: "Approved" },
      pending: { status: "processing", text: "Pending Approval" },
      rejected: { status: "error", text: "Rejected" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge status={config.status} text={config.text}/>;
  };

  const handleViewDetails = (classId) => {
    navigate(`/teacher/classroom/${classId}`);
  };

  const ClassCard = ({ classItem }) => (
    <Card
      className="h-full hover:shadow-lg transition-shadow duration-200"
      actions={[
        <Button 
          type="primary" 
          onClick={() => handleViewDetails(classItem._id)}
          className="text-blue-600 border rounded text-white"
          style={{ width: '95%' }}
        >
          View Details
        </Button>
      ]}
    >
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <Title level={4} className="mb-0">
            {classItem.name || 'No Name'}
          </Title>
          {getStatusBadge(classItem.approvalStatus)}
        </div>
        {classItem.description && (
          <Text className="block mb-3 text-sm text-gray-600">
            {classItem.description}
          </Text>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CopyOutlined className="text-gray-400" />
          <Text className="text-sm">
            Class Code: <Text strong>{classItem.code || 'No Code'}</Text>
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <UserOutlined className="text-gray-400" />
          <Text className="text-sm">
            {classItem.students?.length || 0} students
          </Text>
        </div>
        <div className="text-sm text-gray-500">
          Category: {classItem.category || 'N/A'} | Level: {classItem.level || 'N/A'}
        </div>
        {classItem.approvalStatus === 'rejected' && classItem.rejectionReason && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <Text type="danger" className="text-sm">
              Rejection Reason: {classItem.rejectionReason}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );

  const ClassList = () => (
    <Spin spinning={loading}>
      <div>
        <Row gutter={[24, 24]}>
          {classes.map((classItem) => (
            <Col xs={24} sm={12} lg={8} key={classItem._id}>
              <ClassCard classItem={classItem} />
            </Col>
          ))}
          {classes.length === 0 && !loading && (
            <Col span={24}>
              <div className="text-center py-12">
                <Text type="secondary" className="text-lg">
                  No classrooms found. Create your first classroom to get started.
                </Text>
              </div>
            </Col>
          )}
        </Row>
      </div>
    </Spin>
  );

  const tabItems = [
    {
      key: 'list',
      label: 'Classroom List',
      children: <ClassList />
    },
    {
      key: 'create',
      label: 'Create New Classroom',
      children: <CreateClassForm onSuccess={() => {
        setActiveTab('list');
        fetchClassrooms();
      }} />
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          Classroom Management System
        </Title>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="classroom-management-tabs"
      />
    </div>
  );
};

export default ClassroomManagement; 