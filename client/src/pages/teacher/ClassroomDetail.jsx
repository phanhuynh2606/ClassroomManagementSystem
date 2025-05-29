import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Button, 
  Table, 
  Input, 
  Space, 
  Typography, 
  Badge,
  message,
  Tooltip,
  Modal
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined,
  SearchOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import './teacher.css';

const { Title, Text } = Typography;
const { Search } = Input;

const ClassroomDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [searchText, setSearchText] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [classData, setClassData] = useState({
    id: 1,
    name: 'Toán học 10A',
    subject: 'Toán học',
    code: 'MATH10A',
    description: 'Lớp học toán dành cho học sinh lớp 10A',
    status: 'approved',
    createdAt: '2023-09-01'
  });

  const [students, setStudents] = useState([
    {
      id: 'HS001',
      name: 'Nguyễn Văn A',
      averageScore: 8.5,
      submissionCount: 12,
      joinDate: '5/9/2023'
    },
    {
      id: 'HS002',
      name: 'Trần Thị B',
      averageScore: 9,
      submissionCount: 15,
      joinDate: '6/9/2023'
    },
    {
      id: 'HS003',
      name: 'Lê Văn C',
      averageScore: 7.5,
      submissionCount: 10,
      joinDate: '7/9/2023'
    }
  ]);

  const handleCopyClassCode = () => {
    navigator.clipboard.writeText(classData.code);
    message.success('Đã sao chép mã lớp học');
  };

  const handleEditClass = () => {
    navigate(`/teacher/classroom/edit/${classId}`);
  };

  const handleDeleteClass = () => {
    setDeleteModalVisible(true);
  };

  const confirmDeleteClass = async () => {
    setDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      message.success('Xóa lớp học thành công');
      setDeleteModalVisible(false);
      navigate('/teacher/classroom');
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa lớp học');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
  };

  const handleAddStudent = () => {
    // Handle add student logic
    message.info('Chức năng thêm học sinh');
  };

  const studentColumns = [
    {
      title: 'Mã học sinh',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Điểm trung bình',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 140,
      render: (score) => (
        <Badge 
          color={score >= 8 ? 'green' : score >= 6.5 ? 'orange' : 'red'}
          text={score}
        />
      ),
    },
    {
      title: 'Số lần nộp bài',
      dataIndex: 'submissionCount',
      key: 'submissionCount',
      width: 130,
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 130,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" className="text-blue-600">
          Xem chi tiết
        </Button>
      ),
    },
  ];

  const StudentList = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Search
          placeholder="Tìm kiếm học sinh..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={setSearchText}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAddStudent}
          className="bg-blue-600 border-blue-600"
        >
          Thêm học sinh
        </Button>
      </div>
      
      <Table
        columns={studentColumns}
        dataSource={students}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} học sinh`,
        }}
      />
    </div>
  );

  const AssignmentList = () => (
    <div className="text-center py-12">
      <Text type="secondary" className="text-lg">
        Chức năng bài tập đang được phát triển
      </Text>
    </div>
  );

  const tabItems = [
    {
      key: 'students',
      label: 'Danh sách học sinh',
      children: <StudentList />
    },
    {
      key: 'assignments',
      label: 'Bài tập',
      children: <AssignmentList />
    }
  ];

  return (
    <div className="p-6" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Back button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/teacher/classroom')}
        className="mb-4"
      >
        Quay lại
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Title level={2} className="mb-2">
              {classData.name}
            </Title>
            <Text type="secondary" className="text-lg">
              {classData.subject}
            </Text>
          </div>
          <Space>
            <Badge status="success" text="Đã duyệt" />
            <Button 
              icon={<EditOutlined />}
              onClick={handleEditClass}
              className="flex items-center hover:text-white hover:bg-blue-600"
            >
              Chỉnh sửa
            </Button>
            <Button 
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteClass}
              className="flex items-center hover:text-white hover:bg-red-600"
            >
              Xóa lớp
            </Button>
          </Space>
        </div>

        {/* Class Info Card */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Title level={4} className="mb-3">
                Mô tả
              </Title>
              <Text>{classData.description}</Text>
            </div>
            <div>
              <Title level={4} className="mb-3">
                Mã lớp học
              </Title>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-3 py-1 rounded text-lg font-mono">
                  {classData.code}
                </code>
                <Tooltip title="Sao chép mã lớp">
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />}
                    onClick={handleCopyClassCode}
                    className="flex items-center"
                  />
                </Tooltip>
              </div>
              <Text type="secondary" className="text-sm mt-1 block">
                Học sinh có thể dùng mã này để tham gia lớp học
              </Text>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="classroom-detail-tabs"
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined className="text-red-500" />
            <span>Xác nhận xóa lớp học</span>
          </div>
        }
        open={deleteModalVisible}
        onCancel={handleCancelDelete}
        footer={[
          <Button key="cancel" onClick={handleCancelDelete}>
            Hủy
          </Button>,
          <Button 
            key="delete" 
            type="primary" 
            danger 
            loading={deleting}
            onClick={confirmDeleteClass}
            icon={<DeleteOutlined />}
            style={{height: '32px'}}
          >
            Xóa lớp học
          </Button>
        ]}
        width={500}
        centered
      >
        <div className="py-4">
          <Text className="text-base">
            Bạn có chắc chắn muốn xóa lớp học <Text strong>"{classData.name}"</Text> không?
          </Text>
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
            <Text type="danger" className="block font-medium mb-2">
              ⚠️ Cảnh báo:
            </Text>
            <ul className="text-red-600 text-sm space-y-1">
              <li>• Tất cả dữ liệu học sinh trong lớp sẽ bị xóa</li>
              <li>• Các bài tập và điểm số sẽ bị mất vĩnh viễn</li>
              <li>• Hành động này không thể hoàn tác</li>
            </ul>
          </div>
          <div className="mt-4">
            <Text type="secondary">
              Nếu bạn chỉ muốn tạm thời ẩn lớp học, hãy chọn "Chỉnh sửa" và thay đổi trạng thái thay vì xóa.
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClassroomDetail; 