# Tài Liệu Mô Tả Các Model

## 1. User Model (Người Dùng)

### Mục đích
Model User đại diện cho tất cả người dùng trong hệ thống, bao gồm học viên, giảng viên và quản trị viên.

### Các trường chính
- `email`: Email đăng nhập (bắt buộc, duy nhất)
- `password`: Mật khẩu đã được mã hóa
- `role`: Vai trò người dùng (admin/teacher/student)
- `fullName`: Họ và tên đầy đủ
- `avatar`: Ảnh đại diện
- `phone`: Số điện thoại
- `address`: Địa chỉ
- `bio`: Tiểu sử ngắn
- `isActive`: Trạng thái hoạt động
- `lastLogin`: Thời gian đăng nhập cuối
- `deleted`: Đánh dấu xóa mềm

## 2. Classroom Model (Lớp Học)

### Mục đích
Model Classroom quản lý thông tin về các lớp học, bao gồm thành viên, nội dung và hoạt động.

### Các trường chính
- `name`: Tên lớp học
- `description`: Mô tả lớp học
- `code`: Mã lớp học (duy nhất)
- `teacher`: Giảng viên phụ trách
- `students`: Danh sách học viên
- `maxStudents`: Số lượng học viên tối đa
- `category`: Phân loại lớp học
- `status`: Trạng thái lớp học
- `startDate`: Ngày bắt đầu
- `endDate`: Ngày kết thúc
- `isActive`: Trạng thái hoạt động
- `deleted`: Đánh dấu xóa mềm

## 3. Assignment Model (Bài Tập)

### Mục đích
Model Assignment quản lý các bài tập được giao cho học viên trong lớp học.

### Các trường chính
- `title`: Tiêu đề bài tập
- `description`: Mô tả chi tiết
- `classroom`: Lớp học chứa bài tập
- `createdBy`: Người tạo bài tập
- `dueDate`: Hạn nộp
- `attachments`: Tệp đính kèm
- `submissions`: Bài nộp của học viên
- `totalPoints`: Tổng điểm
- `allowLateSubmission`: Cho phép nộp muộn
- `latePenalty`: Hình phạt nộp muộn
- `visibility`: Trạng thái hiển thị
- `isActive`: Trạng thái hoạt động
- `deleted`: Đánh dấu xóa mềm

## 4. Material Model (Tài Liệu)

### Mục đích
Model Material quản lý các tài liệu học tập được chia sẻ trong lớp học.

### Các trường chính
- `title`: Tiêu đề tài liệu
- `description`: Mô tả tài liệu
- `type`: Loại tài liệu (pdf/slide/video/other)
- `fileUrl`: Đường dẫn tệp
- `fileSize`: Kích thước tệp
- `fileType`: Định dạng tệp
- `thumbnail`: Ảnh thu nhỏ
- `classroom`: Lớp học chứa tài liệu
- `uploadedBy`: Người tải lên
- `isPublic`: Công khai hay không
- `tags`: Nhãn phân loại
- `downloadCount`: Số lượt tải
- `viewCount`: Số lượt xem
- `version`: Phiên bản
- `isActive`: Trạng thái hoạt động
- `deleted`: Đánh dấu xóa mềm

## 5. Quiz Model (Bài Kiểm Tra)

### Mục đích
Model Quiz quản lý các bài kiểm tra trắc nghiệm trong lớp học.

### Các trường chính
- `title`: Tiêu đề bài kiểm tra
- `description`: Mô tả chi tiết
- `classroom`: Lớp học chứa bài kiểm tra
- `createdBy`: Người tạo
- `questions`: Danh sách câu hỏi
- `duration`: Thời gian làm bài
- `startTime`: Thời gian bắt đầu
- `endTime`: Thời gian kết thúc
- `totalPoints`: Tổng điểm
- `passingScore`: Điểm đạt
- `allowReview`: Cho phép xem lại
- `isActive`: Trạng thái hoạt động
- `deleted`: Đánh dấu xóa mềm

## 6. Question Model (Câu Hỏi)

### Mục đích
Model Question quản lý các câu hỏi trong bài kiểm tra.

### Các trường chính
- `content`: Nội dung câu hỏi
- `type`: Loại câu hỏi
- `options`: Các lựa chọn
- `correctAnswer`: Đáp án đúng
- `points`: Điểm số
- `difficulty`: Độ khó
- `explanation`: Giải thích đáp án
- `tags`: Nhãn phân loại
- `isActive`: Trạng thái hoạt động
- `deleted`: Đánh dấu xóa mềm

## 7. Notification Model (Thông Báo)

### Mục đích
Model Notification quản lý các thông báo trong hệ thống.

### Các trường chính
- `title`: Tiêu đề thông báo
- `content`: Nội dung thông báo
- `type`: Loại thông báo
- `priority`: Mức độ ưu tiên
- `sender`: Người gửi
- `recipients`: Người nhận
- `relatedTo`: Liên kết đến đối tượng
- `isRead`: Đã đọc hay chưa
- `readAt`: Thời gian đọc
- `isActive`: Trạng thái hoạt động
- `deleted`: Đánh dấu xóa mềm

## Các Mối Quan Hệ Chính

1. **User - Classroom**
   - Một User (giảng viên) có thể dạy nhiều Classroom
   - Một User (học viên) có thể tham gia nhiều Classroom

2. **Classroom - Assignment**
   - Một Classroom chứa nhiều Assignment
   - Mỗi Assignment thuộc về một Classroom

3. **Classroom - Material**
   - Một Classroom chứa nhiều Material
   - Mỗi Material thuộc về một Classroom

4. **Classroom - Quiz**
   - Một Classroom chứa nhiều Quiz
   - Mỗi Quiz thuộc về một Classroom

5. **Quiz - Question**
   - Một Quiz chứa nhiều Question
   - Mỗi Question có thể thuộc về nhiều Quiz

6. **User - Notification**
   - Một User có thể nhận nhiều Notification
   - Mỗi Notification có thể gửi đến nhiều User 