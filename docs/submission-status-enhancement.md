# Admin Dashboard - Submission Status Enhancement

## Tổng quan cập nhật

Đã cải thiện phần tính toán và hiển thị trạng thái submission để phản ánh chính xác hơn tình trạng nộp bài của học sinh, bao gồm cả trường hợp hệ thống tự chấm điểm.

## Thay đổi Backend

### 1. Cải thiện tính toán `submissionStatusData`

**Trước đây**: Chỉ dựa vào field `status` đơn giản
```javascript
{ $eq: ["$_id", "submitted"] }, then: "Đúng hạn"
{ $eq: ["$_id", "late"] }, then: "Trễ hạn"  
{ $eq: ["$_id", "missing"] }, then: "Chưa nộp"
```

**Bây giờ**: Logic phức tạp hơn dựa trên assignment model thực:
```javascript
// Đã nộp đúng hạn (submitted và không late)
{ 
  case: { 
    $and: [
      { $eq: ["$submissions.status", "submitted"] },
      { $lte: ["$submissions.submittedAt", "$dueDate"] }
    ]
  }, 
  then: "Đúng hạn" 
},
// Nộp trễ (late hoặc submitted sau due date)
{ 
  case: { 
    $or: [
      { $eq: ["$submissions.status", "late"] },
      { 
        $and: [
          { $eq: ["$submissions.status", "submitted"] },
          { $gt: ["$submissions.submittedAt", "$dueDate"] }
        ]
      }
    ]
  }, 
  then: "Trễ hạn" 
},
// Đã chấm điểm (graded) - phân biệt tự động và thủ công
{ 
  case: { $eq: ["$submissions.status", "graded"] }, 
  then: {
    $cond: {
      if: { $ifNull: ["$submissions.submittedAt", false] },
      then: "Đã chấm điểm",
      else: "Không nộp (Tự chấm)"
    }
  }
},
// Pending - chưa nộp
{ 
  case: { $eq: ["$submissions.status", "pending"] }, 
  then: "Chưa nộp" 
}
```

### 2. Thêm `assignmentOverview` statistics

Thêm thống kê tổng quan về assignments:
```javascript
const assignmentStats = await Assignment.aggregate([
  {
    $project: {
      totalSubmissions: { $size: "$submissions" },
      submittedCount: {
        $size: {
          $filter: {
            input: "$submissions",
            cond: { $in: ["$$this.status", ["submitted", "graded", "late"]] }
          }
        }
      },
      gradedCount: {
        $size: {
          $filter: {
            input: "$submissions",
            cond: { $eq: ["$$this.status", "graded"] }
          }
        }
      },
      autoGradedCount: {
        $size: {
          $filter: {
            input: "$submissions",
            cond: { 
              $and: [
                { $eq: ["$$this.status", "graded"] },
                { $eq: [{ $ifNull: ["$$this.submittedAt", null] }, null] }
              ]
            }
          }
        }
      }
    }
  }
]);
```

## Thay đổi Frontend

### 1. Cải thiện Submission Status Chart

**Màu sắc mới**:
- Đúng hạn: `#52c41a` (xanh lá)
- Trễ hạn: `#faad14` (vàng cam)  
- Chưa nộp: `#f5222d` (đỏ)
- Đã chấm điểm: `#1890ff` (xanh dương)
- Không nộp (Tự chấm): `#722ed1` (tím)

**Tooltip cải thiện**:
```javascript
tooltip: {
  title: (datum) => `📊 ${datum.type}`,
  items: [
    (datum) => ({
      color: /* dynamic color based on type */,
      name: '📈 Số lượng',
      value: `${datum.value} submissions`,
    }),
  ],
}
```

### 2. Thêm Assignment Overview Section

**Các thống kê hiển thị**:
- **Tổng bài tập**: Số lượng assignment tổng cộng
- **Có thể nộp**: Tổng số submission có thể có (assignments × students)
- **Đã nộp**: Số submission thực tế đã nộp
- **Đã chấm**: Số submission đã được chấm điểm
- **Tự chấm**: Số submission được hệ thống tự chấm (hiển thị khi > 0)
- **Tỷ lệ nộp**: Phần trăm submission được nộp so với tổng có thể

**Design**:
- Grid layout responsive (6 columns trên desktop, adaptive trên mobile)
- Gradient background cho mỗi card
- Color coding theo loại thống kê

### 3. State Management Update

Thêm `assignmentOverview` vào dashboard state:
```javascript
const [dashboardData, setDashboardData] = useState({
  // ... existing fields
  assignmentOverview: {},
  // ...
});
```

## API Response Update

### Endpoint: `GET /api/admin/dashboard-stats`

**Thêm fields mới**:
```json
{
  "success": true,
  "data": {
    // ... existing fields
    "submissionStatusData": [
      {"type": "Đúng hạn", "value": 150},
      {"type": "Trễ hạn", "value": 25},
      {"type": "Chưa nộp", "value": 30},
      {"type": "Đã chấm điểm", "value": 45},
      {"type": "Không nộp (Tự chấm)", "value": 12}
    ],
    "assignmentOverview": {
      "totalAssignments": 25,
      "totalPossibleSubmissions": 500,
      "totalActualSubmissions": 375,
      "totalGradedSubmissions": 320,
      "totalAutoGradedSubmissions": 12
    }
  }
}
```

## Lợi ích của cập nhật

### 1. Độ chính xác cao hơn
- Phân biệt rõ ràng các trạng thái submission
- Hiển thị chính xác trường hợp hệ thống tự chấm điểm
- Tính toán dựa trên dueDate thực tế

### 2. Thông tin chi tiết hơn
- Thống kê tổng quan về assignment performance
- Tỷ lệ nộp bài của học sinh
- Số lượng bài được tự chấm bởi hệ thống

### 3. UI/UX tốt hơn
- Color coding trực quan cho các trạng thái
- Layout responsive
- Tooltip information rich

### 4. Hỗ trợ quản lý tốt hơn
- Admin có thể nhanh chóng đánh giá tình trạng submissions
- Phát hiện các assignment có tỷ lệ nộp thấp
- Theo dõi hiệu quả của chính sách auto-grading

## Tương lai có thể mở rộng

1. **Submission Trends**: Chart theo thời gian của submission rates
2. **Assignment Performance**: Top/bottom performing assignments
3. **Auto-grading Analytics**: Thống kê chi tiết về auto-grading
4. **Late Submission Patterns**: Phân tích pattern nộp trễ của học sinh
5. **Grade Distribution**: Phân bố điểm số của các submissions
