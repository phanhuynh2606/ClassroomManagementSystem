# Google OAuth Setup cho YouTube Upload

## 🔧 Cách Thiết Lập Google Cloud Console

### **Bước 1: Tạo Project & Enable APIs**

1. **Vào Google Cloud Console**: https://console.cloud.google.com/
2. **Tạo Project mới** hoặc chọn project hiện có
3. **Enable APIs cần thiết**:
   - YouTube Data API v3
   - YouTube Analytics API (optional)

### **Bước 2: Tạo OAuth 2.0 Credentials**

1. **Vào APIs & Services → Credentials**
2. **Click "Create Credentials" → OAuth 2.0 Client ID**
3. **Chọn "Web application"**
4. **Cấu hình domains**:

```
Authorized JavaScript origins:
- http://localhost:5173
- http://localhost:3000  
- https://yourdomain.com

Authorized redirect URIs:
- http://localhost:5173
- http://localhost:3000
- https://yourdomain.com
```

### **Bước 3: Copy Credentials**

```bash
# Client ID (dạng: xxxxxx.apps.googleusercontent.com)
VITE_YOUTUBE_CLIENT_ID=your_client_id_here

# API Key 
VITE_YOUTUBE_API_KEY=your_api_key_here
```

## ⚠️ **FIX LỖI: OAuth App Verification**

### **🔴 Lỗi "access_denied" - App chưa được verify**

**Nguyên nhân**: Google chỉ cho phép owner và test users sử dụng unverified apps.

### **Giải Pháp 1: Thêm Test Users (Recommended cho Development)**

1. **Vào Google Cloud Console → APIs & Services → OAuth consent screen**
2. **Scroll xuống phần "Test users"**
3. **Click "ADD USERS"**
4. **Nhập email addresses của users cần test**:
   ```
   teacher1@gmail.com
   teacher2@gmail.com  
   student1@gmail.com
   admin@company.com
   ```
5. **Click "SAVE"**

**✅ Kết quả**: Các tài khoản này giờ có thể đăng nhập và upload video.

### **Giải Pháp 2: Submit for Verification (Production)**

**⚠️ LƯU Ý**: Chỉ cần thiết khi deploy production và muốn public access.

1. **Vào OAuth consent screen**
2. **Click "PUBLISH APP"**
3. **Submit for verification**:
   - App homepage
   - Privacy policy
   - Terms of service
   - App explanation video
   - Domain verification

**🕐 Thời gian**: 4-6 weeks để Google review.

### **Giải Pháp 3: Internal App (Cho Organizations)**

**Nếu đây là app nội bộ công ty/trường học**:

1. **Chọn "Internal" trong OAuth consent screen**
2. **Chỉ users trong organization domain có thể sử dụng**
3. **Không cần verification process**

## 🔐 **Authentication Flow**

### **Quan Trọng về Đăng Nhập:**

- ✅ **KHÔNG** cần đăng nhập bằng tài khoản tạo CLIENT_ID
- ✅ **CÓ THỂ** đăng nhập bằng **bất kỳ tài khoản Google nào** 
- ✅ Tài khoản đó chỉ cần có **YouTube channel** để upload
- ⚠️ **NHƯNG** app chưa verify chỉ cho phép **owner + test users**

### **Cách Hoạt Động:**

1. **User click "Upload Video"**
2. **Popup Google OAuth xuất hiện**
3. **User chọn tài khoản Google bất kỳ**
4. **Google kiểm tra tài khoản có YouTube channel không**
5. **Nếu có → Upload thành công**
6. **Nếu không → Yêu cầu tạo channel**

## 🛠️ **Fix Lỗi Phổ Biến**

### **Cross-Origin-Opener-Policy Error:**
```bash
# Nguyên nhân: Domain chưa được authorized
# Giải pháp: Thêm domain vào Google Cloud Console
```

### **Authentication Failed:**
```bash
# Nguyên nhân: Tài khoản không có YouTube channel
# Giải pháp: Tạo YouTube channel cho tài khoản đó
```

### **Access Denied - App Chưa Verify:**
```bash
# Nguyên nhân: Tài khoản không phải owner/test user
# Giải pháp: Thêm vào Test Users hoặc submit for verification
```

### **API Key Invalid:**
```bash
# Nguyên nhân: API Key sai hoặc chưa enable API
# Giải pháp: Kiểm tra lại API Key và enable YouTube Data API v3
```

## 🔄 **Testing Setup**

### **Test Authentication:**
```javascript
// Trong Browser Console
await youtubeAPI.signIn()
// Kết quả: true (nếu thành công)
```

### **Test API Key:**
```javascript
// Test YouTube Data API
fetch(`https://www.googleapis.com/youtube/v3/videos?id=dQw4w9WgXcQ&key=YOUR_API_KEY&part=snippet`)
  .then(r => r.json())
  .then(console.log)
```

## 📝 **Environment Variables Template**

```bash
# ===== YOUTUBE API CONFIG =====
VITE_YOUTUBE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
VITE_YOUTUBE_API_KEY=AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567

# ===== DEVELOPMENT =====
VITE_YOUTUBE_CLIENT_ID=dev_client_id
VITE_YOUTUBE_API_KEY=dev_api_key

# ===== PRODUCTION =====  
VITE_YOUTUBE_CLIENT_ID=prod_client_id
VITE_YOUTUBE_API_KEY=prod_api_key
```

## 🚀 **Best Practices**

1. **Development vs Production**: Sử dụng credentials khác nhau
2. **Security**: Không commit credentials vào Git
3. **Domains**: Always update authorized domains khi deploy
4. **Permissions**: Chỉ request permissions cần thiết
5. **Error Handling**: Always có fallback cho authentication failures
6. **Test Users**: Add all developers/testers vào test user list
7. **Verification**: Only submit for verification khi ready for public access

## 🔗 **Useful Links**

- [Google Cloud Console](https://console.cloud.google.com/)
- [YouTube Data API Docs](https://developers.google.com/youtube/v3)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
- [OAuth Verification Process](https://support.google.com/cloud/answer/9110914) 