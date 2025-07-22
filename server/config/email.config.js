const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Learning Management System',
        address: process.env.EMAIL_USER
      },
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  resetPassword: (resetUrl, userName) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4299e1 0%, #2b6cb0 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #4299e1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName || 'User'},</h2>
          <p>We received a request to reset your password for your Learning Management System account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <div class="warning">
            <strong>Important:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>For security, this link can only be used once</li>
            </ul>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">
            ${resetUrl}
          </p>
        </div>
        <div class="footer">
          <p>This email was sent from Learning Management System</p>
          <p>If you have any questions, please contact our support team</p>
        </div>
      </div>
    </body>
    </html>
  `,
  autoGradeNotification: (studentName, assignmentTitle, gradeValue) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Thông báo chấm điểm tự động</title>
      <style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}</style>
    </head>
    <body>
      <h2>Chào ${studentName || 'bạn'},</h2>
      <p>Bài tập <b>'${assignmentTitle}'</b> của bạn đã quá hạn nộp và đã được hệ thống <b>chấm điểm tự động</b> theo chính sách lớp học.</p>
      <p><b>Điểm tự động:</b> <span style="color:#1565c0;font-size:18px;">${gradeValue}</span></p>
      <p>Nếu có thắc mắc, vui lòng liên hệ giáo viên phụ trách.</p>
      <p>Trân trọng,<br/>Learning Management System</p>
    </body>
    </html>
  `,
  assignmentReminder: (data) => {
    const {
      studentName,
      assignmentTitle,
      dueDate,
      daysLeft,
      classroomName,
      assignmentDescription,
      isUrgent = false
    } = data;

    const urgentStyle = isUrgent ? 'color: #ff4d4f; font-weight: bold;' : '';
    const urgentBanner = isUrgent ? 
      `<div style="background: linear-gradient(135deg, #ff4d4f, #ff7875); color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h3 style="margin: 0; font-size: 18px;">🚨 KHẨN CẤP - CHỈ CÒN ${daysLeft} NGÀY!</h3>
      </div>` : '';

    const timeLeftText = daysLeft === 1 ? 
      'chỉ còn 1 ngày' : 
      `còn ${daysLeft} ngày`;

    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nhắc nhở bài tập</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #1890ff, #40a9ff);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
        }
        .assignment-info {
          background: #f8f9fa;
          border-left: 4px solid #1890ff;
          padding: 20px;
          margin: 20px 0;
          border-radius: 6px;
        }
        .assignment-title {
          font-size: 20px;
          font-weight: 600;
          color: #1890ff;
          margin: 0 0 10px 0;
        }
        .due-date {
          font-size: 18px;
          ${urgentStyle}
          margin: 15px 0;
        }
        .description {
          color: #666;
          font-style: italic;
          margin: 15px 0;
          padding: 15px;
          background: #fafafa;
          border-radius: 6px;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #52c41a, #73d13d);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-2px);
        }
        .footer {
          background: #f0f0f0;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
        .tips {
          background: #e6f7ff;
          border: 1px solid #91d5ff;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .tips h4 {
          color: #1890ff;
          margin: 0 0 10px 0;
        }
        .classroom-tag {
          display: inline-block;
          background: #f0f0f0;
          color: #666;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          margin: 10px 0;
        }
        .emoji {
          font-size: 20px;
          margin-right: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 Nhắc nhở bài tập</h1>
          <p>Hệ thống quản lý học tập</p>
        </div>

        ${urgentBanner}

        <div class="content">
          <p>Xin chào <strong>${studentName}</strong>,</p>

          <p>Chúng tôi xin nhắc nhở bạn về bài tập sắp đến hạn nộp:</p>

          <div class="assignment-info">
            <div class="assignment-title">📝 ${assignmentTitle}</div>
            <div class="classroom-tag">📚 Lớp: ${classroomName}</div>
            
            ${assignmentDescription ? 
              `<div class="description">
                <strong>Mô tả:</strong><br>
                ${assignmentDescription}${assignmentDescription.length >= 200 ? '...' : ''}
              </div>` : ''
            }

            <div class="due-date">
              <span class="emoji">⏰</span>
              <strong>Hạn nộp: ${dueDate}</strong>
            </div>

            <div style="font-size: 16px; ${urgentStyle}">
              <span class="emoji">${isUrgent ? '🚨' : '📅'}</span>
              <strong>Bạn ${timeLeftText} để hoàn thành bài tập này!</strong>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="#" class="cta-button">
              🚀 Nộp bài ngay
            </a>
          </div>

          <div class="tips">
            <h4>💡 Gợi ý để hoàn thành bài tập:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Đọc kỹ yêu cầu và hướng dẫn bài tập</li>
              <li>Chuẩn bị tài liệu và file cần thiết</li>
              <li>Kiểm tra lại bài làm trước khi nộp</li>
              ${isUrgent ? '<li style="color: #ff4d4f;"><strong>Ưu tiên hoàn thành bài tập này ngay!</strong></li>' : ''}
            </ul>
          </div>

          <p>Nếu bạn có bất kỳ câu hỏi nào về bài tập này, đừng ngần ngại liên hệ với giáo viên của bạn.</p>

          <p style="color: #666; font-style: italic;">
            Chúc bạn học tập hiệu quả và hoàn thành bài tập đúng hạn! 🎓
          </p>
        </div>

        <div class="footer">
          <p>📧 Email này được gửi tự động từ hệ thống quản lý học tập</p>
          <p>⚙️ Nếu không muốn nhận email nhắc nhở, vui lòng liên hệ với giáo viên</p>
        </div>
      </div>
    </body>
    </html>`;
  }
};

module.exports = {
  sendEmail,
  emailTemplates
}; 