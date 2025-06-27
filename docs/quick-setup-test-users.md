# 🚀 Quick Setup: Add Test Users cho YouTube Upload

## ⚡ **Bước Setup Nhanh (5 phút)**

### **🔥 Nếu users bị lỗi "access_denied":**

1. **Vào Google Cloud Console**: https://console.cloud.google.com/
2. **Chọn project đang sử dụng**
3. **Vào: APIs & Services → OAuth consent screen**
4. **Scroll xuống phần "Test users"**
5. **Click "ADD USERS"**
6. **Nhập emails cần thêm** (mỗi email một dòng):
   ```
   teacher1@gmail.com
   teacher2@gmail.com
   student1@gmail.com
   admin@company.com
   phanhuynhyb68@gmail.com
   ```
7. **Click "SAVE"**

### **✅ Kết Quả:**
- Users này giờ có thể đăng nhập và upload video
- Không còn lỗi "access_denied"
- App hoạt động bình thường

## 🔧 **Các Cách Khác:**

### **Option 1: Publish App (Không Recommend)**
- Click "PUBLISH APP" → Mọi người đều có thể dùng
- ⚠️ **Rủi ro**: Google có thể suspend app nếu không comply policy

### **Option 2: Internal App (Cho Organizations)**
- Chọn "Internal" → Chỉ users trong domain organization
- ✅ **Tốt cho**: Trường học, công ty có G Suite/Workspace

### **Option 3: Submit for Verification (Production)**
- Submit app để Google verify (4-6 weeks)
- ✅ **Cần cho**: Public production apps

## 🆘 **Troubleshooting:**

### **"Không tìm thấy OAuth consent screen":**
1. Vào APIs & Services → OAuth consent screen  
2. Chọn User Type: "External"
3. Fill thông tin cơ bản và Save

### **"Test users section không hiện":**
1. Đảm bảo đã chọn "External" user type
2. Complete OAuth consent screen setup
3. Refresh page

### **"User vẫn bị access_denied sau khi add":**
1. Đảm bảo email chính xác (case-sensitive)
2. User cần sign out khỏi Google và sign in lại
3. Clear browser cache

## 📧 **Template Email cho Users:**

```
Subject: YouTube Upload Access - Learning Management System

Xin chào,

Tài khoản của bạn đã được thêm vào danh sách test users cho tính năng YouTube upload.

Để sử dụng:
1. Vào hệ thống Learning Management
2. Chọn classroom 
3. Click "Upload Video"
4. Đăng nhập bằng email Google này: [EMAIL]
5. Upload video thành công!

Lưu ý: Nếu bạn đã đăng nhập Google trước đó, hãy sign out và sign in lại.

Cảm ơn!
```

## 🎯 **Quick Commands:**

```bash
# List current test users (không có command trực tiếp, phải check trên UI)

# Recommended emails to add for development:
- Developers: dev1@gmail.com, dev2@gmail.com
- Teachers: teacher1@gmail.com, teacher2@gmail.com  
- Students: student1@gmail.com, student2@gmail.com
- Admins: admin@company.com, support@company.com
```

---
**💡 Pro tip**: Add tất cả developers và key users vào test list ngay từ đầu để tránh interruption! 