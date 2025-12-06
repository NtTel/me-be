
# Asking.vn - Nền tảng Hỏi đáp Mẹ & Bé và Giáo dục sớm

**Asking.vn** là một ứng dụng web cao cấp (Premium Web App) dành cho cộng đồng Mẹ & Bé tại Việt Nam.

---

## 🛠 QUAN TRỌNG: Hướng dẫn Khắc phục Lỗi "Missing permissions"

Nếu bạn gặp lỗi khi **Đăng câu hỏi có ảnh** hoặc **Gửi câu trả lời**, nguyên nhân là do Security Rules trên Firebase chưa khớp với code.

Hãy làm theo các bước sau để cập nhật Rules:

### 1. Cập nhật Firestore Rules (Database)
Truy cập [Firebase Console](https://console.firebase.google.com/) -> **Firestore Database** -> **Rules**.
Copy và thay thế toàn bộ bằng đoạn mã sau:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper Functions
    function isSignedIn() { return request.auth != null; }
    function isAdmin() { return isSignedIn() && exists(/databases/$(database)/documents/users/$(request.auth.uid)) && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }

    // Users Collection
    match /users/{userId} {
      allow read: if true;
      allow create: if isOwner(userId);
      // Cho phép User tự update thông tin nhưng cấm sửa trường admin/expert/points
      allow update: if isAdmin() || (isOwner(userId) && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['isAdmin', 'isExpert', 'points'])));
    }

    // Questions Collection
    match /questions/{questionId} {
      allow read: if true;
      allow create: if isSignedIn();
      
      // Cho phép Update nếu:
      // 1. Admin
      // 2. Tác giả (sửa nội dung)
      // 3. Người dùng khác (Thêm câu trả lời vào mảng 'answers', thả tim 'likes')
      allow update: if isAdmin() 
                    || (isSignedIn() && resource.data.author.id == request.auth.uid)
                    || (isSignedIn() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['answers', 'likes', 'views']));
                    
      allow delete: if isAdmin() || (isSignedIn() && resource.data.author.id == request.auth.uid);
    }
  }
}
```

### 2. Cập nhật Storage Rules (Upload Ảnh)
Truy cập [Firebase Console](https://console.firebase.google.com/) -> **Storage** -> **Rules**.
Copy và thay thế toàn bộ bằng đoạn mã sau:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Cho phép upload ảnh câu hỏi vào thư mục question_images
    match /question_images/{allPaths=**} {
      allow read: if true;
      // Cho phép ghi nếu đã đăng nhập và là file ảnh < 5MB
      allow write: if request.auth != null 
                   && request.resource.contentType.matches('image/.*')
                   && request.resource.size < 5 * 1024 * 1024;
    }
    
    // Hồ sơ chuyên gia (Bảo mật hơn)
    match /expert_docs/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Cài đặt & Chạy (Local)

1.  **Cài đặt**:
    ```bash
    npm install
    ```

2.  **Cấu hình `.env`**:
    ```env
    VITE_API_KEY=AIzaSy... (Gemini API Key)
    VITE_FIREBASE_API_KEY=AIzaSy... (Firebase API Key)
    # ... các biến Firebase khác
    ```

3.  **Chạy dự án**:
    ```bash
    npm run dev
    ```

## ☁️ Deploy lên Vercel
1.  Push code lên GitHub.
2.  Import vào Vercel.
3.  Cấu hình **Environment Variables** (VITE_API_KEY, VITE_FIREBASE_...).
4.  Deploy!

Nếu gặp lỗi trắng trang, hãy kiểm tra file `index.html` đã xóa thẻ `importmap` chưa.
