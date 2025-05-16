# Classroom Model

## Mô tả
Model Classroom quản lý thông tin lớp học, bao gồm thông tin cơ bản, danh sách học viên, và các cài đặt của lớp.

## Schema

### Thông tin cơ bản
- `name`: Tên lớp học (required)
- `code`: Mã lớp học (unique, required)
- `description`: Mô tả lớp học
- `teacher`: Giáo viên phụ trách (ref: User)
- `students`: Danh sách học viên (ref: User)

### Cấu hình lớp
- `maxStudents`: Số học viên tối đa (default: 50)
- `category`: Loại lớp ('academic', 'professional', 'other')
- `level`: Cấp độ ('beginner', 'intermediate', 'advanced')

### Lịch học
- `schedule`:
  - `startDate`: Ngày bắt đầu
  - `endDate`: Ngày kết thúc
  - `meetingDays`: Các ngày học trong tuần
  - `meetingTime`: Giờ học

### Cài đặt
- `settings`:
  - `allowStudentInvite`: Cho phép học viên mời
  - `allowStudentPost`: Cho phép học viên đăng bài
  - `allowStudentComment`: Cho phép học viên bình luận

### Trạng thái
- `isActive`: Trạng thái hoạt động
- `isArchived`: Trạng thái lưu trữ

## Indexes
- `name`: Tìm kiếm theo tên lớp
- `code`: Tìm kiếm theo mã lớp
- `teacher`: Tìm kiếm theo giáo viên
- `isActive`: Tìm kiếm theo trạng thái
- `teacher, isActive`: Tìm kiếm kết hợp
- `code, isActive`: Tìm kiếm kết hợp
- `category, level`: Tìm kiếm kết hợp

## Relationships
- `teacher`: Liên kết với User model (role: teacher)
- `students`: Liên kết với User model (role: student) 