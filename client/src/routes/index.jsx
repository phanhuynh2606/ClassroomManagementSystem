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

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/components/UserManagement';
import ClassroomManagement from '../pages/admin/components/ClassroomManagement';
import QuizManagement from '../pages/admin/components/QuizManagement';
import QuestionManagement from '../pages/admin/components/QuestionManagement';
import NotificationManagement from '../pages/admin/components/NotificationManagement';
import AdminProfile from '../pages/admin/AdminProfile';
import TeacherProfile from '../pages/teacher/TeacherProfile';
import StudentProfile from '../pages/student/StudentProfile';

// Teacher Pages
// import TeacherDashboard from '../pages/teacher/TeacherDashboard';
// import MyClassrooms from '../pages/teacher/MyClassrooms';
// import CreateQuiz from '../pages/teacher/CreateQuiz';
// import GradeSubmissions from '../pages/teacher/GradeSubmissions';
// import StudentProgress from '../pages/teacher/StudentProgress';

// Student Pages
// import StudentDashboard from '../pages/student/StudentDashboard';
// import MyClassess from '../pages/student/MyCourses';
// import TakeQuiz from '../pages/student/TakeQuiz';
// import MyGrades from '../pages/student/MyGrades';
// import MyProgress from '../pages/student/MyProgress';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  console.log(user,isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

const AppRouter = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
        <Route path="quizzes" element={<QuizManagement />} />
        <Route path="questions" element={<QuestionManagement />} />
        <Route path="notifications" element={<NotificationManagement />} />
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
        <Route path="profile" element={<TeacherProfile />} />
        {/* <Route index element={<TeacherDashboard />} />
        <Route path="classrooms" element={<MyClassrooms />} />
        <Route path="create-quiz" element={<CreateQuiz />} />
        <Route path="grade-submissions" element={<GradeSubmissions />} />
        <Route path="student-progress" element={<StudentProgress />} /> */}
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
        <Route path="profile" element={<StudentProfile />} />
        {/* <Route index element={<StudentDashboard />} />
        <Route path="classrooms" element={<MyClassess />} />
        <Route path="take-quiz/:quizId" element={<TakeQuiz />} />
        <Route path="grades" element={<MyGrades />} />
        <Route path="progress" element={<MyProgress />} /> 
        */}
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
    </Routes>
  );
};

export default AppRouter; 