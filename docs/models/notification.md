# Model Notification (Thông Báo)

## Mục đích
Model Notification quản lý các thông báo trong hệ thống, bao gồm thông báo hệ thống, thông báo lớp học, thông báo bài tập và thông báo bài kiểm tra.

## Các trường dữ liệu

### Thông tin cơ bản
- `title` (String)
  - Tiêu đề thông báo
  - Bắt buộc
  - Được đánh index
  - Dùng để hiển thị

- `content` (String)
  - Nội dung thông báo
  - Bắt buộc
  - Hiển thị chi tiết

### Phân loại
- `type` (String)
  - Loại thông báo
  - Enum: ['system', 'classroom', 'assignment', 'quiz']
  - Bắt buộc
  - Được đánh index
  - Xác định loại

- `priority` (String)
  - Mức độ ưu tiên
  - Enum: ['low', 'medium', 'high', 'urgent']
  - Mặc định: 'medium'
  - Xác định độ quan trọng

### Người gửi và người nhận
- `sender` (ObjectId)
  - Người gửi
  - Reference đến User
  - Bắt buộc
  - Được đánh index

- `recipients` (Array)
  - Danh sách người nhận
  - Mỗi người nhận chứa:
    - `user`: Reference đến User
    - `read`: Đã đọc hay chưa
    - `readAt`: Thời gian đọc
    - `deleted`: Đã xóa hay chưa
    - `deletedAt`: Thời gian xóa

### Liên kết
- `classroom` (ObjectId)
  - Lớp học liên quan
  - Reference đến Classroom
  - Được đánh index
  - Dùng cho thông báo lớp

- `relatedTo` (ObjectId)
  - Đối tượng liên quan
  - Reference động
  - Dùng cho thông báo bài tập/kiểm tra

- `onModel` (String)
  - Loại đối tượng liên quan
  - Enum: ['Assignment', 'Quiz', 'Material']
  - Xác định model liên kết

### Hành động
- `action` (String)
  - Hành động
  - Enum: ['create', 'update', 'delete', 'reminder', 'announcement']
  - Mặc định: 'announcement'
  - Xác định loại hành động

- `actionUrl` (String)
  - URL hành động
  - Dùng để điều hướng

### Trạng thái
- `isActive` (Boolean)
  - Trạng thái hoạt động
  - Mặc định: true
  - Được đánh index
  - Kiểm soát hiển thị

- `isArchived` (Boolean)
  - Trạng thái lưu trữ
  - Mặc định: false
  - Thông báo đã cũ

### Thời gian
- `scheduledFor` (Date)
  - Thời gian lên lịch
  - Dùng cho thông báo có lịch

- `expiresAt` (Date)
  - Thời gian hết hạn
  - Dùng cho thông báo tạm thời

## Các mối quan hệ
- Được gửi bởi một người dùng (User)
- Có nhiều người nhận (User)
- Có thể liên kết với lớp học (Classroom)
- Có thể liên kết với bài tập (Assignment)
- Có thể liên kết với bài kiểm tra (Quiz)
- Có thể liên kết với tài liệu (Material)

## Các quy tắc nghiệp vụ
1. Tiêu đề và nội dung là bắt buộc
2. Loại thông báo phải hợp lệ
3. Người gửi phải được xác định
4. Phải có ít nhất một người nhận
5. Thông báo lớp học phải liên kết với lớp
6. Thông báo bài tập/kiểm tra phải liên kết với đối tượng
7. Thông báo có lịch phải có thời gian hợp lệ
8. Thông báo tạm thời phải có thời gian hết hạn
9. Thông báo bị xóa mềm không hiển thị
10. Thông báo đã lưu trữ không thể sửa đổi

## Các index
- `{ type: 1, isActive: 1 }`: Tìm kiếm thông báo theo loại
- `{ sender: 1, createdAt: -1 }`: Tìm kiếm thông báo theo người gửi

## Timestamps
- `createdAt`: Thời gian tạo
- `updatedAt`: Thời gian cập nhật cuối 