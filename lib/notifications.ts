import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from "firebase/firestore"

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  adminId: string;
  isRead: boolean;
  createdAt: any; // Firestore Timestamp
  link?: string;
  activityType?: 'jobseeker' | 'employer' | 'admin' | 'system';
  relatedUserId?: string;
}

// Define interface for Notifications related to Employers stored in adminNotifications
export interface EmployerRelatedNotification {
  id: string; // Document ID
  title: string;
  message: string;
  type: string; // Use string to be flexible with notification types
  createdAt: any; // Firestore Timestamp
  link?: string;
  relatedUserId: string; // The employer's user ID
  isRead: boolean; // Added isRead property
  // Include other fields from adminNotifications if needed
}

// Define interface for Employer Notifications to match the structure stored
export interface EmployerNotification {
  id: string;
  employerId: string;
  type: string;
  message: string;
  createdAt: any; // Firestore Timestamp
  // Add other fields if they are stored in the activyt_emp collection
}

/**
 * Add a notification for admin users
 * @param title Title of the notification
 * @param message Message content
 * @param type Type of notification (info, warning, success, error)
 * @param targetAdminId Specific admin ID or "all" for all admins
 * @param link Optional URL to navigate to when clicking the notification
 * @param activityType Type of activity being tracked
 * @param relatedUserId ID of the user related to this activity
 */
export const addAdminNotification = async (
  title: string, 
  message: string, 
  type: 'info' | 'warning' | 'success' | 'error' = 'info',
  targetAdminId: string = 'all',
  link?: string,
  activityType?: 'jobseeker' | 'employer' | 'admin' | 'system',
  relatedUserId?: string
) => {
  try {
    await addDoc(collection(db, "adminNotifications"), {
      title,
      message,
      type,
      adminId: targetAdminId,
      isRead: false,
      createdAt: serverTimestamp(),
      link,
      activityType: activityType || 'admin',
      relatedUserId
    })
    return true
  } catch (error) {
    console.error("Error adding notification:", error)
    return false
  }
}

// EMPLOYER ACTIVITIES

/**
 * Create a notification when a new employer registers
 * @param employerName Name of the employer
 * @param employerId ID of the employer
 */
export const notifyNewEmployerRegistration = async (employerName: string, employerId: string) => {
  return addAdminNotification(
    "New Employer Registration",
    `${employerName} has registered as an employer and needs verification.`,
    "info",
    "all",
    `/admin/users/${employerId}`,
    'employer',
    employerId
  )
}

/**
 * Create a notification when a job is posted
 * @param jobTitle Title of the job
 * @param companyName Company that posted the job
 * @param jobId ID of the job
 * @param employerId ID of the employer
 */
export const notifyNewJobPosted = async (jobTitle: string, companyName: string, jobId: string, employerId: string) => {
  return addAdminNotification(
    "New Job Posted",
    `${companyName} posted a new job: ${jobTitle}`,
    "info",
    "all",
    `/admin/jobs/${jobId}`,
    'employer',
    employerId
  )
}

/**
 * Create a notification when an employer updates their profile
 * @param employerName Name of the employer
 * @param employerId ID of the employer
 */
export const notifyEmployerProfileUpdate = async (employerName: string, employerId: string) => {
  return addAdminNotification(
    "Employer Profile Updated",
    `${employerName} has updated their profile information.`,
    "info",
    "all",
    `/admin/users/${employerId}`,
    'employer',
    employerId
  )
}

/**
 * Create a notification when an employer uploads business documents
 * @param employerName Name of the employer
 * @param employerId ID of the employer
 */
export const notifyEmployerDocumentUpload = async (employerName: string, employerId: string) => {
  return addAdminNotification(
    "Business Verification Documents Uploaded",
    `${employerName} has uploaded business verification documents.`,
    "info",
    "all",
    `/admin/users/${employerId}`,
    'employer',
    employerId
  )
}

// JOBSEEKER ACTIVITIES

/**
 * Create a notification when a new jobseeker registers
 * @param jobseekerName Name of the jobseeker
 * @param jobseekerId ID of the jobseeker
 */
export const notifyNewJobseekerRegistration = async (jobseekerName: string, jobseekerId: string) => {
  return addAdminNotification(
    "New Jobseeker Registration",
    `${jobseekerName} has registered as a jobseeker.`,
    "info",
    "all",
    `/admin/users/${jobseekerId}`,
    'jobseeker',
    jobseekerId
  )
}

/**
 * Create a notification when a jobseeker applies for a job
 * @param jobseekerName Name of the jobseeker
 * @param jobseekerId ID of the jobseeker
 * @param jobTitle Title of the job
 * @param jobId ID of the job
 */
export const notifyNewJobApplication = async (
  jobseekerName: string, 
  jobseekerId: string, 
  jobTitle: string, 
  jobId: string
) => {
  return addAdminNotification(
    "New Job Application",
    `${jobseekerName} has applied for the job: ${jobTitle}`,
    "info",
    "all",
    `/admin/users/${jobseekerId}`,
    'jobseeker',
    jobseekerId
  )
}

/**
 * Create a notification when a jobseeker uploads a resume
 * @param jobseekerName Name of the jobseeker
 * @param jobseekerId ID of the jobseeker
 */
export const notifyResumeUpload = async (jobseekerName: string, jobseekerId: string) => {
  return addAdminNotification(
    "Resume Uploaded",
    `${jobseekerName} has uploaded a new resume.`,
    "info",
    "all",
    `/admin/users/${jobseekerId}`,
    'jobseeker',
    jobseekerId
  )
}

/**
 * Create a notification when a jobseeker updates their profile
 * @param jobseekerName Name of the jobseeker
 * @param jobseekerId ID of the jobseeker
 */
export const notifyJobseekerProfileUpdate = async (jobseekerName: string, jobseekerId: string) => {
  return addAdminNotification(
    "Jobseeker Profile Updated",
    `${jobseekerName} has updated their profile information.`,
    "info",
    "all",
    `/admin/users/${jobseekerId}`,
    'jobseeker',
    jobseekerId
  )
}

// SYSTEM NOTIFICATIONS

/**
 * Create a notification for system alerts
 * @param title Alert title
 * @param message Alert message
 */
export const notifySystemAlert = async (title: string, message: string) => {
  return addAdminNotification(
    title,
    message,
    "warning",
    "all",
    undefined,
    'system'
  )
}

/**
 * Add an activity for an employer
 * @param employerId The ID of the employer
 * @param type The type of activity (application, approval, info)
 * @param message The activity message
 * @param metadata Optional metadata related to the activity (e.g., changes)
 */
export const addEmployerActivity = async (employerId: string, type: string, message: string, metadata: Record<string, any> = {}) => {
  try {
    // Add to activity_log_all collection
    await addDoc(collection(db, "activity_log_all"), {
      userId: employerId,
      type,
      description: message,
      timestamp: serverTimestamp(),
      metadata: {
        role: "employer"
      }
    })

    // Add to activity_emp collection
    await addDoc(collection(db, "activity_emp"), {
      employerId,
      type,
      message,
      createdAt: serverTimestamp(),
      metadata
    })

    return true
  } catch (error) {
    console.error("Error adding employer activity:", error)
    return false
  }
}

/**
 * Fetch notifications for a specific employer
 * @param employerId The ID of the employer
 * @returns A promise resolving to an array of EmployerRelatedNotification
 */
export const getEmployerNotifications = async (employerId: string): Promise<EmployerRelatedNotification[]> => {
  try {
    // Use employernotifications collection instead of adminNotifications
    const notificationsRef = collection(db, "employernotifications");
    const q = query(
      notificationsRef,
      where("employerId", "==", employerId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const notificationsList = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "Notification",
        message: data.message || "",
        type: data.type || "system",
        createdAt: data.createdAt,
        link: data.link || null,
        relatedUserId: employerId, // Map to match interface
        isRead: data.isRead || false
      } as EmployerRelatedNotification;
    });
    
    console.log(`Fetched ${notificationsList.length} notifications for employer ${employerId}`);
    return notificationsList;
    
  } catch (error) {
    console.error("Error fetching employer notifications:", error);
    throw error;
  }
} 