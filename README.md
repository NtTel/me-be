
# Asking.vn - Nền tảng Hỏi đáp Mẹ & Bé và Giáo dục sớm

**Asking.vn** là một ứng dụng web cao cấp (Premium Web App) dành cho cộng đồng Mẹ & Bé tại Việt Nam.

---

## 👑 Hướng dẫn Quản trị (Admin)

Mặc định, tất cả tài khoản đăng ký mới đều là **Thành viên (User)**. Để truy cập trang Admin (`/admin`), bạn cần cấp quyền thủ công trong Firebase Console.

### Cách cấp quyền Admin:
1. Truy cập [Firebase Console](https://console.firebase.google.com/) -> **Firestore Database**.
2. Chọn collection `users`.
3. Tìm document của user bạn muốn cấp quyền (dựa theo ID hoặc Email).
4. Thêm một field mới:
   - Field: `isAdmin`
   - Type: `boolean`
   - Value: `true`
5. Quay lại ứng dụng và truy cập đường dẫn `/admin`.

---

## 🛠 QUAN TRỌNG: Cấu hình Bảo mật Firebase (Security Rules)

Để các tính năng **Trả lời**, **Thông báo**, **Tin nhắn**, **Đăng ảnh**, **Admin** và **Sinh dữ liệu giả (Seed)** hoạt động, bạn **BẮT BUỘC** phải cập nhật Firestore Rules và Storage Rules trên Firebase Console.

### 1. Cập nhật Firestore Rules (Database)
Truy cập [Firebase Console](https://console.firebase.google.com/) -> **Firestore Database** -> **Rules**.
Copy và thay thế toàn bộ bằng đoạn mã sau:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // --- Helper Functions ---
    function isSignedIn() { 
      return request.auth != null; 
    }
    
    function isOwner(userId) { 
      return isSignedIn() && request.auth.uid == userId; 
    }
    
    // Kiểm tra quyền Admin bằng cách đọc document user hiện tại
    function isAdmin() {
      return isSignedIn() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // --- Users Collection ---
    match /users/{userId} {
      allow read: if true;
      // QUAN TRỌNG: Cho phép Admin tạo/xóa user để chạy tính năng Seed Data
      allow create: if isOwner(userId) || isAdmin(); 
      allow update, delete: if isOwner(userId) || isAdmin(); 
    }

    // --- Questions Collection ---
    match /questions/{questionId} {
      allow read: if true;
      // Admin được phép tạo câu hỏi hộ người khác (Seed Data)
      allow create: if isSignedIn();
      // Admin được phép ẩn/xóa bài vi phạm
      allow update: if isSignedIn() || isAdmin(); 
      allow delete: if isOwner(resource.data.author.id) || isAdmin();
    }

    // --- Notifications Collection ---
    match /notifications/{notificationId} {
      allow read, update: if isOwner(resource.data.userId);
      allow create: if isSignedIn();
    }

    // --- Chats Collection ---
    match /chats/{chatId} {
      // Cho phép update nếu là người tham gia HOẶC admin (để xóa/quản lý nếu cần)
      // Lưu ý: create dùng request.resource.data để kiểm tra participants
      allow create: if isSignedIn();
      allow read: if isSignedIn() && (request.auth.uid in resource.data.participants);
      allow update: if isSignedIn() && (request.auth.uid in resource.data.participants);
      
      match /messages/{messageId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn();
      }
    }
    
    // --- Expert Applications (Dành cho Admin duyệt) ---
    match /expert_applications/{appId} {
      allow create: if isSignedIn();
      // Chỉ user tạo đơn mới xem được đơn của mình, hoặc Admin xem tất cả
      allow read: if isOwner(resource.data.userId) || isAdmin();
      // Chỉ Admin mới được update trạng thái (Duyệt/Từ chối)
      allow update: if isAdmin();
    }

    // --- Reports ---
    match /reports/{reportId} {
      allow create: if isSignedIn();
      allow read, update: if isAdmin();
    }
  }
}
```

### 2. Cập nhật Storage Rules (Upload Ảnh)
Truy cập [Firebase Console](https://console.firebase.google.com/) -> **Storage** -> **Rules**.

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      // Cho phép ghi nếu đã đăng nhập và file là ảnh < 5MB
      allow write: if request.auth != null 
                   && request.resource.contentType.matches('image/.*')
                   && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

---

## 🧪 Hướng dẫn Sinh Dữ liệu Giả (Seed Data)

Tính năng này giúp tạo nhanh dữ liệu mẫu để kiểm thử giao diện.

1. Đăng nhập bằng tài khoản có quyền **Admin**.
2. Truy cập menu **Admin** -> chọn **Sinh dữ liệu (Demo)** hoặc vào đường dẫn `/admin/seed`.
3. Nhấn **"Bắt đầu sinh Data"**. Hệ thống sẽ tự động:
   - Tạo 50 người dùng giả (Avatar, Tên tiếng Việt ngẫu nhiên).
   - Tạo các câu hỏi mẫu theo chủ đề (Mang thai, Dinh dưỡng...).
   - Tự động tạo câu trả lời qua lại giữa các user giả.
4. Để xóa dữ liệu: Nhấn **"Xóa toàn bộ Data giả"** (Chỉ xóa các dữ liệu có cờ `isFake=true`, không ảnh hưởng dữ liệu thật).

---

## 🚀 Cài đặt & Chạy (Local)

1.  **Cài đặt**:
    ```bash
    npm install
    ```

2.  **Cấu hình `.env`**:
    Tạo file `.env` ở thư mục gốc và điền thông tin:
    ```env
    VITE_API_KEY=AIzaSy... (Gemini API Key)
    VITE_FIREBASE_API_KEY=AIzaSy... (Firebase API Key)
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    VITE_FIREBASE_STORAGE_BUCKET=...
    VITE_FIREBASE_MESSAGING_SENDER_ID=...
    VITE_FIREBASE_APP_ID=...
    ```

3.  **Chạy dự án**:
    ```bash
    npm run dev
    ```
