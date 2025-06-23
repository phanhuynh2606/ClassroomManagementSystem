import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Card,
  Typography,
  Divider,
  Select,
  message,
  Collapse,
  Tag,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  BookOutlined,
  StarOutlined,
  CopyOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const RubricCustomizer = ({ 
  visible, 
  onCancel, 
  onSave, 
  assignment,
  initialRubric = null 
}) => {
  const [form] = Form.useForm();
  const [rubricCriteria, setRubricCriteria] = useState(
    initialRubric || [
      {
        id: '1',
        criteria: 'Nội dung & Kiến thức',
        description: 'Độ chính xác và đầy đủ của nội dung',
        maxPoints: 40,
        levels: [
          { level: 'Xuất sắc', points: 40, description: 'Nội dung chính xác, đầy đủ, sâu sắc' },
          { level: 'Tốt', points: 32, description: 'Nội dung đúng, khá đầy đủ' },
          { level: 'Trung bình', points: 24, description: 'Nội dung cơ bản, một số thiếu sót' },
          { level: 'Yếu', points: 16, description: 'Nội dung sai nhiều hoặc thiếu' }
        ]
      }
    ]
  );

  // Predefined rubric templates for different subjects
  const rubricTemplates = {
    language: {
      name: 'Ngôn ngữ & Văn học',
      criteria: [
        {
          criteria: 'Hiểu bài & Nội dung',
          description: 'Mức độ hiểu bài và nội dung trả lời',
          maxPoints: 35,
          levels: [
            { level: 'Xuất sắc', points: 35, description: 'Hiểu sâu, trả lời chính xác, đầy đủ' },
            { level: 'Tốt', points: 28, description: 'Hiểu tốt, trả lời đúng phần lớn' },
            { level: 'Khá', points: 21, description: 'Hiểu cơ bản, trả lời một phần' },
            { level: 'Yếu', points: 14, description: 'Hiểu sai hoặc không hiểu' }
          ]
        },
        {
          criteria: 'Ngôn ngữ & Diễn đạt',
          description: 'Kỹ năng sử dụng ngôn ngữ và diễn đạt',
          maxPoints: 25,
          levels: [
            { level: 'Xuất sắc', points: 25, description: 'Ngôn ngữ chuẩn, diễn đạt hay' },
            { level: 'Tốt', points: 20, description: 'Ngôn ngữ tốt, diễn đạt rõ ràng' },
            { level: 'Khá', points: 15, description: 'Ngôn ngữ bình thường' },
            { level: 'Yếu', points: 10, description: 'Ngôn ngữ kém, diễn đạt khó hiểu' }
          ]
        },
        {
          criteria: 'Tư duy & Sáng tạo',
          description: 'Khả năng tư duy và sáng tạo trong bài làm',
          maxPoints: 20,
          levels: [
            { level: 'Xuất sắc', points: 20, description: 'Tư duy sáng tạo, độc đáo' },
            { level: 'Tốt', points: 16, description: 'Có tư duy, khá sáng tạo' },
            { level: 'Khá', points: 12, description: 'Tư duy cơ bản' },
            { level: 'Yếu', points: 8, description: 'Thiếu tư duy, không sáng tạo' }
          ]
        }
      ]
    },
    math: {
      name: 'Toán học',
      criteria: [
        {
          criteria: 'Tính đúng đắn',
          description: 'Độ chính xác của phép tính và kết quả',
          maxPoints: 50,
          levels: [
            { level: 'Xuất sắc', points: 50, description: 'Tất cả đều đúng' },
            { level: 'Tốt', points: 40, description: 'Đúng phần lớn, ít lỗi nhỏ' },
            { level: 'Khá', points: 30, description: 'Đúng một số, có lỗi tính toán' },
            { level: 'Yếu', points: 20, description: 'Sai nhiều hoặc không làm được' }
          ]
        },
        {
          criteria: 'Phương pháp & Cách giải',
          description: 'Lựa chọn và áp dụng phương pháp giải',
          maxPoints: 30,
          levels: [
            { level: 'Xuất sắc', points: 30, description: 'Phương pháp tối ưu, giải hay' },
            { level: 'Tốt', points: 24, description: 'Phương pháp đúng, cách giải rõ ràng' },
            { level: 'Khá', points: 18, description: 'Phương pháp cơ bản' },
            { level: 'Yếu', points: 12, description: 'Phương pháp sai hoặc không có' }
          ]
        },
        {
          criteria: 'Trình bày',
          description: 'Cách trình bày lời giải',
          maxPoints: 20,
          levels: [
            { level: 'Xuất sắc', points: 20, description: 'Trình bày logic, rõ ràng, đầy đủ' },
            { level: 'Tốt', points: 16, description: 'Trình bày tốt, dễ hiểu' },
            { level: 'Khá', points: 12, description: 'Trình bày bình thường' },
            { level: 'Yếu', points: 8, description: 'Trình bày kém, khó hiểu' }
          ]
        }
      ]
    },
    science: {
      name: 'Khoa học tự nhiên',
      criteria: [
        {
          criteria: 'Kiến thức khoa học',
          description: 'Độ chính xác của kiến thức khoa học',
          maxPoints: 40,
          levels: [
            { level: 'Xuất sắc', points: 40, description: 'Kiến thức chính xác, sâu sắc' },
            { level: 'Tốt', points: 32, description: 'Kiến thức đúng, khá đầy đủ' },
            { level: 'Khá', points: 24, description: 'Kiến thức cơ bản' },
            { level: 'Yếu', points: 16, description: 'Kiến thức sai hoặc thiếu' }
          ]
        },
        {
          criteria: 'Tư duy khoa học',
          description: 'Khả năng phân tích, lý luận khoa học',
          maxPoints: 35,
          levels: [
            { level: 'Xuất sắc', points: 35, description: 'Tư duy logic, phân tích sâu sắc' },
            { level: 'Tốt', points: 28, description: 'Có tư duy, phân tích tốt' },
            { level: 'Khá', points: 21, description: 'Tư duy cơ bản' },
            { level: 'Yếu', points: 14, description: 'Thiếu tư duy khoa học' }
          ]
        },
        {
          criteria: 'Ứng dụng & Thực hành',
          description: 'Khả năng ứng dụng kiến thức vào thực tế',
          maxPoints: 25,
          levels: [
            { level: 'Xuất sắc', points: 25, description: 'Ứng dụng tốt, có thực hành' },
            { level: 'Tốt', points: 20, description: 'Biết ứng dụng cơ bản' },
            { level: 'Khá', points: 15, description: 'Ứng dụng hạn chế' },
            { level: 'Yếu', points: 10, description: 'Không biết ứng dụng' }
          ]
        }
      ]
    },
    programming: {
      name: 'Lập trình',
      criteria: [
        {
          criteria: 'Tính đúng đắn của code',
          description: 'Code chạy đúng, logic chính xác',
          maxPoints: 40,
          levels: [
            { level: 'Xuất sắc', points: 40, description: 'Code hoàn hảo, không lỗi' },
            { level: 'Tốt', points: 32, description: 'Code đúng, ít lỗi nhỏ' },
            { level: 'Khá', points: 24, description: 'Code có một số lỗi logic' },
            { level: 'Yếu', points: 16, description: 'Code nhiều lỗi hoặc không chạy' }
          ]
        },
        {
          criteria: 'Cách viết & Comment',
          description: 'Code sạch, có comment, tuân thủ chuẩn',
          maxPoints: 30,
          levels: [
            { level: 'Xuất sắc', points: 30, description: 'Code chuẩn, comment chi tiết' },
            { level: 'Tốt', points: 24, description: 'Code tốt, có comment' },
            { level: 'Khá', points: 18, description: 'Code bình thường, ít comment' },
            { level: 'Yếu', points: 12, description: 'Code kém, không comment' }
          ]
        },
        {
          criteria: 'Tối ưu & Sáng tạo',
          description: 'Thuật toán tối ưu, giải pháp sáng tạo',
          maxPoints: 30,
          levels: [
            { level: 'Xuất sắc', points: 30, description: 'Rất tối ưu, sáng tạo' },
            { level: 'Tốt', points: 24, description: 'Khá tối ưu, có sáng tạo' },
            { level: 'Khá', points: 18, description: 'Tối ưu cơ bản' },
            { level: 'Yếu', points: 12, description: 'Chưa tối ưu, không sáng tạo' }
          ]
        }
      ]
    }
  };

  const addCriteria = () => {
    const newCriteria = {
      id: Date.now().toString(),
      criteria: 'Tiêu chí mới',
      description: 'Mô tả tiêu chí',
      maxPoints: 25,
      levels: [
        { level: 'Xuất sắc', points: 25, description: 'Mô tả mức xuất sắc' },
        { level: 'Tốt', points: 20, description: 'Mô tả mức tốt' },
        { level: 'Khá', points: 15, description: 'Mô tả mức khá' },
        { level: 'Yếu', points: 10, description: 'Mô tả mức yếu' }
      ]
    };
    setRubricCriteria([...rubricCriteria, newCriteria]);
  };

  const removeCriteria = (id) => {
    setRubricCriteria(rubricCriteria.filter(c => c.id !== id));
  };

  const updateCriteria = (id, field, value) => {
    setRubricCriteria(rubricCriteria.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const updateLevel = (criteriaId, levelIndex, field, value) => {
    setRubricCriteria(rubricCriteria.map(c => {
      if (c.id === criteriaId) {
        const newLevels = [...c.levels];
        newLevels[levelIndex] = { ...newLevels[levelIndex], [field]: value };
        return { ...c, levels: newLevels };
      }
      return c;
    }));
  };

  const loadTemplate = (templateKey) => {
    const template = rubricTemplates[templateKey];
    if (template) {
      const criteriaWithIds = template.criteria.map((c, index) => ({
        ...c,
        id: (index + 1).toString()
      }));
      setRubricCriteria(criteriaWithIds);
      message.success(`Đã tải mẫu rubric cho ${template.name}`);
    }
  };

  const handleSave = () => {
    const totalPoints = rubricCriteria.reduce((sum, c) => sum + c.maxPoints, 0);
    
    const rubricData = {
      assignmentId: assignment?.id,
      criteria: rubricCriteria,
      totalPoints,
      createdAt: new Date().toISOString()
    };

    onSave(rubricData);
    message.success('Đã lưu rubric thành công!');
  };

  const getTotalPoints = () => {
    return rubricCriteria.reduce((sum, c) => sum + c.maxPoints, 0);
  };

  return (
    <Modal
      title={
        <Space>
          <StarOutlined />
          <span>Tùy chỉnh Rubric chấm điểm</span>
          {assignment && <Text type="secondary">- {assignment.title}</Text>}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      width={900}
      style={{ top: 20 }}
      okText="Lưu Rubric"
      cancelText="Hủy"
    >
      {/* Template Selection */}
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <Text strong>📋 Chọn mẫu rubric theo môn học:</Text>
          <Text type="secondary">Tổng điểm: <Text strong>{getTotalPoints()}</Text></Text>
        </div>
        <Space wrap>
          {Object.entries(rubricTemplates).map(([key, template]) => (
            <Button 
              key={key}
              onClick={() => loadTemplate(key)}
              icon={<BookOutlined />}
            >
              {template.name}
            </Button>
          ))}
          <Button 
            onClick={addCriteria}
            type="primary"
            icon={<PlusOutlined />}
          >
            Thêm tiêu chí
          </Button>
        </Space>
      </Card>

      {/* Criteria List */}
      <div className="space-y-4">
        {rubricCriteria.map((criteria, index) => (
          <Card 
            key={criteria.id}
            title={
              <div className="flex justify-between items-center">
                <Space>
                  <Text strong>Tiêu chí {index + 1}</Text>
                  <Tag color="blue">{criteria.maxPoints} điểm</Tag>
                </Space>
                <Popconfirm
                  title="Xóa tiêu chí này?"
                  onConfirm={() => removeCriteria(criteria.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    size="small"
                  />
                </Popconfirm>
              </div>
            }
            size="small"
          >
            <div className="space-y-3">
              {/* Criteria Name */}
              <div>
                <Text strong className="mb-1 block">Tên tiêu chí:</Text>
                <Input
                  value={criteria.criteria}
                  onChange={(e) => updateCriteria(criteria.id, 'criteria', e.target.value)}
                  placeholder="Nhập tên tiêu chí"
                />
              </div>

              {/* Description */}
              <div>
                <Text strong className="mb-1 block">Mô tả:</Text>
                <TextArea
                  value={criteria.description}
                  onChange={(e) => updateCriteria(criteria.id, 'description', e.target.value)}
                  placeholder="Mô tả chi tiết tiêu chí này"
                  rows={2}
                />
              </div>

              {/* Max Points */}
              <div>
                <Text strong className="mb-1 block">Điểm tối đa:</Text>
                <InputNumber
                  value={criteria.maxPoints}
                  onChange={(value) => updateCriteria(criteria.id, 'maxPoints', value)}
                  min={1}
                  max={100}
                  style={{ width: 120 }}
                />
              </div>

              {/* Levels */}
              <div>
                <Text strong className="mb-2 block">Các mức điểm:</Text>
                <div className="space-y-2">
                  {criteria.levels.map((level, levelIndex) => (
                    <Card key={levelIndex} size="small" className="bg-gray-50">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Text className="text-xs block mb-1">Mức độ:</Text>
                          <Input
                            value={level.level}
                            onChange={(e) => updateLevel(criteria.id, levelIndex, 'level', e.target.value)}
                            size="small"
                          />
                        </div>
                        <div>
                          <Text className="text-xs block mb-1">Điểm:</Text>
                          <InputNumber
                            value={level.points}
                            onChange={(value) => updateLevel(criteria.id, levelIndex, 'points', value)}
                            min={0}
                            max={criteria.maxPoints}
                            size="small"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <Text className="text-xs block mb-1">Mô tả:</Text>
                          <Input
                            value={level.description}
                            onChange={(e) => updateLevel(criteria.id, levelIndex, 'description', e.target.value)}
                            size="small"
                            placeholder="Mô tả mức này"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {rubricCriteria.length === 0 && (
        <Card className="text-center py-8">
          <Text type="secondary">Chưa có tiêu chí nào. Hãy chọn mẫu hoặc thêm tiêu chí mới.</Text>
        </Card>
      )}
    </Modal>
  );
};

export default RubricCustomizer; 