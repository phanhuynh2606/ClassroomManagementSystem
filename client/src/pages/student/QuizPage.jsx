import React, { useState, useEffect } from 'react';
import {
  Card,
  Radio,
  Button,
  Typography,
  Space,
  Divider,
  message,
  Progress,
  Modal,
} from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const quizQuestions = [
  {
    id: 1,
    question:
      "The standard IQ test has a mean of 106 and a standard deviation of 12. We want to be 90% certain that we are within 4 IQ points of the true mean. Determine the required sample size.",
    options: ["6", "34", "25", "130"],
    correctAnswer: "34",
  },
  {
    id: 2,
    question: "What is the probability of getting heads in a fair coin toss?",
    options: ["0", "0.25", "0.5", "1"],
    correctAnswer: "0.5",
  },
  {
    id: 3,
    question: "What is the probability of getting heads in a fair coin toss?",
    options: ["0", "0.25", "0.5", "1"],
    correctAnswer: "0.5",
  },
];

const QuizPage = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); 

  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) {
      handleConfirmSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [quizQuestions[current].id]: value });
  };

  const handleConfirmSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    message.success('Quiz submitted!');
    navigate('/student/quizzes');
  };

  const showConfirmSubmit = () => {
    Modal.confirm({
      title: 'Are you sure you want to submit?',
      content: 'You will not be able to change your answers after submission.',
      okText: 'Yes, Submit',
      cancelText: 'Cancel',
      onOk: handleConfirmSubmit,
    });
  };

  const percentCompleted =
    (Object.keys(answers).length / quizQuestions.length) * 100;

  return (
    <div className="flex flex-col md:flex-row gap-4 p-6">
      <div className="w-full md:w-1/4 border rounded p-4 bg-white shadow">
        <Title level={5}>Quiz navigation</Title>
        <Space wrap className="mb-4">
          {quizQuestions.map((q, index) => (
            <Button
              key={q.id}
              shape="circle"
              type={index === current ? 'primary' : answers[q.id] ? 'default' : 'dashed'}
              onClick={() => setCurrent(index)}
            >
              {index + 1}
            </Button>
          ))}
        </Space>
        <Divider />
        <Text strong>Time left: {formatTime(timeLeft)}</Text>
        <Progress percent={Math.round(percentCompleted)} size="small" className="mt-2" />
        <div className="mt-4">
          {!submitted && (
            <Button type="primary" danger block onClick={showConfirmSubmit}>
              Finish attempt
            </Button>
          )}
        </div>
      </div>

      <div className="w-full md:w-3/4">
        <Card className="shadow" bordered>
          <Title level={4} className="text-red-500">Question {current + 1}</Title>
          <Divider />
          <Text strong>{quizQuestions[current].question}</Text>
          <Radio.Group
            onChange={(e) => handleAnswer(e.target.value)}
            value={answers[quizQuestions[current].id] || null}
            disabled={submitted}
            className="mt-4 block"
          >
            <Space direction="vertical" className="mt-2">
              {quizQuestions[current].options.map((option, index) => (
                <Radio key={index} value={option}>
                  {option}
                </Radio>
              ))}
            </Space>
          </Radio.Group>

          <div className="flex justify-between mt-6">
            <Button disabled={current === 0} onClick={() => setCurrent((prev) => prev - 1)}>
              Previous
            </Button>
            <Button disabled={current === quizQuestions.length - 1} onClick={() => setCurrent((prev) => prev + 1)}>
              Next
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QuizPage;
