import { useMemo } from 'react';
import { useSelector } from 'react-redux';

const useClassroomPermissions = (classroomData) => {
  const { user } = useSelector((state) => state.auth);

  const permissions = useMemo(() => {
    if (!user || !classroomData) {
      return {
        canPost: false,
        canComment: false,
        canManage: false,
        canCustomize: false,
        canViewPosts: false
      };
    }

    const userRole = user.role;
    const isTeacher = userRole === 'teacher' && classroomData.teacher?._id === user._id;
    const isAdmin = userRole === 'admin';
    const isStudent = userRole === 'student' && classroomData.students?.some(
      s => s.student === user._id && s.status === 'active'
    );

    // Admin has all permissions
    if (isAdmin) {
      return {
        canPost: true,
        canComment: true,
        canManage: true,
        canCustomize: true,
        canViewPosts: true
      };
    }

    // Teacher permissions
    if (isTeacher) {
      return {
        canPost: true,
        canComment: true,
        canManage: true,
        canCustomize: true,
        canViewPosts: true
      };
    }

    // Student permissions
    if (isStudent) {
      const settings = classroomData.settings || {};
      return {
        canPost: settings.allowStudentPost !== false, // Default true if not specified
        canComment: settings.allowStudentComment !== false, // Default true if not specified
        canManage: false,
        canCustomize: false,
        canViewPosts: true
      };
    }

    // No permissions for non-members
    return {
      canPost: false,
      canComment: false,
      canManage: false,
      canCustomize: false,
      canViewPosts: false
    };
  }, [user, classroomData]);

  return permissions;
};

export default useClassroomPermissions; 