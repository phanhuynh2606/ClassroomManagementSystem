# Google OAuth Setup Guide

## Hướng dẫn thiết lập Google OAuth cho Online Classroom

### 1. Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Đảm bảo billing đã được bật cho project

### 2. Bật Google+ API

1. Trong Google Cloud Console, đi tới **APIs & Services** > **Library**
2. Tìm kiếm "Google+ API" hoặc "Google Identity"
3. Click vào "Google+ API" và bật nó

### 3. Tạo OAuth 2.0 Credentials

1. Đi tới **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Chọn application type: **Web application**
4. Đặt tên cho OAuth client
5. Thêm authorized origins:
   - `http://localhost:5173` (cho development)
   - `https://yourdomain.com` (cho production)
6. Thêm authorized redirect URIs:
   - `http://localhost:5173` (cho development)
   - `https://yourdomain.com` (cho production)

### 4. Cấu hình Environment Variables

#### Server (.env)
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

#### Client (.env)
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 5. Lưu ý bảo mật

- **KHÔNG** commit Google Client Secret vào git
- Sử dụng environment variables cho production
- Giữ Client ID và Client Secret an toàn
- Chỉ thêm domain tin cậy vào authorized origins

### 6. Testing

1. Khởi động server: `npm run dev` (trong thư mục server)
2. Khởi động client: `npm run dev` (trong thư mục client)
3. Truy cập `http://localhost:5173/login`
4. Click nút "Sign in with Google"
5. Đăng nhập với tài khoản Google của bạn

### 7. Troubleshooting

#### Lỗi "redirect_uri_mismatch"
- Kiểm tra authorized redirect URIs trong Google Console
- Đảm bảo URL chính xác (bao gồm cả protocol http/https)

#### Lỗi "invalid_client"
- Kiểm tra GOOGLE_CLIENT_ID trong .env files
- Đảm bảo client ID chính xác

#### Lỗi "access_blocked"
- Kiểm tra OAuth consent screen configuration
- Đảm bảo app được verify nếu cần thiết

### 8. Production Deployment

Khi deploy lên production:

1. Cập nhật authorized origins và redirect URIs với domain production
2. Cấu hình environment variables trên hosting platform
3. Đảm bảo HTTPS được bật
4. Test Google OAuth trên production environment

### 9. User Data Handling

Google OAuth sẽ cung cấp:
- Email
- Full name
- Profile picture
- Google ID

Thông tin này được lưu trong database và sử dụng để tạo tài khoản user.
