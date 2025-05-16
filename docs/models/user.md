# User Model

## Mô tả
Model User quản lý thông tin người dùng trong hệ thống, bao gồm học viên, giáo viên và admin.

## Schema

### Thông tin cơ bản
- `username`: Tên đăng nhập (unique, required)
- `email`: Email (unique, required)
- `password`: Mật khẩu (đã được mã hóa)
- `role`: Vai trò ('admin', 'teacher', 'student')
- `image`: Ảnh đại diện

### Thông tin cá nhân
- `fullName`: Họ và tên
- `phone`: Số điện thoại
- `dateOfBirth`: Ngày sinh
- `gender`: Giới tính ('male', 'female', 'other')

### Trạng thái và bảo mật
- `isActive`: Trạng thái hoạt động
- `lastLogin`: Lần đăng nhập cuối
- `emailVerified`: Xác thực email
- `verificationToken`: Token xác thực email
- `verificationTokenExpire`: Thời hạn token xác thực
- `resetPasswordToken`: Token đặt lại mật khẩu
- `resetPasswordExpire`: Thời hạn token đặt lại mật khẩu

### Refresh Tokens
- `refreshTokens`: Danh sách refresh token
  - `token`: Chuỗi token
  - `device`: Thiết bị đăng nhập
  - `ipAddress`: Địa chỉ IP
  - `userAgent`: Thông tin trình duyệt
  - `createdAt`: Thời gian tạo
  - `expiresAt`: Thời gian hết hạn
  - `isRevoked`: Trạng thái vô hiệu hóa
  - `revokedAt`: Thời gian vô hiệu hóa

## Methods
- `matchPassword`: So sánh mật khẩu
- `addRefreshToken`: Thêm refresh token mới
- `revokeRefreshToken`: Vô hiệu hóa một token
- `revokeAllRefreshTokens`: Vô hiệu hóa tất cả token

## Indexes
- `username`: Tìm kiếm theo tên đăng nhập
- `email`: Tìm kiếm theo email
- `role`: Tìm kiếm theo vai trò
- `isActive`: Tìm kiếm theo trạng thái
- `email, role`: Tìm kiếm kết hợp
- `username, isActive`: Tìm kiếm kết hợp
- `refreshTokens.token`: Tìm kiếm theo token

## Middleware
- Tự động mã hóa mật khẩu trước khi lưu 