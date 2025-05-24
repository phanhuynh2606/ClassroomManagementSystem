import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Button, 
  Badge, 
  Row, 
  Col, 
  Typography, 
} from 'antd';
import { 
  UserOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CreateClassForm from './CreateClassForm';
import './teacher.css';

const { Title, Text } = Typography;

const ClassroomManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list');
  const [classes, setClasses] = useState([
    {
      id: 1,
      name: 'Toán học 10A',
      subject: 'Toán học',
      code: 'MATH10A',
      description: 'Lớp học toán dành cho học sinh lớp 10A',
      studentCount: 3,
      status: 'approved',
      createdAt: '2023-09-01'
    },
    {
      id: 2,
      name: 'Vật lý 11B',
      subject: 'Vật lý',
      code: 'PHYS11B',
      description: 'Lớp học vật lý dành cho học sinh lớp 11B',
      studentCount: 2,
      status: 'approved',
      createdAt: '2023-09-02'
    },
    {
      id: 3,
      name: 'Hóa học 12C',
      subject: 'Hóa học',
      code: 'CHEM12C',
      description: 'Lớp học hóa học dành cho học sinh lớp 12C',
      studentCount: 0,
      status: 'pending',
      createdAt: '2023-09-03'
    }
  ]);

  const getStatusBadge = (status) => {
    if (status === 'approved') {
      return <Badge status="success" text="Đã duyệt"/>;
    } else if (status === 'pending') {
      return <Badge status="processing" text="Chờ duyệt"/>;
    }
    return <Badge status="error" text="Từ chối"/>;
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
          onClick={() => handleViewDetails(classItem.id)}
          className="text-blue-600 border rounded text-white"
          style={{ width: '95%' }}
        >
          Xem chi tiết
        </Button>
      ]}
    >
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <Title level={4} className="mb-0">
            {classItem.name}
          </Title>
          {getStatusBadge(classItem.status)}
        </div>
        <Text type="secondary" className="block mb-3">
          {classItem.subject}
        </Text>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CopyOutlined className="text-gray-400" />
          <Text className="text-sm">
            Mã lớp: <Text strong>{classItem.code}</Text>
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <UserOutlined className="text-gray-400" />
          <Text className="text-sm">
            {classItem.studentCount} học sinh
          </Text>
        </div>
      </div>
    </Card>
  );

  const ClassList = () => (
    <div>
      <Row gutter={[24, 24]}>
        {classes.map((classItem) => (
          <Col xs={24} sm={12} lg={8} key={classItem.id}>
            <ClassCard classItem={classItem} />
          </Col>
        ))}
      </Row>
    </div>
  );

  const tabItems = [
    {
      key: 'list',
      label: 'Danh sách lớp học',
      children: <ClassList />
    },
    {
      key: 'create',
      label: 'Tạo lớp học mới',
      children: <CreateClassForm onSuccess={() => setActiveTab('list')} />
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          Hệ thống quản lý lớp học
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