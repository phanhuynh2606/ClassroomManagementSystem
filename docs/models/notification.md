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
  - Enum: ['system', 'class_general', 'class_specific', 'personal', 'deadline', 'reminder']
  - Bắt buộc
  - Được đánh index
  - Xác định loại

- `priority` (String)
  - Mức độ ưu tiên
  - Enum: ['low', 'normal', 'high', 'urgent']
  - Mặc định: 'normal'
  - Xác định độ quan trọng

### Người gửi và người nhận
- `sender` (ObjectId)
  - Người gửi
  - Reference đến User
  - Bắt buộc
  - Được đánh index

- `recipients` (Array)
  - Danh sách người nhận
  - Array of ObjectId references to User
  - Bắt buộc
  - Được đánh index

### Liên kết
- `classroom` (ObjectId)
  - Lớp học liên quan
  - Reference đến Classroom
  - Được đánh index
  - Dùng cho thông báo lớp

- `targetRole` (String)
  - Vai trò đích
  - Enum: ['admin', 'teacher', 'student', 'all']
  - Được đánh index
  - Xác định đối tượng nhận

- `metadata` (Object)
  - Thông tin metadata
  - Chứa các thông tin bổ sung như:
    - `assignmentId`: Reference đến Assignment
    - `quizId`: Reference đến Quiz
    - `materialId`: Reference đến Material
    - `relatedUrl`: URL liên quan

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
6. Thông báo có target role phải hợp lệ
7. Priority level phải hợp lệ

## Các index
- `{ type: 1, priority: 1 }`: Tìm kiếm thông báo theo loại và ưu tiên
- `{ sender: 1, createdAt: -1 }`: Tìm kiếm thông báo theo người gửi
- `{ recipients: 1 }`: Tìm kiếm thông báo theo người nhận
- `{ classroom: 1, type: 1 }`: Tìm kiếm thông báo theo lớp học
- `{ targetRole: 1 }`: Tìm kiếm thông báo theo vai trò
- `{ priority: 1, createdAt: -1 }`: Tìm kiếm thông báo theo ưu tiên và thời gian

## Timestamps
- `createdAt`: Thời gian tạo
- `updatedAt`: Thời gian cập nhật cuối 