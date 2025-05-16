# Question Model

## Mô tả
Model Question quản lý câu hỏi cho các bài kiểm tra, bao gồm nội dung, đáp án, và thống kê sử dụng.

## Schema

### Nội dung câu hỏi
- `content`: Nội dung câu hỏi (required)
- `image`: Hình ảnh câu hỏi
- `options`: Các lựa chọn
  - `content`: Nội dung lựa chọn
  - `isCorrect`: Đáp án đúng
  - `image`: Hình ảnh lựa chọn
- `explanation`: Giải thích đáp án
- `explanationImage`: Hình ảnh giải thích

### Phân loại
- `difficulty`: Độ khó ('easy', 'medium', 'hard')
- `points`: Điểm số (default: 1)
- `category`: Loại bài kiểm tra ('PT1', 'PT2', 'QUIZ1', 'QUIZ2', 'FE', 'ASSIGNMENT')
- `subjectCode`: Mã môn học

### Thống kê
- `statistics`:
  - `totalAttempts`: Tổng số lần làm
  - `correctAttempts`: Số lần làm đúng

### Quản lý
- `createdBy`: Người tạo (ref: User)
- `lastUpdatedBy`: Người cập nhật gần nhất (ref: User)
- `status`: Trạng thái ('draft', 'published', 'archived')
- `isAI`: Được tạo bởi AI

### Lịch sử sử dụng
- `usageHistory`: Lịch sử sử dụng
  - `quiz`: Bài kiểm tra (ref: Quiz)
  - `usedAt`: Thời gian sử dụng
  - `classroom`: Lớp học (ref: Classroom)
- `lastUsedAt`: Lần sử dụng gần nhất
- `usageCount`: Số lần sử dụng
- `cooldownPeriod`: Thời gian chờ giữa các lần sử dụng
- `usedInClassrooms`: Danh sách lớp đã sử dụng

## Methods
- `canBeUsedInClassroom`: Kiểm tra khả năng sử dụng trong lớp
- `addUsage`: Thêm lịch sử sử dụng
- `updateStatistics`: Cập nhật thống kê

## Indexes
- `difficulty`: Tìm kiếm theo độ khó
- `isAI`: Tìm kiếm theo nguồn tạo
- `category, subjectCode`: Tìm kiếm kết hợp
- `createdBy, status`: Tìm kiếm kết hợp
- `lastUsedAt`: Tìm kiếm theo thời gian sử dụng
- `usageCount`: Tìm kiếm theo số lần sử dụng
- `usedInClassrooms`: Tìm kiếm theo lớp học

## Relationships
- `createdBy`: Liên kết với User model
- `lastUpdatedBy`: Liên kết với User model
- `usageHistory.quiz`: Liên kết với Quiz model
- `usageHistory.classroom`: Liên kết với Classroom model 