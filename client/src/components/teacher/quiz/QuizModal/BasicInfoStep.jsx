import React from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Typography } from 'antd';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const BasicInfoStep = ({ form }) => {
  return (
    <div>
      <Title level={4}>📝 Thông tin bài thi</Title>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="title"
            label="Tiêu đề bài thi"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề bài thi" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select placeholder="Chọn danh mục">
              <Option value="midterm">Kiểm tra giữa kỳ</Option>
              <Option value="final">Kiểm tra cuối kỳ</Option>
              <Option value="quiz">Bài kiểm tra nhỏ</Option>
              <Option value="practice">Luyện tập</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="description" label="Mô tả">
        <TextArea rows={3} placeholder="Mô tả nội dung bài thi..." />
      </Form.Item>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="duration"
            label="Thời gian làm bài (phút)"
            rules={[{ required: true, message: 'Vui lòng nhập thời gian' }]}
          >
            <InputNumber
              min={1}
              max={300}
              style={{ width: '100%' }}
              placeholder="60"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="passingScore"
            label="Điểm qua môn (%)"
            rules={[{ required: true, message: 'Vui lòng nhập điểm qua môn' }]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              placeholder="70"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="maxAttempts"
            label="Số lần làm tối đa"
            rules={[{ required: true, message: 'Vui lòng nhập số lần làm' }]}
          >
            <InputNumber
              min={1}
              max={10}
              style={{ width: '100%' }}
              placeholder="1"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default BasicInfoStep;