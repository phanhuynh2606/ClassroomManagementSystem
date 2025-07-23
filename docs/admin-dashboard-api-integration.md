# Admin Dashboard - API Integration Documentation

## Tổng quan
Dashboard Admin đã được tích hợp với API thực để hiển thị dữ liệu từ cơ sở dữ liệu thay vì sử dụng mock data.

## Thay đổi Backend

### 1. Admin Controller (`admin.controller.js`)

#### Cập nhật imports:
```javascript
const Material = require("../models/material.model");
```

#### Cập nhật phần tính toán `totalStorage`:
- **Trước**: Sử dụng giá trị cố định `2048 MB`
- **Sau**: Tính toán thực từ:
  - Materials (file tài liệu)
  - Assignment attachments (file đính kèm bài tập)
  - Submission attachments (file nộp bài của học sinh)

```javascript
// Tính tổng dung lượng từ Materials và Assignment attachments/submissions
const materialStorageResult = await Material.aggregate([
  { $match: { deleted: { $ne: true } } },
  { $group: { _id: null, totalSize: { $sum: "$fileSize" } } }
]);

const assignmentAttachmentsStorage = await Assignment.aggregate([
  { $match: { deleted: { $ne: true } } },
  { $unwind: { path: "$attachments", preserveNullAndEmptyArrays: true } },
  { $group: { _id: null, totalSize: { $sum: "$attachments.fileSize" } } }
]);

const submissionAttachmentsStorage = await Assignment.aggregate([
  { $match: { deleted: { $ne: true } } },
  { $unwind: { path: "$submissions", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$submissions.attachments", preserveNullAndEmptyArrays: true } },
  { $group: { _id: null, totalSize: { $sum: "$submissions.attachments.fileSize" } } }
]);
```

#### Cải thiện dữ liệu trả về:
- **Recent Activities**: Tăng số lượng và cải thiện format thời gian
- **User Role Data**: Chuyển đổi từ English sang tiếng Việt
- **Gender Data**: Chuyển đổi từ English sang tiếng Việt và tính phần trăm
- **Age Distribution**: Cải thiện format và tính phần trăm
- **User Growth**: Format tên tháng tiếng Việt
- **Submission Status**: Chuyển đổi status sang tiếng Việt
- **Login Data**: Thêm dữ liệu đăng nhập theo ngày trong tuần

## Thay đổi Frontend

### 1. Admin Dashboard Component (`AdminDashboard.jsx`)

#### Thêm state management:
```javascript
const [loading, setLoading] = useState(true);
const [dashboardData, setDashboardData] = useState({...});
```

#### Thêm API integration:
```javascript
const fetchDashboardData = async () => {
  try {
    setLoading(true);
    const response = await adminAPI.getDashboardStats();
    if (response.data.success) {
      setDashboardData(response.data.data);
    }
  } catch (error) {
    message.error('Có lỗi xảy ra khi tải dữ liệu');
  } finally {
    setLoading(false);
  }
};
```

#### Thêm loading state:
```javascript
if (loading) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Spin size="large" />
    </div>
  );
}
```

#### Cải thiện hiển thị dung lượng:
```javascript
const formatStorageSize = (sizeInMB) => {
  if (sizeInMB < 1) {
    return `${Math.round(sizeInMB * 1024)} KB`;
  } else if (sizeInMB < 1024) {
    return `${sizeInMB.toFixed(2)} MB`;
  } else {
    return `${(sizeInMB / 1024).toFixed(2)} GB`;
  }
};
```

#### Cập nhật Recent Activities:
- Sử dụng dữ liệu thực từ API
- Cải thiện format thời gian với `formatTimeAgo()`
- Dynamic icons và colors dựa trên activity type

#### Cập nhật Charts:
- User Role Distribution: Sử dụng dữ liệu thực
- Gender Distribution: Sử dụng dữ liệu thực với phần trăm
- Age Distribution: Sử dụng dữ liệu thực với phần trăm  
- User Growth: Sử dụng dữ liệu thực theo tháng
- Submission Status: Sử dụng dữ liệu thực
- Login Activity: Sử dụng dữ liệu từ API (có thể mở rộng với dữ liệu thật)

## API Endpoints

### GET `/api/admin/dashboard-stats`
**Headers**: Authorization: Bearer {admin_token}

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalClassrooms": 25,
    "totalAssignments": 80,
    "totalQuizzes": 100,
    "totalQuestions": 500,
    "totalStorage": 2048.75,
    "recentActivities": [...],
    "userRoleData": [...],
    "genderData": [...],
    "ageDistributionData": [...],
    "userGrowthData": [...],
    "verifiedData": [...],
    "submissionStatusData": [...],
    "loginData": [...]
  }
}
```

## File kiểm tra

### 1. `test-dashboard-api.js`
Script để test API endpoint trực tiếp

### 2. `test-storage-calculation.js`  
Script để test phần tính toán storage trong MongoDB

## Cách chạy

1. Khởi động server:
```bash
cd server
npm start
```

2. Khởi động client:
```bash
cd client  
npm start
```

3. Truy cập admin dashboard với tài khoản admin để xem dữ liệu thực

## Lưu ý

- Dashboard sẽ hiển thị loading state khi đang tải dữ liệu
- Nếu API lỗi, sẽ hiển thị thông báo lỗi và sử dụng dữ liệu mặc định
- Dung lượng storage được tính từ tất cả file trong hệ thống (materials, assignment attachments, submission files)
- Dữ liệu được cập nhật real-time mỗi khi component mount
