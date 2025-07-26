const Classroom = require('../models/classroom.model');
const Assignment = require('../models/assignment.model');
const Quiz = require('../models/quiz.model');
const User = require('../models/user.model');

const getGradesStatistics = async (req, res) => {
  try {
    const { classroomId } = req.params;
    // 1. Lấy classroom và danh sách học sinh
    const classroom = await Classroom.findById(classroomId).lean();
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found' });
    const studentIds = classroom.students.map(s => s.student.toString());
    const students = await User.find({ _id: { $in: studentIds } }).lean();
    // 2. Lấy assignments & quizzes
    const assignments = await Assignment.find({ classroom: classroomId, isActive: true }).lean();
    const quizzes = await Quiz.find({ classroom: classroomId, isActive: true }).lean();
    // 3. Chuẩn hóa danh sách bài
    const allItems = [
      ...assignments.map(a => ({ id: a._id.toString(), title: a.title, maxPoints: a.totalPoints || 100, type: 'assignment' })),
      ...quizzes.map(q => ({ id: q._id.toString(), title: q.title, maxPoints: q.questions.length || 10, type: 'quiz' }))
    ];
    // 4. Tổng hợp điểm từng học sinh
    const studentsData = students.map(student => {
      const grades = {};
      // Assignment submissions
      assignments.forEach(a => {
        const sub = (a.submissions || []).find(s => s.student?.toString() === student._id.toString());
        grades[a._id.toString()] = sub ? {
          score: typeof sub.grade === 'number' ? sub.grade : null,
          maxPoints: a.totalPoints || 100,
          submittedAt: sub.submittedAt || null,
          status: sub.status || (sub.grade != null ? 'graded' : 'missing')
        } : { score: null, maxPoints: a.totalPoints || 100, submittedAt: null, status: 'missing' };
      });
      // Quiz submissions
      quizzes.forEach(q => {
        const sub = (q.submissions || []).find(s => s.student?.toString() === student._id.toString());
        grades[q._id.toString()] = sub ? {
          score: typeof sub.score === 'number' ? sub.score : null,
          maxPoints: q.questions.length,
          submittedAt: sub.submittedAt || null,
          status: sub.status || (sub.score != null ? 'graded' : 'missing')
        } : { score: null, maxPoints: q.totalPoints || 10, submittedAt: null, status: 'missing' };
      });
      return {
        id: student._id,
        name: student.fullName || student.name || '',
        email: student.email,
        avatar: student.image,
        grades
      };
    });
    // 5. Tính toán thống kê
    const calcAvg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const allAverages = studentsData.map(s => {
      const valid = Object.values(s.grades).filter(g => g.score !== null);
      if (!valid.length) return 0;
      const total = valid.reduce((sum, g) => sum + g.score, 0);
      const max = valid.reduce((sum, g) => sum + g.maxPoints, 0);
      return max ? (total / max) * 100 : 0;
    });
    const classAverage = Math.round(calcAvg(allAverages));
    const highestScore = Math.round(Math.max(...allAverages, 0));
    const lowestScore = Math.round(Math.min(...allAverages, 100));
    // Tỷ lệ nộp bài
    const totalGraded = allItems.reduce((sum, item) => sum + studentsData.filter(s => s.grades[item.id]?.score !== null).length, 0);
    const totalPossible = allItems.length * studentsData.length;
    const submissionRate = totalPossible ? Math.round((totalGraded / totalPossible) * 100) : 0;
    // Phân bố điểm
    const gradeDistribution = {
      excellent: studentsData.filter(s => calcAvg(Object.values(s.grades).filter(g => g.score !== null).map(g => (g.score / g.maxPoints) * 100)) >= 90).length,
      good: studentsData.filter(s => {
        const avg = calcAvg(Object.values(s.grades).filter(g => g.score !== null).map(g => (g.score / g.maxPoints) * 100));
        return avg >= 80 && avg < 90;
      }).length,
      average: studentsData.filter(s => {
        const avg = calcAvg(Object.values(s.grades).filter(g => g.score !== null).map(g => (g.score / g.maxPoints) * 100));
        return avg >= 70 && avg < 80;
      }).length,
      poor: studentsData.filter(s => {
        const avg = calcAvg(Object.values(s.grades).filter(g => g.score !== null).map(g => (g.score / g.maxPoints) * 100));
        return avg < 70;
      }).length
    };
    res.json({
      students: studentsData,
      assignments: allItems,
      statistics: {
        classAverage,
        highestScore,
        lowestScore,
        submissionRate,
        gradeDistribution,
        totalStudents: studentsData.length
      }
    });
  } catch (error) {
    console.error('Error in getGradesStatistics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getGradesStatistics };
