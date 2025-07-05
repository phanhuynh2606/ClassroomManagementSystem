const Assignment = require('../models/assignment.model');
const Stream = require('../models/stream.model');
const Comment = require('../models/comment.model');
const Classroom = require('../models/classroom.model');
const User = require('../models/user.model');

// Get teacher dashboard todo items
const getTeacherTodos = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    // Get teacher's classrooms
    const classrooms = await Classroom.find({ 
      teacher: teacherId,
      isActive: true 
    }).select('_id name');

    const classroomIds = classrooms.map(c => c._id);
    
    if (classroomIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          assignments: [],
          questions: [],
          stats: {
            pendingAssignments: 0,
            pendingQuestions: 0,
            totalSubmissions: 0,
            totalGradedSubmissions: 0
          }
        }
      });
    }

    // Get assignments needing grading
    const allAssignments = await Assignment.find({
      classroom: { $in: classroomIds },
      visibility: 'published',
      isActive: true,
      deleted: false
    })
    .populate('classroom', 'name code students')
    .populate('createdBy', 'fullName email image')
    .sort({ dueDate: 1 });


    // Filter assignments with ungraded submissions
    const assignmentsNeedingGrading = allAssignments.filter(assignment => 
      assignment.submissions.some(sub => sub.grade === null || sub.grade === undefined)
    ).slice(0, parseInt(limit));

    // Transform assignments data
    const assignmentsTodo = assignmentsNeedingGrading.map(assignment => {
      const ungradedSubmissions = assignment.submissions.filter(sub => sub.grade === null);
      const totalSubmissions = assignment.submissions.length;
      console.log("Assignment", assignment.classroom);
      return {
        id: assignment._id,
        title: assignment.title,
        classroomName: assignment.classroom.name,
        classroomId: assignment.classroom._id,
        submissionsCount: totalSubmissions,
        ungradedCount: ungradedSubmissions.length,
        totalStudents: assignment.classroom.students?.length || 0,
        dueDate: assignment.dueDate,
        totalPoints: assignment.totalPoints,
        type: 'assignment',
        priority: getPriorityFromDueDate(assignment.dueDate),
        createdAt: assignment.createdAt
      };
    });

    // Get unanswered questions (student posts and comments)
    const unansweredQuestions = await getUnansweredQuestions(classroomIds, teacherId, parseInt(limit));

    // Get overall statistics
    const stats = await getTeacherStats(classroomIds, teacherId);

    return res.status(200).json({
      success: true,
      data: {
        assignments: assignmentsTodo,
        questions: unansweredQuestions,
        stats
      }
    });

  } catch (error) {
    console.error('Error getting teacher todos:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get assignments needing grading (detailed)
const getAssignmentsNeedingGrading = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { page = 1, limit = 20, priority } = req.query;

    // Get teacher's classrooms
    const classrooms = await Classroom.find({ 
      teacher: teacherId,
      isActive: true 
    }).select('_id name students');

    const classroomIds = classrooms.map(c => c._id);

    if (classroomIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          assignments: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0
          }
        }
      });
    }

    // Build query
    let query = {
      classroom: { $in: classroomIds },
      visibility: 'published',
      isActive: true,
      deleted: false
    };

    // Add priority filter
    if (priority) {
      const now = new Date();
      if (priority === 'high') {
        query.dueDate = { $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) }; // Due within 24 hours
      } else if (priority === 'medium') {
        query.dueDate = { 
          $gte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          $lt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        }; // Due within 3 days
      } else if (priority === 'low') {
        query.dueDate = { $gte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) }; // Due after 3 days
      }
    }

    // Get assignments
    const assignments = await Assignment.find(query)
      .populate('classroom', 'name code students')
      .populate('createdBy', 'fullName email image')
      .populate('submissions.student', 'fullName email image')
      .sort({ dueDate: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Filter only assignments with ungraded submissions
    const assignmentsWithUngraded = assignments.filter(assignment => 
      assignment.submissions.some(sub => sub.grade === null)
    );

    // Transform data
    const assignmentsTodo = assignmentsWithUngraded.map(assignment => {
      const ungradedSubmissions = assignment.submissions.filter(sub => sub.grade === null);
      const gradedSubmissions = assignment.submissions.filter(sub => sub.grade !== null);
      
      return {
        id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        classroomName: assignment.classroom.name,
        classroomId: assignment.classroom._id,
        totalStudents: assignment.classroom.students?.length || 0,
        submissionsCount: assignment.submissions.length,
        ungradedCount: ungradedSubmissions.length,
        gradedCount: gradedSubmissions.length,
        dueDate: assignment.dueDate,
        totalPoints: assignment.totalPoints,
        type: 'assignment',
        priority: getPriorityFromDueDate(assignment.dueDate),
        createdAt: assignment.createdAt,
        ungradedSubmissions: ungradedSubmissions.map(sub => ({
          id: sub._id,
          student: sub.student,
          submittedAt: sub.submittedAt,
          status: sub.status
        }))
      };
    });

    // Get total count
    const totalCount = await Assignment.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        assignments: assignmentsTodo,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting assignments needing grading:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get unanswered questions
const getUnansweredQuestionsEndpoint = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    // Get teacher's classrooms
    const classrooms = await Classroom.find({ 
      teacher: teacherId,
      isActive: true 
    }).select('_id name');

    const classroomIds = classrooms.map(c => c._id);

    if (classroomIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          questions: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0
          }
        }
      });
    }

    const questions = await getUnansweredQuestions(classroomIds, teacherId, parseInt(limit), parseInt(page));
    const totalCount = await getTotalUnansweredQuestions(classroomIds, teacherId);

    return res.status(200).json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting unanswered questions:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper functions
const getUnansweredQuestions = async (classroomIds, teacherId, limit, page = 1) => {
  try {
    const skip = (page - 1) * limit;

    // Get student posts that teacher hasn't replied to
    const studentPosts = await Stream.find({
      classroom: { $in: classroomIds },
      type: 'student_post',
      status: 'published',
      isActive: true,
      author: { $ne: teacherId } // Not by teacher
    })
    .populate('author', 'fullName email image')
    .populate('classroom', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Check which posts don't have teacher replies
    const unansweredPosts = [];
    for (const post of studentPosts) {
      const teacherReply = await Comment.findOne({
        streamItem: post._id,
        author: teacherId,
        status: 'active',
        isActive: true
      });

      if (!teacherReply) {
        unansweredPosts.push({
          id: post._id,
          type: 'student_post',
          student: post.author.fullName,
          studentAvatar: post.author.image,
          studentId: post.author._id,
          question: post.title,
          content: post.content,
          classroomName: post.classroom.name,
          classroomId: post.classroom._id,
          createdAt: post.createdAt,
          isAnswered: false
        });
      }
    }

    // Get comments from students that teacher hasn't replied to
    const studentComments = await Comment.find({
      streamItem: { 
        $in: await Stream.find({
          classroom: { $in: classroomIds },
          status: 'published',
          isActive: true
        }).distinct('_id')
      },
      author: { $ne: teacherId }, // Not by teacher
      status: 'active',
      isActive: true,
      parentComment: { $exists: false } // Top-level comments only
    })
    .populate('author', 'fullName email image')
    .populate('streamItem', 'title classroom')
    .populate({
      path: 'streamItem',
      populate: {
        path: 'classroom',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Check which comments don't have teacher replies
    const unansweredComments = [];
    for (const comment of studentComments) {
      const teacherReply = await Comment.findOne({
        streamItem: comment.streamItem._id,
        author: teacherId,
        status: 'active',
        isActive: true,
        $or: [
          { parentComment: comment._id },
          { 
            createdAt: { $gt: comment.createdAt },
            content: { $regex: comment.author.fullName, $options: 'i' }
          }
        ]
      });

      if (!teacherReply) {
        unansweredComments.push({
          id: comment._id,
          type: 'comment',
          student: comment.author.fullName,
          studentAvatar: comment.author.image,
          studentId: comment.author._id,
          question: comment.content,
          content: comment.content,
          classroomName: comment.streamItem.classroom.name,
          classroomId: comment.streamItem.classroom._id,
          streamItemId: comment.streamItem._id,
          streamItemTitle: comment.streamItem.title,
          createdAt: comment.createdAt,
          isAnswered: false
        });
      }
    }

    // Combine and sort by date
    const allQuestions = [...unansweredPosts, ...unansweredComments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return allQuestions;

  } catch (error) {
    console.error('Error getting unanswered questions:', error);
    return [];
  }
};

const getTotalUnansweredQuestions = async (classroomIds, teacherId) => {
  try {
    // Count student posts without teacher replies
    const studentPosts = await Stream.find({
      classroom: { $in: classroomIds },
      type: 'student_post',
      status: 'published',
      isActive: true,
      author: { $ne: teacherId }
    }).select('_id');

    let unansweredPostsCount = 0;
    for (const post of studentPosts) {
      const teacherReply = await Comment.findOne({
        streamItem: post._id,
        author: teacherId,
        status: 'active',
        isActive: true
      });
      if (!teacherReply) unansweredPostsCount++;
    }

    // Count comments without teacher replies
    const studentComments = await Comment.find({
      streamItem: { 
        $in: await Stream.find({
          classroom: { $in: classroomIds },
          status: 'published',
          isActive: true
        }).distinct('_id')
      },
      author: { $ne: teacherId },
      status: 'active',
      isActive: true,
      parentComment: { $exists: false }
    }).select('_id streamItem');

    let unansweredCommentsCount = 0;
    for (const comment of studentComments) {
      const teacherReply = await Comment.findOne({
        streamItem: comment.streamItem,
        author: teacherId,
        status: 'active',
        isActive: true,
        $or: [
          { parentComment: comment._id },
          { createdAt: { $gt: comment.createdAt } }
        ]
      });
      if (!teacherReply) unansweredCommentsCount++;
    }

    return unansweredPostsCount + unansweredCommentsCount;

  } catch (error) {
    console.error('Error counting unanswered questions:', error);
    return 0;
  }
};

const getTeacherStats = async (classroomIds, teacherId) => {
  try {
    // Get assignment statistics
    const assignments = await Assignment.find({
      classroom: { $in: classroomIds },
      visibility: 'published',
      isActive: true,
      deleted: false
    });

    let totalSubmissions = 0;
    let totalGradedSubmissions = 0;
    let pendingAssignments = 0;

    assignments.forEach(assignment => {
      const submissions = assignment.submissions || [];
      totalSubmissions += submissions.length;
      
      const ungradedSubmissions = submissions.filter(sub => sub.grade === null || sub.grade === undefined);
      totalGradedSubmissions += submissions.length - ungradedSubmissions.length;
      
      if (ungradedSubmissions.length > 0) {
        pendingAssignments++;
      }
    });

    // Get question statistics
    const pendingQuestions = await getTotalUnansweredQuestions(classroomIds, teacherId);

    return {
      pendingAssignments,
      pendingQuestions,
      totalSubmissions,
      totalGradedSubmissions,
      totalClassrooms: classroomIds.length,
      completionRate: totalSubmissions > 0 ? Math.round((totalGradedSubmissions / totalSubmissions) * 100) : 0
    };

  } catch (error) {
    console.error('Error getting teacher stats:', error);
    return {
      pendingAssignments: 0,
      pendingQuestions: 0,
      totalSubmissions: 0,
      totalGradedSubmissions: 0,
      totalClassrooms: 0,
      completionRate: 0
    };
  }
};

const getPriorityFromDueDate = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const timeDiff = due.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (daysDiff < 0) return 'overdue';
  if (daysDiff <= 1) return 'high';
  if (daysDiff <= 3) return 'medium';
  return 'low';
};

module.exports = {
  getTeacherTodos,
  getAssignmentsNeedingGrading,
  getUnansweredQuestionsEndpoint
}; 