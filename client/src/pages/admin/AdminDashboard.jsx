import React from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Progress,
  Typography,
  Space,
  Divider,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  DatabaseOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { Pie, Column, Area, Line } from "@ant-design/charts";

const { Title, Text } = Typography;

const AdminDashboard = () => {
  // Mock data - replace with actual API calls
  const statistics = {
    totalUsers: 150,
    totalClassrooms: 25,
    totalAssignments: 80,
    totalQuizzes: 100,
    totalQuestions: 500,
    totalStorage: 2048, // MB
  };

  const recentActivities = [
    {
      key: "1",
      type: "user",
      action: "Người dùng mới đăng ký",
      details: "Nguyễn Văn An đã tham gia với vai trò Học sinh",
      time: "2 giờ trước",
      status: "success",
      icon: "👤",
      color: "#52c41a",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=An",
    },
    {
      key: "2",
      type: "classroom",
      action: "Lớp học mới được tạo",
      details: "WDP301 - Phát triển Web được tạo bởi GV. Trần Minh",
      time: "3 giờ trước",
      status: "success",
      icon: "🏫",
      color: "#1890ff",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Minh",
    },
    {
      key: "3",
      type: "quiz",
      action: "Bài kiểm tra mới được tạo",
      details: "Kiểm tra giữa kỳ - WDP301 (30 câu hỏi, 60 phút)",
      time: "5 giờ trước",
      status: "warning",
      icon: "📝",
      color: "#faad14",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Quiz",
    },
    {
      key: "4",
      type: "question",
      action: "Câu hỏi mới được thêm",
      details: "15 câu hỏi trắc nghiệm được thêm vào Ngân hàng câu hỏi",
      time: "8 giờ trước",
      status: "success",
      icon: "❓",
      color: "#722ed1",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Question",
    },
    {
      key: "5",
      type: "assignment",
      action: "Bài tập mới được giao",
      details: "Bài tập thực hành React Hooks - Hạn nộp: 25/12/2024",
      time: "12 giờ trước",
      status: "info",
      icon: "📚",
      color: "#13c2c2",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Assignment",
    },
    {
      key: "6",
      type: "submission",
      action: "Bài nộp mới",
      details: "Lê Thị Hoa đã nộp bài tập JavaScript Advanced",
      time: "1 ngày trước",
      status: "success",
      icon: "✅",
      color: "#52c41a",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hoa",
    },
  ];

  // Mock user activity data for charts
  const loginData = [
    { day: "T2", logins: 120 },
    { day: "T3", logins: 98 },
    { day: "T4", logins: 150 },
    { day: "T5", logins: 80 },
    { day: "T6", logins: 170 },
    { day: "T7", logins: 60 },
    { day: "CN", logins: 30 },
  ];


  const submissionRate = 0.85;
  const storageUsage = 0.65;

  const userRoleData = [
    { type: "Admin", value: 5 },
    { type: "Giáo viên", value: 25 },
    { type: "Học sinh", value: 120 },
  ];

  // New demographic data
  const ageDistributionData = [
    { ageGroup: "18-22", count: 45, percentage: 30 },
    { ageGroup: "23-27", count: 38, percentage: 25.3 },
    { ageGroup: "28-32", count: 32, percentage: 21.3 },
    { ageGroup: "33-37", count: 20, percentage: 13.3 },
    { ageGroup: "38+", count: 15, percentage: 10 },
  ];

  const genderData = [
    { type: "Nam", value: 85, percentage: 56.7 },
    { type: "Nữ", value: 62, percentage: 41.3 },
    { type: "Khác", value: 3, percentage: 2 },
  ];

  // New Mock Data
  const userGrowthData = [
    { month: "Thg 1", count: 60 },
    { month: "Thg 2", count: 85 },
    { month: "Thg 3", count: 75 },
    { month: "Thg 4", count: 110 },
    { month: "Thg 5", count: 130 },
    { month: "Thg 6", count: 150 },
  ];

  const submissionStatusData = [
    { type: "Đúng hạn", value: 270 },
    { type: "Trễ hạn", value: 45 },
    { type: "Chưa nộp", value: 20 },
  ];

  // Column chart config for login activity
  const loginColumnConfig = {
    data: loginData,
    xField: "day",
    yField: "logins",
    height: 250,
    color: ({ logins }) => {
      if (logins >= 150) return '#52c41a';
      if (logins >= 100) return '#1890ff';
      return '#faad14';
    },
    label: {
      position: "top",
      style: { 
        fill: "#fff",
        fontSize: 13,
        fontWeight: '600',
      },
    },
    columnStyle: {
      radius: [4, 4, 0, 0],
      shadowColor: 'rgba(24, 144, 255, 0.2)',
      shadowBlur: 8,
      shadowOffsetY: 2,
    },
    yAxis: {
      grid: { 
        line: { 
          style: { 
            stroke: "#e5e5e5", 
            lineDash: [4, 4],
            strokeOpacity: 0.6,
          } 
        } 
      },
      label: {
        style: {
          fill: '#666',
          fontSize: 11,
        },
      },
    },
    xAxis: {
      label: {
        style: {
          fill: '#666',
          fontSize: 12,
          fontWeight: '500',
        },
      },
    },
    animation: {
      appear: {
        animation: 'wave-in',
        duration: 1000,
      },
    },
  };


  const statCards = [
    {
      title: "Tổng số người dùng",
      value: statistics.totalUsers,
      icon: <UserOutlined />,
      color: "#1890ff",
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Tổng số lớp học",
      value: statistics.totalClassrooms,
      icon: <TeamOutlined />,
      color: "#52c41a",
      bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      trend: "+5%",
      trendUp: true,
    },
    {
      title: "Tổng số bài tập",
      value: statistics.totalAssignments,
      icon: <FileTextOutlined />,
      color: "#722ed1",
      bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Tổng số bài kiểm tra",
      value: statistics.totalQuizzes,
      icon: <QuestionCircleOutlined />,
      color: "#fa8c16",
      bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      trend: "+15%",
      trendUp: true,
    },
    {
      title: "Tổng số câu hỏi",
      value: statistics.totalQuestions,
      icon: <DatabaseOutlined />,
      color: "#eb2f96",
      bg: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
      trend: "+20%",
      trendUp: true,
    },
    {
      title: "Dung lượng đã sử dụng",
      value: `${statistics.totalStorage} MB`,
      icon: <DatabaseOutlined />,
      color: "#13c2c2",
      bg: "linear-gradient(135deg, #3fe3dc 0%, #eea3bc 70%)",
      trend: "+3%",
      trendUp: false,
    },
  ];

  // Fixed Area Chart Config
  const userGrowthConfig = {
    data: userGrowthData,
    xField: "month",
    yField: "count",
    height: 300,
    smooth: true,
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
      fillOpacity: 0.6,
      shadowColor: 'rgba(24, 144, 255, 0.3)',
      shadowBlur: 20,
      shadowOffsetY: 10,
    },
    line: {
      color: "#1890ff",
      size: 3,
      shadowColor: 'rgba(24, 144, 255, 0.5)',
      shadowBlur: 10,
    },
    point: {
      size: 6,
      shape: "circle",
      style: {
        fill: "white",
        stroke: "#1890ff",
        lineWidth: 3,
        shadowColor: 'rgba(24, 144, 255, 0.4)',
        shadowBlur: 8,
      },
    },
    yAxis: {
      grid: {
        line: {
          style: {
            stroke: "#e5e5e5",
            lineDash: [4, 4],
            strokeOpacity: 0.6,
          },
        },
      },
      label: {
        style: {
          fill: '#666',
          fontSize: 11,
        },
      },
    },
    xAxis: {
      label: {
        style: {
          fill: '#666',
          fontSize: 12,
          fontWeight: '500',
        },
      },
    },
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1500,
      },
    },
    tooltip: {
      title: (datum) => ` ${datum.month}`,
      items: [
        (datum) => ({
          color: '#722ed1',
          name: '📊 Số lượng',
          value: `${datum.count} người`,
        }),
      ],
    },
  };

  const submissionStatusConfig = {
    data: submissionStatusData,
    angleField: "value",
    colorField: "type",
    height: 300,
    radius: 0.9,
    innerRadius: 0.6,
    color: ["#52c41a", "#faad14", "#f5222d"],
    label: {
      offset: "-50%",
      content: (data) => `${data.value}`,
      style: {
        textAlign: "center",
        fontSize: 14,
        fill: "#fff",
        fontWeight: "bold",
      },
    },
    legend: { position: "bottom" },
    interactions: [{ type: "element-selected" }],
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: "pre-wrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontSize: 24,
          fontWeight: "bold",
        },
        content: `${submissionStatusData.reduce(
          (acc, curr) => acc + curr.value,
          0
        )}\nTổng cộng`,
      },
    },
  };

  const userRoleConfig = {
    data: userRoleData,
    angleField: "value",
    colorField: "type",
    radius: 0.85,
    height: 250,
    color: ["#ff7875", "#73d13d", "#40a9ff"],
    label: {
      offset: "-50%",
      content: (data) => data.value,
      style: {
        textAlign: "center",
        fontSize: 14,
        fontWeight: 'bold',
        fill: 'white',
      },
    },
    legend: { 
      position: "bottom",
      itemSpacing: 16,
      marker: {
        symbol: 'circle',
        size: 8,
      },
    },
    pieStyle: {
      stroke: '#fff',
      strokeWidth: 2,
      shadowColor: 'rgba(0,0,0,0.1)',
      shadowBlur: 10,
      shadowOffsetY: 3,
    },
    interactions: [
      { type: "element-selected" },
      { type: "element-highlight" }
    ],
    animation: {
      appear: {
        animation: 'grow-in-x',
        duration: 1200,
      },
    },
  };

  // Age distribution chart config
  const ageDistributionConfig = {
    data: ageDistributionData,
    xField: "ageGroup",
    yField: "count",
    height: 280,
    color: ({ count }) => {
      if (count >= 40) return '#722ed1';
      if (count >= 30) return '#9254de'; 
      return '#b37feb';
    },
    label: {
      position: "top",
      style: { 
        fill: "#fff", 
        fontSize: 14,
        fontWeight: '600',
      },
      formatter: (datum) => `${datum}`,
    },
    columnStyle: {
      radius: [6, 6, 0, 0],
      stroke: '#722ed1',
      strokeWidth: 1,
      shadowColor: 'rgba(114, 46, 209, 0.3)',
      shadowBlur: 10,
      shadowOffsetY: 3,
    },
    yAxis: {
      grid: { 
        line: { 
          style: { 
            stroke: "#e5e5e5", 
            lineDash: [4, 4],
            strokeOpacity: 0.7,
          } 
        } 
      },
      label: {
        style: {
          fill: '#666',
          fontSize: 11,
        },
      },
    },
    xAxis: {
      label: {
        style: {
          fill: '#666',
          fontSize: 12,
          fontWeight: '500',
        },
      },
    },
      tooltip: {
        title: (datum) => `👥 Nhóm tuổi: ${datum.ageGroup}`,
        items: [
          (datum) => ({
            color: '#722ed1',
            name: '📊 Số lượng',
            value: `${datum.count} người (${datum.percentage}%)`,
          }),
        ],
        domStyles: {
          'g2-tooltip': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            color: 'white',
            fontSize: '13px',
            padding: '16px 20px',
          },
          'g2-tooltip-title': {
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '8px',
          },
          'g2-tooltip-list-item': {
            color: 'rgba(255,255,255,0.9)',
            margin: '4px 0',
          },
        },
      }
    
  };

  // Gender distribution chart config
  const genderConfig = {
    data: genderData,
    angleField: "value",
    colorField: "type",
    height: 280,
    radius: 0.9,
    innerRadius: 0.5,
    color: ["#1890ff", "#ff4d4f", "#52c41a"],
    label: {
      text: (datum) => `${datum.percentage}%`,
      style: {
        fontWeight: 'bold',
        fontSize: 12,
        fill: 'white',
        textAlign: 'center',
      },
    },
    legend: {
      color: {
        title: false,
        position: 'bottom',
        rowPadding: 8,
        itemSpacing: 20,
        marker: {
          symbol: 'circle',
          size: 8,
        },
      },
    },
    tooltip: {
      title: (datum) => {
        const getGenderIcon = (type) => {
          switch(type) {
            case 'Nam': return '👨';
            case 'Nữ': return '👩';
            case 'Khác': return '👤';
            default: return '👤';
          }
        };
        return `${getGenderIcon(datum.type)} Giới tính: ${datum.type}`;
      },
      items: [
        (datum) => ({
          color: datum.type === 'Nam' ? '#1890ff' : datum.type === 'Nữ' ? '#ff4d4f' : '#52c41a',
          name: '👥 Số lượng',
          value: `${datum.value} người (${datum.percentage}%)`,
        }),
      ],
      domStyles: {
        'g2-tooltip': {
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          border: 'none',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          color: 'white',
          fontSize: '13px',
          padding: '16px 20px',
        },
        'g2-tooltip-title': {
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '8px',
        },
        'g2-tooltip-list-item': {
          color: 'rgba(255,255,255,0.9)',
          margin: '4px 0',
        },
      },
    },
    statistic: {
      title: {
        style: {
          fontSize: 16,
          color: "#666",
          fontWeight: 'normal',
        },
        content: "Tổng cộng",
      },
      content: {
        style: {
          fontSize: 28,
          fontWeight: "bold",
          color: "#1890ff",
        },
        content: `${genderData.reduce((acc, curr) => acc + curr.value, 0)}`,
      },
    }
  };

  const activityColumns = [
    {
      title: "",
      dataIndex: "avatar",
      key: "avatar",
      width: 60,
      render: (text, record) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${record.color}20, ${record.color}40)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            border: `2px solid ${record.color}30`,
            boxShadow: `0 4px 12px ${record.color}20`,
          }}>
            {record.icon}
          </div>
          <div style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: record.color,
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }} />
        </div>
      ),
    },
    {
      title: "Hoạt động",
      dataIndex: "action",
      key: "action",
      render: (text, record) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: '#262626',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
          }}>
            {text}
            <Tag 
              color={record.status === 'success' ? 'success' : 
                     record.status === 'warning' ? 'warning' : 
                     record.status === 'info' ? 'processing' : 'default'}
              style={{ 
                marginLeft: '8px',
                fontSize: '10px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '12px',
              }}
            >
              {record.status === 'success' ? 'Thành công' : 
               record.status === 'warning' ? 'Cảnh báo' : 
               record.status === 'info' ? 'Thông tin' : 'Mặc định'}
            </Tag>
          </div>
          <Text 
            type="secondary" 
            style={{ 
              fontSize: '13px',
              lineHeight: '1.4',
              display: 'block',
            }}
          >
            {record.details}
          </Text>
        </div>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      width: 120,
      render: (text) => (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'linear-gradient(135deg, #f6f9fc, #e9f4ff)',
          borderRadius: '8px',
          border: '1px solid #e1e8f0',
        }}>
          <ClockCircleOutlined style={{ 
            color: "#1890ff", 
            fontSize: '14px',
            marginBottom: '4px',
          }} />
          <Text 
            style={{ 
              fontSize: '12px',
              fontWeight: '500',
              color: '#595959',
              textAlign: 'center',
              lineHeight: '1.2',
            }}
          >
            {text}
          </Text>
        </div>
      ),
    },
  ];

  const SectionTitle = ({ icon, children }) => (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
      {icon}
      <Title
        level={4}
        style={{ margin: 0, marginLeft: 12, color: "#2c3e50", fontWeight: 600 }}
      >
        {children}
      </Title>
    </div>
  );

  return (
    <div
      style={{
        padding: "24px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 20%, #f093fb 40%, #f5576c 60%, #4facfe 80%, #00f2fe 100%)",
        minHeight: "calc(100vh - 112px)",
        position: "relative",
      }}
    >
      {/* Background overlay for better readability */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          zIndex: 0,
        }}
      />
      
      {/* Content wrapper */}
      <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: "#1a1a1a" }}>
          <TrophyOutlined style={{ color: "#faad14", marginRight: 12 }} />
          Admin Dashboard
        </Title>
        <Text type="secondary">
          Welcome back! Here's what's happening with your system.
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[20, 20]}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={8} xl={8} key={index}>
            <Card
              style={{
                background: card.bg,
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                overflow: "hidden",
              }}
              bodyStyle={{ padding: "20px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <Text
                    style={{ color: "rgba(255,255,255)", fontSize: "14px" }}
                  >
                    {card.title}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text
                      style={{
                        color: "white",
                        fontSize: "28px",
                        fontWeight: "bold",
                      }}
                    >
                      {card.value}
                    </Text>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {card.trendUp ? (
                      <RiseOutlined
                        style={{ color: "#52c41a", marginRight: 4 }}
                      />
                    ) : (
                      <FallOutlined
                        style={{ color: "#ff4d4f", marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={{
                        color: "rgba(255,255,255,1)",
                        fontSize: "12px",
                      }}
                    >
                      {card.trend} from last month
                    </Text>
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {React.cloneElement(card.icon, {
                    style: { fontSize: "24px", color: "white" },
                  })}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Progress Section */}
      <Row gutter={[16, 16]} style={{ marginTop: 32, marginBottom: 32 }}>
        <Col span={12}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                <span>Submission Rate</span>
              </Space>
            }
            style={{
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Progress
                type="circle"
                percent={submissionRate * 100}
                format={(percent) => `${percent}%`}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
                size={120}
              />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Overall assignment submission rate</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={
              <Space>
                <DatabaseOutlined style={{ color: "#1890ff" }} />
                <span>Storage Usage</span>
              </Space>
            }
            style={{
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Progress
                type="circle"
                percent={storageUsage * 100}
                format={(percent) => `${percent}%`}
                strokeColor={{
                  "0%": "#ff4d4f",
                  "100%": "#fa8c16",
                }}
                size={120}
              />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  {statistics.totalStorage} MB of 3 GB used
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <div style={{ marginBottom: 32 }}>
        <SectionTitle
          icon={
            <LineChartOutlined style={{ fontSize: 22, color: "#52c41a" }} />
          }
        >
          Chỉ số hiệu suất
        </SectionTitle>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Card
              style={{
                borderRadius: 16,
                boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                height: "100%",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 16,
                }}
              >
                <AreaChartOutlined
                  style={{ color: "#1890ff", marginRight: 8 }}
                />
                Tăng trưởng người dùng (6 tháng qua)
              </Text>
              <Area {...userGrowthConfig} />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card
              style={{
                borderRadius: 16,
                boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                height: "100%",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 16,
                }}
              >
                <PieChartOutlined
                  style={{ color: "#52c41a", marginRight: 8 }}
                />
                Tình trạng nộp bài
              </Text>
              <Pie {...submissionStatusConfig} />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Hoạt động trong tuần */}
      <div style={{ marginBottom: 32 }}>
        <SectionTitle
          icon={
            <LineChartOutlined style={{ fontSize: 22, color: "#1890ff" }} />
          }
        >
          Hoạt động trong tuần
        </SectionTitle>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              style={{
                borderRadius: 16,
                boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                height: "100%",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 16,
                }}
              >
                <LineChartOutlined
                  style={{ color: "#1890ff", marginRight: 8 }}
                />
                Hoạt động đăng nhập hàng tuần
              </Text>
              <Column {...loginColumnConfig} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              style={{
                borderRadius: 16,
                boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                height: "100%",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 16,
                }}
              >
                <PieChartOutlined
                  style={{ color: "#52c41a", marginRight: 8 }}
                />
                Phân bổ vai trò người dùng
              </Text>
              <Pie {...userRoleConfig} />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Demographic Statistics */}
      <div style={{ marginBottom: 32 }}>
        <SectionTitle
          icon={
            <UserOutlined style={{ fontSize: 22, color: "#eb2f96" }} />
          }
        >
          Thống kê nhân khẩu học
        </SectionTitle>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              style={{
                borderRadius: 16,
                boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                height: "100%",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 16,
                }}
              >
                <BarChartOutlined
                  style={{ color: "#722ed1", marginRight: 8 }}
                />
                Phân bố theo độ tuổi
              </Text>
              <Column {...ageDistributionConfig} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              style={{
                borderRadius: 16,
                boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                height: "100%",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 16,
                }}
              >
                <PieChartOutlined
                  style={{ color: "#1890ff", marginRight: 8 }}
                />
                Phân bố theo giới tính
              </Text>
              <Pie {...genderConfig} />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Recent Activities */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(118, 75, 162, 0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '12px',
              marginRight: '16px',
            }}>
              <ClockCircleOutlined style={{ 
                fontSize: 24, 
                color: "white",
              }} />
            </div>
            <div>
              <Title level={3} style={{ 
                margin: 0, 
                color: 'white',
                fontWeight: '600',
              }}>
                Hoạt động gần đây
              </Title>
              <Text style={{ 
                color: 'rgba(255,255,255,0.8)',
                fontSize: '14px',
              }}>
                Theo dõi các hoạt động mới nhất trong hệ thống
              </Text>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '20px',
            padding: '8px 16px',
            backdropFilter: 'blur(10px)',
          }}>
            <Text style={{ 
              color: 'white',
              fontSize: '12px',
              fontWeight: '500',
            }}>
              🔄 Cập nhật realtime
            </Text>
          </div>
        </div>
        
        <Card
          style={{
            borderRadius: 16,
            boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(25px)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            overflow: 'hidden',
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={activityColumns}
            dataSource={recentActivities}
            pagination={{ 
              pageSize: 6,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} của ${total} hoạt động`,
              style: {
                padding: '16px 24px',
                background: '#fafafa',
                borderTop: '1px solid #f0f0f0',
              }
            }}
            size="middle"
            showHeader={false}
            rowClassName={(record, index) => 
              index % 2 === 0 ? 'activity-row-even' : 'activity-row-odd'
            }
            onRow={(record, index) => ({
              style: {
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.15)';
                e.currentTarget.style.backgroundColor = '#f0f8ff';
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fafafa' : 'white';
              },
            })}
            style={{
              background: 'white',
            }}
          />
        </Card>
      </div>
      </div> {/* Close content wrapper */}
    </div>
  );
};

export default AdminDashboard;
