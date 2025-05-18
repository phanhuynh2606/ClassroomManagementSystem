# Model Assignment (Bài Tập)

## Mục đích
Model Assignment quản lý các bài tập được giao cho học viên, bao gồm thông tin chi tiết, tệp đính kèm, bài nộp và chấm điểm.

## Các trường dữ liệu

### Thông tin cơ bản
- `title` (String)
  - Tiêu đề bài tập
  - Bắt buộc
  - Được đánh index
  - Dùng để hiển thị và tìm kiếm

- `description` (String)
  - Mô tả chi tiết
  - Bắt buộc
  - Hướng dẫn làm bài

### Liên kết
- `classroom` (ObjectId)
  - Lớp học chứa bài tập
  - Reference đến Classroom
  - Bắt buộc
  - Được đánh index

- `createdBy` (ObjectId)
  - Người tạo bài tập
  - Reference đến User
  - Bắt buộc
  - Được đánh index

### Thời gian
- `dueDate` (Date)
  - Hạn nộp bài
  - Bắt buộc
  - Được đánh index
  - Xác định thời hạn

### Tệp đính kèm
- `attachments` (Array)
  - Danh sách tệp đính kèm
  - Mỗi tệp chứa:
    - `name`: Tên tệp
    - `url`: Đường dẫn tệp
    - `fileType`: Loại tệp
    - `fileSize`: Kích thước tệp

### Bài nộp
- `submissions` (Array)
  - Danh sách bài nộp
  - Mỗi bài nộp chứa:
    - `student`: Reference đến User
    - `submittedAt`: Thời gian nộp
    - `content`: Nội dung bài làm
    - `attachments`: Danh sách tệp đính kèm
    - `grade`: Điểm số
    - `feedback`: Nhận xét
    - `status`: Trạng thái (pending, submitted, graded, late)

### Điểm số
- `totalPoints` (Number)
  - Tổng điểm
  - Mặc định: 100
  - Xác định thang điểm

- `allowLateSubmission` (Boolean)
  - Cho phép nộp muộn
  - Mặc định: false
  - Kiểm soát nộp muộn

- `latePenalty` (Number)
  - Phạt nộp muộn
  - Mặc định: 0
  - Trừ điểm khi nộp muộn

### Trạng thái
- `isActive` (Boolean)
  - Trạng thái hoạt động
  - Mặc định: true
  - Được đánh index
  - Kiểm soát hiển thị

- `isArchived` (Boolean)
  - Trạng thái lưu trữ
  - Mặc định: false
  - Bài tập đã kết thúc

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

### Phân loại
- `tags` (Array)
  - Nhãn phân loại
  - Mảng các chuỗi
  - Dùng để tìm kiếm và lọc

### Hiển thị
- `visibility` (String)
  - Trạng thái hiển thị
  - Enum: ['draft', 'published', 'scheduled']
  - Mặc định: 'draft'
  - Kiểm soát hiển thị

- `publishDate` (Date)
  - Thời gian xuất bản
  - Dùng cho bài tập đã lên lịch

## Các mối quan hệ
- Thuộc về một lớp học (Classroom)
- Được tạo bởi một người dùng (User)
- Có nhiều bài nộp từ học viên (User)
- Có thể liên kết với thông báo (Notification)

## Các quy tắc nghiệp vụ
1. Tiêu đề và mô tả là bắt buộc
2. Hạn nộp phải sau thời gian tạo
3. Bài nộp muộn sẽ bị trừ điểm theo latePenalty
4. Chỉ giảng viên mới có quyền tạo và quản lý bài tập
5. Học viên chỉ có thể nộp bài một lần
6. Bài tập bị xóa mềm không hiển thị trong danh sách
7. Bài tập đã lưu trữ không cho phép nộp bài mới
8. Bài tập ở trạng thái draft không hiển thị với học viên
9. Bài tập đã lên lịch sẽ tự động xuất bản khi đến thời gian
10. Điểm số phải nằm trong khoảng 0 đến totalPoints

## Các index
- `{ classroom: 1, dueDate: 1, isActive: 1 }`: Tìm kiếm bài tập theo lớp và hạn nộp
- `{ createdBy: 1, createdAt: -1 }`: Tìm kiếm bài tập theo người tạo

## Timestamps
- `createdAt`: Thời gian tạo
- `updatedAt`: Thời gian cập nhật cuối 