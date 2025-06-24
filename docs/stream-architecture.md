# Stream Architecture Documentation

## Tổng quan

Stream là tính năng trung tâm của classroom, hiển thị tất cả hoạt động và nội dung theo thời gian thực. Hệ thống Stream được thiết kế để:

- Hiển thị tất cả announcements, assignments, materials, quizzes theo timeline
- Hỗ trợ comments và tương tác
- Tự động tạo activity logs khi có hoạt động trong classroom
- Quản lý permissions và visibility

## Cấu trúc Models

### 1. Stream Model (`stream.model.js`)

Model chính quản lý tất cả stream items.

#### Các loại Stream Items:
- **announcement**: Thông báo từ giáo viên
- **assignment**: Bài tập (link đến Assignment model)
- **material**: Tài liệu (link đến Material model)  
- **quiz**: Bài kiểm tra (link đến Quiz model)
- **activity**: Hoạt động hệ thống (student join, submission, etc.)

#### Key Fields:
```javascript
{
  title: String,           // Tiêu đề
  content: String,         // Nội dung chính
  type: String,           // Loại: announcement, assignment, material, quiz, activity
  classroom: ObjectId,     // Ref to Classroom
  author: ObjectId,        // Ref to User (tác giả)
  resourceId: ObjectId,    // Ref đến resource gốc (assignment/material/quiz)
  resourceModel: String,   // Model name: 'Assignment', 'Material', 'Quiz'
  attachments: [Object],   // File đính kèm
  dueDate: Date,          // Hạn nộp (cho assignment/quiz)
  totalPoints: Number,     // Điểm số
  commentsCount: Number,   // Số comments
  pinned: Boolean,        // Ghim bài đăng
  status: String,         // draft, published, archived, deleted
  publishAt: Date         // Thời gian publish
}
```

#### Static Methods:
- `getClassroomStream(classroomId, options)`: Lấy stream của classroom
- `createAnnouncement(data)`: Tạo announcement
- `createActivity(classroomId, authorId, activityType, activityData)`: Tạo activity

### 2. Comment Model (`comment.model.js`)

Model quản lý comments cho stream items.

#### Features:
- Nested comments (reply) với tối đa 3 levels
- Like/Unlike comments
- Edit history tracking
- Report system
- Soft delete

#### Key Fields:
```javascript
{
  content: String,         // Nội dung comment
  author: ObjectId,        // Ref to User
  streamItem: ObjectId,    // Ref to Stream
  parentComment: ObjectId, // Ref to parent Comment (cho reply)
  replyTo: ObjectId,      // Ref to User được reply
  level: Number,          // Mức độ nested (0-3)
  replyCount: Number,     // Số replies
  likeCount: Number,      // Số likes
  likedBy: [Object],      // Users đã like
  isEdited: Boolean,      // Đã được edit
  editHistory: [Object]   // Lịch sử edit
}
```

#### Static Methods:
- `getStreamComments(streamItemId, options)`: Lấy comments của stream item
- `getCommentReplies(parentCommentId, options)`: Lấy replies của comment
- `createComment(data)`: Tạo comment mới
- `createReply(data)`: Tạo reply

### 3. Stream Middleware (`stream.middleware.js`)

Middleware tự động tạo stream entries khi có CRUD operations trên Assignment, Material, Quiz.

#### Functions:
- **Assignment Middleware**: Tự động tạo/update/delete stream entry khi assignment thay đổi
- **Material Middleware**: Tự động tạo/update/delete stream entry khi material thay đổi  
- **Quiz Middleware**: Tự động tạo/update/delete stream entry khi quiz thay đổi
- **Activity Middleware**: Tạo activity entries cho các hành động như:
  - Student join/leave classroom
  - Assignment submission
  - Quiz completion
  - Material upload

## Workflow

### 1. Tạo Assignment mới:
```
1. Teacher tạo Assignment → Assignment.save()
2. Assignment middleware trigger → tạo Stream entry tự động
3. Stream entry hiển thị trong classroom timeline
4. Students có thể comment trên stream entry
```

### 2. Student join classroom:
```
1. Student join classroom → Classroom.students.push()
2. Activity middleware trigger → tạo Activity stream entry
3. Activity hiển thị "Student X joined the class"
```

### 3. Post Announcement:
```
1. Teacher post announcement → Stream.createAnnouncement()
2. Stream entry được tạo với type='announcement'
3. Announcement hiển thị trong timeline
4. Students có thể comment
```

## Database Indexes

### Stream Model Indexes:
- `{ classroom: 1, publishAt: -1, status: 1 }` - Main stream query
- `{ classroom: 1, type: 1, publishAt: -1 }` - Filter by type
- `{ classroom: 1, pinned: -1, publishAt: -1 }` - Pinned posts first

### Comment Model Indexes:
- `{ streamItem: 1, createdAt: -1 }` - Get comments for stream item
- `{ streamItem: 1, parentComment: 1, createdAt: 1 }` - Nested comments
- `{ streamItem: 1, status: 1, isActive: 1 }` - Active comments only

## API Endpoints (Suggested)

### Stream APIs:
```
GET    /api/classroom/:id/stream           - Get classroom stream
POST   /api/classroom/:id/announcements   - Create announcement
GET    /api/stream/:id                     - Get stream item detail
PUT    /api/stream/:id                     - Update stream item
DELETE /api/stream/:id                     - Delete stream item
POST   /api/stream/:id/pin                 - Pin/unpin stream item
```

### Comment APIs:
```
GET    /api/stream/:id/comments            - Get stream comments
POST   /api/stream/:id/comments            - Create comment
GET    /api/comments/:id/replies           - Get comment replies
POST   /api/comments/:id/replies           - Create reply
PUT    /api/comments/:id                   - Edit comment
DELETE /api/comments/:id                   - Delete comment
POST   /api/comments/:id/like              - Like/unlike comment
```

## Best Practices

### 1. Performance:
- Sử dụng pagination cho stream queries
- Cache stream data cho classrooms có nhiều hoạt động
- Lazy load comments (chỉ load khi cần)

### 2. Security:
- Validate permissions trước khi tạo/edit stream items
- Kiểm tra classroom membership cho comments
- Rate limiting cho comment creation

### 3. Data Consistency:
- Sử dụng transactions khi tạo stream entries
- Middleware đảm bảo đồng bộ giữa models
- Cleanup orphaned comments khi delete stream items

### 4. User Experience:
- Real-time updates với WebSocket
- Optimistic UI updates
- Rich text support cho content
- File attachment handling

## Example Usage

### Tạo Announcement:
```javascript
const announcement = await Stream.createAnnouncement({
  title: "Welcome to Programming Class",
  content: "Please check the syllabus...",
  classroom: classroomId,
  author: teacherId,
  attachments: [{ name: "syllabus.pdf", url: "..." }]
});
```

### Lấy Stream với Pagination:
```javascript
const streamItems = await Stream.getClassroomStream(classroomId, {
  page: 1,
  limit: 20,
  type: null // All types
});
```

### Tạo Comment:
```javascript
const comment = await Comment.createComment({
  content: "Great explanation!",
  author: studentId,
  streamItem: streamItemId
});
```

### Tạo Reply:
```javascript
const reply = await Comment.createReply({
  content: "Thank you!",
  author: teacherId,
  streamItem: streamItemId,
  parentComment: commentId,
  replyTo: studentId,
  level: 1
});
```

## Migration Strategy

Nếu đã có data existing:

1. **Tạo Stream và Comment collections**
2. **Migrate existing data**: Tạo stream entries cho assignments/materials/quizzes hiện có
3. **Apply middleware**: Thêm middleware vào existing models
4. **Update frontend**: Sử dụng stream APIs thay vì query riêng lẻ
5. **Test thoroughly**: Đảm bảo data consistency

---

*Thiết kế này đảm bảo tính mở rộng, hiệu suất và trải nghiệm người dùng tốt cho tính năng Stream.* 