# Video Tracking Feature - Hướng dẫn sử dụng

## 🎯 Tổng quan

Tính năng Video Tracking cho phép hệ thống theo dõi tiến độ xem video của người dùng, lưu vị trí dừng và tự động tiếp tục từ vị trí đã dừng khi mở lại video.

## ✨ Tính năng chính

### 1. Theo dõi tiến độ xem
- **Tự động lưu vị trí**: Lưu vị trí hiện tại của video mỗi 15 giây
- **Lưu khi pause**: Cập nhật tiến độ ngay lập tức khi người dùng tạm dừng
- **Lưu khi seek**: Cập nhật vị trí khi người dùng tua video
- **Lưu khi đóng**: Sử dụng `sendBeacon` và `fetch` với `keepalive` để đảm bảo lưu dữ liệu

### 2. Resume từ vị trí cũ
- Khi mở lại video, tự động tiếp tục từ vị trí đã dừng
- Hiển thị thông báo "Resuming from [time]"
- Hoạt động cho cả YouTube videos và uploaded videos

### 3. Tracking lượt views
- **Điều kiện đếm view**: Xem ít nhất 30 giây HOẶC 25% độ dài video
- **Tránh spam**: Mỗi người dùng chỉ được đếm 1 view cho mỗi video
- **Analytics**: Giáo viên có thể xem thống kê lượt view và tiến độ của học sinh

## 🔧 Cách hoạt động

### Backend Structure
```javascript
// Video Watch Model trong MongoDB
{
  user: ObjectId,           // ID người dùng
  videoId: String,          // YouTube ID hoặc video ID
  videoType: 'youtube'|'uploaded',  // Loại video
  classroom: ObjectId,      // ID lớp học
  
  // Progress tracking
  currentTime: Number,      // Vị trí hiện tại (giây)
  duration: Number,         // Tổng thời lượng (giây)
  progressPercent: Number,  // Phần trăm đã xem
  
  // View tracking
  isViewCounted: Boolean,   // Đã đếm view chưa
  isCompleted: Boolean,     // Đã hoàn thành chưa (>90%)
  
  // Session tracking
  sessions: [...]           // Chi tiết từng session xem
}
```

### API Endpoints
- `POST /api/video-watch/start` - Bắt đầu session xem
- `PUT /api/video-watch/progress/:watchId` - Cập nhật tiến độ  
- `POST /api/video-watch/end/:watchId` - Kết thúc session
- `GET /api/video-watch/analytics/:classroomId/:videoId` - Thống kê

## 📱 Cách sử dụng

### Test tính năng
Truy cập `/teacher/video-demo` để test với video YouTube mẫu:

1. **Bước 1**: Click "Play Video" trên video bất kỳ
2. **Bước 2**: Xem vài giây, pause hoặc tua video
3. **Bước 3**: Đóng modal bằng cách click "Close"
4. **Bước 4**: Mở lại video - sẽ tiếp tục từ vị trí đã dừng
5. **Bước 5**: Xem >30 giây hoặc >25% để được đếm view

### Sử dụng trong code

#### Cho YouTube Videos
```jsx
<VideoPlayerModal
  visible={true}
  videoData={{
    id: 'dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ', 
    title: 'Video Title',
    url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'video/youtube',
    duration: '3:33'  // MM:SS format
  }}
  classroomId="classroom-id"
  streamItemId="stream-item-id"
  onCancel={() => {}}
/>
```

#### Cho Uploaded Videos
```jsx
<VideoPlayerModal
  visible={true}
  videoData={{
    id: 'uploaded-video-id',
    title: 'Video Title', 
    url: 'https://example.com/video.mp4',
    type: 'video',
    duration: 213  // seconds
  }}
  classroomId="classroom-id"
  streamItemId="stream-item-id"
  onCancel={() => {}}
/>
```

## 🛠️ Thay đổi đã thực hiện

### 1. Frontend Components
- **VideoPlayerModal.jsx**: Sử dụng EnhancedVideoPlayer cho cả YouTube và uploaded videos
- **EnhancedVideoPlayer.jsx**: Thêm logic tracking hoàn chỉnh
- **videoWatch.api.js**: API client cho tracking

### 2. Backend Updates
- **videoWatch.controller.js**: Xử lý sendBeacon requests
- **server.js**: Thêm middleware cho text/plain content-type
- **videoWatch.model.js**: Model tracking với session management

### 3. Demo Page
- **VideoTrackingDemo.jsx**: Page test tính năng
- **Route**: `/teacher/video-demo`

## 🔍 Workflow hoàn chỉnh

```
1. User clicks play video
   ↓
2. startWatching API: Tạo/lấy watch record
   ↓ 
3. Nếu có vị trí cũ → auto seek đến vị trí đó
   ↓
4. Trong quá trình xem:
   - Update progress mỗi 15s
   - Update ngay khi pause/seek
   ↓
5. Khi đóng modal/trang:
   - sendBeacon/fetch lưu vị trí cuối
   ↓
6. Lần sau mở video:
   - Resume từ vị trí đã lưu
```

## 💡 Lưu ý

- **YouTube Duration**: Parse từ "MM:SS" thành seconds
- **Reliability**: sendBeacon + fetch keepalive backup
- **Performance**: Update 15s interval, immediate on pause/seek  
- **Error Handling**: Video vẫn hoạt động nếu tracking failed

Tính năng này nâng cao trải nghiệm học tập và cung cấp insights hữu ích cho giáo viên! 