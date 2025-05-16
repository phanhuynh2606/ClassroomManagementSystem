# Notification Model

## Mô tả
Model Notification quản lý thông báo trong hệ thống, bao gồm thông báo hệ thống, thông báo lớp học, và thông báo bài tập.

## Schema

### Thông tin cơ bản
- `title`: Tiêu đề thông báo (required)
- `content`: Nội dung thông báo (required)
- `type`: Loại thông báo ('system', 'classroom', 'assignment', 'quiz')
- `priority`: Mức độ ưu tiên ('low', 'medium', 'high', 'urgent')

### Người gửi và người nhận
- `sender`: Người gửi (ref: User, required)
- `recipients`: Danh sách người nhận
  - `user`: Người nhận (ref: User)
  - `read`: Trạng thái đọc
  - `readAt`: Thời gian đọc
  - `deleted`: Trạng thái xóa
  - `deletedAt`: Thời gian xóa

### Liên kết
- `classroom`: Lớp học liên quan (ref: Classroom)
- `relatedTo`: Đối tượng liên quan (refPath: onModel)
- `onModel`: Model liên quan ('Assignment', 'Quiz', 'Material')
- `action`: Hành động ('create', 'update', 'delete', 'reminder', 'announcement')
- `actionUrl`: URL liên kết

### Trạng thái
- `isActive`: Trạng thái hoạt động
- `isArchived`: Trạng thái lưu trữ

### Lên lịch
- `scheduledFor`: Thời gian gửi
- `expiresAt`: Thời gian hết hạn

## Indexes
- `title`: Tìm kiếm theo tiêu đề
- `type`: Tìm kiếm theo loại
- `sender`: Tìm kiếm theo người gửi
- `isActive`: Tìm kiếm theo trạng thái
- `type, isActive`: Tìm kiếm kết hợp
- `sender, createdAt`: Tìm kiếm kết hợp
- `recipients.user, recipients.read`: Tìm kiếm kết hợp
- `classroom, type`: Tìm kiếm kết hợp
- `scheduledFor`: Tìm kiếm theo thời gian gửi
- `expiresAt`: Tìm kiếm theo thời gian hết hạn

## Relationships
- `sender`: Liên kết với User model
- `recipients.user`: Liên kết với User model
- `classroom`: Liên kết với Classroom model
- `relatedTo`: Liên kết động với các model khác 