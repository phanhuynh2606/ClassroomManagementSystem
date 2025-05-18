# Model Question (Câu Hỏi)

## Mục đích
Model Question quản lý các câu hỏi được sử dụng trong bài kiểm tra, hỗ trợ nhiều loại câu hỏi và quản lý đáp án.

## Các trường dữ liệu

### Thông tin cơ bản
- `content` (String)
  - Nội dung câu hỏi
  - Bắt buộc
  - Hiển thị cho người dùng

- `image` (String)
  - Hình ảnh câu hỏi
  - Không bắt buộc
  - Dùng để minh họa

### Đáp án
- `options` (Array)
  - Danh sách lựa chọn
  - Mỗi lựa chọn chứa:
    - `content`: Nội dung lựa chọn
    - `isCorrect`: Đúng/sai
    - `image`: Hình ảnh lựa chọn

- `explanation` (String)
  - Giải thích đáp án
  - Không bắt buộc
  - Hiển thị sau khi chấm điểm

- `explanationImage` (String)
  - Hình ảnh giải thích
  - Không bắt buộc
  - Dùng để minh họa giải thích

### Phân loại
- `difficulty` (String)
  - Độ khó
  - Enum: ['easy', 'medium', 'hard']
  - Mặc định: 'medium'
  - Được đánh index
  - Xác định độ khó

- `category` (String)
  - Phân loại
  - Enum: ['PT1', 'PT2', 'QUIZ1', 'QUIZ2', 'FE', 'ASSIGNMENT']
  - Bắt buộc
  - Được đánh index
  - Dùng để tổ chức

- `subjectCode` (String)
  - Mã môn học
  - Bắt buộc
  - Được đánh index
  - Dùng để phân loại

### Điểm số
- `points` (Number)
  - Điểm số
  - Mặc định: 1
  - Xác định trọng số

### Thống kê
- `statistics` (Object)
  - Thống kê sử dụng
  - `totalAttempts`: Tổng số lần làm
  - `correctAttempts`: Số lần làm đúng

### AI
- `isAI` (Boolean)
  - Được tạo bởi AI
  - Mặc định: false
  - Được đánh index

### Người tạo và cập nhật
- `createdBy` (ObjectId)
  - Người tạo
  - Reference đến User
  - Bắt buộc
  - Được đánh index

- `lastUpdatedBy` (ObjectId)
  - Người cập nhật cuối
  - Reference đến User

### Trạng thái
- `status` (String)
  - Trạng thái
  - Enum: ['draft', 'published', 'archived']
  - Mặc định: 'draft'
  - Kiểm soát hiển thị

### Lịch sử sử dụng
- `usageHistory` (Array)
  - Lịch sử sử dụng
  - Mỗi lần sử dụng chứa:
    - `quiz`: Reference đến Quiz
    - `usedAt`: Thời gian sử dụng
    - `classroom`: Reference đến Classroom

- `lastUsedAt` (Date)
  - Thời gian sử dụng cuối
  - Được đánh index

- `usageCount` (Number)
  - Số lần sử dụng
  - Mặc định: 0
  - Được đánh index

- `cooldownPeriod` (Number)
  - Thời gian chờ (ngày)
  - Mặc định: 30
  - Giới hạn tái sử dụng

- `usedInClassrooms` (Array)
  - Danh sách lớp đã sử dụng
  - Mảng các ObjectId
  - Reference đến Classroom
  - Được đánh index

### Trạng thái
- `isActive` (Boolean)
  - Trạng thái hoạt động
  - Mặc định: true
  - Được đánh index
  - Kiểm soát hiển thị

- `isArchived` (Boolean)
  - Trạng thái lưu trữ
  - Mặc định: false
  - Câu hỏi đã cũ

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

## Các mối quan hệ
- Được tạo bởi một người dùng (User)
- Được cập nhật bởi một người dùng (User)
- Được sử dụng trong nhiều bài kiểm tra (Quiz)
- Được sử dụng trong nhiều lớp học (Classroom)

## Các quy tắc nghiệp vụ
1. Nội dung câu hỏi là bắt buộc
2. Phân loại và mã môn học là bắt buộc
3. Độ khó phải được xác định
4. Điểm số phải là số dương
5. Câu hỏi bị xóa mềm không hiển thị trong danh sách
6. Câu hỏi đã lưu trữ không thể sửa đổi
7. Câu hỏi đã sử dụng trong lớp không thể sử dụng lại trong thời gian chờ
8. Thống kê được cập nhật tự động khi có bài làm mới
9. Câu hỏi AI được đánh dấu riêng
10. Câu hỏi ở trạng thái draft không hiển thị với học viên

## Các index
- `{ difficulty: 1 }`: Tìm kiếm theo độ khó
- `{ isAI: 1 }`: Tìm kiếm câu hỏi AI
- `{ category: 1, subjectCode: 1 }`: Tìm kiếm theo phân loại và môn học
- `{ createdBy: 1, status: 1 }`: Tìm kiếm theo người tạo và trạng thái
- `{ lastUsedAt: 1 }`: Tìm kiếm theo thời gian sử dụng
- `{ usageCount: 1 }`: Tìm kiếm theo số lần sử dụng
- `{ 'usedInClassrooms': 1 }`: Tìm kiếm theo lớp đã sử dụng
- `{ type: 1, difficulty: 1, isActive: 1 }`: Tìm kiếm theo loại và độ khó
- `{ createdBy: 1, createdAt: -1 }`: Tìm kiếm theo người tạo
- `{ tags: 1 }`: Tìm kiếm theo nhãn

## Timestamps
- `createdAt`: Thời gian tạo
- `updatedAt`: Thời gian cập nhật cuối

## Các phương thức chính
- `canBeUsedInClassroom`: Kiểm tra khả năng sử dụng trong lớp
- `addUsage`: Thêm lịch sử sử dụng
- `updateStatistics`: Cập nhật thống kê
- `softDelete`: Xóa mềm câu hỏi
- `restore`: Khôi phục câu hỏi đã xóa mềm 