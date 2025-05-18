# Model Classroom (Lớp Học)

## Mục đích
Model Classroom quản lý thông tin về các lớp học trong hệ thống, bao gồm thông tin cơ bản, thành viên, lịch học và cài đặt.

## Các trường dữ liệu

### Thông tin cơ bản
- `name` (String)
  - Tên lớp học
  - Bắt buộc
  - Được đánh index
  - Dùng để hiển thị và tìm kiếm

- `code` (String)
  - Mã lớp học
  - Bắt buộc, duy nhất
  - Được đánh index
  - Dùng để tham gia lớp

- `description` (String)
  - Mô tả lớp học
  - Không bắt buộc
  - Cung cấp thông tin chi tiết

### Thành viên
- `teacher` (ObjectId)
  - Giảng viên phụ trách
  - Reference đến User
  - Bắt buộc
  - Được đánh index

- `students` (Array)
  - Danh sách học viên
  - Mỗi học viên chứa:
    - `student`: Reference đến User
    - `joinedAt`: Thời gian tham gia
    - `status`: Trạng thái (active, inactive, pending)
  - Tự động cập nhật khi học viên tham gia/rời lớp

- `maxStudents` (Number)
  - Số lượng học viên tối đa
  - Mặc định: 50
  - Giới hạn số lượng học viên

### Phân loại
- `category` (String)
  - Loại lớp học
  - Enum: ['academic', 'professional', 'other']
  - Mặc định: 'academic'
  - Phân loại mục đích

- `level` (String)
  - Cấp độ lớp học
  - Enum: ['beginner', 'intermediate', 'advanced']
  - Mặc định: 'beginner'
  - Xác định độ khó

### Lịch học
- `schedule` (Object)
  - Thông tin lịch học
  - `startDate`: Ngày bắt đầu
  - `endDate`: Ngày kết thúc
  - `meetingDays`: Các ngày học trong tuần
  - `meetingTime`: Thời gian học

### Trạng thái
- `isActive` (Boolean)
  - Trạng thái hoạt động
  - Mặc định: true
  - Được đánh index
  - Kiểm soát hiển thị

- `isArchived` (Boolean)
  - Trạng thái lưu trữ
  - Mặc định: false
  - Lớp học đã kết thúc

### Xóa mềm
- `deleted` (Boolean)
  - Đánh dấu xóa mềm
  - Mặc định: false
  - Được đánh index

- `deletedAt` (Date)
  - Thời gian xóa
  - Được set khi xóa

- `deletedBy` (ObjectId)
  - Người thực hiện xóa
  - Reference đến User

### Cài đặt
- `settings` (Object)
  - Cài đặt lớp học
  - `allowStudentInvite`: Cho phép học viên mời
  - `allowStudentPost`: Cho phép học viên đăng bài
  - `allowStudentComment`: Cho phép học viên bình luận

## Các mối quan hệ
- Thuộc về một giảng viên (User)
- Có nhiều học viên (User)
- Chứa nhiều bài tập (Assignment)
- Chứa nhiều tài liệu (Material)
- Chứa nhiều bài kiểm tra (Quiz)
- Có nhiều thông báo (Notification)

## Các quy tắc nghiệp vụ
1. Mã lớp học phải là duy nhất
2. Số lượng học viên không được vượt quá maxStudents
3. Chỉ giảng viên mới có quyền tạo và quản lý lớp
4. Học viên phải được chấp nhận mới có thể tham gia
5. Lớp học bị xóa mềm không hiển thị trong danh sách
6. Lớp học đã lưu trữ không cho phép thêm học viên mới
7. Lớp học phải có ngày bắt đầu và kết thúc hợp lệ
8. Các ngày học phải được chọn từ danh sách cho phép
9. Thời gian học phải được định dạng hợp lệ
10. Cài đặt lớp học có thể được thay đổi bởi giảng viên

## Các index
- `{ teacher: 1, isActive: 1 }`: Tìm kiếm lớp học theo giảng viên
- `{ code: 1, isActive: 1 }`: Tìm kiếm lớp học theo mã
- `{ category: 1, level: 1 }`: Tìm kiếm lớp học theo phân loại

## Timestamps
- `createdAt`: Thời gian tạo
- `updatedAt`: Thời gian cập nhật cuối 