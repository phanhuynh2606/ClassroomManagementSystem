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
    // Add basic assignment data
    console.log('Creating assignment with data:', assignmentData);
    
    Object.keys(assignmentData).forEach(key => {
      if (key === 'attachments') {
        // Handle file attachments
        if (assignmentData.attachments && assignmentData.attachments.length > 0) {
          assignmentData.attachments.forEach((file, index) => {
            console.log(`Processing attachment ${index}:`, {
              name: file.name,
              originFileObj: file.originFileObj?.name,
              size: file.originFileObj?.size
            });
            
            if (file.originFileObj) {
              // Log file details
              console.log('File name:', JSON.stringify(file.originFileObj.name));
              console.log('File name char codes:', [...file.originFileObj.name].map(c => c.charCodeAt(0)));
              
              formData.append('attachments', file.originFileObj);
            }
          });
        }
      } else if (key === 'submissionSettings') {
        // Handle nested object - stringify for FormData
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
    
    // Log FormData contents
    console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes)`);
        console.log(`File name char codes:`, [...value.name].map(c => c.charCodeAt(0)));
      } else {
        console.log(`${key}:`, value);
      }
    }
    
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
    
    console.log('Updating assignment with data:', assignmentData);
    
    Object.keys(assignmentData).forEach(key => {
      if (key === 'attachments') {
        // Handle file attachments
        if (assignmentData.attachments && assignmentData.attachments.length > 0) {
          assignmentData.attachments.forEach((file, index) => {
            console.log(`Processing attachment ${index}:`, {
              name: file.name,
              originFileObj: file.originFileObj?.name,
              size: file.originFileObj?.size
            });
            
            if (file.originFileObj) {
              formData.append('attachments', file.originFileObj);
            }
          });
        }
      } else if (key === 'submissionSettings') {
        // Handle nested object - stringify for FormData
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

    // Log FormData contents for debugging
    console.log("FormData entries for update:");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(`${key}:`, value);
      }
    }

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

  // Assignment analytics
  getAnalytics: (assignmentId) => {
    return axiosClient.get(`/assignments/${assignmentId}/analytics`);
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
  }
};

export default assignmentAPI; 