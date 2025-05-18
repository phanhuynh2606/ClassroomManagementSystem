# Model Material (Tài Liệu)

## Mục đích
Model Material quản lý các tài liệu học tập được chia sẻ trong lớp học. Nó hỗ trợ nhiều loại tệp, quản lý phiên bản và theo dõi việc sử dụng tài liệu.

## Các trường dữ liệu

### Thông tin cơ bản
- `title` (String)
  - Tiêu đề tài liệu
  - Bắt buộc
  - Dùng để hiển thị và tìm kiếm

- `description` (String)
  - Mô tả tài liệu
  - Không bắt buộc
  - Cung cấp thông tin chi tiết

### Thông tin tệp
- `type` (String)
  - Loại tài liệu
  - Enum: ['pdf', 'slide', 'video', 'other']
  - Bắt buộc
  - Phân loại tài liệu

- `fileUrl` (String)
  - Đường dẫn tệp
  - Bắt buộc
  - Trỏ đến tệp lưu trữ

- `fileSize` (Number)
  - Kích thước tệp (bytes)
  - Không bắt buộc
  - Theo dõi dung lượng

- `fileType` (String)
  - Định dạng tệp (MIME type)
  - Không bắt buộc
  - Xác định loại tệp

- `thumbnail` (String)
  - URL ảnh thu nhỏ
  - Không bắt buộc
  - Dùng cho xem trước

### Liên kết
- `classroom` (ObjectId)
  - Lớp học chứa tài liệu
  - Reference đến Classroom
  - Bắt buộc
  - Được đánh index

- `uploadedBy` (ObjectId)
  - Người tải lên
  - Reference đến User
  - Bắt buộc
  - Được đánh index

### Quyền truy cập
- `isPublic` (Boolean)
  - Công khai hay không
  - Mặc định: false
  - Được đánh index
  - Kiểm soát quyền xem

### Phân loại
- `tags` (Array)
  - Nhãn phân loại
  - Mảng các chuỗi
  - Dùng để tổ chức
  - Được đánh index

### Thống kê sử dụng
- `downloadCount` (Number)
  - Số lượt tải
  - Mặc định: 0
  - Theo dõi mức độ sử dụng

- `viewCount` (Number)
  - Số lượt xem
  - Mặc định: 0
  - Theo dõi mức độ quan tâm

### Quản lý phiên bản
- `version` (Number)
  - Phiên bản hiện tại
  - Mặc định: 1
  - Theo dõi cập nhật

- `previousVersions` (Array)
  - Lịch sử phiên bản
  - Mỗi phiên bản chứa:
    - `fileUrl`: Đường dẫn tệp cũ
    - `version`: Số phiên bản
    - `updatedAt`: Thời gian cập nhật
    - `updatedBy`: Người cập nhật

### Trạng thái
- `isActive` (Boolean)
  - Trạng thái hoạt động
  - Mặc định: true
  - Kiểm soát quyền truy cập

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
- Được tải lên bởi một người dùng (User)
- Có thể liên kết với nhiều thông báo (Notification)

## Các quy tắc nghiệp vụ
1. Tiêu đề và đường dẫn tệp là bắt buộc
2. Loại tài liệu phải là một trong các giá trị cho phép
3. Kích thước tệp phải là số dương
4. Số phiên bản phải tăng dần
5. Tài liệu đã lưu trữ không thể sửa đổi
6. Tài liệu đã xóa mềm không hiển thị trong các truy vấn thông thường
7. Tài liệu công khai có thể xem bởi mọi người
8. Lịch sử phiên bản được duy trì
9. Thống kê sử dụng được cập nhật tự động
10. Định dạng tệp phải phù hợp với loại tài liệu

## Các phương thức chính
- `createMaterial`: Tạo tài liệu mới
- `updateVersion`: Cập nhật phiên bản
- `trackDownload`: Ghi nhận lượt tải
- `trackView`: Ghi nhận lượt xem
- `updateVisibility`: Cập nhật quyền truy cập
- `getVersions`: Lấy lịch sử phiên bản
- `softDelete`: Xóa mềm tài liệu
- `restore`: Khôi phục tài liệu đã xóa mềm
- `getMaterialStats`: Lấy thống kê về tài liệu
- `validateFileType`: Kiểm tra tính hợp lệ của tệp

## Usage Examples

### Creating a New Material
```javascript
const material = new Material({
  title: 'Introduction to JavaScript',
  description: 'Basic JavaScript concepts',
  type: 'pdf',
  fileUrl: 'https://storage.example.com/materials/js-intro.pdf',
  fileSize: 1024000,
  fileType: 'application/pdf',
  classroom: classroomId,
  uploadedBy: teacherId,
  tags: ['javascript', 'programming', 'basics']
});
await material.save();
```

### Updating Material Version
```javascript
await material.updateOne({
  $push: {
    previousVersions: {
      fileUrl: material.fileUrl,
      version: material.version,
      updatedAt: material.updatedAt,
      updatedBy: material.uploadedBy
    }
  },
  $set: {
    fileUrl: newFileUrl,
    version: material.version + 1,
    updatedBy: teacherId
  }
});
```

### Tracking Usage
```javascript
await material.updateOne({
  $inc: {
    downloadCount: 1,
    viewCount: 1
  }
});
```

## Business Rules
1. Title and fileUrl are required
2. Type must be valid enum value
3. File size must be positive
4. Version numbers must increment
5. Archived materials can't be modified
6. Deleted materials are hidden from queries
7. Public materials are visible to all
8. Version history is maintained
9. Usage statistics are automatically updated
10. File type must match material type

## Related Models
- Classroom (parent container)
- User (uploader and viewers)
- Notification (material updates)

## Material Types

### PDF Materials
- Lecture notes
- Reading materials
- Study guides
- Worksheets

### Slide Materials
- Presentation slides
- Lecture slides
- Visual aids
- Course outlines

### Video Materials
- Lecture recordings
- Tutorial videos
- Demonstrations
- Course introductions

### Other Materials
- Code samples
- Data files
- External links
- Supplementary resources 