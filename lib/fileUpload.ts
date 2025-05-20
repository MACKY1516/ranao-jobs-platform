// File upload utility for handling local file storage
import { updateUserProfile, updateCompanyProfile } from './users';

/**
 * Saves a file to local storage and returns the file path
 * 
 * @param file The file to save
 * @param userId The user ID for creating unique file paths
 * @param fileType Type of file (logo, coverImage, profilePhoto, resume)
 * @returns The file path where the file is saved
 */
export async function saveFileLocally(file: File, userId: string, fileType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a unique filename
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${fileType}_${userId}_${timestamp}.${fileExtension}`;
      
      // Read the file as DataURL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) {
          reject(new Error("Failed to read file"));
          return;
        }
        
        // Store the DataURL in localStorage to persist across sessions
        const fileDataUrl = event.target.result as string;
        
        // Store in localStorage with a key
        const storageKey = `file_${fileType}_${userId}`;
        localStorage.setItem(storageKey, fileDataUrl);
        
        // Return the storage key as the file path
        resolve(fileDataUrl);
      };
      
      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };
      
      // Start reading the file as DataURL
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error saving file locally:", error);
      reject(new Error("Failed to save file locally"));
    }
  });
}

/**
 * Upload employer logo and save path to Firestore
 * 
 * @param file The logo file
 * @param userId The employer's user ID
 * @returns Promise that resolves when the update is complete
 */
export async function uploadEmployerLogo(file: File, userId: string): Promise<string> {
  try {
    // Save file locally
    const filePath = await saveFileLocally(file, userId, 'logo');
    
    // Update profile in Firestore with the file path
    await updateCompanyProfile(userId, {
      logo: filePath
    });
    
    return filePath;
  } catch (error) {
    console.error("Error uploading logo:", error);
    throw new Error("Failed to upload logo");
  }
}

/**
 * Upload employer cover image and save path to Firestore
 * 
 * @param file The cover image file
 * @param userId The employer's user ID
 * @returns Promise that resolves when the update is complete
 */
export async function uploadEmployerCoverImage(file: File, userId: string): Promise<string> {
  try {
    // Save file locally
    const filePath = await saveFileLocally(file, userId, 'coverImage');
    
    // Update profile in Firestore with the file path
    await updateCompanyProfile(userId, {
      coverImage: filePath
    });
    
    return filePath;
  } catch (error) {
    console.error("Error uploading cover image:", error);
    throw new Error("Failed to upload cover image");
  }
}

/**
 * Upload jobseeker profile photo and save path to Firestore
 * 
 * @param file The profile photo file
 * @param userId The jobseeker's user ID
 * @returns Promise that resolves when the update is complete
 */
export async function uploadJobseekerPhoto(file: File, userId: string): Promise<string> {
  try {
    // Save file locally
    const filePath = await saveFileLocally(file, userId, 'profilePhoto');
    
    // Update profile in Firestore with the file path
    await updateUserProfile(userId, {
      profilePhoto: filePath
    });
    
    return filePath;
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    throw new Error("Failed to upload profile photo");
  }
}

/**
 * Upload jobseeker resume and save path to Firestore
 * 
 * @param file The resume file
 * @param userId The jobseeker's user ID
 * @returns Promise that resolves when the update is complete
 */
export async function uploadJobseekerResume(file: File, userId: string): Promise<string> {
  try {
    // Save file locally
    const filePath = await saveFileLocally(file, userId, 'resume');
    
    // Import here to avoid circular dependency
    const { notifyResumeUpload } = await import('./notifications');
    
    // Get user info from local storage
    const storedUser = localStorage.getItem("ranaojobs_user");
    const userName = storedUser ? JSON.parse(storedUser).name || 'A jobseeker' : 'A jobseeker';
    
    // Update profile in Firestore with the file path
    await updateUserProfile(userId, {
      resume: filePath,
      resumeFileName: file.name,
      resumeUpdatedAt: new Date().toISOString()
    });
    
    // Create notification
    await notifyResumeUpload(userName, userId);
    
    return filePath;
  } catch (error) {
    console.error("Error uploading resume:", error);
    throw new Error("Failed to upload resume");
  }
} 