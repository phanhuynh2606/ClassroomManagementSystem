# Quiz Model

## Mô tả
Model Quiz quản lý bài kiểm tra, bao gồm thông tin bài kiểm tra, câu hỏi, và bài làm của học viên.

## Schema

### Thông tin cơ bản
- `title`: Tiêu đề bài kiểm tra (required)
- `description`: Mô tả bài kiểm tra
- `classroom`: Lớp học (ref: Classroom, required)
- `createdBy`: Người tạo (ref: User, required)

### Câu hỏi
- `questions`: Danh sách câu hỏi (ref: Question)

### Thời gian
- `duration`: Thời gian làm bài (phút, required)
- `startTime`: Thời gian bắt đầu (required)
- `endTime`: Thời gian kết thúc (required)

### Cài đặt
- `allowReview`: Cho phép xem lại bài làm
- `showResults`: Hiển thị kết quả
- `randomizeQuestions`: Xáo trộn câu hỏi
- `passingScore`: Điểm đạt (default: 60)
- `maxAttempts`: Số lần làm tối đa (default: 1)

### Bài làm
- `submissions`: Danh sách bài làm
  - `student`: Học viên (ref: User)
  - `answers`: Câu trả lời
    - `question`: Câu hỏi (ref: Question)
    - `selectedOptions`: Lựa chọn đã chọn
    - `isCorrect`: Kết quả đúng/sai
  - `score`: Điểm số
  - `startedAt`: Thời gian bắt đầu làm
  - `submittedAt`: Thời gian nộp bài
  - `attempt`: Số lần làm
  - `status`: Trạng thái ('in-progress', 'completed', 'abandoned')

### Trạng thái
- `isActive`: Trạng thái hoạt động
- `isArchived`: Trạng thái lưu trữ
- `visibility`: Hiển thị ('draft', 'published', 'scheduled')
- `publishDate`: Thời gian đăng bài

### Phân loại
- `tags`: Nhãn phân loại

## Indexes
- `title`: Tìm kiếm theo tiêu đề
- `classroom`: Tìm kiếm theo lớp học
- `createdBy`: Tìm kiếm theo người tạo
- `startTime`: Tìm kiếm theo thời gian bắt đầu
- `isActive`: Tìm kiếm theo trạng thái
- `classroom, startTime`: Tìm kiếm kết hợp
- `createdBy, isActive`: Tìm kiếm kết hợp
- `submissions.student, submissions.status`: Tìm kiếm kết hợp
- `tags`: Tìm kiếm theo nhãn

## Relationships
- `classroom`: Liên kết với Classroom model
- `createdBy`: Liên kết với User model
- `questions`: Liên kết với Question model
- `submissions.student`: Liên kết với User model
- `submissions.answers.question`: Liên kết với Question model 