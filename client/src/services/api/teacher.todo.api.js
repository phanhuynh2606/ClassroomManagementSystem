import axiosClient from '../axiosClient';

const teacherTodoApi = {
  // Get teacher todos (assignments needing grading + unanswered questions)
  getTeacherTodos: async (params = {}) => {
    const response = await axiosClient.get('/teacher-todo/todos', { params });
    return response;
  },

  // Get assignments needing grading (detailed view)
  getAssignmentsNeedingGrading: async (params = {}) => {
    const response = await axiosClient.get('/teacher-todo/assignments-needing-grading', { params });
    return response;
  },

  // Get unanswered questions (detailed view)
  getUnansweredQuestions: async (params = {}) => {
    const response = await axiosClient.get('/teacher-todo/unanswered-questions', { params });
    return response;
  }
};

export default teacherTodoApi; 