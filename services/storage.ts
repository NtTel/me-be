import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig"; // Đảm bảo đường dẫn đúng tới file firebase.ts của bạn

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 */
export const uploadFile = async (file: File, folder: string): Promise<string> => {
  if (!storage) {
    console.error("Storage not initialized");
    return "";
  }

  try {
    // 1. Tạo tên file an toàn
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
    const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${sanitizedName}`;
    
    // 2. Tạo reference
    const storageRef = ref(storage, `${folder}/${uniqueName}`);
    
    // 3. THÊM METADATA (QUAN TRỌNG)
    // Giúp trình duyệt biết đây là ảnh (image/png) hay pdf để hiển thị đúng thay vì bắt tải về
    const metadata = {
      contentType: file.type, 
    };

    // 4. Upload file kèm metadata
    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    // 5. Lấy URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

/**
 * Upload multiple files concurrently
 */
export const uploadMultipleFiles = async (files: File[], folder: string): Promise<string[]> => {
  if (!files || files.length === 0) return [];
  
  try {
    const uploadPromises = files.map(file => uploadFile(file, folder));
    const urls = await Promise.all(uploadPromises);
    return urls.filter(url => url !== "");
  } catch (error) {
    console.error("Error uploading multiple files:", error);
    throw error;
  }
};
