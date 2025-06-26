# YouTube Video Upload Setup

Hệ thống Learning Management đã được tích hợp tính năng upload video từ máy tính lên YouTube. Để sử dụng tính năng này, bạn cần thiết lập YouTube Data API v3.

## 1. Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Enable YouTube Data API v3:
   - Vào **APIs & Services** > **Library**
   - Tìm kiếm "YouTube Data API v3"
   - Click **Enable**

## 2. Tạo OAuth 2.0 Credentials

1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Chọn **Web application**
4. Thêm domain của bạn vào **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://localhost:3000
   https://yourdomain.com
   ```
5. Thêm redirect URIs vào **Authorized redirect URIs**:
   ```
   http://localhost:5173
   http://localhost:3000
   https://yourdomain.com
   ```

## 3. Tạo API Key

1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API key**
3. (Tùy chọn) Restrict the key to YouTube Data API v3

## 4. Environment Variables

Thêm các biến môi trường sau vào file `.env`:

```env
# YouTube API Configuration
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
VITE_YOUTUBE_CLIENT_ID=your_youtube_oauth_client_id_here
```

## 5. Cách sử dụng

### Trong Announcement Editor

1. Click vào nút **"Upload Video"** trong toolbar
2. Chọn file video từ máy tính (tối đa 200MB)
3. Điền thông tin video:
   - **Title**: Tiêu đề video
   - **Description**: Mô tả video
   - **Tags**: Từ khóa (phân cách bằng dấu phẩy)
   - **Privacy**: Chế độ riêng tư (Unlisted/Private/Public)
4. Click **"Upload to YouTube"**
5. Đăng nhập YouTube nếu được yêu cầu
6. Chờ upload hoàn tất

### Quy trình Upload

1. **File Validation**: Kiểm tra định dạng và kích thước file
2. **YouTube Authentication**: Đăng nhập vào YouTube
3. **Metadata Setup**: Chuẩn bị thông tin video
4. **Resumable Upload**: Upload file theo chunks (1MB/chunk)
5. **Progress Tracking**: Hiển thị tiến độ upload
6. **Video Info Retrieval**: Lấy thông tin video sau khi upload
7. **Attachment Creation**: Thêm video vào announcement

## 6. Supported Video Formats

- MP4
- MOV
- AVI
- WMV
- FLV
- WebM
- 3GPP
- MPEG-PS

## 7. Limitations

- **File Size**: Tối đa 200MB cho tài khoản YouTube thường
- **Upload Quota**: Có giới hạn API quota hàng ngày
- **Video Processing**: YouTube cần thời gian xử lý video sau upload
- **Privacy**: Video mặc định là "Unlisted" để bảo mật lớp học

## 8. Troubleshooting

### Lỗi "Failed to sign in to YouTube"
- Kiểm tra OAuth Client ID
- Kiểm tra domain được authorize
- Đảm bảo popup không bị block

### Lỗi "Upload quota exceeded"
- Đợi 24h để quota reset
- Hoặc request tăng quota từ Google

### Lỗi "File too large"
- Giảm kích thước file xuống dưới 200MB
- Hoặc nâng cấp tài khoản YouTube

### Video không hiển thị sau upload
- Đợi YouTube xử lý video (1-10 phút)
- Kiểm tra privacy setting của video

## 9. Security Notes

- **API Key**: Chỉ để trong .env, không commit vào Git
- **Client ID**: Có thể public nhưng nên restrict domain
- **Video Privacy**: Mặc định "Unlisted" để bảo mật
- **User Consent**: Người dùng phải đồng ý chia sẻ YouTube access

## 10. Development vs Production

### Development
```env
VITE_YOUTUBE_API_KEY=dev_api_key
VITE_YOUTUBE_CLIENT_ID=dev_client_id
```

### Production
```env
VITE_YOUTUBE_API_KEY=prod_api_key
VITE_YOUTUBE_CLIENT_ID=prod_client_id
```

Đảm bảo setup OAuth credentials riêng cho từng environment. 