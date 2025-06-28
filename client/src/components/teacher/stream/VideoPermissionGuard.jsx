import React from 'react';
import { useSelector } from 'react-redux';
import { Result, Button } from 'antd';
import { LockOutlined, VideoCameraOutlined } from '@ant-design/icons';

const VideoPermissionGuard = ({ 
  children, 
  requiredRole = 'teacher',
  action = 'upload video',
  showFallback = true 
}) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Check authentication
  if (!isAuthenticated || !user) {
    if (!showFallback) return null;
    
    return (
      <Result
        icon={<LockOutlined className="text-gray-400" />}
        title="Authentication Required"
        subTitle="Please log in to access video upload features"
        extra={
          <Button type="primary" onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        }
      />
    );
  }

  // Define role hierarchy
  const roleHierarchy = {
    student: 0,
    teacher: 1,
    admin: 2
  };

  const userRoleLevel = roleHierarchy[user.role] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 1;

  // Check role permissions
  if (userRoleLevel < requiredRoleLevel) {
    if (!showFallback) return null;
    
    return (
      <Result
        icon={<VideoCameraOutlined className="text-red-400" />}
        title="Insufficient Permissions"
        subTitle={`You need ${requiredRole} privileges to ${action}`}
        extra={
          <div className="text-center">
            <div className="mb-4">
              <div className="text-sm text-gray-600">Current role: <span className="font-medium capitalize">{user.role}</span></div>
              <div className="text-sm text-gray-600">Required role: <span className="font-medium capitalize">{requiredRole}</span></div>
            </div>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        }
      />
    );
  }

  // Permission granted - render children
  return children;
};

// Hook for permission checking
export const useVideoPermissions = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const hasPermission = (action, resourceOwnerId = null) => {
    if (!isAuthenticated || !user) return false;

    const permissions = {
      // Upload permissions
      'upload.video': ['teacher', 'admin'],
      'upload.youtube': ['teacher', 'admin'],
      
      // Management permissions
      'video.edit': (role, ownerId) => {
        if (role === 'admin') return true;
        if (role === 'teacher' && ownerId === user._id) return true;
        return false;
      },
      'video.delete': (role, ownerId) => {
        if (role === 'admin') return true;
        if (role === 'teacher' && ownerId === user._id) return true;
        return false;
      },
      
      // View permissions
      'video.view': ['student', 'teacher', 'admin'],
      'video.comment': ['student', 'teacher', 'admin'],
      
      // Admin only
      'video.admin': ['admin'],
      'youtube.manage': ['admin']
    };

    const permission = permissions[action];
    
    if (Array.isArray(permission)) {
      return permission.includes(user.role);
    }
    
    if (typeof permission === 'function') {
      return permission(user.role, resourceOwnerId);
    }
    
    return false;
  };

  const canUploadVideo = () => hasPermission('upload.video');
  const canAddYouTubeVideo = () => hasPermission('upload.youtube');
  const canEditVideo = (ownerId) => hasPermission('video.edit', ownerId);
  const canDeleteVideo = (ownerId) => hasPermission('video.delete', ownerId);
  const canViewVideo = () => hasPermission('video.view');
  const canCommentVideo = () => hasPermission('video.comment');
  const isVideoAdmin = () => hasPermission('video.admin');

  return {
    hasPermission,
    canUploadVideo,
    canAddYouTubeVideo,
    canEditVideo,
    canDeleteVideo,
    canViewVideo,
    canCommentVideo,
    isVideoAdmin,
    userRole: user?.role,
    userId: user?._id
  };
};

export default VideoPermissionGuard; 