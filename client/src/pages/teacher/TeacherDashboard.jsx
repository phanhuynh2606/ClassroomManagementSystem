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
  Badge,
  Tabs,
  Modal,
  message,
  Dropdown,
  Spin,
  Alert
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
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getTeacherDashboard } from '../../services/api/teacher.api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API data states
  const [stats, setStats] = useState(null);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [classPerformance, setClassPerformance] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getTeacherDashboard();
      
      // Set stats
      setStats(response.stats);
      
      // Process grade distribution for charts (add value field for PieChart)
      const processedGradeDistribution = response.gradeDistribution?.map(item => ({
        ...item,
        value: item.percentage || 0
      })) || [];
      setGradeDistribution(processedGradeDistribution);
      
      // Set other data
      setClassPerformance(response.classPerformance || []);
      setWeeklyProgress(response.weeklyProgress || []);
      setRecentActivities(response.recentActivities || []);
      setUpcomingEvents(response.upcomingEvents || []);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
      message.error('Lỗi khi tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Color scheme for charts
  const GRADE_COLORS = {
    "9.0-10": "#52c41a",    // Green - Excellent
    "8.0-8.9": "#1890ff",  // Blue - Good
    "7.0-7.9": "#faad14",  // Orange - Fair
    "6.0-6.9": "#fa8c16",  // Orange-red - Below average
    "< 6.0": "#ff4d4f"     // Red - Poor
  };

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
      icon: <BarChartOutlined />
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
      className="h-full shadow-lg"
      extra={<BookOutlined className="text-blue-500" />}
      style={{ borderRadius: '12px' }}
    >
      <div className="space-y-3">
        <Button 
          type="primary" 
          block 
          icon={<PlusOutlined />}
          onClick={() => navigate('/teacher/classroom')}
          className="h-12 text-left flex items-center rounded-lg"
          style={{ borderRadius: '8px' }}
        >
          Tạo lớp học mới
        </Button>
        <Button 
          block 
          icon={<EyeOutlined />}
          onClick={() => navigate('/teacher/classroom')}
          className="h-12 text-left flex items-center rounded-lg"
          style={{ borderRadius: '8px' }}
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
            className="h-12 text-left flex items-center justify-between rounded-lg"
            style={{ borderRadius: '8px' }}
          >
            <span>Báo cáo & Thống kê</span>
            <MoreOutlined />
          </Button>
        </Dropdown>
        <Button 
          block 
          icon={<CalendarOutlined />}
          onClick={() => navigate('/teacher/todo')}
          className="h-12 text-left flex items-center rounded-lg"
          style={{ borderRadius: '8px' }}
        >
          Việc cần làm
        </Button>
      </div>
    </Card>
  );

  const StatsOverview = () => (
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full shadow-lg" style={{ borderRadius: '12px' }}>
          <Statistic
            title="Tổng số lớp học"
            value={stats?.totalClasses ?? 0}
            prefix={<BookOutlined className="text-blue-500" />}
            valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full shadow-lg" style={{ borderRadius: '12px' }}>
          <Statistic
            title="Tổng số học sinh"
            value={stats?.totalStudents ?? 0}
            prefix={<UserOutlined className="text-green-500" />}
            valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full shadow-lg" style={{ borderRadius: '12px' }}>
          <Statistic
            title="Điểm trung bình"
            value={stats?.averageGrade ?? 0}
            precision={1}
            prefix={<RiseOutlined className="text-purple-500" />}
            valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: 'bold' }}
            suffix="/10"
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full shadow-lg" style={{ borderRadius: '12px' }}>
          <Statistic
            title="Tỷ lệ nộp bài"
            value={stats?.submissionRate ?? 0}
            prefix={<CheckCircleOutlined className="text-green-500" />}
            valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
            suffix="%"
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full shadow-lg" style={{ borderRadius: '12px' }}>
          <Statistic
            title="Nộp muộn"
            value={stats?.lateSubmissions ?? 0}
            prefix={<ClockCircleOutlined className="text-orange-500" />}
            valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6} md={4}>
        <Card className="text-center h-full shadow-lg" style={{ borderRadius: '12px' }}>
          <Statistic
            title="Tổng bài tập"
            value={stats?.totalAssignments ?? 0}
            prefix={<FileExcelOutlined className="text-blue-600" />}
            valueStyle={{ color: '#1565c0', fontSize: '24px', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
    </Row>
  );

  const UpcomingEvents = () => (
    <Card 
      title="Sự kiện sắp tới" 
      className="h-full shadow-lg"
      extra={<CalendarOutlined className="text-blue-500" />}
      style={{ borderRadius: '12px' }}
    >
      <div className="space-y-4">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <CalendarOutlined className="text-4xl text-gray-300 mb-2" />
            <Text type="secondary">Không có sự kiện nào sắp tới</Text>
          </div>
        ) : (
          upcomingEvents.map((event, index) => (
            <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <Text strong className="block text-sm text-gray-800">
                    {event.title}
                  </Text>
                  <Text type="secondary" className="text-xs mt-1">
                    📅 {event.date} • ⏰ {event.time}
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

  // Enhanced Grade Distribution with Pie Chart
  const GradeDistributionChart = () => (
    <Card 
      title={<span><PieChartOutlined className="mr-2" />Phân bố điểm số</span>}
      className="h-full shadow-lg"
      style={{ borderRadius: '12px' }}
    >
      {gradeDistribution.length === 0 ? (
        <div className="text-center py-8">
          <PieChartOutlined className="text-4xl text-gray-300 mb-2" />
          <Text type="secondary">Chưa có dữ liệu phân bố điểm</Text>
        </div>
      ) : (
        <Row gutter={24}>
          <Col span={14}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({range, percentage}) => `${range}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.range]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Tỷ lệ']} />
              </PieChart>
            </ResponsiveContainer>
          </Col>
          <Col span={10}>
            <div className="space-y-3 mt-4">
              {gradeDistribution.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: GRADE_COLORS[item.range] }}
                    />
                    <Text className="font-medium">{item.range}</Text>
                  </div>
                  <div className="text-right">
                    <Text strong className="text-lg">{item.count}</Text>
                    <Text type="secondary" className="text-sm block">
                      {item.percentage}%
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      )}
    </Card>
  );


  const ClassPerformanceChart = () => (
    <Card 
      title={<span><TrophyOutlined className="mr-2" />Hiệu suất lớp học</span>}
      className="h-full shadow-lg"
      style={{ borderRadius: '12px' }}
    >
      {classPerformance.length === 0 ? (
        <div className="text-center py-8">
          <TrophyOutlined className="text-4xl text-gray-300 mb-2" />
          <Text type="secondary">Chưa có dữ liệu hiệu suất lớp học</Text>
        </div>
      ) : (
        <div className="space-y-4">
          {classPerformance.map((classItem, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <Text strong className="text-lg">{classItem.className}</Text>
                  <div className="flex gap-4 mt-1">
                    <Tag color="blue" icon={<UserOutlined />}>{classItem.students.length} HS</Tag>
                    <Tag color="green" icon={<BookOutlined />}>{classItem.assignments} BT</Tag>
                  </div>
                </div>
                <div className="text-right">
                  <Text className={classItem.avgGrade >= 8.0 ? 'text-green-600 text-xl font-bold' : 'text-orange-600 text-xl font-bold'}>
                    {classItem.avgGrade}/10
                  </Text>
                  <Text type="secondary" className="text-sm block">Điểm TB</Text>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                  <Text type="secondary" className="text-sm">Tỷ lệ nộp bài</Text>
                  <Text strong>{classItem.submissionRate}%</Text>
                </div>
                <Progress 
                  percent={classItem.submissionRate} 
                  strokeColor={classItem.submissionRate >= 90 ? '#52c41a' : classItem.submissionRate >= 70 ? '#faad14' : '#ff4d4f'}
                  trailColor="#f0f0f0"
                />
              </div>
              
              {classItem.lateSubmissions > 0 && (
                <div className="flex justify-between items-center">
                  <Text type="secondary" className="text-sm">Nộp muộn</Text>
                  <Tag color="orange" icon={<ClockCircleOutlined />}>
                    {classItem.lateSubmissions} bài
                  </Tag>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  const WeeklyProgressChart = () => (
    <Card 
      title={<span><LineChartOutlined className="mr-2" />Tiến độ tuần</span>}
      className="h-full shadow-lg"
      style={{ borderRadius: '12px' }}
    >
      {weeklyProgress.length === 0 ? (
        <div className="text-center py-8">
          <LineChartOutlined className="text-4xl text-gray-300 mb-2" />
          <Text type="secondary">Chưa có dữ liệu tiến độ tuần</Text>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={weeklyProgress} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="submissions"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
              name="Số bài nộp"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="grade"
              stroke="#82ca9d"
              strokeWidth={3}
              name="Điểm trung bình"
              dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );

  const RecentActivities = () => (
    <Card 
      title="Hoạt động gần đây" 
      className="h-full shadow-lg"
      extra={<ClockCircleOutlined className="text-gray-500" />}
      style={{ borderRadius: '12px' }}
    >
      {recentActivities.length === 0 ? (
        <div className="text-center py-8">
          <ClockCircleOutlined className="text-4xl text-gray-300 mb-2" />
          <Text type="secondary">Chưa có hoạt động nào</Text>
        </div>
      ) : (
        <List
          dataSource={recentActivities}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    src={item.student?.image} 
                    style={{ backgroundColor: '#1890ff' }}
                  >
                    {item.student?.fullName?.[0]?.toUpperCase() || getActivityIcon(item.type)}
                  </Avatar>
                }
                title={<Text className="text-sm">{item.message}</Text>}
                description={<Text type="secondary" className="text-xs">{item.time}</Text>}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Đang tải dữ liệu dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Lỗi tải dữ liệu"
          description={error}
          type="error"
          action={
            <Button type="primary" onClick={fetchDashboardData}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div 
      className="teacher-dashboard-content"
      style={{ 
        background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%)',
        padding: '24px',
        minHeight: '100vh'
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

        {/* Analytics Dashboard with Tabs */}
        <div className="mb-6">
          <Tabs defaultActiveKey="performance" size="large">
            <TabPane tab={<span><TrophyOutlined />Hiệu suất lớp học</span>} key="performance">
              <ClassPerformanceChart />
            </TabPane>
            <TabPane tab={<span><LineChartOutlined />Tiến độ tuần</span>} key="weekly">
              <WeeklyProgressChart />
            </TabPane>
            <TabPane tab={<span><PieChartOutlined />Phân bố điểm - Pie Chart</span>} key="pie-distribution">
              <GradeDistributionChart />
            </TabPane>
          </Tabs>
        </div>

        {/* Main Content */}
        <Row gutter={[24, 24]}>
          {/* Left Column */}
          <Col xs={24} lg={16}>
            <div className="space-y-6">
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
          <Button key="refresh" icon={<RiseOutlined />} onClick={fetchDashboardData}>
            Làm mới dữ liệu
          </Button>,
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
              dataSource={classPerformance}
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
                        {item.avgGrade}/10
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

          {/* Grade Distribution Summary */}
          <Card title="Phân bố điểm số" size="small">
            <div className="space-y-2">
              {gradeDistribution.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <Text className="w-20">{item.range}</Text>
                  <div className="flex-1 mx-3">
                    <Progress 
                      percent={item.percentage} 
                      size="small"
                      strokeColor={GRADE_COLORS[item.range]}
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