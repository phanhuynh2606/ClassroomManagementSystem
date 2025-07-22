import React from 'react';
import {
  Card,
  Alert,
  Tag,
  Space,
  Typography,
  Progress,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge
} from 'antd';
import {
  TrophyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

const AnalyticsInsights = ({ analyticsData, assignment }) => {
  if (!analyticsData || !analyticsData.overview) {
    return (
      <Card>
        <div className="text-center py-8">
          <InfoCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
          <Title level={4} type="secondary" className="mt-4">
            Thống kê phân tích
          </Title>
          <Text type="secondary">
            Thống kê sẽ được tạo khi dữ liệu có sẵn.
          </Text>
        </div>
      </Card>
    );
  }

  const { overview, gradeDistribution, performanceInsights, timeAnalysis } = analyticsData;
  const maxGrade = assignment?.totalPoints || 100;

  const generateInsights = () => {
    const insights = [];

    // 1. Overall Performance Insight
    const passingRate = Number(overview.passingRate) || 0;
    
    if (passingRate >= 90) {
      insights.push({
        type: 'success',
        icon: <TrophyOutlined />,
        title: '🎉 Hiệu suất lớp tuyệt vời!',
        description: `Tuyệt vời! ${Math.round(passingRate)}% của lớp đạt điểm đậu. Lớp học đã hiểu bài rất tốt!`,
        priority: 1
      });
    } else if (passingRate >= 80) {
      insights.push({
        type: 'info',
        icon: <CheckCircleOutlined />,
        title: '👍 Hiệu suất lớp tốt',
        description: `Tốt! ${Math.round(passingRate)}% của lớp đạt điểm đậu. Phần lớn học sinh đã nắm vững bài học.`,
        priority: 2
      });
    } else if (passingRate >= 60) {
      insights.push({
        type: 'warning',
        icon: <InfoCircleOutlined />,
        title: '📚 Hiệu suất trung bình',
        description: `${Math.round(passingRate)}% của lớp đạt điểm đậu. Cần hỗ trợ thêm một số học sinh.`,
        priority: 3
      });
    } else {
      insights.push({
        type: 'error',
        icon: <WarningOutlined />,
        title: '🚨 Cần chú ý đến hiệu suất',
        description: `Chỉ ${Math.round(passingRate)}% đạt điểm đậu. Cần xem lại phương pháp giảng dạy hoặc nội dung bài học.`,
        priority: 1,
        actionable: true,
        suggestions: [
          'Tổ chức buổi ôn tập cho lớp',
          'Phân tích câu hỏi học sinh hay sai',
          'Tạo bài tập bổ sung',
          'Gặp riêng học sinh yếu'
        ]
      });
    }

    // 2. Grade Distribution Insights
    if (gradeDistribution && Array.isArray(gradeDistribution)) {
      const aGrades = gradeDistribution.find(g => g.label && g.label.includes('A (90-100%)'));
      const fGrades = gradeDistribution.find(g => g.label && g.label.includes('F (<60%)'));

      if (aGrades && (aGrades.percentage || 0) > 25) {
        insights.push({
          type: 'info',
          icon: <StarOutlined />,
          title: '⭐ Nhận diện học sinh đạt điểm cao',
          description: `Tuyệt vời! ${aGrades.count || 0} học sinh (${Math.round((aGrades.percentage || 0) * 10) / 10}%) đạt loại A. Có thể cân nhắc tăng độ khó cho lần sau.`,
          priority: 2
        });
      }

      if (fGrades && (fGrades.percentage || 0) > 20) {
        insights.push({
          type: 'warning',
          icon: <WarningOutlined />,
          title: '📉 Nhiều học sinh gặp khó khăn',
          description: `${fGrades.count || 0} học sinh (${Math.round((fGrades.percentage || 0) * 10) / 10}%) đạt điểm F. Cần hỗ trợ đặc biệt.`,
          priority: 1,
          actionable: true,
          suggestions: [
            'Tổ chức lớp học bù',
            'Cung cấp tài liệu bổ trợ',
            'Ghép nhóm học tập',
            'Tư vấn học tập cá nhân'
          ]
        });
      }
    }

    // 3. Perfect Scores
    if (performanceInsights && (performanceInsights.perfectScores || 0) > 0) {
      insights.push({
        type: 'success',
        icon: <TrophyOutlined />,
        title: '🏆 Đạt điểm tuyệt đối',
        description: `${performanceInsights.perfectScores} học sinh đạt điểm tuyệt đối ${maxGrade}/${maxGrade}! Xuất sắc!`,
        priority: 2
      });
    }

    // 4. Late Submission Analysis
    const lateCount = Number(overview.lateCount) || 0;
    const submittedCount = Number(overview.submittedCount) || 1;
    
    if (lateCount > submittedCount * 0.3) {
      insights.push({
        type: 'warning',
        icon: <ClockCircleOutlined />,
        title: '⏰ Tỷ lệ nộp muộn cao',
        description: `${lateCount} bài nộp muộn (${Math.round((lateCount/submittedCount)*100)}%). Cần nhắc nhở về deadline và quản lý thời gian.`,
        priority: 2,
        actionable: true,
        suggestions: [
          'Gửi reminder trước deadline',
          'Tạo deadline trung gian',
          'Hướng dẫn quản lý thời gian',
          'Điều chỉnh timeline assignment'
        ]
      });
    }

    // 5. Completion Rate
    const completionRate = Number(overview.completionRate) || 0;
    if (completionRate < 90) {
      const missingCount = Number(overview.missingCount) || 0;
      insights.push({
        type: 'warning',
        icon: <InfoCircleOutlined />,
        title: '📝 Bài nộp chưa hoàn thành',
        description: `${missingCount} học sinh chưa nộp bài (${(100-completionRate).toFixed(1)}% chưa hoàn thành). Cần follow-up.`,
        priority: 1,
        actionable: true,
        suggestions: [
          'Liên hệ học sinh chưa nộp bài',
          'Kiểm tra lý do vắng mặt',
          'Cung cấp hỗ trợ kỹ thuật',
          'Gia hạn cho trường hợp đặc biệt'
        ]
      });
    }

    // 6. Grade Variance Analysis
    const standardDeviation = Number(overview.standardDeviation) || 0;
    if (standardDeviation > maxGrade * 0.25) {
      insights.push({
        type: 'info',
        icon: <InfoCircleOutlined />,
        title: '📊 Độ lệch chuẩn điểm cao',
        description: `Điểm số phân tán cao (độ lệch chuẩn: ${standardDeviation.toFixed(1)}). Có sự chênh lệch lớn giữa học sinh giỏi và yếu.`,
        priority: 2,
        actionable: true,
        suggestions: [
          'Phân loại học sinh theo trình độ',
          'Tạo bài tập đa cấp độ',
          'Tăng cường hỗ trợ học sinh yếu',
          'Thử nghiệm phương pháp dạy học khác nhau'
        ]
      });
    }

    // Sort by priority and return
    return insights.sort((a, b) => a.priority - b.priority);
  };

  const insights = generateInsights();

  const getInsightColor = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  const renderActionableSuggestions = (suggestions) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <Text strong className="text-sm">💡 Gợi ý hành động:</Text>
        <ul className="mt-2 ml-4 text-sm">
          {suggestions.map((suggestion, index) => (
            <li key={`suggestion-${index}`} className="mb-1">• {suggestion}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderQuickStats = () => (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={12} sm={6}>
        <Card size="small" className="text-center">
          <Statistic
            title="Xếp hạng lớp"
            value={
              (overview.passingRate || 0) >= 90 ? 'A+' : 
              (overview.passingRate || 0) >= 80 ? 'A' : 
              (overview.passingRate || 0) >= 70 ? 'B' : 
              (overview.passingRate || 0) >= 60 ? 'C' : 'D'
            }
            valueStyle={{ 
              color: (overview.passingRate || 0) >= 80 ? '#52c41a' : 
                     (overview.passingRate || 0) >= 60 ? '#faad14' : '#ff4d4f',
              fontSize: '24px'
            }}
            prefix={<TrophyOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small" className="text-center">
          <Statistic
            title="Hoàn thành"
            value={Math.round(overview.completionRate || 0)}
            suffix="%"
            valueStyle={{ color: (overview.completionRate || 0) >= 90 ? '#52c41a' : '#faad14' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small" className="text-center">
          <Statistic
            title="Đúng hạn"
            value={
              (overview.submittedCount || 0) > 0 ? 
              Math.round(((Number(overview.submittedCount) - Number(overview.lateCount || 0)) / Number(overview.submittedCount)) * 100) : 
              100
            }
            suffix="%"
            valueStyle={{ color: '#1890ff' }}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small" className="text-center">
          <Statistic
            title="Xuất sắc"
            value={
              performanceInsights && (overview.gradedCount || 0) > 0 ? 
              Math.round(((performanceInsights.excellentPerformance || 0) / (overview.gradedCount || 1)) * 100) : 
              0
            }
            suffix="%"
            valueStyle={{ color: '#722ed1' }}
            prefix={<StarOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );

  if (insights.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <InfoCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
          <Title level={4} type="secondary" className="mt-4">
            Thống kê phân tích
          </Title>
          <Text type="secondary">
            Thống kê sẽ được tạo khi dữ liệu có sẵn.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div className="analytics-insights">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Title level={4} className="mb-1">
              🔍 Các thông tin quan trọng & Gợi ý
            </Title>
            <Text type="secondary">
              Phân tích AI và gợi ý hành động có tác động
            </Text>
          </div>
          <Badge count={insights.length} showZero color="#1890ff" />
        </div>
        
        {renderQuickStats()}
      </div>

      <Row gutter={[16, 16]}>
        {insights.map((insight, index) => (
          <Col xs={24} lg={insight.actionable ? 24 : 12} key={`insight-${index}`}>
            <Alert
              message={insight.title}
              description={
                <div>
                  <div>{insight.description}</div>
                  {insight.actionable && renderActionableSuggestions(insight.suggestions)}
                </div>
              }
              type={getInsightColor(insight.type)}
              icon={insight.icon}
              showIcon
              className={`${insight.priority === 1 ? 'border-2 shadow-md' : ''}`}
              action={
                insight.actionable && (
                  <Space>
                    <Tag color="blue">Yêu cầu hành động</Tag>
                    {insight.priority === 1 && <Tag color="red">Mức độ ưu tiên cao</Tag>}
                  </Space>
                )
              }
            />
          </Col>
        ))}
      </Row>

      {/* Performance Trend Indicator */}
      <Card className="mt-6" size="small">
        <div className="flex items-center justify-between">
          <div>
            <Text strong>Đánh giá chung:</Text>
            <div className="mt-1">
              {(overview.passingRate || 0) >= 85 ? (
                <Space>
                  <RiseOutlined style={{ color: '#52c41a' }} />
                  <Text type="success">Lớp đang hoạt động tuyệt vời</Text>
                  <Tag color="green">Hiểu biết sâu sắc</Tag>
                </Space>
              ) : (overview.passingRate || 0) >= 70 ? (
                <Space>
                  <ThunderboltOutlined style={{ color: '#1890ff' }} />
                  <Text>Lớp đang hoạt động tốt</Text>
                  <Tag color="blue">Tiến bộ tốt</Tag>
                </Space>
              ) : (
                <Space>
                  <FallOutlined style={{ color: '#ff4d4f' }} />
                  <Text type="danger">Lớp cần hỗ trợ thêm</Text>
                  <Tag color="red">Cần can thiệp</Tag>
                </Space>
              )}
            </div>
          </div>
          <Progress
            type="circle"
            percent={Math.round(overview.passingRate || 0)}
            size={80}
            strokeColor={
              (overview.passingRate || 0) >= 85 ? '#52c41a' : 
              (overview.passingRate || 0) >= 70 ? '#1890ff' : '#ff4d4f'
            }
          />
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsInsights;