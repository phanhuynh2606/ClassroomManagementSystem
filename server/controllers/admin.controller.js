const User = require("../models/user.model");
const Classroom = require("../models/classroom.model");
const Assignment = require("../models/assignment.model");
const Quiz = require("../models/quiz.model");
const Question = require("../models/question.model");
const Material = require("../models/material.model");

const getUsersByRole = async (req, res) => {
  const { role } = req.query;
  const query = role ? { role } : {};
  const users = await User.find(query).select('-password -__v -createdAt -refreshToken ');
  res.status(200).json({
    success: true,
    data: users,
  });
};

const verifyTeacher = async (req, res) => {
  const { userId } = req.params;
  const {verified } = req.body;
  const user = await User.findByIdAndUpdate(userId, { verified: verified }, { new: true });
  res.status(200).json({
    success: true,
    data: user,
  });
};

const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { userData } = req.body;
  console.log(userData)
  const user = await User.findByIdAndUpdate(userId, userData, { new: true });
  res.status(200).json({
    success: true,
    data: user,
  });
};

const getAdminDashboardStats = async (req, res) => {
  try {
    // Tính toán ngày tháng cho current và previous month
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Tổng hợp thống kê tổng cộng
    const [
      totalUsers,
      totalClassrooms,
      totalAssignments,
      totalQuizzes,
      totalQuestions
    ] = await Promise.all([
      User.countDocuments(),
      Classroom.countDocuments(),
      Assignment.countDocuments(),
      Quiz.countDocuments(),
      Question.countDocuments(),
    ]);

    // Thống kê tháng hiện tại
    const [
      currentMonthUsers,
      currentMonthClassrooms,
      currentMonthAssignments,
      currentMonthQuizzes,
      currentMonthQuestions
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } }),
      Classroom.countDocuments({ createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } }),
      Assignment.countDocuments({ createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } }),
      Quiz.countDocuments({ createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } }),
      Question.countDocuments({ createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } }),
    ]);

    // Thống kê tháng trước
    const [
      previousMonthUsers,
      previousMonthClassrooms,
      previousMonthAssignments,
      previousMonthQuizzes,
      previousMonthQuestions
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } }),
      Classroom.countDocuments({ createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } }),
      Assignment.countDocuments({ createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } }),
      Quiz.countDocuments({ createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } }),
      Question.countDocuments({ createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } }),
    ]);

    // Tính tổng dung lượng từ Materials và Assignment attachments/submissions
    const materialStorageResult = await Material.aggregate([
      { $match: { deleted: { $ne: true } } }, // Chỉ tính những file chưa bị xóa
      { $group: { _id: null, totalSize: { $sum: "$fileSize" } } }
    ]);

    // Tính dung lượng từ Assignment attachments
    const assignmentAttachmentsStorage = await Assignment.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $unwind: { path: "$attachments", preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, totalSize: { $sum: "$attachments.fileSize" } } }
    ]);

    // Tính dung lượng từ Assignment submissions
    const submissionAttachmentsStorage = await Assignment.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $unwind: { path: "$submissions", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$submissions.attachments", preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, totalSize: { $sum: "$submissions.attachments.fileSize" } } }
    ]);

    // Dung lượng tháng hiện tại
    const [currentMonthMaterialStorage, currentMonthAssignmentStorage, currentMonthSubmissionStorage] = await Promise.all([
      Material.aggregate([
        { $match: { deleted: { $ne: true }, createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } } },
        { $group: { _id: null, totalSize: { $sum: "$fileSize" } } }
      ]),
      Assignment.aggregate([
        { $match: { deleted: { $ne: true }, createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } } },
        { $unwind: { path: "$attachments", preserveNullAndEmptyArrays: true } },
        { $group: { _id: null, totalSize: { $sum: "$attachments.fileSize" } } }
      ]),
      Assignment.aggregate([
        { $match: { deleted: { $ne: true } } },
        { $unwind: { path: "$submissions", preserveNullAndEmptyArrays: true } },
        { $match: { "submissions.submittedAt": { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } } },
        { $unwind: { path: "$submissions.attachments", preserveNullAndEmptyArrays: true } },
        { $group: { _id: null, totalSize: { $sum: "$submissions.attachments.fileSize" } } }
      ])
    ]);

    // Dung lượng tháng trước
    const [previousMonthMaterialStorage, previousMonthAssignmentStorage, previousMonthSubmissionStorage] = await Promise.all([
      Material.aggregate([
        { $match: { deleted: { $ne: true }, createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } } },
        { $group: { _id: null, totalSize: { $sum: "$fileSize" } } }
      ]),
      Assignment.aggregate([
        { $match: { deleted: { $ne: true }, createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } } },
        { $unwind: { path: "$attachments", preserveNullAndEmptyArrays: true } },
        { $group: { _id: null, totalSize: { $sum: "$attachments.fileSize" } } }
      ]),
      Assignment.aggregate([
        { $match: { deleted: { $ne: true } } },
        { $unwind: { path: "$submissions", preserveNullAndEmptyArrays: true } },
        { $match: { "submissions.submittedAt": { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } } },
        { $unwind: { path: "$submissions.attachments", preserveNullAndEmptyArrays: true } },
        { $group: { _id: null, totalSize: { $sum: "$submissions.attachments.fileSize" } } }
      ])
    ]);

    // Tổng hợp tất cả dung lượng (chuyển từ bytes sang MB)
    const materialSize = materialStorageResult[0]?.totalSize || 0;
    const assignmentAttachmentSize = assignmentAttachmentsStorage[0]?.totalSize || 0;
    const submissionAttachmentSize = submissionAttachmentsStorage[0]?.totalSize || 0;
    
    const totalStorageBytes = materialSize + assignmentAttachmentSize + submissionAttachmentSize;
    const totalStorage = Math.round(totalStorageBytes / (1024 * 1024) * 100) / 100; // Convert to MB với 2 chữ số thập phân

    // Tính dung lượng cho tháng hiện tại và tháng trước
    const currentMonthStorageBytes = (currentMonthMaterialStorage[0]?.totalSize || 0) + 
                                   (currentMonthAssignmentStorage[0]?.totalSize || 0) + 
                                   (currentMonthSubmissionStorage[0]?.totalSize || 0);
    const currentMonthStorage = Math.round(currentMonthStorageBytes / (1024 * 1024) * 100) / 100;

    const previousMonthStorageBytes = (previousMonthMaterialStorage[0]?.totalSize || 0) + 
                                    (previousMonthAssignmentStorage[0]?.totalSize || 0) + 
                                    (previousMonthSubmissionStorage[0]?.totalSize || 0);
    const previousMonthStorage = Math.round(previousMonthStorageBytes / (1024 * 1024) * 100) / 100;

    // Lấy hoạt động gần đây (user, classroom, assignment, quiz, assignment submission)
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(2);
    const recentClassrooms = await Classroom.find().sort({ createdAt: -1 }).limit(2);
    const recentAssignments = await Assignment.find().sort({ createdAt: -1 }).limit(2);
    const recentQuizzes = await Quiz.find().sort({ createdAt: -1 }).limit(2);
    let recentSubmissions = [];
    try {
      const Submission = require("../models/assignment.model");
      recentSubmissions = await Submission.find().sort({ createdAt: -1 }).limit(1);
    } catch (e) {}

    const recentActivities = [
      ...recentUsers.map(u => ({ 
        type: 'user', 
        action: 'Người dùng mới đăng ký', 
        details: `${u.fullName} đã tham gia với vai trò ${u.role}`, 
        time: u.createdAt, 
        avatar: u.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.fullName}` 
      })),
      ...recentClassrooms.map(c => ({ 
        type: 'classroom', 
        action: 'Lớp học mới được tạo', 
        details: `${c.name} được tạo bởi ${c.teacher?.fullName || 'giáo viên'}`, 
        time: c.createdAt 
      })),
      ...recentAssignments.map(a => ({ 
        type: 'assignment', 
        action: 'Bài tập mới được giao', 
        details: `${a.title} - Hạn nộp: ${a.dueDate ? new Date(a.dueDate).toLocaleDateString('vi-VN') : 'Không có'}`, 
        time: a.createdAt 
      })),
      ...recentQuizzes.map(q => ({ 
        type: 'quiz', 
        action: 'Bài kiểm tra mới được tạo', 
        details: `${q.title} (${q.questions?.length || 0} câu hỏi, ${q.duration || 0} phút)`, 
        time: q.createdAt 
      })),
      ...recentSubmissions.map(s => ({ 
        type: 'submission', 
        action: 'Bài nộp mới', 
        details: `Bài nộp mới cho bài tập ${s.assignmentTitle || ''}`, 
        time: s.createdAt 
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

    // Phân bổ vai trò
    const userRoleData = await User.aggregate([
      { $group: { _id: "$role", value: { $sum: 1 } } },
      { $project: { 
        type: { 
          $switch: {
            branches: [
              { case: { $eq: ["$_id", "admin"] }, then: "Admin" },
              { case: { $eq: ["$_id", "teacher"] }, then: "Giáo viên" },
              { case: { $eq: ["$_id", "student"] }, then: "Học sinh" }
            ],
            default: "$_id"
          }
        }, 
        value: 1, 
        _id: 0 
      } }
    ]);

    // Phân bổ giới tính
    const genderData = await User.aggregate([
      { $group: { _id: "$gender", value: { $sum: 1 } } },
      { $project: { 
        type: { 
          $switch: {
            branches: [
              { case: { $eq: ["$_id", "male"] }, then: "Nam" },
              { case: { $eq: ["$_id", "female"] }, then: "Nữ" },
              { case: { $eq: ["$_id", "other"] }, then: "Khác" }
            ],
            default: "Không xác định"
          }
        }, 
        value: 1, 
        _id: 0 
      } }
    ]);

    // Tính phần trăm cho gender data
    const totalGender = genderData.reduce((acc, curr) => acc + curr.value, 0) || 1;
    genderData.forEach(g => g.percentage = +(g.value * 100 / totalGender).toFixed(1));

    // Phân bổ độ tuổi
    const ageDistributionData = await User.aggregate([
      { $match: { dateOfBirth: { $ne: null } } },
      { $project: {
          age: { $subtract: [ { $year: now }, { $year: "$dateOfBirth" } ] }
        }
      },
      { $bucket: {
          groupBy: "$age",
          boundaries: [0, 18, 23, 28, 33, 38, 100],
          default: "Khác",
          output: { count: { $sum: 1 } }
        }
      }
    ]);
    
    // Chuyển đổi thành dạng frontend cần
    const ageGroups = ["<18", "18-22", "23-27", "28-32", "33-37", "38+"];
    const ageDist = ageGroups.map((label, i) => {
      const bucket = ageDistributionData[i] || {};
      return {
        ageGroup: label,
        count: bucket.count || 0
      };
    });
    // Tính phần trăm
    const totalAges = ageDist.reduce((a, b) => a + b.count, 0) || 1;
    ageDist.forEach(a => a.percentage = +(a.count * 100 / totalAges).toFixed(1));

    // Tăng trưởng user theo tháng (6 tháng gần nhất)
    const userGrowthData = await User.aggregate([
      { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 }
      } },
      { $sort: { _id: 1 } }
    ]);
    
    // Chuyển thành dạng frontend với tên tháng tiếng Việt
    const userGrowth = userGrowthData.map(d => {
      const [year, month] = d._id.split('-');
      const monthNames = ["Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6", "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12"];
      return { 
        month: monthNames[parseInt(month) - 1], 
        count: d.count 
      };
    });

    // Phân bổ trạng thái xác thực
    const verifiedData = await User.aggregate([
      { $group: { _id: "$verified", value: { $sum: 1 } } },
      { $project: { type: { $cond: ["$_id", "Đã xác thực", "Chờ xác thực"] }, value: 1, _id: 0 } }
    ]);

    // Phân bổ trạng thái nộp bài (assignment) với logic chi tiết hơn
    const submissionStatusData = await Assignment.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $unwind: "$submissions" },
      { 
        $addFields: {
          "submissions.actualStatus": {
            $switch: {
              branches: [
                // Đã nộp đúng hạn (submitted và không late)
                { 
                  case: { 
                    $and: [
                      { $eq: ["$submissions.status", "submitted"] },
                      { $lte: ["$submissions.submittedAt", "$dueDate"] }
                    ]
                  }, 
                  then: "Đúng hạn" 
                },
                // Nộp trễ (late hoặc submitted sau due date)
                { 
                  case: { 
                    $or: [
                      { $eq: ["$submissions.status", "late"] },
                      { 
                        $and: [
                          { $eq: ["$submissions.status", "submitted"] },
                          { $gt: ["$submissions.submittedAt", "$dueDate"] }
                        ]
                      }
                    ]
                  }, 
                  then: "Trễ hạn" 
                },
                // Đã chấm điểm (graded) - có thể là tự động hoặc thủ công
                { 
                  case: { $eq: ["$submissions.status", "graded"] }, 
                  then: {
                    $cond: {
                      if: { $ifNull: ["$submissions.submittedAt", false] },
                      then: "Đã chấm điểm",
                      else: "Không nộp (Hệ thống Tự chấm)"
                    }
                  }
                },
                // Pending - chưa nộp
                { 
                  case: { $eq: ["$submissions.status", "pending"] }, 
                  then: "Chưa nộp" 
                }
              ],
              default: "Không xác định"
            }
          }
        }
      },
      { $group: { _id: "$submissions.actualStatus", value: { $sum: 1 } } },
      { $project: { type: "$_id", value: 1, _id: 0 } }
    ]);

    // Thống kê tổng quan về assignments và submissions
    const assignmentStats = await Assignment.aggregate([
      { $match: { deleted: { $ne: true } } },
      {
        $project: {
          totalSubmissions: { $size: "$submissions" },
          // Chỉ tính những bài THỰC SỰ được nộp (có submittedAt)
          actuallySubmittedCount: {
            $size: {
              $filter: {
                input: "$submissions",
                cond: { 
                  $and: [
                    { $in: ["$$this.status", ["submitted", "graded", "late"]] },
                    { $ne: [{ $ifNull: ["$$this.submittedAt", null] }, null] }
                  ]
                }
              }
            }
          },
          // Tổng số bài đã được chấm (bao gồm cả tự động và thủ công)
          gradedCount: {
            $size: {
              $filter: {
                input: "$submissions",
                cond: { $eq: ["$$this.status", "graded"] }
              }
            }
          },
          // Chỉ những bài được tự động chấm (không có submittedAt)
          autoGradedCount: {
            $size: {
              $filter: {
                input: "$submissions",
                cond: { 
                  $and: [
                    { $eq: ["$$this.status", "graded"] },
                    { $eq: [{ $ifNull: ["$$this.submittedAt", null] }, null] }
                  ]
                }
              }
            }
          },
          // Bài được chấm thủ công (có submittedAt)
          manuallyGradedCount: {
            $size: {
              $filter: {
                input: "$submissions",
                cond: { 
                  $and: [
                    { $eq: ["$$this.status", "graded"] },
                    { $ne: [{ $ifNull: ["$$this.submittedAt", null] }, null] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAssignments: { $sum: 1 },
          totalPossibleSubmissions: { $sum: "$totalSubmissions" },
          totalActualSubmissions: { $sum: "$actuallySubmittedCount" }, // Chỉ tính bài thực sự nộp
          totalGradedSubmissions: { $sum: "$gradedCount" },
          totalAutoGradedSubmissions: { $sum: "$autoGradedCount" },
          totalManuallyGradedSubmissions: { $sum: "$manuallyGradedCount" }
        }
      }
    ]);

    const assignmentOverview = assignmentStats[0] || {
      totalAssignments: 0,
      totalPossibleSubmissions: 0,
      totalActualSubmissions: 0, // Bài thực sự nộp
      totalGradedSubmissions: 0,
      totalAutoGradedSubmissions: 0, // Bài tự chấm
      totalManuallyGradedSubmissions: 0 // Bài chấm thủ công
    };

    // Dữ liệu đăng nhập theo ngày trong tuần (mock data - có thể thay thế bằng dữ liệu thật từ log)
    const loginData = [
      { day: "T2", logins: Math.floor(Math.random() * 100) + 80 },
      { day: "T3", logins: Math.floor(Math.random() * 100) + 90 },
      { day: "T4", logins: Math.floor(Math.random() * 100) + 120 },
      { day: "T5", logins: Math.floor(Math.random() * 100) + 100 },
      { day: "T6", logins: Math.floor(Math.random() * 100) + 140 },
      { day: "T7", logins: Math.floor(Math.random() * 60) + 40 },
      { day: "CN", logins: Math.floor(Math.random() * 40) + 20 },
    ];

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalClassrooms,
        totalAssignments,
        totalQuizzes,
        totalQuestions,
        totalStorage,
        // Dữ liệu so sánh tháng hiện tại vs tháng trước
        currentMonthStats: {
          users: currentMonthUsers,
          classrooms: currentMonthClassrooms,
          assignments: currentMonthAssignments,
          quizzes: currentMonthQuizzes,
          questions: currentMonthQuestions,
          storage: currentMonthStorage
        },
        previousMonthStats: {
          users: previousMonthUsers,
          classrooms: previousMonthClassrooms,
          assignments: previousMonthAssignments,
          quizzes: previousMonthQuizzes,
          questions: previousMonthQuestions,
          storage: previousMonthStorage
        },
        recentActivities,
        userRoleData,
        genderData,
        ageDistributionData: ageDist,
        userGrowthData: userGrowth,
        verifiedData,
        submissionStatusData,
        assignmentOverview,
        loginData
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsersByRole,
  verifyTeacher,
  updateUser,
  getAdminDashboardStats,
};
