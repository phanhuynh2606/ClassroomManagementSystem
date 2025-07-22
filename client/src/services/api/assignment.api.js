import axiosClient from '../axiosClient';

// Helper function to normalize assignment data
const normalizeAssignmentData = (assignment) => {
  if (!assignment) return null;

  return {
    ...assignment,
    // Ensure submissionSettings has default values
    submissionSettings: {
      type: 'both',
      maxFileSize: 10,
      allowedFileTypes: [],
      textSubmissionRequired: false,
      fileSubmissionRequired: false,
      ...assignment.submissionSettings
    },
    // Ensure missingSubmissionPolicy has default values
    missingSubmissionPolicy: {
      autoGradeWhenOverdue: false,
      autoGradeValue: 0,
      daysAfterDueForAutoGrade: 1,
      allowBulkGrading: true,
      notifyStudentsOfMissingSubmission: true,
      reminderDaysBeforeDue: [3, 1],
      ...assignment.missingSubmissionPolicy
    },
    // Ensure attachments is array
    attachments: assignment.attachments || [],
    // Ensure submissions is array  
    submissions: assignment.submissions || [],
    // Ensure tags is array
    tags: assignment.tags || []
  };
};

// Helper function to handle API responses
const handleResponse = (responsePromise) => {
  return responsePromise
    .then(response => {
      const data = response;

      // Normalize single assignment
      if (data.data && !Array.isArray(data.data) && typeof data.data === 'object') {
        data.data = normalizeAssignmentData(data.data);
      }

      // Normalize assignment list
      if (data.data && data.data.docs && Array.isArray(data.data.docs)) {
        data.data.docs = data.data.docs.map(normalizeAssignmentData);
      }

      return data;
    })
    .catch(error => {
      console.error('Assignment API Error:', error);
      throw error;
    });
};

const assignmentAPI = {
  // Get assignments for a classroom
  getClassroomAssignments: (classroomId, params = {}) => {
    return handleResponse(
      axiosClient.get(`/assignments/classroom/${classroomId}`, { params })
    );
  },

  // Get assignment detail
  getDetail: (assignmentId) => {
    return handleResponse(
      axiosClient.get(`/assignments/${assignmentId}`)
    );
  },

  // Create new assignment
  create: (classroomId, assignmentData) => {
    const formData = new FormData();

    Object.keys(assignmentData).forEach(key => {
      if (key === 'attachments') {
        // Handle file attachments
        if (assignmentData.attachments && assignmentData.attachments.length > 0) {
          assignmentData.attachments.forEach((file, index) => {

            if (file.originFileObj) {
              formData.append('attachments', file.originFileObj);
            }
          });
        }
      } else if (key === 'submissionSettings' || key === 'missingSubmissionPolicy') {
        // Handle nested objects - stringify for FormData
        formData.append(key, JSON.stringify(assignmentData[key]));
      } else if (key === 'tags' && Array.isArray(assignmentData[key])) {
        // Handle array fields
        assignmentData[key].forEach(tag => {
          formData.append('tags[]', tag);
        });
      } else if (assignmentData[key] !== undefined && assignmentData[key] !== null) {
        formData.append(key, assignmentData[key]);
      }
    });



    return handleResponse(
      axiosClient.post(`/assignments/classroom/${classroomId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    );
  },

  // Update assignment
  update: (assignmentId, assignmentData) => {
    const formData = new FormData();

    Object.keys(assignmentData).forEach(key => {
      if (key === 'attachments') {
        // Handle file attachments
        if (assignmentData.attachments && assignmentData.attachments.length > 0) {
          assignmentData.attachments.forEach((file, index) => {

            if (file.originFileObj) {
              formData.append('attachments', file.originFileObj);
            }
          });
        }
      } else if (key === 'submissionSettings' || key === 'missingSubmissionPolicy') {
        // Handle nested objects - stringify for FormData
        formData.append(key, JSON.stringify(assignmentData[key]));
      } else if (key === 'tags' && Array.isArray(assignmentData[key])) {
        // Handle array fields
        assignmentData[key].forEach(tag => {
          formData.append('tags[]', tag);
        });
      } else if (assignmentData[key] !== undefined && assignmentData[key] !== null) {
        formData.append(key, assignmentData[key]);
      }
    });

    return handleResponse(
      axiosClient.put(`/assignments/${assignmentId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    );
  },

  // Delete assignment
  delete: (assignmentId) => {
    return axiosClient.delete(`/assignments/${assignmentId}`);
  },

  // Submit assignment (for students)
  submit: (assignmentId, submissionData) => {
    const formData = new FormData();

    if (submissionData.content) {
      formData.append('content', submissionData.content);
    }

    if (submissionData.attachments && submissionData.attachments.length > 0) {
      submissionData.attachments.forEach(file => {
        if (file.originFileObj) {
          formData.append('attachments', file.originFileObj);
        }
      });
    }

    return axiosClient.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get assignment submissions (for teachers)
  getSubmissions: (assignmentId, params = {}) => {
    return axiosClient.get(`/assignments/${assignmentId}/submissions`, { params });
  },

  // Grade submission (for teachers)
  gradeSubmission: (assignmentId, submissionId, gradeData) => {
    return axiosClient.put(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, gradeData);
  },

  // Student specific methods
  getStudentAssignments: (classroomId, params = {}) => {
    return handleResponse(
      axiosClient.get(`/assignments/classroom/${classroomId}`, {
        params: { ...params, role: 'student' }
      })
    );
  },

  getStudentAssignmentDetail: (assignmentId) => {
    return handleResponse(
      axiosClient.get(`/assignments/${assignmentId}?role=student`)
    );
  },

  // Teacher specific methods
  getTeacherAssignments: (classroomId, params = {}) => {
    return axiosClient.get(`/assignments/classroom/${classroomId}`, {
      params: { ...params, role: 'teacher' }
    });
  },

  // Bulk operations
  bulkGrade: (assignmentId, gradesData) => {
    return axiosClient.post(`/assignments/${assignmentId}/bulk-grade`, gradesData);
  },

  // Missing Submission Policy Operations
  // Auto-grade missing submissions when assignment is overdue
  autoGradeMissingSubmissions: (assignmentId) => {
    return axiosClient.post(`/assignments/${assignmentId}/auto-grade-missing`);
  },

  // Bulk grade missing submissions (manual) - based on assignment's missingSubmissionPolicy.allowBulkGrading
  bulkGradeMissingSubmissions: (assignmentId, gradingData) => {
    return axiosClient.post(`/assignments/${assignmentId}/bulk-grade-missing`, gradingData);
  },

  // Export assignment data
  exportAssignment: (assignmentId, format = 'xlsx') => {
    return axiosClient.get(`/assignments/${assignmentId}/export`, {
      params: { format },
      responseType: 'blob'
    });
  },

  // Export submissions
  exportSubmissions: (assignmentId, format = 'xlsx') => {
    return axiosClient.get(`/assignments/${assignmentId}/submissions/export`, {
      params: { format },
      responseType: 'blob'
    });
  },
  getAssignmentStatsByStudent: () => {
    return axiosClient.get('/assignments/by-student');
  },

  // Duplicate assignment
  duplicate: (assignmentId, newData = {}) => {
    return axiosClient.post(`/assignments/${assignmentId}/duplicate`, newData);
  },

  // Refresh assignment data (useful after updates)
  refresh: (assignmentId) => {
    return assignmentAPI.getDetail(assignmentId);
  },

  // Validate submission before submit
  validateSubmission: (assignmentId, submissionData) => {
    return axiosClient.post(`/assignments/${assignmentId}/validate-submission`, submissionData);
  },
   // Assignment analytics - Enhanced version
   getAnalytics: (assignmentId, params = {}) => {
    return axiosClient.get(`/assignments/analytics/assignments/${assignmentId}/analytics`, { 
      params: {
        timeRange: params.timeRange || 'all',
        gradeRange: params.gradeRange || 'all',
        includeHistory: params.includeHistory !== false, // Default true
        ...params
      }
    });
  },

  // Export analytics data
  exportAnalytics: (assignmentId, format = 'xlsx') => {
    return axiosClient.get(`/assignments/${assignmentId}/analytics/export`, {
      params: { format },
      responseType: 'blob'
    });
  },

  // Real-time analytics (for dashboard updates)
  getAnalyticsStream: (assignmentId) => {
    // This could be implemented with WebSocket or Server-Sent Events
    return axiosClient.get(`/assignments/${assignmentId}/analytics/stream`);
  },

  // Compare analytics between assignments
  compareAnalytics: (assignmentIds) => {
    return axiosClient.post('/assignments/compare-analytics', { assignmentIds });
  },

  // Get class analytics summary
  getClassAnalyticsSummary: (classroomId, params = {}) => {
    return axiosClient.get(`/assignments/classroom/${classroomId}/analytics-summary`, { 
      params 
    });
  },

  // Predictive analytics (if you want to implement ML features)
  getPredictiveAnalytics: (assignmentId) => {
    return axiosClient.get(`/assignments/${assignmentId}/predictive-analytics`);
  },

  // Send reminder emails to students who haven't submitted
  sendReminderEmails: (assignmentId, studentIds) => {
    return axiosClient.post(`/assignments/${assignmentId}/send-reminder`, { studentIds });
  }

};
const analyticsHelpers = {
  /**
   * Calculate grade letter from percentage
   */
  getGradeLetter: (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  },

  /**
   * Get grade color based on percentage
   */
  getGradeColor: (percentage) => {
    if (percentage >= 90) return '#52c41a'; // Green
    if (percentage >= 80) return '#1890ff'; // Blue  
    if (percentage >= 70) return '#faad14'; // Gold
    if (percentage >= 60) return '#fa8c16'; // Orange
    return '#ff4d4f'; // Red
  },

  /**
   * Format analytics data for charts
   */
  formatForChart: (data, chartType = 'bar') => {
    switch (chartType) {
      case 'pie':
        return data.map(item => ({
          name: item.label || item.name,
          value: item.count || item.value,
          percentage: item.percentage
        }));
      
      case 'line':
      case 'area':
        return data.map(item => ({
          x: item.date || item.time || item.label,
          y: item.value || item.count,
          label: item.label || item.name
        }));
      
      default: // bar
        return data.map(item => ({
          name: item.label || item.name,
          value: item.count || item.value,
          fill: item.color || '#1890ff'
        }));
    }
  },

  /**
   * Calculate percentile rank
   */
  calculatePercentile: (grades, targetGrade) => {
    const sorted = [...grades].sort((a, b) => a - b);
    const rank = sorted.findIndex(grade => grade >= targetGrade);
    return rank === -1 ? 100 : (rank / sorted.length) * 100;
  },

  /**
   * Generate insights from analytics data
   */
  generateInsights: (analyticsData) => {
    const insights = [];
    const { overview, gradeDistribution } = analyticsData;

    // Class performance insights
    if (overview.passingRate >= 90) {
      insights.push({
        type: 'success',
        title: 'Excellent Class Performance',
        message: `${Math.round(overview.passingRate)}% của lớp đạt điểm đậu`,
        icon: '🎉'
      });
    } else if (overview.passingRate < 60) {
      insights.push({
        type: 'warning', 
        title: 'Performance Needs Attention',
        message: `Chỉ ${Math.round(overview.passingRate)}% đạt điểm đậu`,
        icon: '⚠️'
      });
    }

    // Grade distribution insights
    const aGrades = gradeDistribution.find(g => g.label.includes('A'));
    if (aGrades && aGrades.percentage > 30) {
      insights.push({
        type: 'info',
        title: 'High Achievers',
        message: `${aGrades.percentage.toFixed(1)}% học sinh đạt loại A`,
        icon: '⭐'
      });
    }

    return insights;
  }
};
export { analyticsHelpers };

export default assignmentAPI; 