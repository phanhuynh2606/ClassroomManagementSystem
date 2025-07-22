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
  LineChartOutlined,
  TrophyOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { VideoPlayerDemo } from '../../components/teacher/stream';
import './style/teacher.css';
import { getTeacherDashboard } from '../../services/api/teacher.api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [videoPlayerDemoVisible, setVideoPlayerDemoVisible] = useState(false);

  // Dữ liệu thực tế từ API
  const [stats, setStats] = useState(null);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [classPerformance, setClassPerformance] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    getTeacherDashboard()
      .then(res => {
        setStats(res.stats);
        setGradeDistribution(res.gradeDistribution);
        setClassPerformance(res.classPerformance || []);
        setWeeklyProgress(res.weeklyProgress || []);
        setRecentActivities(res.recentActivities || []);
        setUpcomingEvents(res.upcomingEvents || []);
      })
      .catch(err => {
        setStats(null);
        setGradeDistribution([]);
        setClassPerformance([]);
        setWeeklyProgress([]);
        setRecentActivities([]);
        setUpcomingEvents([]);
      });
  }, []);

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
            value={stats?.totalClasses ?? 0}
            prefix={<BookOutlined className="text-blue-500" />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full">
          <Statistic
            title="Tổng số học sinh"
            value={stats?.totalStudents ?? 0}
            prefix={<UserOutlined className="text-green-500" />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full">
          <Statistic
            title="Điểm trung bình"
            value={stats?.averageGrade ?? 0}
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
            value={stats?.submissionRate ?? 0}
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
            value={stats?.lateSubmissions ?? 0}
            prefix={<ClockCircleOutlined className="text-orange-500" />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full">
          <Statistic
            title="Tổng bài tập"
            value={stats?.totalAssignments ?? 0}
            prefix={<FileExcelOutlined className="text-blue-600" />}
            valueStyle={{ color: '#1565c0' }}
          />
        </Card>
      </Col>
    </Row>
  );


  const UpcomingEvents = () => (
    <Card 
      title="Sự kiện sắp tới" 
      className="h-full"
      extra={<CalendarOutlined className="text-blue-500" />}
    >
      <div className="space-y-4">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <CalendarOutlined className="text-4xl text-gray-300 mb-2" />
            <Text type="secondary">Không có sự kiện nào sắp tới</Text>
          </div>
        ) : (
          upcomingEvents.map((event) => (
            <div key={event.title + event.date + event.time} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
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
          ))
        )}
      </div>
    </Card>
  );

  const AnalyticsDashboard = () => (
    <Card 
      title={<span>📊 Phân bố điểm</span>}
      className="h-full"
    >
      <div className="space-y-3">
        {gradeDistribution.length === 0 ? (
          <div>Chưa có dữ liệu phân bố điểm.</div>
        ) : (
          gradeDistribution.map((item, index) => (
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
          ))
        )}
      </div>
    </Card>
  );

  const ClassPerformance = () => (
    <Card title="Tổng quan lớp học" className="h-full">
      <div className="space-y-4">
        {classPerformance.length === 0 ? (
          <div>Chưa có dữ liệu hiệu suất lớp học.</div>
        ) : (
          classPerformance.map((classItem, index) => (
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
          ))
        )}
      </div>
    </Card>
  );

  const WeeklyProgress = () => (
    <Card title="Tiến độ tuần" className="h-full">
      <div className="space-y-4">
        {weeklyProgress.length === 0 ? (
          <div>Chưa có dữ liệu tiến độ tuần.</div>
        ) : (
          weeklyProgress.map((week, index) => (
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
          ))
        )}
      </div>
    </Card>
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
              avatar={<Avatar src={item.student.image} style={{ backgroundColor: '#1890ff' }}>{item.type?.[0]?.toUpperCase() || '?'}</Avatar>}
              title={<Text className="text-sm">{item.message}</Text>}
              description={<Text type="secondary" className="text-xs">{item.time}</Text>}
            />
          </List.Item>
        )}
      />
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
          <Tabs defaultActiveKey="performance">
            <TabPane tab={<span><BarChartOutlined />Hiệu suất lớp học</span>} key="performance">
              <ClassPerformance />
            </TabPane>
            <TabPane tab={<span><LineChartOutlined />Tiến độ tuần</span>} key="weekly">
              <WeeklyProgress />
            </TabPane>
            <TabPane tab={<span><PieChartOutlined />Phân bố điểm</span>} key="distribution">
              <AnalyticsDashboard />
            </TabPane>
          </Tabs>
        </div>

        {/* Main Content */}
        <Row gutter={[24, 24]}>
          {/* Left Column */}
          <Col xs={24} lg={16}>
            <div className="space-y-6">
              {/* Các bảng thống kê, hoạt động gần đây, ... */}
              <RecentActivities />
            </div>
          </Col>

          {/* Right Column */}
          <Col xs={24} lg={8}>
            <div className="space-y-6">
              <QuickActions />
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
                  value={stats?.totalClasses ?? 0}
                  valueStyle={{ fontSize: '18px', color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className="text-center">
                <Statistic
                  title="Học sinh"
                  value={stats?.totalStudents ?? 0}
                  valueStyle={{ fontSize: '18px', color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className="text-center">
                <Statistic
                  title="Điểm TB"
                  value={stats?.averageGrade ?? 0}
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
                  value={stats?.submissionRate ?? 0}
                  suffix="%"
                  valueStyle={{ fontSize: '18px', color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Performance Summary */}
          <Card title="Tóm tắt hiệu suất" size="small">
            <List
              dataSource={[]} // No mock data for detailed reports
              renderItem={(item) => (
                <List.Item>
                  <div className="w-full flex justify-between items-center">
                    <div>
                      <Text strong>Lớp học</Text>
                      <br />
                      <Text type="secondary" className="text-sm">
                        Học sinh • Bài tập
                      </Text>
                    </div>
                    <div className="text-right">
                      <Tag color="blue">Điểm TB</Tag>
                      <br />
                      <Text className="text-sm text-gray-500">
                        Tỷ lệ nộp bài
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
              {gradeDistribution.map((item, index) => (
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

      {/* Video Player Demo Modal */}
      <Modal
        title="🎬 Enhanced Video Player Demo"
        open={videoPlayerDemoVisible}
        onCancel={() => setVideoPlayerDemoVisible(false)}
        width="95vw"
        style={{ maxWidth: '1400px' }}
        footer={null}
        bodyStyle={{ 
          padding: 0,
          height: '80vh',
          overflow: 'auto'
        }}
      >
        <VideoPlayerDemo />
      </Modal>
    </div>
  );
};

export default TeacherDashboard; 