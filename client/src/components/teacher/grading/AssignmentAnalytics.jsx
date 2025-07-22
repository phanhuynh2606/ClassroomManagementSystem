import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Spin,
  Alert,
  Tag,
  Table,
  List,
  Space,
  Button,
  Select,
  DatePicker,
  Tooltip,
  Badge,
  Divider,
  Empty
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrophyOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  StarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  RadarChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import moment from 'moment';
import assignmentAPI from '../../../services/api/assignment.api';
import {AnalyticsErrorBoundary,AnalyticsInsights} from"./index"

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AssignmentAnalytics = ({ assignmentId, assignment, submissions = [] }) => {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedGradeRange, setSelectedGradeRange] = useState('all');
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    if (assignmentId) {
      fetchAnalytics();
    }
  }, [assignmentId, selectedTimeRange, selectedGradeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await assignmentAPI.getAnalytics(assignmentId, {
        timeRange: selectedTimeRange,
        gradeRange: selectedGradeRange
      });
      console.log("response", response);
      if (response && response.success) {
        console.log("Run here");
        setAnalyticsData(response.data);
      } else {
        // Fallback to local calculation if API fails
        console.warn('API response invalid, calculating locally');
        calculateLocalAnalytics();
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Always fallback to local calculation on error
      calculateLocalAnalytics();
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalAnalytics = () => {
    if (!assignment || !Array.isArray(submissions)) {
      console.warn('Invalid assignment or submissions data for analytics');
      return;
    }

    const maxGrade = Number(assignment.totalPoints) || 100;
    const validSubmissions = submissions.filter(s => 
      s && 
      s.status !== 'missing' && 
      !s._id?.toString().startsWith('missing_') &&
      s.grade !== null && 
      s.grade !== undefined &&
      !isNaN(s.grade)
    );

    if (validSubmissions.length === 0) {
      // Set empty state for analytics
      setAnalyticsData({
        overview: {
          totalStudents: assignment.stats?.totalStudents || submissions.length || 0,
          submittedCount: 0,
          gradedCount: 0,
          lateCount: 0,
          avgGrade: 0,
          medianGrade: 0,
          highestGrade: 0,
          lowestGrade: 0,
          passingRate: 0
        },
        gradeDistribution: [],
        submissionTimeline: [],
        performanceInsights: {
          aboveAverage: 0,
          belowAverage: 0,
          perfectScores: 0,
          needsImprovement: 0
        },
        timeAnalysis: {
          submissionsByHour: [],
          submissionsByDay: []
        }
      });
      return;
    }

    // Grade Distribution
    const gradeRanges = [
      { label: 'A (90-100%)', min: maxGrade * 0.9, max: maxGrade, color: '#52c41a' },
      { label: 'B (80-89%)', min: maxGrade * 0.8, max: maxGrade * 0.89, color: '#1890ff' },
      { label: 'C (70-79%)', min: maxGrade * 0.7, max: maxGrade * 0.79, color: '#faad14' },
      { label: 'D (60-69%)', min: maxGrade * 0.6, max: maxGrade * 0.69, color: '#fa8c16' },
      { label: 'F (<60%)', min: 0, max: maxGrade * 0.59, color: '#ff4d4f' }
    ];

    const gradeDistribution = gradeRanges.map(range => {
      const count = validSubmissions.filter(s => {
        const grade = Number(s.grade) || 0;
        return grade >= range.min && grade <= range.max;
      }).length;
      
      return {
        ...range,
        count,
        percentage: validSubmissions.length > 0 ? (count / validSubmissions.length * 100) : 0
      };
    });

    // Submission Timeline - với proper validation
    const submissionTimeline = validSubmissions
      .filter(s => s.submittedAt) // Ensure submittedAt exists
      .map(s => ({
        date: moment(s.submittedAt).format('DD/MM'),
        hour: moment(s.submittedAt).hour(),
        isLate: moment(s.submittedAt).isAfter(moment(assignment.dueDate)),
        grade: Number(s.grade) || 0
      }))
      .sort((a, b) => moment(a.date, 'DD/MM').diff(moment(b.date, 'DD/MM')))
      .slice(0, 20); // Limit for performance

    // Performance Insights
    const grades = validSubmissions.map(s => Number(s.grade) || 0);
    const avgGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length || 0;
    const median = grades.length > 0 ? 
      grades.sort((a, b) => a - b)[Math.floor(grades.length / 2)] : 0;
    const highestGrade = Math.max(...grades, 0);
    const lowestGrade = Math.min(...grades, maxGrade);

    // Late Submission Analysis
    const lateSubmissions = validSubmissions.filter(s => 
      s.submittedAt && moment(s.submittedAt).isAfter(moment(assignment.dueDate))
    );

    const calculatedData = {
      overview: {
        totalStudents: assignment.stats?.totalStudents || submissions.length || 0,
        submittedCount: validSubmissions.length,
        gradedCount: validSubmissions.filter(s => s.status === 'graded').length,
        lateCount: lateSubmissions.length,
        avgGrade: Math.round(avgGrade * 10) / 10,
        medianGrade: Math.round(median * 10) / 10,
        highestGrade,
        lowestGrade,
        passingRate: validSubmissions.length > 0 ? 
          (validSubmissions.filter(s => (Number(s.grade) || 0) >= maxGrade * 0.6).length / validSubmissions.length * 100) : 0
      },
      gradeDistribution,
      submissionTimeline,
      performanceInsights: {
        aboveAverage: validSubmissions.filter(s => (Number(s.grade) || 0) > avgGrade).length,
        belowAverage: validSubmissions.filter(s => (Number(s.grade) || 0) < avgGrade).length,
        perfectScores: validSubmissions.filter(s => (Number(s.grade) || 0) === maxGrade).length,
        needsImprovement: validSubmissions.filter(s => (Number(s.grade) || 0) < maxGrade * 0.7).length
      },
      timeAnalysis: {
        submissionsByHour: Array.from({ length: 24 }, (_, hour) => ({
          hour: `${hour}:00`,
          count: validSubmissions.filter(s => 
            s.submittedAt && moment(s.submittedAt).hour() === hour
          ).length
        })),
        submissionsByDay: [
          'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
        ].map((day, index) => ({
          day,
          count: validSubmissions.filter(s => 
            s.submittedAt && moment(s.submittedAt).day() === index
          ).length
        }))
      }
    };

    setAnalyticsData(calculatedData);
  };

  const renderGradeDistributionChart = () => {
    if (!analyticsData?.gradeDistribution || !Array.isArray(analyticsData.gradeDistribution)) {
      return <Empty description="No grade data available" />;
    }

    // Ensure data is properly formatted and is an array
    const chartData = analyticsData.gradeDistribution
      .filter(item => item && typeof item === 'object') // Filter out invalid items
      .map((item, index) => ({
        name: item.label || `Grade ${index + 1}`,
        count: Number(item.count) || 0,
        percentage: Math.round((Number(item.percentage) || 0) * 10) / 10,
        fill: item.color || '#1890ff'
      }));

    // Double check that we have valid array data
    if (!Array.isArray(chartData) || chartData.length === 0) {
      return <Empty description="No valid chart data available" />;
    }

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`pie-cell-${index}-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
            <RechartsTooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <RechartsTooltip />
          <Bar dataKey="count" fill="#1890ff" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderSubmissionTimelineChart = () => {
    if (!analyticsData?.submissionTimeline || analyticsData?.submissionTimeline?.grouped?.length === 0) {
      return <Empty description="No timeline data available" />;
    }

    // Ensure data is properly formatted
    const timelineData = analyticsData?.submissionTimeline?.grouped
      ?.filter(item => item && typeof item === 'object')
      ?.map((item, index) => ({
        date: item.date || `Day ${index + 1}`,
        grade: Number(item.grade) || 0,
        count: Number(item.count) || 1
      }));
    if (timelineData?.length === 0) {
      return <Empty description="No valid timeline data available" />;
    }

    return (
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={timelineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <RechartsTooltip />
          <Area 
            type="monotone" 
            dataKey="grade" 
            stroke="#1890ff" 
            fill="#1890ff" 
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderPerformanceRadar = () => {
    if (!analyticsData?.overview) return <Empty description="No performance data available" />;

    const maxGrade = assignment?.totalPoints || 100;
    const overview = analyticsData.overview;
    
    // Ensure we have valid data
    const avgGrade = Number(overview.avgGrade) || 0;
    const submittedCount = Number(overview.submittedCount) || 0;
    const totalStudents = Number(overview.totalStudents) || 1;
    const lateCount = Number(overview.lateCount) || 0;
    const passingRate = Number(overview.passingRate) || 0;

    const radarData = [
      {
        subject: 'Average Score',
        A: Math.min(Math.round((avgGrade / maxGrade) * 100), 100),
        fullMark: 100
      },
      {
        subject: 'Completion Rate',
        A: Math.min(Math.round((submittedCount / totalStudents) * 100), 100),
        fullMark: 100
      },
      {
        subject: 'Passing Rate',
        A: Math.min(Math.round(passingRate), 100),
        fullMark: 100
      },
      {
        subject: 'On-time Rate',
        A: submittedCount > 0 ? Math.min(Math.round(((submittedCount - lateCount) / submittedCount) * 100), 100) : 0,
        fullMark: 100
      }
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Performance"
            dataKey="A"
            stroke="#1890ff"
            fill="#1890ff"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const getTopPerformers = () => {
    if (!submissions || !Array.isArray(submissions)) {
      return [];
    }

    const validSubmissions = submissions.filter(s => 
      s && 
      s.status !== 'missing' && 
      s.grade !== null && 
      s.grade !== undefined &&
      !isNaN(s.grade)
    );

    if (validSubmissions.length === 0) {
      return [];
    }

    return validSubmissions
      .sort((a, b) => (Number(b.grade) || 0) - (Number(a.grade) || 0))
      .slice(0, 5)
      .map((submission, index) => ({
        rank: index + 1,
        student: submission.student || { fullName: 'Unknown Student' },
        grade: Number(submission.grade) || 0,
        percentage: Math.round(((Number(submission.grade) || 0) / (assignment?.totalPoints || 100)) * 100)
      }));
  };

  const getInsights = () => {
    if (!analyticsData?.overview) return [];

    const insights = [];
    const { overview, performanceInsights } = analyticsData;

    // Class performance insight
    if (overview.passingRate >= 90) {
      insights.push({
        type: 'success',
        icon: <CheckCircleOutlined />,
        title: 'Excellent Class Performance',
        description: `${Math.round(overview.passingRate)}% của lớp đạt điểm đậu. Lớp học hiểu bài rất tốt!`
      });
    } else if (overview.passingRate < 60) {
      insights.push({
        type: 'warning',
        icon: <WarningOutlined />,
        title: 'Needs Review',
        description: `Chỉ ${Math.round(overview.passingRate)}% đạt điểm đậu. Cần xem lại nội dung bài học.`
      });
    }

    // Grade distribution insight
    if (performanceInsights?.perfectScores > 0) {
      insights.push({
        type: 'info',
        icon: <StarOutlined />,
        title: 'Perfect Scores',
        description: `${performanceInsights.perfectScores} học sinh đạt điểm tuyệt đối!`
      });
    }

    // Late submission insight
    if (overview.lateCount > overview.submittedCount * 0.3) {
      insights.push({
        type: 'warning',
        icon: <ClockCircleOutlined />,
        title: 'Many Late Submissions',
        description: `${overview.lateCount} bài nộp muộn (${Math.round((overview.lateCount/overview.submittedCount)*100)}%). Cần nhắc nhở về deadline.`
      });
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spin size="large" />
        <div className="mt-4">
          <Text type="secondary">Đang phân tích dữ liệu assignment...</Text>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Alert
        message="Không có dữ liệu analytics"
        description="Chưa có đủ dữ liệu để phân tích hoặc có lỗi khi tải dữ liệu."
        type="info"
        showIcon
        action={
          <Button size="small" onClick={fetchAnalytics} icon={<ReloadOutlined />}>
            Thử lại
          </Button>
        }
      />
    );
  }

  const topPerformers = getTopPerformers();
  const insights = getInsights();

  return (
    <AnalyticsErrorBoundary onRetry={fetchAnalytics}>
      <div className="assignment-analytics">
        {/* Header Controls */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Title level={3} className="mb-2">
              📊 Assignment Analytics
            </Title>
            <Text type="secondary">
              Phân tích chi tiết về hiệu suất và kết quả bài tập
            </Text>
          </div>
          <Space>
            <Select 
              value={chartType} 
              onChange={setChartType}
              style={{ width: 120 }}
            >
              <Option value="bar">
                <BarChartOutlined /> Bar Chart
              </Option>
              <Option value="pie">
                <PieChartOutlined /> Pie Chart
              </Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchAnalytics}>
              Refresh
            </Button>
          </Space>
        </div>

        {/* Overview Statistics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="Total Students"
                value={analyticsData?.overview?.totalStudents || 0}
                prefix={<UserOutlined className="text-blue-500" />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Progress 
                percent={analyticsData?.overview ? Math.round((analyticsData.overview.submittedCount / analyticsData.overview.totalStudents) * 100) : 0} 
                size="small" 
                status="active"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="Average Grade"
                value={analyticsData?.overview?.avgGrade || 0}
                suffix={`/${assignment?.totalPoints || 100}`}
                prefix={<TrophyOutlined className="text-gold" />}
                valueStyle={{ 
                  color: (analyticsData?.overview?.avgGrade || 0) >= (assignment?.totalPoints || 100) * 0.7 ? '#52c41a' : '#faad14' 
                }}
              />
              <Text type="secondary">
                Median: {analyticsData?.overview?.medianGrade || 0}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="Passing Rate"
                value={Math.round(analyticsData?.overview?.passingRate || 0)}
                suffix="%"
                prefix={<CheckCircleOutlined className="text-green-500" />}
                valueStyle={{ 
                  color: (analyticsData?.overview?.passingRate || 0) >= 70 ? '#52c41a' : '#ff4d4f' 
                }}
              />
              <Text type="secondary">
                {(analyticsData?.overview?.submittedCount || 0) - Math.round(((analyticsData?.overview?.passingRate || 0)/100) * (analyticsData?.overview?.submittedCount || 0))} need improvement
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="Late Submissions"
                value={analyticsData?.overview?.lateCount || 0}
                suffix={`/${analyticsData?.overview?.submittedCount || 0}`}
                prefix={<ClockCircleOutlined className="text-orange-500" />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <Text type="secondary">
                {Math.round(((analyticsData?.overview?.lateCount || 0)/(analyticsData?.overview?.submittedCount || 1))*100) || 0}% late rate
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Enhanced Insights with AI-powered recommendations */}
        <div className="mb-6">
          <AnalyticsInsights 
            analyticsData={analyticsData} 
            assignment={assignment}
          />
        </div>

        <Row gutter={[24, 24]}>
          {/* Grade Distribution */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <BarChartOutlined className="text-blue-500" />
                  <span>Grade Distribution</span>
                  <Badge count={analyticsData?.overview?.gradedCount || 0} showZero color="#52c41a" />
                </div>
              }
              extra={
                <Space>
                  <Tag color="blue">
                    Avg: {analyticsData?.overview?.avgGrade || 0}/{assignment?.totalPoints || 100}
                  </Tag>
                </Space>
              }
            >
              {renderGradeDistributionChart()}
              <Divider />
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Highest"
                    value={analyticsData?.overview?.highestGrade || 0}
                    prefix={<RiseOutlined className="text-green-500" />}
                    valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Lowest"
                    value={analyticsData?.overview?.lowestGrade || 0}
                    prefix={<FallOutlined className="text-red-500" />}
                    valueStyle={{ color: '#ff4d4f', fontSize: '16px' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Performance Radar */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <RadarChartOutlined className="text-purple-500" />
                  <span>Performance Overview</span>
                </div>
              }
            >
              {renderPerformanceRadar()}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData?.overview ? Math.round((analyticsData.overview.submittedCount / analyticsData.overview.totalStudents) * 100) : 0}%
                  </div>
                  <Text type="secondary">Completion Rate</Text>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData?.overview ? Math.round(((analyticsData.overview.submittedCount - analyticsData.overview.lateCount) / analyticsData.overview.submittedCount) * 100) || 0 : 0}%
                  </div>
                  <Text type="secondary">On-time Rate</Text>
                </div>
              </div>
            </Card>
          </Col>

          {/* Top Performers */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <StarOutlined className="text-gold" />
                  <span>Top Performers</span>
                </div>
              }
            >
              {topPerformers.length > 0 ? (
                <List
                  size="small"
                  dataSource={topPerformers}
                  renderItem={(item, index) => (
                    <List.Item key={`top-performer-${index}-${item.student?._id || item.student?.id || index}`}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Badge count={item.rank} color={
                            item.rank === 1 ? '#faad14' : 
                            item.rank === 2 ? '#d9d9d9' : 
                            item.rank === 3 ? '#cd7f32' : '#1890ff'
                          } />
                          <div>
                            <Text strong>
                              {typeof item.student === 'object' 
                                ? item.student?.fullName || item.student?.name || 'Unknown Student'
                                : String(item.student || 'Unknown Student')
                              }
                            </Text>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">
                            {item.grade}/{assignment?.totalPoints || 100}
                          </div>
                          <Text type="secondary" className="text-xs">
                            {item.percentage}%
                          </Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="No graded submissions yet" />
              )}
            </Card>
          </Col>

          {/* Grade Range Breakdown */}
          <Col xs={24} lg={16}>
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <PieChartOutlined className="text-green-500" />
                  <span>Detailed Grade Breakdown</span>
                </div>
              }
            >
              {analyticsData?.gradeDistribution && Array.isArray(analyticsData.gradeDistribution) ? (
                <Table
                  size="small"
                  dataSource={analyticsData.gradeDistribution.map((item, index) => ({
                    ...item,
                    key: `grade-${index}-${item.label?.replace(/\s+/g, '-') || 'unknown'}`
                  }))}
                  columns={[
                    {
                      title: 'Grade Range',
                      dataIndex: 'label',
                      key: 'label',
                      render: (text, record) => (
                        <Tag color={record.color || '#1890ff'}>{text || 'Unknown'}</Tag>
                      )
                    },
                    {
                      title: 'Count',
                      dataIndex: 'count',
                      key: 'count',
                      align: 'center',
                      render: (count) => <Badge count={Number(count) || 0} showZero color="#1890ff" />
                    },
                    {
                      title: 'Percentage',
                      dataIndex: 'percentage',
                      key: 'percentage',
                      align: 'center',
                      render: (percentage) => `${Math.round((Number(percentage) || 0) * 10) / 10}%`
                    },
                    {
                      title: 'Progress',
                      key: 'progress',
                      render: (_, record) => (
                        <Progress 
                          percent={Math.round(Number(record.percentage) || 0)} 
                          size="small" 
                          strokeColor={record.color || '#1890ff'}
                          showInfo={false}
                        />
                      )
                    }
                  ]}
                  pagination={false}
                  className="grade-breakdown-table"
                />
              ) : (
                <Empty description="No grade breakdown data available" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Additional Analytics Row */}
        {analyticsData?.timeAnalysis && (
          <Row gutter={[24, 24]} className="mt-6">
            {/* Submission Timeline */}
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <div className="flex items-center gap-2">
                    <LineChartOutlined className="text-indigo-500" />
                    <span>Submission Timeline</span>
                  </div>
                }
              >
                {renderSubmissionTimelineChart()}
              </Card>
            </Col>

            {/* Time Statistics */}
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <div className="flex items-center gap-2">
                    <CalendarOutlined className="text-orange-500" />
                    <span>Submission Patterns</span>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div>
                    <Text strong>Peak Submission Hour:</Text>
                    <div className="mt-1">
                      {(() => {
                        const peakHour = analyticsData.timeAnalysis.submissionsByHour
                          ?.reduce((max, hour) => (hour.count || 0) > (max.count || 0) ? hour : max, { count: 0, hour: '00:00' });
                        return (
                          <Tag color="blue" icon={<ClockCircleOutlined />}>
                            {peakHour.hour} ({peakHour.count} submissions)
                          </Tag>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <Text strong>Most Active Day:</Text>
                    <div className="mt-1">
                      {(() => {
                        const peakDay = analyticsData.timeAnalysis.submissionsByDay
                          ?.reduce((max, day) => (day.count || 0) > (max.count || 0) ? day : max, { count: 0, day: 'Monday' });
                        return (
                          <Tag color="green" icon={<CalendarOutlined />}>
                            {peakDay.day} ({peakDay.count} submissions)
                          </Tag>
                        );
                      })()}
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <Text type="secondary">Submission Speed:</Text>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Early Birds (&gt;3 days before):</span>
                        <Badge count={
                          submissions?.filter(s => 
                            s.submittedAt && assignment?.dueDate &&
                            moment(assignment.dueDate).diff(moment(s.submittedAt), 'days') > 3
                          ).length || 0
                        } color="#52c41a" />
                      </div>
                      <div className="flex justify-between">
                        <span>Last Minute (same day):</span>
                        <Badge count={
                          submissions?.filter(s => 
                            s.submittedAt && assignment?.dueDate &&
                            moment(s.submittedAt).isSame(moment(assignment.dueDate), 'day')
                          ).length || 0
                        } color="#faad14" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </AnalyticsErrorBoundary>
  );
};

export default AssignmentAnalytics;