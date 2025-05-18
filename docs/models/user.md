# Model User (Người Dùng)

## Mục đích
Model User đại diện cho tất cả người dùng trong hệ thống, bao gồm học viên, giảng viên và quản trị viên. Model này quản lý thông tin cá nhân, xác thực và phân quyền của người dùng.

## Các trường dữ liệu

### Thông tin cơ bản
- `email` (String)
  - Email đăng nhập
  - Bắt buộc, duy nhất
  - Được đánh index để tìm kiếm nhanh
  - Dùng làm định danh chính

- `password` (String)
  - Mật khẩu đã được mã hóa
  - Bắt buộc
  - Được mã hóa trước khi lưu

- `role` (String)
  - Vai trò người dùng
  - Enum: ['admin', 'teacher', 'student']
  - Mặc định: 'student'
  - Được đánh index
  - Xác định quyền hạn trong hệ thống

### Thông tin cá nhân
- `image` (String)
  - URL ảnh đại diện
  - Mặc định: ''
  - Lưu trữ trên cloud storage

- `fullName` (String)
  - Họ và tên đầy đủ
  - Không bắt buộc
  - Dùng để hiển thị

- `phone` (String)
  - Số điện thoại
  - Không bắt buộc
  - Dùng cho liên lạc

- `dateOfBirth` (Date)
  - Ngày sinh
  - Không bắt buộc
  - Thông tin cá nhân

- `gender` (String)
  - Giới tính
  - Enum: ['male', 'female', 'other']
  - Không bắt buộc
  - Thông tin cá nhân

### Trạng thái và theo dõi
- `isActive` (Boolean)
  - Trạng thái hoạt động
  - Mặc định: true
  - Được đánh index
  - Kiểm soát quyền truy cập

- `lastLogin` (Date)
  - Thời gian đăng nhập cuối
  - Tự động cập nhật
  - Theo dõi hoạt động

### Quản lý token
- `refreshTokens` (Array)
  - Danh sách token làm mới
  - Mỗi token chứa:
    - `token`: Chuỗi token
    - `device`: Thông tin thiết bị
    - `ipAddress`: Địa chỉ IP
    - `userAgent`: Thông tin trình duyệt
    - `createdAt`: Thời gian tạo
    - `expiresAt`: Thời gian hết hạn
    - `isRevoked`: Trạng thái thu hồi
    - `revokedAt`: Thời gian thu hồi
  - Giới hạn tối đa 3 token
  - Tự động dọn dẹp token hết hạn

### Đặt lại mật khẩu
- `resetPasswordToken` (String)
  - Token đặt lại mật khẩu
  - Được tạo khi yêu cầu đặt lại

- `resetPasswordExpire` (Date)
  - Thời gian hết hạn token
  - Mặc định: 1 giờ sau khi tạo

### Xác thực email
- `emailVerified` (Boolean)
  - Trạng thái xác thực email
  - Mặc định: false

- `verificationToken` (String)
  - Token xác thực email
  - Được tạo khi đăng ký

- `verificationTokenExpire` (Date)
  - Thời gian hết hạn token
  - Mặc định: 24 giờ sau khi tạo

## Các mối quan hệ
- Dạy nhiều lớp học (Classroom)
- Tham gia nhiều lớp học (Classroom)
- Tạo nhiều bài tập (Assignment)
- Nộp nhiều bài tập (Assignment)
- Tải lên nhiều tài liệu (Material)
- Nhận nhiều thông báo (Notification)

## Các quy tắc nghiệp vụ
1. Email phải là duy nhất trong hệ thống
2. Mật khẩu phải được mã hóa trước khi lưu
3. Vai trò phải là một trong ba giá trị: admin, teacher, student
4. Tài khoản bị khóa (isActive = false) không thể đăng nhập
5. Mỗi người dùng chỉ được giữ tối đa 3 token làm mới
6. Token làm mới hết hạn sẽ tự động bị xóa
7. Token đặt lại mật khẩu có hiệu lực trong 1 giờ
8. Token xác thực email có hiệu lực trong 24 giờ
9. Thông tin cá nhân có thể được cập nhật bởi chính người dùng
10. Mật khẩu phải được thay đổi định kỳ

## Các phương thức chính
- `matchPassword`: So sánh mật khẩu
- `addRefreshToken`: Thêm token làm mới
- `revokeRefreshToken`: Thu hồi token
- `revokeAllRefreshTokens`: Thu hồi tất cả token
- `cleanExpiredTokens`: Dọn dẹp token hết hạn

## Các index
- `{ email: 1 }`: Tìm kiếm theo email
- `{ email: 1, role: 1 }`: Tìm kiếm theo email và vai trò
- `{ role: 1, isActive: 1 }`: Tìm kiếm người dùng đang hoạt động theo vai trò
- `{ 'refreshTokens.token': 1 }`: Tìm kiếm theo token

## Timestamps
- `createdAt`: Thời gian tạo
- `updatedAt`: Thời gian cập nhật cuối

## Usage Examples

### Creating a New User
```javascript
const user = new User({
  email: 'user@example.com',
  password: 'password123',
  role: 'student',
  fullName: 'John Doe'
});
await user.save();
```

### User Authentication
```javascript
const user = await User.findOne({ email });
if (user && await user.matchPassword(password)) {
  // Authentication successful
}
```

### Managing Refresh Tokens
```javascript
// Add new token
await user.addRefreshToken({
  token: 'refresh-token',
  device: 'mobile',
  ipAddress: '127.0.0.1'
});

// Revoke token
await user.revokeRefreshToken('refresh-token');
```

## Security Considerations
1. Passwords are automatically hashed using bcrypt
2. Refresh tokens are limited to 3 per user
3. Tokens automatically expire
4. Email verification required for full access
5. Password reset tokens expire after 1 hour 