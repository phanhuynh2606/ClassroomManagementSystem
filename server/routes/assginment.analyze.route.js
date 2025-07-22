const express = require('express');
const moment = require('moment');
const { protect, authorize } = require('../middleware/auth.middleware');
const Assignment = require('../models/assignment.model');
const User = require('../models/user.model');
const Classroom = require('../models/classroom.model');
const router = express.Router();

/**
 * GET /api/assignments/:assignmentId/analytics
 * Get comprehensive analytics for an assignment
 */
router.get('/assignments/:assignmentId/analytics', 
  protect, 
  authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { timeRange, gradeRange, includeHistory = true } = req.query;
      const userId = req.user._id;
      const userRole = req.user.role;

      console.log(`📊 Analytics request for assignment: ${assignmentId}`);

      // Get assignment with full submission data
      const assignment = await Assignment.findById(assignmentId)
        .populate('classroom', 'teacher students name')
        .populate({
          path: 'submissions.student',
          model: 'User',
          select: 'fullName email image studentId'
        });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Authorization check
      const isTeacher = assignment.classroom.teacher.toString() === userId.toString();
      if (!isTeacher && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view analytics'
        });
      }

      // Get all students in classroom for complete analytics
      const classroom = await Classroom.findById(assignment.classroom._id)
        .populate('students.student', 'fullName email image studentId');

      const allStudents = classroom.students
        .filter(s => s.status === 'active')
        .map(s => s.student);

      console.log(`📊 Found ${allStudents.length} students, ${assignment.submissions.length} submissions`);

      // Calculate analytics data
      const analyticsData = await calculateAssignmentAnalytics(
        assignment, 
        allStudents,
        { timeRange, gradeRange, includeHistory }
      );

      console.log(`✅ Analytics calculated successfully`);

      res.json({
        success: true,
        data: analyticsData,
        meta: {
          calculatedAt: new Date().toISOString(),
          assignmentId: assignment._id,
          assignmentTitle: assignment.title,
          totalStudents: allStudents.length,
          dueDate: assignment.dueDate,
          source: 'server'
        }
      });

    } catch (error) {
      console.error('❌ Analytics API Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/assignments/:assignmentId/analytics/export
 * Export analytics data as Excel/PDF
 */
router.get('/assignments/:assignmentId/analytics/export',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { format = 'xlsx' } = req.query;

      console.log(`📊 Export request: ${assignmentId} as ${format}`);

      // Get analytics data
      const assignment = await Assignment.findById(assignmentId)
        .populate('classroom', 'teacher students name')
        .populate('submissions.student', 'fullName email');

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Authorization check
      const isTeacher = assignment.classroom.teacher.toString() === req.user._id.toString();
      if (!isTeacher && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to export analytics'
        });
      }

      // For now, return basic CSV format
      if (format === 'csv') {
        const csvData = generateCSVAnalytics(assignment);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${assignmentId}.csv"`);
        res.send(csvData);
      } else {
        // Excel format would require additional library
        res.status(400).json({
          success: false,
          message: 'Excel export not implemented yet. Use CSV format.'
        });
      }

    } catch (error) {
      console.error('❌ Export Analytics Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics'
      });
    }
  }
);

/**
 * Main analytics calculation function
 */
async function calculateAssignmentAnalytics(assignment, allStudents, options = {}) {
  try {
    const { timeRange, gradeRange, includeHistory } = options;
    const maxGrade = Number(assignment.totalPoints) || 100;
    
    console.log(`🔄 Calculating analytics for assignment: ${assignment.title}`);
    
    // Filter submissions based on criteria
    let validSubmissions = assignment.submissions.filter(submission => {
      // Basic filters - must have submitted and graded
      if (!submission.submittedAt || 
          submission.grade === null || 
          submission.grade === undefined ||
          isNaN(submission.grade)) {
        return false;
      }

      // Time range filter
      if (timeRange && timeRange !== 'all') {
        const submittedDate = moment(submission.submittedAt);
        const now = moment();
        
        switch (timeRange) {
          case 'last_7_days':
            if (!submittedDate.isAfter(now.clone().subtract(7, 'days'))) return false;
            break;
          case 'last_30_days':
            if (!submittedDate.isAfter(now.clone().subtract(30, 'days'))) return false;
            break;
          case 'last_semester':
            if (!submittedDate.isAfter(now.clone().subtract(6, 'months'))) return false;
            break;
        }
      }

      // Grade range filter
      if (gradeRange && gradeRange !== 'all') {
        const percentage = (Number(submission.grade) / maxGrade) * 100;
        
        switch (gradeRange) {
          case 'excellent': // 90-100%
            if (percentage < 90) return false;
            break;
          case 'good': // 80-89%
            if (percentage < 80 || percentage >= 90) return false;
            break;
          case 'average': // 70-79%
            if (percentage < 70 || percentage >= 80) return false;
            break;
          case 'below_average': // <70%
            if (percentage >= 70) return false;
            break;
        }
      }

      return true;
    });

    console.log(`📊 Valid submissions: ${validSubmissions.length} out of ${assignment.submissions.length}`);

    // Calculate components
    const overview = calculateOverviewStats(assignment, allStudents, validSubmissions, maxGrade);
    const gradeDistribution = calculateGradeDistribution(validSubmissions, maxGrade);
    const submissionTimeline = calculateSubmissionTimeline(validSubmissions, assignment.dueDate);
    const performanceInsights = calculatePerformanceInsights(validSubmissions, maxGrade, overview.avgGrade);
    const timeAnalysis = calculateTimeAnalysis(validSubmissions);
    const studentPerformance = calculateStudentPerformance(allStudents, assignment.submissions, assignment, maxGrade);
    
    // Calculate trends if history is requested
    let trends = null;
    if (includeHistory) {
      trends = await calculateTrends(assignment, validSubmissions);
    }

    const result = {
      overview,
      gradeDistribution,
      submissionTimeline,
      performanceInsights,
      timeAnalysis,
      studentPerformance,
      trends,
      metadata: {
        totalSubmissions: validSubmissions.length,
        totalStudents: allStudents.length,
        assignmentMaxGrade: maxGrade,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt,
        lastCalculated: new Date().toISOString()
      }
    };

    console.log(`✅ Analytics calculation complete`);
    return result;

  } catch (error) {
    console.error('❌ Error in calculateAssignmentAnalytics:', error);
    throw error;
  }
}

/**
 * Calculate overview statistics
 */
function calculateOverviewStats(assignment, allStudents, validSubmissions, maxGrade) {
  try {
    const grades = validSubmissions.map(s => Number(s.grade) || 0);
    const avgGrade = grades.length > 0 ? 
      grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0;
    
    const sortedGrades = [...grades].sort((a, b) => a - b);
    const median = sortedGrades.length > 0 ? 
      sortedGrades[Math.floor(sortedGrades.length / 2)] : 0;

    // Late submissions
    const lateSubmissions = validSubmissions.filter(s => 
      s.submittedAt && assignment.dueDate &&
      moment(s.submittedAt).isAfter(moment(assignment.dueDate))
    );

    // All submissions (including ungraded ones)
    const allSubmittedSubmissions = assignment.submissions.filter(s => s.submittedAt);

    // Passing rate (assuming 60% is passing)
    const passingGrade = maxGrade * 0.6;
    const passingSubmissions = validSubmissions.filter(s => (Number(s.grade) || 0) >= passingGrade);

    // Standard deviation
    const standardDeviation = grades.length > 0 ? calculateStandardDeviation(grades) : 0;

    return {
      totalStudents: allStudents.length,
      submittedCount: allSubmittedSubmissions.length,
      gradedCount: validSubmissions.length,
      missingCount: allStudents.length - allSubmittedSubmissions.length,
      lateCount: lateSubmissions.length,
      avgGrade: Math.round(avgGrade * 10) / 10,
      medianGrade: Math.round(median * 10) / 10,
      highestGrade: grades.length > 0 ? Math.max(...grades) : 0,
      lowestGrade: grades.length > 0 ? Math.min(...grades) : 0,
      passingRate: validSubmissions.length > 0 ? (passingSubmissions.length / validSubmissions.length * 100) : 0,
      standardDeviation: Math.round(standardDeviation * 10) / 10,
      completionRate: allStudents.length > 0 ? (allSubmittedSubmissions.length / allStudents.length * 100) : 0
    };
  } catch (error) {
    console.error('❌ Error in calculateOverviewStats:', error);
    throw error;
  }
}

/**
 * Calculate grade distribution
 */
function calculateGradeDistribution(validSubmissions, maxGrade) {
  const gradeRanges = [
    { label: 'A (90-100%)', min: maxGrade * 0.9, max: maxGrade, color: '#52c41a' },
    { label: 'B (80-89%)', min: maxGrade * 0.8, max: maxGrade * 0.89, color: '#1890ff' },
    { label: 'C (70-79%)', min: maxGrade * 0.7, max: maxGrade * 0.79, color: '#faad14' },
    { label: 'D (60-69%)', min: maxGrade * 0.6, max: maxGrade * 0.69, color: '#fa8c16' },
    { label: 'F (<60%)', min: 0, max: maxGrade * 0.59, color: '#ff4d4f' }
  ];
  console.log("validSubmissions gradeDistribution", validSubmissions);
  return gradeRanges.map(range => {
    const count = validSubmissions.filter(s => {
      const grade = Number(s.grade) || 0;
      return grade >= range.min && grade <= range.max;
    }).length;

    return {
      ...range,
      count,
      percentage: validSubmissions.length > 0 ? (count / validSubmissions.length * 100) : 0,
      students: validSubmissions
        .filter(s => {
          const grade = Number(s.grade) || 0;
          return grade >= range.min && grade <= range.max;
        })
        .map(s => ({
          studentId: s.student._id || s.student,
          studentName: s.student.fullName || s.student.name || 'Unknown',
          grade: s.grade,
          submittedAt: s.submittedAt
        }))
    };
  });
}

/**
 * Calculate submission timeline
 */
function calculateSubmissionTimeline(validSubmissions, dueDate) {
  const timeline = validSubmissions
    .filter(s => s.submittedAt) // Ensure submittedAt exists
    .map(s => ({
      date: moment(s.submittedAt).format('YYYY-MM-DD'),
      hour: moment(s.submittedAt).hour(),
      day: moment(s.submittedAt).format('dddd'),
      isLate: dueDate ? moment(s.submittedAt).isAfter(moment(dueDate)) : false,
      grade: Number(s.grade) || 0,
      studentName: s.student.fullName || s.student.name || 'Unknown',
      hoursBeforeDue: dueDate ? moment(dueDate).diff(moment(s.submittedAt), 'hours') : 0
    }))
    .sort((a, b) => moment(a.date).diff(moment(b.date)));

  // Group by date for timeline chart
  const timelineGrouped = timeline.reduce((acc, curr) => {
    const existing = acc.find(item => item.date === curr.date);
    if (existing) {
      existing.count += 1;
      existing.avgGrade = (existing.avgGrade + curr.grade) / 2;
      existing.submissions.push(curr);
    } else {
      acc.push({
        date: curr.date,
        count: 1,
        avgGrade: curr.grade,
        submissions: [curr]
      });
    }
    return acc;
  }, []);

  return {
    raw: timeline.slice(0, 50), // Limit for performance
    grouped: timelineGrouped.slice(0, 20),
    submissionPattern: dueDate ? analyzeSubmissionPattern(timeline, dueDate) : null
  };
}

/**
 * Calculate performance insights
 */
function calculatePerformanceInsights(validSubmissions, maxGrade, avgGrade) {
  return {
    aboveAverage: validSubmissions.filter(s => (Number(s.grade) || 0) > avgGrade).length,
    belowAverage: validSubmissions.filter(s => (Number(s.grade) || 0) < avgGrade).length,
    atAverage: validSubmissions.filter(s => (Number(s.grade) || 0) === avgGrade).length,
    perfectScores: validSubmissions.filter(s => (Number(s.grade) || 0) === maxGrade).length,
    needsImprovement: validSubmissions.filter(s => (Number(s.grade) || 0) < maxGrade * 0.7).length,
    excellentPerformance: validSubmissions.filter(s => (Number(s.grade) || 0) >= maxGrade * 0.9).length,
    satisfactoryPerformance: validSubmissions.filter(s => {
      const grade = Number(s.grade) || 0;
      return grade >= maxGrade * 0.7 && grade < maxGrade * 0.9;
    }).length,
    unsatisfactoryPerformance: validSubmissions.filter(s => (Number(s.grade) || 0) < maxGrade * 0.6).length
  };
}

/**
 * Calculate time analysis
 */
function calculateTimeAnalysis(validSubmissions) {
  // Submissions by hour (0-23)
  const submissionsByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    count: validSubmissions.filter(s => 
      s.submittedAt && moment(s.submittedAt).hour() === hour
    ).length,
    avgGrade: calculateAverageGradeForHour(validSubmissions, hour)
  }));

  // Submissions by day of week
  const submissionsByDay = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ].map((day, index) => ({
    day,
    dayIndex: index,
    count: validSubmissions.filter(s => 
      s.submittedAt && moment(s.submittedAt).day() === index
    ).length,
    avgGrade: calculateAverageGradeForDay(validSubmissions, index)
  }));

  // Peak submission times
  const peakHour = submissionsByHour.reduce((max, hour) => 
    hour.count > max.count ? hour : max, { count: 0, hour: '00:00' });
  const peakDay = submissionsByDay.reduce((max, day) => 
    day.count > max.count ? day : max, { count: 0, day: 'Monday' });

  return {
    submissionsByHour,
    submissionsByDay,
    peakSubmissionHour: peakHour,
    peakSubmissionDay: peakDay,
    submissionDistribution: analyzeSubmissionDistribution(validSubmissions)
  };
}

/**
 * Calculate student performance details - FIXED VERSION
 */
function calculateStudentPerformance(allStudents, submissions, assignment, maxGrade) {
  return allStudents.map(student => {
    const submission = submissions.find(s => 
      (s.student._id || s.student).toString() === student._id.toString()
    );

    if (!submission || !submission.submittedAt) {
      return {
        studentId: student._id,
        studentName: student.fullName || student.name,
        status: 'missing',
        grade: null,
        percentage: null,
        submittedAt: null,
        isLate: null
      };
    }

    const grade = Number(submission.grade) || 0;
    const percentage = grade > 0 ? (grade / maxGrade * 100) : 0;

    return {
      studentId: student._id,
      studentName: student.fullName || student.name,
      studentEmail: student.email,
      status: submission.status,
      grade: grade,
      percentage: percentage ? Math.round(percentage * 10) / 10 : null,
      submittedAt: submission.submittedAt,
      isLate: submission.submittedAt && assignment.dueDate ? 
        moment(submission.submittedAt).isAfter(moment(assignment.dueDate)) : null,
      feedback: submission.feedback,
      gradedAt: submission.gradedAt
    };
  });
}

/**
 * Calculate trends (requires historical data)
 */
async function calculateTrends(assignment, validSubmissions) {
  try {
    const gradingHistory = validSubmissions
      .filter(s => s.gradingHistory && s.gradingHistory.length > 0)
      .map(s => ({
        studentId: s.student._id || s.student,
        history: s.gradingHistory.map(h => ({
          grade: Number(h.grade) || 0,
          gradedAt: h.gradedAt,
          changeType: h.changeType
        }))
      }));

    return {
      gradingHistory,
      improvementTrend: calculateImprovementTrend(gradingHistory),
      revisionAnalysis: analyzeGradeRevisions(gradingHistory)
    };
  } catch (error) {
    console.error('Error calculating trends:', error);
    return null;
  }
}

// Helper functions
function calculateStandardDeviation(grades) {
  if (grades.length === 0) return 0;
  const mean = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
  const variance = grades.reduce((sum, grade) => sum + Math.pow(grade - mean, 2), 0) / grades.length;
  return Math.sqrt(variance);
}

function calculateAverageGradeForHour(submissions, hour) {
  const hourSubmissions = submissions.filter(s => 
    s.submittedAt && moment(s.submittedAt).hour() === hour
  );
  if (hourSubmissions.length === 0) return null;
  
  const sum = hourSubmissions.reduce((total, s) => total + (Number(s.grade) || 0), 0);
  return Math.round((sum / hourSubmissions.length) * 10) / 10;
}

function calculateAverageGradeForDay(submissions, dayIndex) {
  const daySubmissions = submissions.filter(s => 
    s.submittedAt && moment(s.submittedAt).day() === dayIndex
  );
  if (daySubmissions.length === 0) return null;
  
  const sum = daySubmissions.reduce((total, s) => total + (Number(s.grade) || 0), 0);
  return Math.round((sum / daySubmissions.length) * 10) / 10;
}

function analyzeSubmissionPattern(timeline, dueDate) {
  const earlySubmissions = timeline.filter(s => s.hoursBeforeDue > 72);
  const onTimeSubmissions = timeline.filter(s => s.hoursBeforeDue >= 0 && s.hoursBeforeDue <= 72);
  const lastMinuteSubmissions = timeline.filter(s => s.hoursBeforeDue >= 0 && s.hoursBeforeDue <= 24);
  const lateSubmissions = timeline.filter(s => s.hoursBeforeDue < 0);

  return {
    earlySubmissions: {
      count: earlySubmissions.length,
      avgGrade: earlySubmissions.length > 0 ? 
        earlySubmissions.reduce((sum, s) => sum + s.grade, 0) / earlySubmissions.length : 0
    },
    onTimeSubmissions: {
      count: onTimeSubmissions.length,
      avgGrade: onTimeSubmissions.length > 0 ? 
        onTimeSubmissions.reduce((sum, s) => sum + s.grade, 0) / onTimeSubmissions.length : 0
    },
    lastMinuteSubmissions: {
      count: lastMinuteSubmissions.length,
      avgGrade: lastMinuteSubmissions.length > 0 ? 
        lastMinuteSubmissions.reduce((sum, s) => sum + s.grade, 0) / lastMinuteSubmissions.length : 0
    },
    lateSubmissions: {
      count: lateSubmissions.length,
      avgGrade: lateSubmissions.length > 0 ? 
        lateSubmissions.reduce((sum, s) => sum + s.grade, 0) / lateSubmissions.length : 0
    }
  };
}

function analyzeSubmissionDistribution(validSubmissions) {
  const distribution = {
    morning: validSubmissions.filter(s => {
      if (!s.submittedAt) return false;
      const hour = moment(s.submittedAt).hour();
      return hour >= 6 && hour < 12;
    }).length,
    afternoon: validSubmissions.filter(s => {
      if (!s.submittedAt) return false;
      const hour = moment(s.submittedAt).hour();
      return hour >= 12 && hour < 18;
    }).length,
    evening: validSubmissions.filter(s => {
      if (!s.submittedAt) return false;
      const hour = moment(s.submittedAt).hour();
      return hour >= 18 && hour < 24;
    }).length,
    lateNight: validSubmissions.filter(s => {
      if (!s.submittedAt) return false;
      const hour = moment(s.submittedAt).hour();
      return hour >= 0 && hour < 6;
    }).length
  };

  return distribution;
}

function calculateImprovementTrend(gradingHistory) {
  return gradingHistory.map(student => {
    const history = student.history.sort((a, b) => 
      new Date(a.gradedAt) - new Date(b.gradedAt)
    );

    if (history.length < 2) return null;

    const firstGrade = history[0].grade;
    const lastGrade = history[history.length - 1].grade;
    const improvement = lastGrade - firstGrade;

    return {
      studentId: student.studentId,
      improvement,
      improvementPercentage: firstGrade > 0 ? (improvement / firstGrade * 100) : 0,
      attempts: history.length
    };
  }).filter(Boolean);
}

function analyzeGradeRevisions(gradingHistory) {
  const revisions = gradingHistory.reduce((acc, student) => {
    const revisionCount = student.history.filter(h => 
      h.changeType === 'revision' || h.changeType === 'correction'
    ).length;
    
    if (revisionCount > 0) {
      acc.totalRevisions += revisionCount;
      acc.studentsWithRevisions += 1;
    }
    
    return acc;
  }, {
    totalRevisions: 0,
    studentsWithRevisions: 0
  });

  return {
    ...revisions,
    avgRevisionsPerStudent: gradingHistory.length > 0 ? 
      revisions.totalRevisions / gradingHistory.length : 0
  };
}

function generateCSVAnalytics(assignment) {
  const csvRows = [];
  csvRows.push(['Assignment Analytics Report']);
  csvRows.push(['Assignment:', assignment.title]);
  csvRows.push(['Due Date:', moment(assignment.dueDate).format('YYYY-MM-DD HH:mm')]);
  csvRows.push(['Total Points:', assignment.totalPoints]);
  csvRows.push(['']);
  csvRows.push(['Student', 'Grade', 'Status', 'Submitted At', 'Late']);
  
  assignment.submissions.forEach(sub => {
    if (sub.submittedAt) {
      const isLate = moment(sub.submittedAt).isAfter(moment(assignment.dueDate));
      csvRows.push([
        sub.student.fullName || sub.student.name || 'Unknown',
        sub.grade || 0,
        sub.status || 'submitted',
        moment(sub.submittedAt).format('YYYY-MM-DD HH:mm'),
        isLate ? 'Yes' : 'No'
      ]);
    }
  });

  return csvRows.map(row => row.join(',')).join('\n');
}

module.exports = router;