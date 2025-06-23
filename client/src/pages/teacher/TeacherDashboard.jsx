import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Statistic, 
  Progress,
  List,
  Avatar,
  Tag,
  Space,
  Calendar,
  Badge,
  Table,
  Select,
  DatePicker,
  Tabs,
  Modal,
  message,
  Dropdown
} from 'antd';
import { 
  BookOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  BarChartOutlined,
  CalendarOutlined,
  RiseOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  PieChartOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  MoreOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './teacher.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Mock data - thay thế bằng API calls trong thực tế
  const [stats, setStats] = useState({
    totalClasses: 3,
    totalStudents: 45,
    pendingApprovals: 1,
    completedAssignments: 28,
    averageGrade: 8.2,
    submissionRate: 78,
    lateSubmissions: 12,
    totalAssignments: 35
  });

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    classPerformance: [
      {
        key: '1',
        className: 'Web Development',
        students: 25,
        assignments: 12,
        avgGrade: 8.5,
        submissionRate: 92,
        lateSubmissions: 3
      },
      {
        key: '2',
        className: 'Programming Fundamentals',
        students: 30,
        assignments: 15,
        avgGrade: 7.8,
        submissionRate: 85,
        lateSubmissions: 6
      },
      {
        key: '3',
        className: 'Advanced React',
        students: 20,
        assignments: 8,
        avgGrade: 8.9,
        submissionRate: 95,
        lateSubmissions: 1
      }
    ],
    weeklyProgress: [
      { week: 'Tuần 1', submissions: 23, grade: 8.1 },
      { week: 'Tuần 2', submissions: 28, grade: 8.3 },
      { week: 'Tuần 3', submissions: 25, grade: 8.0 },
      { week: 'Tuần 4', submissions: 30, grade: 8.6 }
    ],
    gradeDistribution: [
      { range: '9.0-10', count: 15, percentage: 33 },
      { range: '8.0-8.9', count: 18, percentage: 40 },
      { range: '7.0-7.9', count: 8, percentage: 18 },
      { range: '6.0-6.9', count: 3, percentage: 7 },
      { range: '< 6.0', count: 1, percentage: 2 }
    ]
  });

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: 'student_joined',
      message: 'Nguyễn Văn A đã tham gia lớp Toán học 10A',
      time: '2 giờ trước',
      avatar: 'A'
    },
    {
      id: 2,
      type: 'assignment_submitted',
      message: 'Trần Thị B đã nộp bài tập Chương 1',
      time: '4 giờ trước',
      avatar: 'B'
    },
    {
      id: 3,
      type: 'class_created',
      message: 'Lớp Hóa học 12C đã được tạo và chờ phê duyệt',
      time: '1 ngày trước',
      avatar: 'H'
    }
  ]);

  const [upcomingEvents, setUpcomingEvents] = useState([
    {
      id: 1,
      title: 'Kiểm tra chương 2 - Toán học 10A',
      date: '2023-09-15',
      time: '08:00'
    },
    {
      id: 2,
      title: 'Deadline bài tập - Vật lý 11B',
      date: '2023-09-16',
      time: '23:59'
    }
  ]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'student_joined':
        return <UserOutlined className="text-blue-500" />;
      case 'assignment_submitted':
        return <CheckCircleOutlined className="text-green-500" />;
      case 'class_created':
        return <BookOutlined className="text-purple-500" />;
      default:
        return <ClockCircleOutlined className="text-gray-500" />;
    }
  };

  // Scroll to analytics section
  const scrollToAnalytics = () => {
    const analyticsElement = document.getElementById('analytics-dashboard');
    if (analyticsElement) {
      analyticsElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Add highlight effect
      analyticsElement.style.boxShadow = '0 0 20px rgba(24, 144, 255, 0.3)';
      analyticsElement.style.transition = 'box-shadow 0.3s ease';
      
      // Remove highlight after 2 seconds
      setTimeout(() => {
        analyticsElement.style.boxShadow = 'none';
      }, 2000);
    }
  };

  // Export functions
  const handleExportExcel = () => {
    message.loading('Đang tạo file Excel...', 1);
    setTimeout(() => {
      message.success('Tải xuống thành công! File đã được lưu tại Downloads.');
    }, 1500);
  };

  const handleExportPDF = () => {
    message.loading('Đang tạo báo cáo PDF...', 1);
    setTimeout(() => {
      message.success('Báo cáo PDF đã được tạo và tải xuống!');
    }, 1500);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDetailedReport = () => {
    setReportModalVisible(true);
  };

  // Report menu items
  const reportMenuItems = [
    {
      key: 'analytics',
      label: 'Xem thống kê nhanh',
      icon: <BarChartOutlined />,
      onClick: scrollToAnalytics
    },
    {
      type: 'divider'
    },
    {
      key: 'excel',
      label: 'Xuất Excel',
      icon: <FileExcelOutlined />,
      onClick: handleExportExcel
    },
    {
      key: 'pdf',
      label: 'Báo cáo PDF',
      icon: <FilePdfOutlined />,
      onClick: handleExportPDF
    },
    {
      key: 'print',
      label: 'In báo cáo',
      icon: <PrinterOutlined />,
      onClick: handlePrintReport
    },
    {
      type: 'divider'
    },
    {
      key: 'detailed',
      label: 'Báo cáo chi tiết',
      icon: <MoreOutlined />,
      onClick: handleDetailedReport
    }
  ];

  const QuickActions = () => (
    <Card 
      title="Hành động nhanh" 
      className="h-full"
      extra={<BookOutlined className="text-blue-500" />}
    >
      <div className="space-y-3">
        <Button 
          type="primary" 
          block 
          icon={<PlusOutlined />}
          onClick={() => navigate('/teacher/classroom')}
          className="h-12 text-left flex items-center"
        >
          Tạo lớp học mới
        </Button>
        <Button 
          block 
          icon={<EyeOutlined />}
          onClick={() => navigate('/teacher/classroom')}
          className="h-12 text-left flex items-center"
        >
          Xem tất cả lớp học
        </Button>
        <Dropdown
          menu={{ items: reportMenuItems }}
          placement="topLeft"
          trigger={['click']}
        >
          <Button 
            block 
            icon={<BarChartOutlined />}
            className="h-12 text-left flex items-center justify-between"
          >
            <span>Báo cáo & Thống kê</span>
            <MoreOutlined />
          </Button>
        </Dropdown>
        <Button 
          block 
          icon={<CalendarOutlined />}
          onClick={() => navigate('/teacher/todo')}
          className="h-12 text-left flex items-center"
        >
          Việc cần làm
        </Button>
      </div>
    </Card>
  );

  const StatsOverview = () => (
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full">
          <Statistic
            title="Tổng số lớp học"
            value={stats.totalClasses}
            prefix={<BookOutlined className="text-blue-500" />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full">
          <Statistic
            title="Tổng số học sinh"
            value={stats.totalStudents}
            prefix={<UserOutlined className="text-green-500" />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full">
          <Statistic
            title="Điểm trung bình"
            value={stats.averageGrade}
            precision={1}
            prefix={<RiseOutlined className="text-purple-500" />}
            valueStyle={{ color: '#722ed1' }}
            suffix="/10"
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full">
          <Statistic
            title="Tỷ lệ nộp bài"
            value={stats.submissionRate}
            prefix={<CheckCircleOutlined className="text-green-500" />}
            valueStyle={{ color: '#52c41a' }}
            suffix="%"
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full">
          <Statistic
            title="Nộp muộn"
            value={stats.lateSubmissions}
            prefix={<ClockCircleOutlined className="text-orange-500" />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full">
          <Statistic
            title="Tổng bài tập"
            value={stats.totalAssignments}
            prefix={<FileExcelOutlined className="text-blue-600" />}
            valueStyle={{ color: '#1565c0' }}
          />
        </Card>
      </Col>
    </Row>
  );

  const RecentActivities = () => (
    <Card 
      title="Hoạt động gần đây" 
      className="h-full"
      extra={<ClockCircleOutlined className="text-gray-500" />}
    >
      <List
        dataSource={recentActivities}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Badge dot={item.type === 'student_joined'}>
                  <Avatar style={{ backgroundColor: '#1890ff' }}>
                    {item.avatar}
                  </Avatar>
                </Badge>
              }
              title={
                <div className="flex items-center gap-2">
                  {getActivityIcon(item.type)}
                  <Text className="text-sm">{item.message}</Text>
                </div>
              }
              description={
                <Text type="secondary" className="text-xs">
                  {item.time}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  const UpcomingEvents = () => (
    <Card 
      title="Sự kiện sắp tới" 
      className="h-full"
      extra={<CalendarOutlined className="text-blue-500" />}
    >
      <div className="space-y-4">
        {upcomingEvents.map((event) => (
          <div key={event.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <div className="flex justify-between items-start">
              <div>
                <Text strong className="block text-sm">
                  {event.title}
                </Text>
                <Text type="secondary" className="text-xs">
                  {event.date} • {event.time}
                </Text>
              </div>
              <Tag color="blue" className="text-xs">
                Sắp tới
              </Tag>
            </div>
          </div>
        ))}
        {upcomingEvents.length === 0 && (
          <div className="text-center py-8">
            <CalendarOutlined className="text-4xl text-gray-300 mb-2" />
            <Text type="secondary">Không có sự kiện nào sắp tới</Text>
          </div>
        )}
      </div>
    </Card>
  );

  const AnalyticsDashboard = () => {
    const classColumns = [
      {
        title: 'Lớp học',
        dataIndex: 'className',
        key: 'className',
        width: 180,
      },
      {
        title: 'Học sinh',
        dataIndex: 'students',
        key: 'students',
        align: 'center',
        width: 80,
      },
      {
        title: 'Bài tập',
        dataIndex: 'assignments',
        key: 'assignments',
        align: 'center',
        width: 80,
      },
      {
        title: 'Điểm TB',
        dataIndex: 'avgGrade',
        key: 'avgGrade',
        align: 'center',
        width: 90,
        render: (grade) => (
          <Tag color={grade >= 8.5 ? 'green' : grade >= 7.0 ? 'orange' : 'red'}>
            {grade.toFixed(1)}
          </Tag>
        ),
      },
      {
        title: 'Tỷ lệ nộp bài',
        dataIndex: 'submissionRate',
        key: 'submissionRate',
        align: 'center',
        width: 120,
        render: (rate) => (
          <div>
            <Progress
              percent={rate}
              size="small"
              status={rate >= 90 ? 'success' : rate >= 70 ? 'active' : 'exception'}
            />
            <Text className="text-xs">{rate}%</Text>
          </div>
        ),
      },
      {
        title: 'Nộp muộn',
        dataIndex: 'lateSubmissions',
        key: 'lateSubmissions',
        align: 'center',
        width: 90,
        render: (late) => (
          <Tag color={late <= 2 ? 'green' : late <= 5 ? 'orange' : 'red'}>
            {late}
          </Tag>
        ),
      },
    ];

    return (
      <Card 
        title={
          <div className="flex justify-between items-center">
            <span>📊 Thống kê & Báo cáo</span>
            <Space>
              <Button 
                icon={<FileExcelOutlined />} 
                onClick={handleExportExcel}
                type="primary"
                size="small"
              >
                Xuất Excel
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={handleExportPDF}
                size="small"
              >
                Xuất PDF
              </Button>
            </Space>
          </div>
        }
        className="h-full"
      >
        <Tabs defaultActiveKey="performance">
          <TabPane 
            tab={
              <span>
                <BarChartOutlined />
                Hiệu suất lớp học
              </span>
            } 
            key="performance"
          >
            <Table
              columns={classColumns}
              dataSource={analyticsData.classPerformance}
              pagination={false}
              size="small"
              scroll={{ x: 650 }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <LineChartOutlined />
                Tiến độ tuần
              </span>
            } 
            key="weekly"
          >
            <div className="space-y-4">
              {analyticsData.weeklyProgress.map((week, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <Text strong>{week.week}</Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                      {week.submissions} bài nộp
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text strong className={week.grade >= 8.0 ? 'text-green-600' : 'text-orange-600'}>
                      {week.grade.toFixed(1)}/10
                    </Text>
                    <br />
                    <Progress 
                      percent={(week.grade / 10) * 100} 
                      size="small" 
                      showInfo={false}
                      strokeColor={week.grade >= 8.0 ? '#52c41a' : '#fa8c16'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <PieChartOutlined />
                Phân bố điểm
              </span>
            } 
            key="distribution"
          >
            <div className="space-y-3">
              {analyticsData.gradeDistribution.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Text className="w-16">{item.range}</Text>
                    <Progress 
                      percent={item.percentage} 
                      size="small"
                      strokeColor={
                        item.range.includes('9') ? '#52c41a' :
                        item.range.includes('8') ? '#1890ff' :
                        item.range.includes('7') ? '#faad14' :
                        item.range.includes('6') ? '#fa8c16' : '#ff4d4f'
                      }
                      style={{ width: 200 }}
                    />
                  </div>
                  <div className="text-right">
                    <Text strong>{item.count} HS</Text>
                    <br />
                    <Text type="secondary" className="text-sm">{item.percentage}%</Text>
                  </div>
                </div>
              ))}
            </div>
          </TabPane>
        </Tabs>
      </Card>
    );
  };

  const ClassPerformance = () => (
    <Card title="Hoạt động gần đây" className="h-full">
      <div className="space-y-4">
        {analyticsData.classPerformance.map((classItem, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <Text strong className="text-base">{classItem.className}</Text>
              <Tag color="blue">{classItem.students} HS</Tag>
            </div>
            <div className="flex justify-between mb-2">
              <Text type="secondary" className="text-sm">Điểm trung bình</Text>
              <Text className={classItem.avgGrade >= 8.0 ? 'text-green-600' : 'text-orange-600'}>
                {classItem.avgGrade.toFixed(1)}/10
              </Text>
            </div>
            <Progress 
              percent={classItem.submissionRate} 
              strokeColor={classItem.submissionRate >= 90 ? '#52c41a' : '#fa8c16'}
            />
            <Text type="secondary" className="text-xs">
              Tỷ lệ nộp bài: {classItem.submissionRate}%
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div 
      className="teacher-dashboard-content"
      style={{ 
        background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%)',
        padding: '24px'
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <Title level={1} style={{ color: '#1565C0', marginBottom: '8px' }}>
            Dashboard Giáo viên
          </Title>
          <Text className="text-lg text-gray-600">
            Chào mừng trở lại! Đây là tổng quan về các lớp học của bạn.
          </Text>
        </div>

        {/* Stats Overview */}
        <div className="mb-6">
          <StatsOverview />
        </div>

        {/* Analytics Dashboard */}
        <div id="analytics-dashboard" className="mb-6">
          <AnalyticsDashboard />
        </div>

        {/* Main Content */}
        <Row gutter={[24, 24]}>
          {/* Left Column */}
          <Col xs={24} lg={16}>
            <div className="space-y-6">
              {/* Recent Activities */}
              <RecentActivities />
              
              {/* Class Performance Summary */}
              <ClassPerformance />
            </div>
          </Col>

          {/* Right Column */}
          <Col xs={24} lg={8}>
            <div className="space-y-6">
              {/* Quick Actions */}
              <QuickActions />
              
              {/* Upcoming Events */}
              <UpcomingEvents />
            </div>
          </Col>
        </Row>
      </div>

      {/* Detailed Report Modal */}
      <Modal
        title="📊 Báo cáo chi tiết"
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        width={800}
        footer={[
          <Button key="export" icon={<FileExcelOutlined />} onClick={handleExportExcel}>
            Xuất Excel
          </Button>,
          <Button key="pdf" icon={<FilePdfOutlined />} onClick={handleExportPDF}>
            Xuất PDF
          </Button>,
          <Button key="close" onClick={() => setReportModalVisible(false)}>
            Đóng
          </Button>
        ]}
      >
        <div className="space-y-6">
          {/* Quick Stats */}
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small" className="text-center">
                <Statistic
                  title="Tổng lớp"
                  value={stats.totalClasses}
                  valueStyle={{ fontSize: '18px', color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className="text-center">
                <Statistic
                  title="Học sinh"
                  value={stats.totalStudents}
                  valueStyle={{ fontSize: '18px', color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className="text-center">
                <Statistic
                  title="Điểm TB"
                  value={stats.averageGrade}
                  precision={1}
                  suffix="/10"
                  valueStyle={{ fontSize: '18px', color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className="text-center">
                <Statistic
                  title="Tỷ lệ nộp"
                  value={stats.submissionRate}
                  suffix="%"
                  valueStyle={{ fontSize: '18px', color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Performance Summary */}
          <Card title="Tóm tắt hiệu suất" size="small">
            <List
              dataSource={analyticsData.classPerformance}
              renderItem={(item) => (
                <List.Item>
                  <div className="w-full flex justify-between items-center">
                    <div>
                      <Text strong>{item.className}</Text>
                      <br />
                      <Text type="secondary" className="text-sm">
                        {item.students} học sinh • {item.assignments} bài tập
                      </Text>
                    </div>
                    <div className="text-right">
                      <Tag color={item.avgGrade >= 8.0 ? 'green' : 'orange'}>
                        {item.avgGrade.toFixed(1)}/10
                      </Tag>
                      <br />
                      <Text className="text-sm text-gray-500">
                        {item.submissionRate}% nộp bài
                      </Text>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          {/* Grade Distribution Chart */}
          <Card title="Phân bố điểm số" size="small">
            <div className="space-y-2">
              {analyticsData.gradeDistribution.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <Text className="w-20">{item.range}</Text>
                  <div className="flex-1 mx-3">
                    <Progress 
                      percent={item.percentage} 
                      size="small"
                      strokeColor={
                        item.range.includes('9') ? '#52c41a' :
                        item.range.includes('8') ? '#1890ff' :
                        item.range.includes('7') ? '#faad14' :
                        item.range.includes('6') ? '#fa8c16' : '#ff4d4f'
                      }
                    />
                  </div>
                  <Text strong className="w-16 text-right">
                    {item.count} HS ({item.percentage}%)
                  </Text>
                </div>
              ))}
            </div>
          </Card>

          <Text type="secondary" className="block text-center">
            Báo cáo được tạo vào {new Date().toLocaleDateString('vi-VN')} lúc {new Date().toLocaleTimeString('vi-VN')}
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherDashboard; 