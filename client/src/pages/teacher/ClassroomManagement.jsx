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
  Spin,
  Space
} from 'antd';
import { 
  UserOutlined,
  CopyOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CreateClassForm from './CreateClassForm';
import classroomAPI from '../../services/api/classroom.api';
import './style/teacher.css';

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
      
      if (response && response.success && Array.isArray(response.data)) {
        setClasses(response.data);
      } else if (Array.isArray(response.data)) {
        setClasses(response.data);
      } else if (Array.isArray(response)) {
        setClasses(response);
      } else {
        console.error('Unexpected response format:', response);
        setClasses([]);
      }
    } catch (error) {
      message.error('Failed to fetch classrooms');
      console.error('Error fetching classrooms:', error);
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
      active: {
        type: 'success',
        text: 'Đang hoạt động'
      },
      inactive: {
        type: 'default',
        text: 'Không hoạt động'
      },
      pending_delete: {
        type: 'error',
        text: 'Chờ xóa'
      },
      pending_edit: {
        type: 'warning',
        text: 'Chờ chỉnh sửa'
      },
      pending_creation: {
        type: 'warning',
        text: 'Chờ tạo mới'
      },
      deleted: {
        type: 'default',
        text: 'Đã xóa'
      }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge status={config.type} text={config.text} />;
  };

  const getCardStyle = (status) => {
    const styleConfig = {
      active: {
        background: '#f6ffed',
        borderColor: '#b7eb8f'
      },
      inactive: {
        background: '#f5f5f5',
        borderColor: '#d9d9d9'
      },
      pending_delete: {
        background: '#fff2f0',
        borderColor: '#ffccc7'
      },
      pending_edit: {
        background: '#fff7e6',
        borderColor: '#ffd591'
      },
      pending_creation: {
        background: '#e6f7ff',
        borderColor: '#91d5ff',
      },
      deleted: {
        background: '#f5f5f5',
        borderColor: '#d9d9d9',
        opacity: 0.7
      }
    };
    
    return styleConfig[status] || styleConfig.inactive;
  };

  const handleViewDetails = (classId) => {
    navigate(`/teacher/classroom/${classId}`);
  };

  const ClassCard = ({ classItem, onEdit, onDelete, onView }) => {
    const cardStyle = getCardStyle(classItem.status);
    const canEdit = classItem.status === 'active';

    return (
      <Card
        hoverable
        style={{
          ...cardStyle,
          marginBottom: 16,
          transition: 'all 0.3s'
        }}
        actions={[
          <Button 
            type="link" 
            onClick={() => onView(classItem._id)}
            icon={<EyeOutlined />}
          >
            Xem chi tiết
          </Button>,
        ].filter(Boolean)}
      >
        <Card.Meta
          title={
            <Space>
              {classItem.name}
              {getStatusBadge(classItem.status)}
            </Space>
          }
          description={
            <Space direction="vertical" size="small">
              <Text>Mã lớp: {classItem.code}</Text>
              <Text>Học sinh: {classItem.students?.length || 0}/{classItem.maxStudents}</Text>
            </Space>
          }
        />
      </Card>
    );
  };

  const ClassList = () => (
    <Spin spinning={loading} tip="Đang tải danh sách lớp...">
      <div>
        <Row gutter={[24, 24]}>
          {classes.map((classItem) => (
            <Col xs={24} sm={12} lg={8} key={classItem._id}>
              <ClassCard classItem={classItem} onView={handleViewDetails} />
            </Col>
          ))}
          {classes.length === 0 && !loading && (
            <Col span={24}>
              <div className="text-center py-12">
                <Text type="secondary" className="text-lg">
                  Không có lớp nào. Hãy tạo lớp học đầu tiên để bắt đầu.
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
      label: 'Danh sách lớp học',
      children: <ClassList />
    },
    {
      key: 'create',
      label: 'Tạo lớp học mới',
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
          Quản lý lớp học
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