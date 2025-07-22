import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Spin } from "antd";

// Layouts
import AdminLayout from "../layouts/AdminLayout";
import TeacherLayout from "../layouts/TeacherLayout";
import StudentLayout from "../layouts/StudentLayout";
import MainLayout from "../layouts/MainLayout";

// Auth Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

// Admin Pages
import AdminProfile from "../pages/admin/AdminProfile";

// Teacher Pages
import TeacherProfile from "../pages/teacher/TeacherProfile";
import TeacherSettings from "../pages/teacher/TeacherSettings";
import TeacherNotifications from "../pages/teacher/TeacherNotifications";
import TeacherTodo from "../pages/teacher/TeacherTodo";
import TeacherMaterials from "../pages/teacher/TeacherMaterials";
import TeacherRequestManagement from "../pages/teacher/TeacherRequestManagement";
import CreateClassForm from "../pages/teacher/CreateClassForm";
import EditClassForm from "../pages/teacher/EditClassForm";

// Student Pages
import StudentProfile from "../pages/student/StudentProfile";
import StudentClassroomManagement from "../pages/student/StudentClassroomManagement";
import StudentAssignmentList from "../pages/student/StudentAssignmentList";
import StudentQuizList from "../pages/student/StudentQuizList";
import StudentGrades from "../pages/student/StudentGrades";

// 🚀 LAZY LOAD HEAVY COMPONENTS
// Heavy Admin Pages
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const UserManagement = lazy(() =>
  import("../pages/admin/components/UserManagement")
);
const ClassroomManagement = lazy(() =>
  import("../pages/admin/components/ClassroomManagement")
);
const AdminClassroomDetail = lazy(() =>
  import("../pages/admin/components/AdminClassroomDetail")
);
const QuizManagement = lazy(() =>
  import("../pages/admin/components/QuizManagement")
);
const QuestionManagement = lazy(() =>
  import("../pages/admin/components/question/QuestionManagement")
);
const NotificationManagement = lazy(() =>
  import("../pages/admin/components/NotificationManagement")
);
const AdminRequestManagement = lazy(() =>
  import("../pages/admin/components/AdminRequestManagement")
);

// Heavy Teacher Pages
const TeacherDashboard = lazy(() =>
  import("../pages/teacher/TeacherDashboard")
);
const TeacherClassroomManagement = lazy(() =>
  import("../pages/teacher/ClassroomManagement")
);
const TeacherClassroomDetail = lazy(() =>
  import("../pages/teacher/ClassroomDetail")
);
const QuizDetail = lazy(() => import("../components/teacher/quiz/QuizDetail"));
const AssignmentDetail = lazy(() =>
  import("../pages/teacher/AssignmentDetail")
);
const AssignmentEdit = lazy(() => import("../pages/teacher/AssignmentEdit"));

// Heavy Student Pages
const StudentDashboard = lazy(() =>
  import("../pages/student/StudentDashboard")
);
const StudentClassroomDetail = lazy(() =>
  import("../pages/student/StudentClassroomDetail")
);
const StudentAssignmentDetail = lazy(() =>
  import("../pages/student/StudentAssignmentDetail")
);
const QuizPage = lazy(() => import("../pages/student/QuizPage"));

// Loading Components
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <Spin size="large" />
      <div className="mt-4 text-gray-600 text-lg">Loading page...</div>
    </div>
  </div>
);

const DashboardLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <Spin size="large" />
      <div className="mt-4 text-gray-600 text-lg">Loading dashboard...</div>
    </div>
  </div>
);

const ClassroomLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
    <div className="text-center">
      <Spin size="large" />
      <div className="mt-4 text-gray-600 text-lg">Loading classroom...</div>
    </div>
  </div>
);

const AssignmentLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
    <div className="text-center">
      <Spin size="large" />
      <div className="mt-4 text-gray-600 text-lg">Loading assignment...</div>
    </div>
  </div>
);

const ManagementLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
    <div className="text-center">
      <Spin size="large" />
      <div className="mt-4 text-gray-600 text-lg">
        Loading management panel...
      </div>
    </div>
  </div>
);

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

// Loading component
const Loading = () => (
  <div className="flex justify-center items-center h-64">
    <Spin size="large" />
  </div>
);

const AppRouter = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Main layout for public pages */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/login" replace />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<DashboardLoader />}>
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route path="profile" element={<AdminProfile />} />
          <Route
            path="users"
            element={
              <Suspense fallback={<ManagementLoader />}>
                <UserManagement />
              </Suspense>
            }
          />
          <Route
            path="classrooms"
            element={
              <Suspense fallback={<ManagementLoader />}>
                <ClassroomManagement />
              </Suspense>
            }
          />
          <Route
            path="classrooms/:classroomId"
            element={
              <Suspense fallback={<ClassroomLoader />}>
                <AdminClassroomDetail />
              </Suspense>
            }
          />
          <Route
            path="quizzes"
            element={
              <Suspense fallback={<ManagementLoader />}>
                <QuizManagement />
              </Suspense>
            }
          />
          <Route
            path="questions"
            element={
              <Suspense fallback={<ManagementLoader />}>
                <QuestionManagement />
              </Suspense>
            }
          />
          <Route
            path="notifications"
            element={
              <Suspense fallback={<ManagementLoader />}>
                <NotificationManagement />
              </Suspense>
            }
          />
          <Route
            path="requests"
            element={
              <Suspense fallback={<ManagementLoader />}>
                <AdminRequestManagement />
              </Suspense>
            }
          />
        </Route>

        {/* Teacher Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route
            index
            element={
              <Suspense fallback={<DashboardLoader />}>
                <TeacherDashboard />
              </Suspense>
            }
          />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<DashboardLoader />}>
                <TeacherDashboard />
              </Suspense>
            }
          />

          {/* Classroom Management */}
          <Route
            path="classroom"
            element={
              <Suspense fallback={<ManagementLoader />}>
                <TeacherClassroomManagement />
              </Suspense>
            }
          />
          <Route path="classroom/create" element={<CreateClassForm />} />
          <Route
            path="classroom/:classId"
            element={
              <Suspense fallback={<ClassroomLoader />}>
                <TeacherClassroomDetail />
              </Suspense>
            }
          />
          
          <Route 
            path="classroom/:classId/quizzes/:quizId"
            element={<QuizDetail />}
          />

          <Route path="classroom/edit/:classId" element={<EditClassForm />} />
          <Route
            path="classroom/:classId/assignment/:assignmentId"
            element={
              <Suspense fallback={<AssignmentLoader />}>
                <AssignmentDetail />
              </Suspense>
            }
          />
          <Route
            path="classroom/:classId/assignment/:assignmentId/edit"
            element={
              <Suspense fallback={<AssignmentLoader />}>
                <AssignmentEdit />
              </Suspense>
            }
          />

          {/* Core Features */}
          <Route path="todo" element={<TeacherTodo />} />
          <Route path="materials" element={<TeacherMaterials />} />

          {/* Management */}
          <Route path="requests" element={<TeacherRequestManagement />} />
          <Route path="notifications" element={<TeacherNotifications />} />

          {/* Settings & Profile */}
          {/* <Route path="settings" element={<TeacherSettings />} /> */}
          <Route path="profile" element={<TeacherProfile />} />
        </Route>

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<DashboardLoader />}>
                <StudentDashboard />
              </Suspense>
            }
          />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<DashboardLoader />}>
                <StudentDashboard />
              </Suspense>
            }
          />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="classrooms" element={<StudentClassroomManagement />} />
          <Route
            path="classroom/:classroomId"
            element={
              <Suspense fallback={<ClassroomLoader />}>
                <StudentClassroomDetail />
              </Suspense>
            }
          />
          {/* Upcoming Student Features */}

          <Route
            path="classrooms/:classroomId/assignments/:assignmentId"
            element={
              <Suspense fallback={<AssignmentLoader />}>
                <StudentAssignmentDetail />
              </Suspense>
            }
          />
          <Route
            path="classrooms/:classroomId/quizzes/:quizId"
            element={
              <Suspense fallback={<PageLoader />}>
                <QuizPage />
              </Suspense>
            }
          />
          <Route path="grades" element={<StudentGrades />} />
          <Route path="schedule" element={<ComingSoon title="Lịch học" />} />
        </Route>

        {/* Default Route - Redirect based on user role */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {user?.role === "admin" ? (
                <Navigate to="/admin" />
              ) : user?.role === "teacher" ? (
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
              <h1 className="text-4xl font-bold text-gray-600 mb-2">
                Trang không tìm thấy
              </h1>
              <p className="text-gray-500 mb-6">
                Trang bạn đang tìm kiếm không tồn tại
              </p>
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
    </Suspense>
  );
};

export default AppRouter;
