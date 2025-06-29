import React, { useState, memo } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Space, 
  Typography, 
  Avatar, 
  Tag, 
  Dropdown, 
  Modal, 
  message, 
  Tooltip,
  Tabs,
  List,
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  MoreOutlined, 
  UserAddOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  UserOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  UserDeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

const PeopleTab = ({ studentsData, teachersData, studentsLoading, searchText, setSearchText, classData, handleCopyClassCode }) => {
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('students');
  console.log("teachersData", teachersData);

  const handleRemoveStudent = (student) => {
    setSelectedStudent(student);
    setRemoveModalVisible(true);
  };

  const confirmRemoveStudent = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success(`Removed ${selectedStudent.name} from the class`);
      setRemoveModalVisible(false);
      setSelectedStudent(null);
    } catch (error) {
      message.error('Failed to remove student');
    }
  };

  const handleEmailStudent = (student) => {
    const email = student?.email || student?.student?.email;
    if (email) {
      window.open(`mailto:${email}`, '_blank');
    } else {
      message.warning('No email address found for this student');
    }
  };

  const studentActions = (student) => [
    {
      key: 'email',
      label: 'Send email',
      icon: <MailOutlined />,
      onClick: () => handleEmailStudent(student)
    },
    {
      key: 'remove',
      label: 'Remove from class',
      icon: <UserDeleteOutlined />,
      danger: true,
      onClick: () => handleRemoveStudent(student)
    }
  ];

  const studentColumns = [
    {
      title: 'Student',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        // Handle different data structures
        const name = record?.name || record?.student?.fullName || record?.fullName || 'Unknown';
        const email = record?.email || record?.student?.email || '';
        const image = record?.image || record?.student?.image;
        
        return (
          <div className="flex items-center gap-3">
            <Avatar 
              src={image} 
              icon={!image && <UserOutlined />}
              size={40}
            />
            <div>
              <div className="font-medium">{name}</div>
              <Text type="secondary" className="text-sm">{email}</Text>
            </div>
          </div>
        );
      },
      sorter: (a, b) => {
        const nameA = a?.name || a?.student?.fullName || a?.fullName || '';
        const nameB = b?.name || b?.student?.fullName || b?.fullName || '';
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        // Default to 'active' if no status is provided
        const studentStatus = status || record?.student?.status || 'active';
        const config = {
          active: { color: 'green', text: 'Active' },
          pending: { color: 'orange', text: 'Invitation Pending' },
          inactive: { color: 'red', text: 'Inactive' }
        };
        const { color, text } = config[studentStatus] || config.active;
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Pending', value: 'pending' },
        { text: 'Inactive', value: 'inactive' }
      ],
      onFilter: (value, record) => {
        const studentStatus = record?.status || record?.student?.status || 'active';
        return studentStatus === value;
      },
    },
    {
      title: 'Joined',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (date, record) => {
        const joinDate = date || record?.student?.createdAt || record?.createdAt;
        return joinDate ? dayjs(joinDate).format('HH:mm DD/MM/YYYY') : 'Unknown';
      },
      sorter: (a, b) => {
        const dateA = a?.joinedAt || a?.student?.createdAt || a?.createdAt || '1970-01-01';
        const dateB = b?.joinedAt || b?.student?.createdAt || b?.createdAt || '1970-01-01';
        return new Date(dateA) - new Date(dateB);
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Dropdown
          menu={{ items: studentActions(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button 
            type="text" 
            icon={<MoreOutlined />}
            size="small"
          />
        </Dropdown>
      ),
    },
  ];

  const filteredStudents = studentsData.filter(student => {
    // Handle different data structures safely
    const name = student?.name || student?.student?.fullName || student?.fullName || '';
    const email = student?.email || student?.student?.email || '';
    
    return name.toLowerCase().includes(searchText.toLowerCase()) ||
           email.toLowerCase().includes(searchText.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={3} className="mb-0">People</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<UserAddOutlined />}
            onClick={() => message.info('Invite students feature coming soon')}
          >
            Invite students
          </Button>
          <Button 
            icon={<CopyOutlined />}
            onClick={handleCopyClassCode}
          >
            Class code: {classData?.code}
          </Button>
        </Space>
      </div>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <TeamOutlined />
              Students ({filteredStudents.length})
            </span>
          } 
          key="students"
        >
          <Card>
            <div className="mb-4">
              <Search
                placeholder="Search students by name or email"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
              />
            </div>

            <Table
              columns={studentColumns}
              dataSource={filteredStudents}
              rowKey={(record) => record?.id || record?.student?._id || record?._id || Math.random()}
              loading={studentsLoading}
              pagination={{
                total: filteredStudents.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} students`,
              }}
              scroll={{ x: 800 }}
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <UserOutlined />
              Teachers ({Array.isArray(teachersData) ? teachersData.length : 0})
            </span>
          } 
          key="teachers"
        >
          <Card>
            <List
              dataSource={Array.isArray(teachersData) ? teachersData : []}
              renderItem={(teacher) => (
                <List.Item
                  actions={[
                    <Button 
                      key="email"
                      type="text" 
                      icon={<MailOutlined />}
                      onClick={() => {
                        const email = teacher?.email || teacher?.user?.email;
                        if (email) {
                          window.open(`mailto:${email}`, '_blank');
                        } else {
                          message.warning('No email address found');
                        }
                      }}
                    >
                      Email
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        src={teacher?.image || teacher?.avatar || teacher?.user?.image} 
                        icon={<UserOutlined />}
                        size={48}
                      />
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {teacher?.fullName || teacher?.name || teacher?.user?.fullName || 'Teacher'}
                        </span>
                        <Tag color="blue">
                          {teacher?.role || 'Teacher'}
                        </Tag>
                      </div>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <Text type="secondary">
                          {teacher?.email || teacher?.user?.email || 'No email'}
                        </Text>
                        
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{
                emptyText: 'No teachers found'
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Remove Student Modal */}
      <Modal
        title="Remove Student"
        open={removeModalVisible}
        onOk={confirmRemoveStudent}
        onCancel={() => setRemoveModalVisible(false)}
        okText="Remove"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        {selectedStudent && (
          <div className="py-4">
            <ExclamationCircleOutlined className="text-orange-500 mr-2" />
            <Text>
              Are you sure you want to remove <strong>
                {selectedStudent?.name || selectedStudent?.student?.fullName || selectedStudent?.fullName || 'this student'}
              </strong> from this class?
              They will no longer have access to class materials and assignments.
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default memo(PeopleTab); 