import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import StudentLayout from '../layouts/StudentLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/components/UserManagement';
import ClassroomManagement from '../pages/admin/components/ClassroomManagement';
import AdminClassroomDetail from '../pages/admin/components/AdminClassroomDetail';
import QuizManagement from '../pages/admin/components/QuizManagement';
import QuestionManagement from '../pages/admin/components/question/QuestionManagement';
import NotificationManagement from '../pages/admin/components/NotificationManagement';
import AdminRequestManagement from '../pages/admin/components/AdminRequestManagement';
import AdminProfile from '../pages/admin/AdminProfile';

// Teacher Pages
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import TeacherClassroomManagement from '../pages/teacher/ClassroomManagement';
import TeacherClassroomDetail from '../pages/teacher/ClassroomDetail';
import EditClassForm from '../pages/teacher/EditClassForm';
import TeacherProfile from '../pages/teacher/TeacherProfile';
import TeacherRequestManagement from '../pages/teacher/TeacherRequestManagement';

// Student Pages
import StudentProfile from '../pages/student/StudentProfile';
import StudentClassroomManagement from '../pages/student/StudentClassroomManagement';
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentClassroomDetail from '../pages/student/StudentClassroomDetail';
import StudentAssignmentList from '../pages/student/StudentAssignmentList';
import StudentAssignmentDetail from '../pages/student/StudentAssignmentDetail';
import StudentQuizList from '../pages/student/StudentQuizList';
import QuizPage from '../pages/student/QuizPage';
// import MyClassess from '../pages/student/MyCourses';
// import TakeQuiz from '../pages/student/TakeQuiz';
// import MyGrades from '../pages/student/MyGrades';
// import MyProgress from '../pages/student/MyProgress';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

// Placeholder components for upcoming features
const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-96 text-center">
    <div className="text-6xl text-gray-300 mb-4">🚧</div>
    <h2 className="text-2xl font-bold text-gray-600 mb-2">{title}</h2>
    <p className="text-gray-500">Tính năng này đang được phát triển</p>
  </div>
);

const AppRouter = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="classrooms" element={<ClassroomManagement />} />
        <Route path="classrooms/:classroomId" element={<AdminClassroomDetail />} />
        <Route path="quizzes" element={<QuizManagement />} />
        <Route path="questions" element={<QuestionManagement />} />
        <Route path="notifications" element={<NotificationManagement />} />
        <Route path="requests" element={<AdminRequestManagement />} />
      </Route>

      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<TeacherDashboard />} />
        <Route path="dashboard" element={<TeacherDashboard />} />

        {/* Classroom Management */}
        <Route path="classroom" element={<TeacherClassroomManagement />} />
        <Route path="classroom/:classId" element={<TeacherClassroomDetail />} />
        <Route path="classroom/edit/:classId" element={<EditClassForm />} />

        {/* Request Management */}
        <Route path="requests" element={<TeacherRequestManagement />} />

        {/* Profile */}
        <Route path="profile" element={<TeacherProfile />} />

        {/* Upcoming Features */}
        <Route path="quizzes" element={<ComingSoon title="Quản lý Bài kiểm tra" />} />
        <Route path="assignments" element={<ComingSoon title="Quản lý Bài tập" />} />
        <Route path="grades" element={<ComingSoon title="Chấm điểm" />} />
        <Route path="reports" element={<ComingSoon title="Báo cáo & Thống kê" />} />
        <Route path="schedule" element={<ComingSoon title="Lịch học" />} />
        <Route path="students" element={<ComingSoon title="Quản lý Học sinh" />} />
        <Route path="notifications" element={<ComingSoon title="Thông báo" />} />
      </Route>

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="classrooms" element={<StudentClassroomManagement />} />
        <Route path="classroom/:classroomId" element={<StudentClassroomDetail />} />
        {/* Upcoming Student Features */}
        <Route path="assignments" element={<StudentAssignmentList />} />
        <Route path="assignments/:assignmentId" element={<StudentAssignmentDetail/>} />
        <Route path="quizzes" element={<StudentQuizList/>} />
        <Route path="quizzes/:quizId" element={<QuizPage/>} />
        <Route path="grades" element={<ComingSoon title="Điểm số" />} />
        <Route path="schedule" element={<ComingSoon title="Lịch học" />} />
      </Route>

      {/* Default Route - Redirect based on user role */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {user?.role === 'admin' ? (
              <Navigate to="/admin" />
            ) : user?.role === 'teacher' ? (
              <Navigate to="/teacher" />
            ) : (
              <Navigate to="/student" />
            )}
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route 
        path="*" 
        element={
          <div className="flex flex-col items-center justify-center h-screen text-center">
            <div className="text-9xl text-gray-300 mb-4">404</div>
            <h1 className="text-4xl font-bold text-gray-600 mb-2">Trang không tìm thấy</h1>
            <p className="text-gray-500 mb-6">Trang bạn đang tìm kiếm không tồn tại</p>
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Quay lại
            </button>
          </div>
        } 
      />
    </Routes>
  );
};

export default AppRouter; 