# 🚀 Assignment Scheduler - Automatic Publishing System

## Overview

Hệ thống LMS hiện đã có tính năng **tự động xuất bản bài tập đã lên lịch** khi đến thời gian `publishDate`. Điều này đảm bảo assignments sẽ tự động hiển thị cho học sinh đúng thời gian mà giáo viên đã thiết lập.

## 🎯 Features

### ✅ Đã triển khai:

1. **Cron Job Scheduler**
   - Chạy mỗi phút để kiểm tra assignments cần publish
   - Tự động chuyển từ `'scheduled'` → `'published'`
   - Tạo stream entry khi publish
   - Log chi tiết để theo dõi

2. **Real-time Middleware**
   - Kiểm tra khi user truy cập assignments
   - Publish ngay lập tức nếu đã đến thời gian
   - Áp dụng cho cả list và detail views

3. **Cleanup Scheduler**
   - Chạy hàng ngày lúc nửa đêm
   - Tự động publish các assignments quá hạn lịch (>24h)
   - Tránh assignments bị "kẹt" ở trạng thái scheduled

4. **Quiz Support**
   - Tương tự assignments, quizzes cũng được auto-publish

## 🔧 Technical Implementation

### Files Added/Modified:

```
📁 server/
├── 📦 package.json                    (+ node-cron dependency)
├── 🚀 server.js                       (+ start schedulers)
├── ⚡ utils/scheduler.js               (+ new file)
├── 🛡️ middleware/assignment.middleware.js (+ auto-publish functions)
└── 🛣️ routes/assignment.route.js      (+ middleware integration)
```

### Core Functions:

1. **`startAssignmentScheduler()`**
   ```javascript
   // Runs every minute: '* * * * *'
   // Finds assignments where:
   // - visibility === 'scheduled'
   // - publishDate <= now
   // - deleted === false
   // - isActive === true
   ```

2. **`checkScheduledAssignments()`**
   ```javascript
   // Middleware that runs on assignment list requests
   // Provides instant publishing on user access
   ```

3. **`checkSingleAssignment()`**
   ```javascript
   // Middleware for assignment detail views
   // Publishes specific assignment if ready
   ```

## 📊 Logging & Monitoring

### Console Output Examples:

```bash
🚀 Assignment Scheduler started - checking every minute
📅 Found 2 assignments ready to publish
✅ Auto-published assignment: "Math Homework 1" in Class A
✅ Auto-published assignment: "Science Lab 2" in Class B
⚡ Real-time published: "History Essay" in Class C
🧹 Found 1 expired scheduled assignments
🔄 Auto-published expired assignment: "Late Assignment"
```

### Log Patterns:
- `🚀` Scheduler start
- `📅` Bulk auto-publish (cron)
- `⚡` Real-time publish (middleware)
- `🧹` Cleanup operations
- `✅` Success operations
- `❌` Error operations

## ⚙️ Configuration

### Cron Schedule Options:

```javascript
// Current: Every minute (development)
'* * * * *'

// Production recommendation: Every 5 minutes
'*/5 * * * *'

// Conservative: Every 15 minutes
'*/15 * * * *'
```

### Environment Variables:

```env
# Optional: Override cron schedule
ASSIGNMENT_SCHEDULER_INTERVAL=*/5 * * * *

# Optional: Disable scheduler (for testing)
DISABLE_SCHEDULER=false
```

## 🎮 Usage Flow

### For Teachers:

1. **Create Scheduled Assignment**
   ```
   Title: "Midterm Essay"
   Due Date: 2024-01-20 23:59
   Publish Date: 2024-01-15 08:00  ← Future time
   Visibility: "scheduled"
   ```

2. **Automatic Publishing**
   - At 2024-01-15 08:00 → Assignment becomes visible to students
   - Stream entry created automatically
   - Email notifications sent (if implemented)

### For Students:

1. **Before Publish Time**
   - Assignment not visible in list
   - Cannot access assignment detail
   - Status shows "Scheduled"

2. **After Publish Time**
   - Assignment appears in list
   - Can view details and submit
   - Status shows "Published"

## 🚨 Edge Cases Handled

### 1. **Server Downtime**
- Real-time middleware catches missed schedules
- Next user access triggers publish

### 2. **Clock Drift**
- Database timestamps used for accuracy
- Timezone-aware comparisons

### 3. **Concurrent Access**
- Safe MongoDB operations
- Duplicate prevention logic

### 4. **Failed Publishing**
- Error logging without breaking system
- Individual assignment failures don't affect others

## 🧪 Testing

### Manual Test:

1. **Create Test Assignment**
   ```javascript
   publishDate: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
   ```

2. **Verify Auto-Publishing**
   - Check console logs after 2 minutes
   - Refresh assignment list
   - Confirm visibility change

### Database Check:

```javascript
// Find scheduled assignments
db.assignments.find({ 
  visibility: 'scheduled', 
  publishDate: { $lte: new Date() } 
})

// Find auto-published assignments
db.assignments.find({ 
  visibility: 'published',
  publishDate: { $exists: true }
})
```

## 🔮 Future Enhancements

### Possible Additions:

1. **Email Notifications**
   - Notify students when assignments are published
   - Reminder emails before due dates

2. **Teacher Dashboard**
   - View scheduled assignments
   - Modify publish times
   - Cancel scheduled publishing

3. **Batch Operations**
   - Bulk schedule multiple assignments
   - Template-based scheduling

4. **Analytics**
   - Track publishing performance
   - Student engagement metrics

5. **Time Zone Support**
   - User-specific time zones
   - Automatic DST handling

## ⚠️ Important Notes

### Production Considerations:

1. **Performance**
   - Cron job queries are indexed
   - Minimal database load
   - Consider scaling for large datasets

2. **Reliability**
   - Graceful error handling
   - Non-blocking operations
   - Fallback mechanisms

3. **Maintenance**
   - Monitor logs for errors
   - Adjust cron frequency as needed
   - Regular database cleanup

### Security:

1. **Access Control**
   - Only teachers can create scheduled assignments
   - Students cannot see unpublished content
   - Proper authorization checks

2. **Data Integrity**
   - Atomic operations
   - Consistent state management
   - Rollback on failures

## 📞 Support & Troubleshooting

### Common Issues:

1. **Assignments not auto-publishing**
   - Check server logs for errors
   - Verify cron job is running
   - Confirm publishDate format

2. **Duplicate stream entries**
   - Check for middleware conflicts
   - Review error logs
   - Verify database constraints

3. **Performance issues**
   - Monitor database query performance
   - Consider index optimization
   - Adjust cron frequency

### Debug Commands:

```bash
# Check current scheduled assignments
curl -X GET /api/assignments/scheduled

# Force run scheduler manually
curl -X POST /api/admin/force-publish

# View scheduler status
curl -X GET /api/admin/scheduler-status
```

---

## 🎉 Conclusion

Hệ thống auto-publishing đã hoàn chỉnh và sẵn sàng sử dụng! Giáo viên có thể tạo assignments trước và lên lịch xuất bản tự động, giúp quản lý thời gian hiệu quả hơn.

**🚀 Ready to go! Install dependencies and restart server to activate.** 