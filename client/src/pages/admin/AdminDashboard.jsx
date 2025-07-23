import React, { useState, useEffect } from "react";
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
  Spin,
  message,
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
import adminAPI from "../../services/api/admin.api";

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalClassrooms: 0,
    totalAssignments: 0,
    totalQuizzes: 0,
    totalQuestions: 0,
    totalStorage: 0,
    currentMonthStats: { users: 0, classrooms: 0, assignments: 0, quizzes: 0, questions: 0, storage: 0 },
    previousMonthStats: { users: 0, classrooms: 0, assignments: 0, quizzes: 0, questions: 0, storage: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [userRoleData, setUserRoleData] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [ageDistributionData, setAgeDistributionData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [verificationData, setVerificationData] = useState([]);
  const [submissionStatusData, setSubmissionStatusData] = useState([]);
  const [assignmentOverviewData, setAssignmentOverviewData] = useState({});
  const [loginData, setLoginData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

    const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getDashboardStats();
      console.log('Dashboard API Response:', response);
      
      if (response && response.data) {
        // Sử dụng data từ API response
        const apiData = response.data;
        setStatistics(apiData);
        setRecentActivities(apiData.recentActivities || []);
        setUserRoleData(apiData.userRoleData || []);
        setGenderData(apiData.genderData || []);
        setAgeDistributionData(apiData.ageDistributionData || []);
        setUserGrowthData(apiData.userGrowthData || []);
        setVerificationData(apiData.verifiedData || []);
        setSubmissionStatusData(apiData.submissionStatusData || []);
        setAssignmentOverviewData(apiData.assignmentOverview || {});
        setLoginData(apiData.loginData || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu dashboard:', error);
      setError('Không thể tải dữ liệu dashboard');
      // Fallback data nếu API fails
      setStatistics({
        totalUsers: 0,
        totalClassrooms: 0, 
        totalAssignments: 0,
        totalQuizzes: 0,
        totalQuestions: 0,
        totalStorage: 0,
        currentMonthStats: { users: 0, classrooms: 0, assignments: 0, quizzes: 0, questions: 0, storage: 0 },
        previousMonthStats: { users: 0, classrooms: 0, assignments: 0, quizzes: 0, questions: 0, storage: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate trends from API data
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return { trend: "N/A", trendUp: true };
    const percentage = ((current - previous) / previous) * 100;
    return {
      trend: percentage > 0 ? `+${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`,
      trendUp: percentage >= 0
    };
  };

  // Get trend data from API or use default values
  const userTrend = calculateTrend(
    statistics.currentMonthStats?.users || 0, 
    statistics.previousMonthStats?.users || 0
  );
  const classroomTrend = calculateTrend(
    statistics.currentMonthStats?.classrooms || 0, 
    statistics.previousMonthStats?.classrooms || 0
  );
  const assignmentTrend = calculateTrend(
    statistics.currentMonthStats?.assignments || 0, 
    statistics.previousMonthStats?.assignments || 0
  );
  const quizTrend = calculateTrend(
    statistics.currentMonthStats?.quizzes || 0, 
    statistics.previousMonthStats?.quizzes || 0
  );
  const questionTrend = calculateTrend(
    statistics.currentMonthStats?.questions || 0, 
    statistics.previousMonthStats?.questions || 0
  );
  const storageTrend = calculateTrend(
    statistics.currentMonthStats?.storage || 0, 
    statistics.previousMonthStats?.storage || 0
  );

  // Format storage size
  const formatStorageSize = (sizeInMB) => {
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1024)} KB`;
    } else if (sizeInMB < 1024) {
      return `${sizeInMB.toFixed(2)} MB`;
    } else {
      return `${(sizeInMB / 1024).toFixed(2)} GB`;
    }
  };

  // Process recent activities from API data
  const getActivityIcon = (type) => {
    switch (type) {
      case 'user': return '👤';
      case 'classroom': return '🏫';
      case 'quiz': return '📝';
      case 'question': return '❓';
      case 'assignment': return '📚';
      case 'submission': return '✅';
      default: return '📋';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user': return '#52c41a';
      case 'classroom': return '#1890ff';
      case 'quiz': return '#faad14';
      case 'question': return '#722ed1';
      case 'assignment': return '#13c2c2';
      case 'submission': return '#52c41a';
      default: return '#666';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  // Process activities with state data
  const processedActivities = recentActivities?.map((activity, index) => ({
    key: index.toString(),
    type: activity.type,
    action: activity.action,
    details: activity.details,
    time: formatTimeAgo(activity.time),
    status: "success",
    icon: getActivityIcon(activity.type),
    color: getActivityColor(activity.type),
    avatar: activity.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${index}`,
  })) || [];

  // Calculate submission rate from real data (only count actual submissions, not auto-graded)
  const calculateSubmissionRate = () => {
    // Ưu tiên sử dụng assignmentOverviewData nếu có
    if (assignmentOverviewData && assignmentOverviewData.totalPossibleSubmissions > 0) {
      // totalActualSubmissions đã được sửa trong backend để chỉ tính bài thực sự nộp
      return assignmentOverviewData.totalActualSubmissions / assignmentOverviewData.totalPossibleSubmissions;
    }
    
    // Fallback: tính từ submissionStatusData, loại trừ "Không nộp (Tự chấm)"
    const data = submissionStatusData.length > 0 ? submissionStatusData : [
      { type: "Đúng hạn", value: 270 },
      { type: "Trễ hạn", value: 45 },
      { type: "Chưa nộp", value: 20 },
    ];
    
    const totalSubmissions = data.reduce((acc, curr) => acc + curr.value, 0);
    // Chỉ tính những bài thực sự được nộp (không bao gồm tự chấm)
    const actuallySubmitted = data.filter(item => 
      item.type === "Đúng hạn" || item.type === "Trễ hạn" || 
      (item.type === "Đã chấm điểm" && !item.type.includes("Tự chấm"))
    ).reduce((acc, curr) => acc + curr.value, 0);
    
    return totalSubmissions > 0 ? (actuallySubmitted / totalSubmissions) : 0.85;
  };

  // Calculate storage usage from real data  
  const calculateStorageUsage = () => {
    // Giả sử limit storage là 1GB = 1024MB
    const storageLimit = 1024; // 1GB in MB
    const currentStorage = statistics.totalStorage || 0;
    return currentStorage > 0 ? Math.min(currentStorage / storageLimit, 1) : 0.65;
  };

  const submissionRate = calculateSubmissionRate();
  const storageUsage = calculateStorageUsage();

  // Column chart config for login activity
  const loginColumnConfig = {
    data: loginData.length > 0 ? loginData : [
      { day: "T2", logins: 120 },
      { day: "T3", logins: 98 },
      { day: "T4", logins: 150 },
      { day: "T5", logins: 80 },
      { day: "T6", logins: 170 },
      { day: "T7", logins: 60 },
      { day: "CN", logins: 30 },
    ],
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
      title: "Tổng người dùng",
      value: statistics.totalUsers,
      icon: <UserOutlined />,
      color: "#1890ff",
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      trend: userTrend.trend,
      trendUp: userTrend.trendUp,
    },
    {
      title: "Tổng lớp học",
      value: statistics.totalClassrooms,
      icon: <TeamOutlined />,
      color: "#52c41a",
      bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      trend: classroomTrend.trend,
      trendUp: classroomTrend.trendUp,
    },
    {
      title: "Tổng bài tập",
      value: statistics.totalAssignments,
      icon: <FileTextOutlined />,
      color: "#722ed1",
      bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      trend: assignmentTrend.trend,
      trendUp: assignmentTrend.trendUp,
    },
    {
      title: "Tổng bài kiểm tra",
      value: statistics.totalQuizzes,
      icon: <QuestionCircleOutlined />,
      color: "#fa8c16",
      bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      trend: quizTrend.trend,
      trendUp: quizTrend.trendUp,
    },
    {
      title: "Tổng câu hỏi",
      value: statistics.totalQuestions,
      icon: <DatabaseOutlined />,
      color: "#eb2f96",
      bg: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
      trend: questionTrend.trend,
      trendUp: questionTrend.trendUp,
    },
    {
      title: "Dung lượng đã sử dụng",
      value: formatStorageSize(statistics.totalStorage),
      icon: <DatabaseOutlined />,
      color: "#13c2c2",
      bg: "linear-gradient(135deg, #3fe3dc 0%, #eea3bc 70%)",
      trend: storageTrend.trend,
      trendUp: storageTrend.trendUp,
    },
  ];

  // Fixed Area Chart Config
  const userGrowthConfig = {
    data: userGrowthData.length > 0 ? userGrowthData : [
      { month: "Thg 1", count: 60 },
      { month: "Thg 2", count: 85 },
      { month: "Thg 3", count: 75 },
      { month: "Thg 4", count: 110 },
      { month: "Thg 5", count: 130 },
      { month: "Thg 6", count: 150 },
    ],
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
    data: submissionStatusData.length > 0 ? submissionStatusData : [
      { type: "Đúng hạn", value: 270 },
      { type: "Trễ hạn", value: 45 },
      { type: "Chưa nộp", value: 20 },
    ],
    angleField: "value",
    colorField: "type",
    height: 300,
    radius: 0.9,
    innerRadius: 0.6,
    color: (datum) => {
      switch (datum.type) {
        case "Đúng hạn": return "#52c41a";
        case "Trễ hạn": return "#faad14";
        case "Chưa nộp": return "#f5222d";
        case "Đã chấm điểm": return "#1890ff";
        case "Tự chấm": return "#722ed1";
        default: return "#d9d9d9";
      }
    },
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
    legend: { 
      position: "bottom",
      itemSpacing: 12,
      marker: {
        symbol: 'circle',
        size: 8,
      },
    },
    interactions: [{ type: "element-selected" }],
    statistic: {
      title: {
        style: {
          fontSize: 16,
          color: "#666",
          fontWeight: 'normal',
        },
        content: "Tổng submissions",
      },
      content: {
        style: {
          whiteSpace: "pre-wrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontSize: 24,
          fontWeight: "bold",
          color: "#1890ff",
        },
        content: `${(submissionStatusData.length > 0 ? submissionStatusData : [
          { type: "Đúng hạn", value: 270 },
          { type: "Trễ hạn", value: 45 },
          { type: "Chưa nộp", value: 20 },
        ]).reduce(
          (acc, curr) => acc + curr.value,
          0
        )}`,
      },
    },
    tooltip: {
      title: (datum) => `📊 ${datum.type}`,
      items: [
        (datum) => ({
          color: datum.type === 'Đúng hạn' ? '#52c41a' : 
                 datum.type === 'Trễ hạn' ? '#faad14' :
                 datum.type === 'Chưa nộp' ? '#f5222d' :
                 datum.type === 'Đã chấm điểm' ? '#1890ff' :
                 datum.type === 'Tự chấm' ? '#722ed1' : '#d9d9d9',
          name: '📈 Số lượng',
          value: `${datum.value} submissions`,
        }),
      ],
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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh)',
        padding: '0px',
        margin: '0px',
        background: "linear-gradient(135deg, #acb7eaff 0%, #b683eaff 20%, #d0aed4ff 40%, #e2d9dbff 60%, #a2a9af91 80%, #f5f5f5ff 100%)"
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 20%, #f093fb 40%, #f5576c 60%, #4facfe 80%, #00f2fe 100%)",
        minHeight: "calc(100vh - 64px)",
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
          Chào mừng bạn trở lại! Đây là những gì đang diễn ra với hệ thống của bạn.
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
                      {card.trend} so với tháng trước
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
        <Col span={8}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                <span>Tỷ lệ nộp bài</span>
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
                percent={Math.round(submissionRate * 100)}
                format={(percent) => `${percent}%`}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
                size={120}
                strokeWidth={8}
              />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  {assignmentOverviewData && assignmentOverviewData.totalPossibleSubmissions > 0 
                    ? (
                      <div>
                        <div>📝 {assignmentOverviewData.totalActualSubmissions}/{assignmentOverviewData.totalPossibleSubmissions} bài đã nộp</div>
                        {assignmentOverviewData.totalAutoGradedSubmissions > 0 && (
                          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                            🤖 {assignmentOverviewData.totalAutoGradedSubmissions} bài tự chấm (không nộp)
                          </div>
                        )}
                      </div>
                    )
                    : "Tỷ lệ nộp bài tập tổng thể"
                  }
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={
              <Space>
                <DatabaseOutlined style={{ color: "#1890ff" }} />
                <span>Sử dụng lưu trữ</span>
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
                percent={Math.round(storageUsage * 100)}
                format={(percent) => `${percent}%`}
                strokeColor={{
                  "0%": "#52c41a",
                  "50%": "#faad14", 
                  "80%": "#ff7875",
                  "100%": "#ff4d4f",
                }}
                size={120}
                strokeWidth={8}
              />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  {formatStorageSize(statistics.totalStorage || 0)} of 1 GB used
                </Text>
                {storageUsage > 0.8 && (
                  <div style={{ marginTop: 4 }}>
                    <Text type="warning" style={{ fontSize: 12 }}>
                      ⚠️ Dung lượng sắp hết
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: "#722ed1" }} />
                <span>Hiệu suất hệ thống</span>
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
                percent={Math.round(
                  assignmentOverviewData && assignmentOverviewData.totalGradedSubmissions > 0
                    ? ((assignmentOverviewData.totalGradedSubmissions / assignmentOverviewData.totalPossibleSubmissions) * 100) || 0
                    : 75
                )}
                format={(percent) => `${percent}%`}
                strokeColor={{
                  "0%": "#fa8c16",
                  "100%": "#722ed1",
                }}
                size={120}
                strokeWidth={8}
              />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  {assignmentOverviewData && assignmentOverviewData.totalPossibleSubmissions > 0
                    ? (
                      <div>
                        <div>✅ {assignmentOverviewData.totalGradedSubmissions}/{assignmentOverviewData.totalPossibleSubmissions} bài đã chấm</div>
                        {assignmentOverviewData.totalManuallyGradedSubmissions !== undefined && (
                          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                            👨‍🏫 {assignmentOverviewData.totalManuallyGradedSubmissions} thủ công | 
                            🤖 {assignmentOverviewData.totalAutoGradedSubmissions} tự động
                          </div>
                        )}
                      </div>
                    )
                    : "Tỷ lệ chấm bài tổng thể"
                  }
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

      {/* Weekly Activity */}
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

      {/* Assignment Overview Statistics */}
      {assignmentOverviewData && Object.keys(assignmentOverviewData).length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <SectionTitle
            icon={
              <FileTextOutlined style={{ fontSize: 22, color: "#722ed1" }} />
            }
          >
            Thống kê tổng quan bài tập
          </SectionTitle>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={6}>
              <Card
                style={{
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  textAlign: "center",
                }}
              >
                <Statistic
                  title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Tổng bài tập</span>}
                  value={assignmentOverviewData.totalAssignments || 0}
                  valueStyle={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card
                style={{
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  border: "none",
                  textAlign: "center",
                }}
              >
                <Statistic
                  title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Có thể nộp</span>}
                  value={assignmentOverviewData.totalPossibleSubmissions || 0}
                  valueStyle={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card
                style={{
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  border: "none",
                  textAlign: "center",
                }}
              >
                <Statistic
                  title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Đã nộp</span>}
                  value={assignmentOverviewData.totalActualSubmissions || 0}
                  valueStyle={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card
                style={{
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                  border: "none",
                  textAlign: "center",
                }}
              >
                <Statistic
                  title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Đã chấm</span>}
                  value={assignmentOverviewData.totalGradedSubmissions || 0}
                  valueStyle={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}
                />
              </Card>
            </Col>
            {assignmentOverviewData.totalAutoGradedSubmissions > 0 && (
              <Col xs={12} sm={8} md={6}>
                <Card
                  style={{
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
                    border: "none",
                    textAlign: "center",
                  }}
                >
                  <Statistic
                    title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Tự chấm</span>}
                    value={assignmentOverviewData.totalAutoGradedSubmissions || 0}
                    valueStyle={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}
                  />
                </Card>
              </Col>
            )}
            <Col xs={12} sm={8} md={6}>
              <Card
                style={{
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                  border: "none",
                  textAlign: "center",
                }}
              >
                <Statistic
                  title={<span style={{ color: "rgba(85,85,85,0.8)" }}>Tỷ lệ nộp</span>}
                  value={
                    assignmentOverviewData.totalPossibleSubmissions > 0
                      ? Math.round(
                          (assignmentOverviewData.totalActualSubmissions /
                            assignmentOverviewData.totalPossibleSubmissions) *
                            100
                        )
                      : 0
                  }
                  suffix="%"
                  valueStyle={{ color: "#555", fontSize: 24, fontWeight: "bold" }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      )}

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
            {/* <Text style={{ 
              color: 'white',
              fontSize: '12px',
              fontWeight: '500',
            }}>
              🔄 Cập nhật realtime
            </Text> */}
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
            dataSource={processedActivities}
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
