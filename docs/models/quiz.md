# Model Quiz (Bài Kiểm Tra)

## Mục đích
Model Quiz quản lý các bài kiểm tra trong lớp học, bao gồm câu hỏi, thời gian làm bài, cài đặt và kết quả của học viên.

## Các trường dữ liệu

### Thông tin cơ bản
- `title` (String)
  - Tiêu đề bài kiểm tra
  - Bắt buộc
  - Được đánh index
  - Dùng để hiển thị và tìm kiếm

- `description` (String)
  - Mô tả chi tiết
  - Không bắt buộc
  - Hướng dẫn làm bài

### Liên kết
- `classroom` (ObjectId)
  - Lớp học chứa bài kiểm tra
  - Reference đến Classroom
  - Bắt buộc
  - Được đánh index

- `createdBy` (ObjectId)
  - Người tạo bài kiểm tra
  - Reference đến User
  - Bắt buộc
  - Được đánh index

### Câu hỏi
- `questions` (Array)
  - Danh sách câu hỏi
  - Mỗi phần tử là Reference đến Question
  - Được đánh index
  - Thứ tự hiển thị

### Thời gian
- `duration` (Number)
  - Thời gian làm bài (phút)
  - Bắt buộc
  - Giới hạn thời gian

- `startTime` (Date)
  - Thời gian bắt đầu
  - Bắt buộc
  - Được đánh index
  - Xác định thời điểm mở

- `endTime` (Date)
  - Thời gian kết thúc
  - Bắt buộc
  - Được đánh index
  - Xác định thời điểm đóng

### Cài đặt
- `allowReview` (Boolean)
  - Cho phép xem lại bài làm
  - Mặc định: true
  - Kiểm soát quyền xem lại

- `showResults` (Boolean)
  - Hiển thị kết quả
  - Mặc định: true
  - Kiểm soát hiển thị điểm

- `randomizeQuestions` (Boolean)
  - Xáo trộn câu hỏi
  - Mặc định: false
  - Tăng tính khách quan

- `passingScore` (Number)
  - Điểm đạt
  - Mặc định: 60
  - Xác định đạt/không đạt

- `maxAttempts` (Number)
  - Số lần làm tối đa
  - Mặc định: 1
  - Giới hạn số lần làm

### Bài làm
- `submissions` (Array)
  - Danh sách bài làm
  - Mỗi bài làm chứa:
    - `student`: Reference đến User
    - `answers`: Danh sách câu trả lời
      - `question`: Reference đến Question
      - `selectedOptions`: Mảng các lựa chọn
      - `isCorrect`: Đúng/sai
    - `score`: Điểm số
    - `startedAt`: Thời gian bắt đầu
    - `submittedAt`: Thời gian nộp
    - `attempt`: Số lần làm
    - `status`: Trạng thái (in-progress, completed, abandoned)

### Trạng thái
- `isActive` (Boolean)
  - Trạng thái hoạt động
  - Mặc định: true
  - Được đánh index
  - Kiểm soát hiển thị

- `isArchived` (Boolean)
  - Trạng thái lưu trữ
  - Mặc định: false
  - Bài kiểm tra đã kết thúc

### Xóa mềm
- `deleted` (Boolean)
  - Đánh dấu xóa mềm
  - Mặc định: false
  - Đánh index để lọc nhanh

- `deletedAt` (Date)
  - Thời gian xóa
  - Được set khi xóa

- `deletedBy` (ObjectId)
  - Người thực hiện xóa
  - Reference đến User

## Các mối quan hệ
- Thuộc về một lớp học (Classroom)
- Được tạo bởi một người dùng (User)
- Chứa nhiều câu hỏi (Question)
- Có nhiều bài làm từ học viên (User)
- Có thể liên kết với thông báo (Notification)

## Các quy tắc nghiệp vụ
1. Tiêu đề là bắt buộc
2. Thời gian kết thúc phải sau thời gian bắt đầu
3. Thời gian làm bài phải hợp lý (tối thiểu 1 phút)
4. Chỉ giảng viên mới có quyền tạo và quản lý bài kiểm tra
5. Học viên chỉ có thể làm bài trong thời gian cho phép
6. Số lần làm không được vượt quá maxAttempts
7. Bài kiểm tra bị xóa mềm không hiển thị trong danh sách
8. Bài kiểm tra đã lưu trữ không cho phép làm bài mới
9. Điểm số phải nằm trong khoảng 0 đến 100
10. Bài làm đã nộp không thể sửa đổi

## Các index
- `{ classroom: 1, startTime: 1, isActive: 1 }`: Tìm kiếm bài kiểm tra theo lớp và thời gian
- `{ createdBy: 1, createdAt: -1 }`: Tìm kiếm bài kiểm tra theo người tạo

## Timestamps
- `createdAt`: Thời gian tạo
- `updatedAt`: Thời gian cập nhật cuối

## Các phương thức chính
- `createQuiz`: Tạo bài kiểm tra mới
- `addQuestion`: Thêm câu hỏi
- `removeQuestion`: Xóa câu hỏi
- `updateSettings`: Cập nhật cài đặt
- `startQuiz`: Bắt đầu làm bài
- `submitQuiz`: Nộp bài
- `gradeSubmission`: Chấm điểm
- `getResults`: Lấy kết quả
- `archive`: Lưu trữ bài kiểm tra
- `restore`: Khôi phục bài kiểm tra
- `softDelete`: Xóa mềm bài kiểm tra
- `getQuizStats`: Lấy thống kê về bài kiểm tra 