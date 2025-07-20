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
import { useParams } from 'react-router-dom';
import quizAPI from '../../services/api/quiz.api';
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
  const { classroomId, quizId } = useParams();
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizDataDetail, setQuizDataDetail] = useState(null);

  useEffect(() => {
    let timer;

    if (timeLeft > 0 && !submitted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleConfirmSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  useEffect(() => {
    fetchTakeQuiz();
  }, [classroomId, quizId]);

  const fetchTakeQuiz = async () => {
    try {
      const response = await quizAPI.takeQuiz(quizId);
      setQuizDataDetail(response.data);
      setTimeLeft(response.data.duration * 60);
    } catch (error) {
      message.error('Failed to load quiz data');
    }
  };

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAnswer = (value) => {
    const questionId = quizDataDetail?.questions[current]._id;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };


  const handleConfirmSubmit = async () => {
    try {
      const payload = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
    }));

      console.log('Submitting answers:', payload);


      await quizAPI.submit(quizId, { answers: payload });

      setSubmitted(true);
      message.success('Quiz submitted successfully');
      navigate(`/student/classroom/${classroomId}#quizzes`);

    } catch (error) {
      console.error('Failed to submit quiz', error);
      message.error('Failed to submit quiz');
    }
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

  const percentCompleted = (Object.keys(answers).length / quizDataDetail?.questions.length) * 100;

  return (
    <div className="flex flex-col md:flex-row gap-4 p-6">
      <div className="w-full md:w-1/4 border rounded p-4 bg-white shadow">
        <Title level={5}>{quizDataDetail?.title}</Title>
        <Space wrap className="mb-4">
          {quizDataDetail?.questions.map((q, index) => (
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
        <Card className="shadow" variant="outlined">
          <Title level={4} className="text-red-500">
            Question {current + 1}
          </Title>
          <Divider />
          <Text strong>
            {quizDataDetail?.questions[current].content}
          </Text>

          <Radio.Group
            onChange={(e) => handleAnswer(e.target.value)}
            value={
              answers[quizDataDetail?.questions[current]._id] || null
            }
            disabled={submitted}
            className="mt-4 block"
          >
            <Space direction="vertical" className="mt-2">
              {quizDataDetail?.questions[current].options.map(
                (option, index) => (
                  <Radio key={index} value={option.content}>
                    {option.content}
                  </Radio>
                )
              )}
            </Space>
          </Radio.Group>

          <div className="flex justify-between mt-6">
            <Button
              disabled={current === 0}
              onClick={() => setCurrent((prev) => prev - 1)}
            >
              Previous
            </Button>
            <Button
              disabled={
                current === quizDataDetail?.questions.length - 1
              }
              onClick={() => setCurrent((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default QuizPage;
