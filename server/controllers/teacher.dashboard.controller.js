const Classroom = require("../models/classroom.model");
const Assignment = require("../models/assignment.model");
const Quiz = require("../models/quiz.model");
const User = require("../models/user.model");

const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // 1. Lấy danh sách lớp học của giáo viên
    const classrooms = await Classroom.find({
      teacher: teacherId,
      isActive: true,
    }).lean();
    const classroomIds = classrooms.map((c) => c._id);
    console.log("Classrooms :", classrooms);
    // 2. Tổng số học sinh (nếu chỉ 1 lớp, lấy đúng số học sinh của lớp đó)
    let totalStudents = 0;
    if (classrooms.length === 1) {
      totalStudents = classrooms[0].students
        ? classrooms[0].students.length
        : 0;
    } else {
      const studentsSet = new Set();
      classrooms.forEach(
        (c) =>
        {
          c.students && c.students.forEach((s) => studentsSet.add(s.toString()));
          totalStudents += c.students ? c.students.length : 0;
        }

      );
      // totalStudents = studentsSet.size;
    }

    // 3. Assignment
    const assignments = await Assignment.find({
      classroom: { $in: classroomIds },
      isActive: true,
    })
      .populate("submissions.student", "fullName email image")
      .lean();
    const totalAssignments = assignments.length;

    // 4. Tính submissionRate đúng (dựa vào thời gian nộp, không chỉ status)
    let uniqueSubmissions = new Set();
    let lateSubmissions = 0;
    let gradingScale = null;
    assignments.forEach((a) => {
      const dueDate = a.dueDate ? new Date(a.dueDate) : null;
      // Map để chỉ lấy 1 submission hợp lệ cho mỗi học sinh
      const studentEarliestSubmission = {};
      a.submissions.forEach((s) => {
        if (s.student && s.submittedAt) {
          const studentId = s.student._id
            ? s.student._id.toString()
            : s.student.toString();
          // Nếu đã có submission cho học sinh này, lấy submission sớm nhất
          if (
            !studentEarliestSubmission[studentId] ||
            new Date(s.submittedAt) <
              new Date(studentEarliestSubmission[studentId].submittedAt)
          ) {
            studentEarliestSubmission[studentId] = s;
          }
        }
      });
      // Duyệt qua các submission hợp lệ nhất của mỗi học sinh cho bài này
      Object.values(studentEarliestSubmission).forEach((s) => {
        uniqueSubmissions.add(`${a._id}_${s.student._id || s.student}`);
        // Tính nộp muộn dựa vào thời gian
        if (dueDate && new Date(s.submittedAt) > dueDate) {
          lateSubmissions++;
        }
      });
    });
    const denominator = totalAssignments * totalStudents;
    submissionRate = denominator
      ? Math.min(100, Math.round((uniqueSubmissions.size / denominator) * 100))
      : 0;

    // 5. Tính averageGrade và gradeDistribution theo thang 10
    let totalGrades10 = 0,
      gradedCount = 0;
    const gradeDistribution = [
      { range: "9.0-10", count: 0 },
      { range: "8.0-8.9", count: 0 },
      { range: "7.0-7.9", count: 0 },
      { range: "6.0-6.9", count: 0 },
      { range: "< 6.0", count: 0 },
    ];
    assignments.forEach((a) => {
      const maxPoint = a.totalPoints || 10;
      a.submissions.forEach((s) => {
        if (typeof s.grade === "number") {
          const grade10 = (s.grade / maxPoint) * 10;
          totalGrades10 += grade10;
          gradedCount++;
          if (grade10 >= 9) gradeDistribution[0].count++;
          else if (grade10 >= 8) gradeDistribution[1].count++;
          else if (grade10 >= 7) gradeDistribution[2].count++;
          else if (grade10 >= 6) gradeDistribution[3].count++;
          else gradeDistribution[4].count++;
        }
      });
    });
    const averageGrade = gradedCount
      ? Number((totalGrades10 / gradedCount).toFixed(1))
      : 0;
    const totalGraded = gradeDistribution.reduce((sum, g) => sum + g.count, 0);
    gradeDistribution.forEach(
      (g) =>
        (g.percentage = totalGraded
          ? Math.round((g.count / totalGraded) * 100)
          : 0)
    );

    // 6. Hiệu suất từng lớp (classPerformance)
    const classPerformance = await Promise.all(
      classrooms.map(async (c) => {
        // Lấy assignments của lớp này
        const classAssignments = assignments.filter(
          (a) => a.classroom.toString() === c._id.toString()
        );
        // Tổng số học sinh
        const students = c.students ? c.students.length : 0;
        // Tổng số bài tập
        const numAssignments = classAssignments.length;
        // Điểm TB lớp
        let totalClassGrades = 0,
          classGradedCount = 0,
          classSubmissionCount = 0,
          classLate = 0;
        // Tính submissionRate và lateSubmissions cho từng lớp
        let classUniqueSubmissions = new Set();
        classAssignments.forEach((a) => {
          const dueDate = a.dueDate ? new Date(a.dueDate) : null;
          const studentEarliestSubmission = {};
          a.submissions.forEach((s) => {
            if (s.student && s.submittedAt) {
              const studentId = s.student._id
                ? s.student._id.toString()
                : s.student.toString();
              if (
                !studentEarliestSubmission[studentId] ||
                new Date(s.submittedAt) <
                  new Date(studentEarliestSubmission[studentId].submittedAt)
              ) {
                studentEarliestSubmission[studentId] = s;
              }
            }
          });
          Object.values(studentEarliestSubmission).forEach((s) => {
            classUniqueSubmissions.add(
              `${a._id}_${s.student._id || s.student}`
            );
            if (dueDate && new Date(s.submittedAt) > dueDate) {
              classLate++;
            }
          });
          a.submissions.forEach((s) => {
            classSubmissionCount++;
            if (typeof s.grade === "number") {
              // Quy đổi điểm về gradingScale
              let gradeVal = s.grade;
              if (gradingScale === 10) {
                gradeVal = (s.grade / (a.totalPoints || 10)) * 10;
              } else if (gradingScale === 100) {
                gradeVal = (s.grade / (a.totalPoints || 100)) * 100;
              } else {
                gradeVal = (s.grade / (a.totalPoints || 10)) * 10;
              }
              totalClassGrades += gradeVal;
              classGradedCount++;
            }
          });
        });
        let avgGrade = 0;
        if (classGradedCount) {
          avgGrade = totalClassGrades / classGradedCount;
        }
        const classSubmissionRate =
          numAssignments && students
            ? Math.round(
                (classUniqueSubmissions.size / (numAssignments * students)) *
                  100
              )
            : 0;
        return {
          className: c.name,
          students,
          assignments: numAssignments,
          avgGrade: Number(avgGrade.toFixed(1)),
          submissionRate: classSubmissionRate,
          lateSubmissions: classLate,
        };
      })
    );

    // Khai báo biến tổng quan ở đây, chỉ khai báo 1 lần
    
    if (classrooms.length === 1 && classPerformance.length === 1) {
      submissionRate = classPerformance[0].submissionRate;
      lateSubmissions = classPerformance[0].lateSubmissions;
      totalStudents = classPerformance[0].students;
    } else {
      // 4. Tính submissionRate đúng (dựa vào thời gian nộp, không chỉ status)
      let uniqueSubmissions = new Set();
      let lateSubmissionsTotal = 0;
      assignments.forEach((a) => {
        const dueDate = a.dueDate ? new Date(a.dueDate) : null;
        const studentEarliestSubmission = {};
        a.submissions.forEach((s) => {
          if (s.student && s.submittedAt) {
            const studentId = s.student._id
              ? s.student._id.toString()
              : s.student.toString();
            if (
              !studentEarliestSubmission[studentId] ||
              new Date(s.submittedAt) <
                new Date(studentEarliestSubmission[studentId].submittedAt)
            ) {
              studentEarliestSubmission[studentId] = s;
            }
          }
        });
        Object.values(studentEarliestSubmission).forEach((s) => {
          uniqueSubmissions.add(`${a._id}_${s.student._id || s.student}`);
          if (dueDate && new Date(s.submittedAt) > dueDate) {
            lateSubmissionsTotal++;
          }
        });
      });
      const denominator = totalAssignments * totalStudents;
      submissionRate = denominator
        ? Math.min(
            100,
            Math.round((uniqueSubmissions.size / denominator) * 100)
          )
        : 0;
      lateSubmissions = lateSubmissionsTotal;
    }

    // 7. Tiến độ tuần (weeklyProgress) - mỗi tuần là tổng hợp các bài nộp và điểm TB
    const weekMap = {};
    assignments.forEach((a) => {
      if (!a.createdAt) return;
      const week = `Tuần ${getWeekNumber(new Date(a.createdAt))}`;
      if (!weekMap[week])
        weekMap[week] = { submissions: 0, totalGrade: 0, graded: 0 };
      a.submissions.forEach((s) => {
        weekMap[week].submissions++;
        if (typeof s.grade === "number") {
          // Tính điểm theo gradingScale
          let gradeVal = s.grade;
          if (gradingScale === 10) {
            // Nếu thang điểm 10, quy đổi về 10 nếu cần
            gradeVal = (s.grade / (a.totalPoints || 10)) * 10;
          } else if (gradingScale === 100) {
            // Nếu thang điểm 100, quy đổi về 100 nếu cần
            gradeVal = (s.grade / (a.totalPoints || 100)) * 100;
          } else {
            // mixed: quy đổi về 10
            gradeVal = (s.grade / (a.totalPoints || 10)) * 10;
          }
          weekMap[week].totalGrade += gradeVal;
          weekMap[week].graded++;
        }
      });
    });
    const weeklyProgress = Object.entries(weekMap).map(([week, data]) => ({
      week,
      submissions: data.submissions,
      grade: data.graded
        ? Number((data.totalGrade / data.graded).toFixed(1))
        : 0,
    }));

    // 8. Hoạt động gần đây (recentActivities) - mẫu đơn giản lấy từ assignment submissions mới nhất
    let recentActivities = [];
    assignments.forEach((a) => {
      a.submissions.slice(-2).forEach((s) => {
        if (s && s.student) {
          const studentName =
            typeof s.student === "object" && s.student.fullName
              ? s.student.fullName
              : s.student.toString();
          recentActivities.push({
            type: "assignment_submitted",
            message: `Học sinh ${studentName} đã nộp bài tập ${a.title}`,
            time: s.submittedAt ? s.submittedAt.toLocaleString() : "",
            student: s.student,
          });
        }
      });
    });
    // Giới hạn 5 hoạt động gần nhất
    recentActivities = recentActivities.slice(-5).reverse();

    // 9. Sự kiện sắp tới (upcomingEvents) - mẫu đơn giản lấy assignment/quiz sắp đến hạn
    const now = new Date();
    const upcomingAssignments = assignments
      .filter((a) => a.dueDate && new Date(a.dueDate) > now)
      .map((a) => ({
        title: `Deadline bài tập - ${a.title}`,
        date: a.dueDate.toISOString().slice(0, 10),
        time: a.dueDate.toISOString().slice(11, 16),
      }));
    // Có thể lấy quiz tương tự nếu muốn
    const upcomingEvents = upcomingAssignments.slice(0, 5);

    // Xác định thang điểm chung của dashboard
    
    const allPoints = assignments.map(a => a.totalPoints || 10);
    if (allPoints.length > 0) {
      const uniquePoints = Array.from(new Set(allPoints));
      if (uniquePoints.length === 1) {
        gradingScale = uniquePoints[0];
      } else if (uniquePoints.every(p => p <= 10)) {
        gradingScale = 10;
      } else if (uniquePoints.every(p => p >= 100)) {
        gradingScale = 100;
      } else {
        gradingScale = 'mixed';
      }
    }

    res.json({
      stats: {
        totalClasses: classrooms.length,
        totalStudents,
        totalAssignments,
        averageGrade,
        submissionRate,
        lateSubmissions: lateSubmissions, // Đảm bảo trả về submissionRate, lateSubmissions, totalStudents trong stats
        gradingScale // Thang điểm dashboard
      },
      gradeDistribution,
      classPerformance,
      weeklyProgress,
      recentActivities,
      upcomingEvents,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Helper: Lấy số tuần trong năm
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

module.exports = { getTeacherDashboard };
