
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file object to upload
 * @param folder The folder path in storage (e.g., 'question_images' or 'expert_docs')
 * @returns Promise<string> The public download URL
 */
export const uploadFile = async (file: File, folder: string): Promise<string> => {
  if (!storage) {
    console.error("Storage not initialized");
    return "";
  }

  try {
    // Sanitize filename to avoid special characters issues
    // Format: timestamp_random_cleanName
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
    const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${sanitizedName}`;
    
    // Create reference. Note: simple concatenation works for root folders.
    // If folder implies user structure, it should be passed in 'folder' arg (e.g., 'expert_docs/uid123')
    const storageRef = ref(storage, `${folder}/${uniqueName}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the URL
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
    // Filter out any empty strings if upload failed silently
    return urls.filter(url => url !== "");
  } catch (error) {
    console.error("Error uploading multiple files:", error);
    throw error;
  }
};
