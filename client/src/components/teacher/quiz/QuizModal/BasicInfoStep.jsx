import React from 'react';
import { Form, Input, Row, Col, InputNumber, Select, Typography } from 'antd';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const QuizStepBasicInfo = () => (
  <div>
    <Title level={4}>📝 Thông tin bài thi</Title>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="title"
          label="Tiêu đề bài thi"
          rules={[
            { required: true, message: 'Vui lòng nhập tiêu đề' },
            { min: 3, message: 'Tiêu đề phải có ít nhất 3 ký tự' },
            { max: 100, message: 'Tiêu đề không được vượt quá 100 ký tự' }
          ]}
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
            <Option value="MID_TERM_EXAM">Kiểm tra giữa kỳ</Option>
            <Option value="FINAL_EXAM">Kiểm tra cuối kỳ</Option>
            <Option value="PROGRESS_TEST">Bài kiểm tra nhỏ</Option>
            <Option value="ASSIGNMENT">Luyện tập</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item 
      name="description" 
      label="Mô tả"
      rules={[
        { max: 500, message: 'Mô tả không được vượt quá 500 ký tự' }
      ]}
    >
      <TextArea rows={3} placeholder="Mô tả nội dung bài thi..." />
    </Form.Item>
    
    <Row gutter={16}>
      <Col span={8}>
        <Form.Item
          name="duration"
          label="Thời gian làm bài (phút)"
          rules={[
            { required: true, message: 'Vui lòng nhập thời gian' },
            { type: 'number', min: 1, message: 'Thời gian phải lớn hơn 0' },
            { type: 'number', max: 300, message: 'Thời gian không được vượt quá 300 phút' }
          ]}
        >
          <InputNumber 
            min={1} 
            max={300} 
            style={{ width: '100%' }} 
            placeholder="60"
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item
          name="passingScore"
          label="Điểm qua môn (%)"
          rules={[
            { required: true, message: 'Vui lòng nhập điểm qua môn' },
            { type: 'number', min: 0, message: 'Điểm qua môn phải từ 0%' },
            { type: 'number', max: 100, message: 'Điểm qua môn không được vượt quá 100%' }
          ]}
        >
          <InputNumber 
            min={0} 
            max={100} 
            style={{ width: '100%' }} 
            placeholder="70"
            formatter={value => `${value}%`}
            parser={value => value.replace('%', '')}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item
          name="maxAttempts"
          label="Số lần làm tối đa"
          rules={[
            { required: true, message: 'Vui lòng nhập số lần làm' },
            { type: 'number', min: 1, message: 'Số lần làm phải lớn hơn 0' },
            { type: 'number', max: 10, message: 'Số lần làm không được vượt quá 10' }
          ]}
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

export default QuizStepBasicInfo;