import { db } from "@/lib/firebase"
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  limit,
  Timestamp,
  increment
} from "firebase/firestore"
import { addAdminNotification, addEmployerActivity } from "@/lib/notifications"

export interface JobPosting {
  id?: string
  title: string
  company: string
  location: string
  city: string
  coordinates: [number, number]
  type: string
  category: string
  salary: string
  description: string
  requirements: string
  benefits: string
  applicationDeadline: string
  contactEmail: string
  contactPhone: string
  remote: boolean
  featured: boolean
  urgent: boolean
  employerId: string
  companyName: string
  createdAt?: any
  updatedAt?: any
  isActive?: boolean
  applicationsCount?: number
}

/**
 * Add a new job posting to Firestore
 * @param jobData The job posting data
 * @returns The ID of the newly created job posting
 */
export async function addJobPosting(jobData: Omit<JobPosting, "id" | "createdAt" | "updatedAt" | "isActive" | "applicationsCount">): Promise<string> {
  try {
    // Add timestamp and status
    const jobWithMetadata = {
      ...jobData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true, // Immediately active
      applicationsCount: 0
    }
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, "jobs"), jobWithMetadata)
    
    return docRef.id
  } catch (error) {
    console.error("Error adding job posting:", error)
    throw new Error("Failed to add job posting")
  }
}

/**
 * Update an existing job posting
 * @param jobId The ID of the job posting to update
 * @param jobData The updated job data
 */
export async function updateJobPosting(jobId: string, jobData: Partial<JobPosting>): Promise<void> {
  try {
    const jobRef = doc(db, "jobs", jobId)
    
    // Add updated timestamp
    const updatedData = {
      ...jobData,
      updatedAt: serverTimestamp()
    }
    
    await updateDoc(jobRef, updatedData)
  } catch (error) {
    console.error("Error updating job posting:", error)
    throw new Error("Failed to update job posting")
  }
}

/**
 * Delete a job posting
 * @param jobId The ID of the job posting to delete
 */
export async function deleteJobPosting(jobId: string): Promise<void> {
  try {
    // Get job data before deleting to get employerId and title
    const jobSnapshot = await getDoc(doc(db, "jobs", jobId));
    if (!jobSnapshot.exists()) {
      throw new Error("Job not found");
    }
    const jobData = jobSnapshot.data();
    const employerId = jobData.employerId;
    const jobTitle = jobData.title;

    const jobRef = doc(db, "jobs", jobId);
    await deleteDoc(jobRef);

    // Add activity for the employer
    if (employerId) {
      await addEmployerActivity(
        employerId,
        "info", // Or perhaps a new type like "job_deleted"
        `You deleted your job posting: ${jobTitle}`
      );
    }

  } catch (error) {
    console.error("Error deleting job posting:", error);
    throw new Error("Failed to delete job posting")
  }
}

/**
 * Get a job posting by ID
 * @param jobId The ID of the job posting to retrieve
 * @returns The job posting data
 */
export async function getJobPosting(jobId: string): Promise<JobPosting | null> {
  try {
    const jobRef = doc(db, "jobs", jobId)
    const jobDoc = await getDoc(jobRef)
    
    if (!jobDoc.exists()) {
      return null
    }
    
    return {
      id: jobDoc.id,
      ...jobDoc.data()
    } as JobPosting
  } catch (error) {
    console.error("Error getting job posting:", error)
    throw new Error("Failed to get job posting")
  }
}

/**
 * Get all job postings by an employer
 * @param employerId The ID of the employer
 * @returns An array of job postings
 */
export async function getEmployerJobPostings(employerId: string): Promise<JobPosting[]> {
  try {
    const jobsQuery = query(
      collection(db, "jobs"),
      where("employerId", "==", employerId),
      orderBy("createdAt", "desc")
    )
    
    const querySnapshot = await getDocs(jobsQuery)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as JobPosting))
  } catch (error) {
    console.error("Error getting employer job postings:", error)
    throw new Error("Failed to get employer job postings")
  }
}

/**
 * Toggle the active status of a job posting
 * @param jobId The ID of the job posting
 * @param isActive The new active status
 */
export async function toggleJobStatus(jobId: string, isActive: boolean): Promise<void> {
  try {
    const jobRef = doc(db, "jobs", jobId);

    // Get job data before updating to get employerId and title
    const jobSnapshot = await getDoc(doc(db, "jobs", jobId));
    if (!jobSnapshot.exists()) {
      throw new Error("Job not found");
    }
    const jobData = jobSnapshot.data();
    const employerId = jobData.employerId;
    const jobTitle = jobData.title;
    const status = isActive ? "activated" : "deactivated";

    await updateDoc(jobRef, {
      isActive,
      updatedAt: serverTimestamp()
    });

    // Add activity for the employer
    if (employerId) {
      await addEmployerActivity(
        employerId,
        "info", // Or perhaps a new type like "job_status_change"
        `Your job posting for ${jobTitle} has been ${status}.`
      );
    }

  } catch (error) {
    console.error("Error toggling job status:", error);
    throw new Error("Failed to toggle job status")
  }
}

/**
 * Get recent job postings
 * @param limitCount Number of job postings to retrieve
 * @returns An array of job postings
 */
export async function getRecentJobPostings(limitCount: number = 10): Promise<JobPosting[]> {
  try {
    const jobsQuery = query(
      collection(db, "jobs"),
      where("isActive", "==", true),
      where("verificationStatus", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    )
    
    const querySnapshot = await getDocs(jobsQuery)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as JobPosting))
  } catch (error) {
    console.error("Error getting recent job postings:", error)
    throw new Error("Failed to get recent job postings")
  }
}

/**
 * Increment the applications count for a job posting
 * @param jobId The ID of the job posting
 */
export async function incrementJobApplicationsCount(jobId: string): Promise<void> {
  try {
    const jobRef = doc(db, "jobs", jobId)
    
    // Get the current job data
    const jobDoc = await getDoc(jobRef)
    if (!jobDoc.exists()) {
      throw new Error("Job posting not found")
    }
    
    const jobData = jobDoc.data()
    const currentCount = jobData.applicationsCount || 0
    
    // Increment the count
    await updateDoc(jobRef, {
      applicationsCount: currentCount + 1,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error("Error incrementing applications count:", error)
    throw new Error("Failed to increment applications count")
  }
}

/**
 * Decrement the applications count for a job posting
 * @param jobId The ID of the job posting
 */
export async function decrementJobApplicationsCount(jobId: string): Promise<void> {
  try {
    const jobRef = doc(db, "jobs", jobId)
    
    // Get the current job data
    const jobDoc = await getDoc(jobRef)
    if (!jobDoc.exists()) {
      throw new Error("Job posting not found")
    }
    
    const jobData = jobDoc.data()
    const currentCount = jobData.applicationsCount || 0
    
    // Ensure count doesn't go below zero
    const newCount = Math.max(0, currentCount - 1)
    
    // Decrement the count
    await updateDoc(jobRef, {
      applicationsCount: newCount,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error("Error decrementing applications count:", error)
    throw new Error("Failed to decrement applications count")
  }
}

/**
 * Create a new job posting
 * @param jobData The job posting data
 * @param employerId The ID of the employer creating the job
 * @returns The ID of the created job
 */
export async function createJob(jobData: any, employerId: string): Promise<string> {
  try {
    // Get employer info
    const employerRef = doc(db, "users", employerId)
    const employerSnap = await getDoc(employerRef)
    
    if (!employerSnap.exists()) {
      throw new Error("Employer not found")
    }
    
    const employerData = employerSnap.data()
    
    // Create job with verification status as pending
    const jobRef = await addDoc(collection(db, "jobs"), {
      ...jobData,
      employerId,
      companyName: employerData.companyName || "Unknown Company",
      companyLogo: employerData.logo || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "pending", // Jobs start as pending until approved by admin
      verificationStatus: "pending", // Add verification status
      applicationCount: 0,
      viewCount: 0,
      active: true,
    })
    
    // Increment job count for employer
    await updateDoc(employerRef, {
      jobCount: increment(1)
    })
    
    // Notify admin about new job posting requiring verification
    await addAdminNotification(
      "New Job Verification Required",
      `New job posting "${jobData.title}" by ${employerData.companyName} requires verification.`,
      "info",
      "all",
      `/admin/jobs/verification/${jobRef.id}`,
      "employer",
      employerId
    )

    // Add activity for the employer
    await addEmployerActivity(
      employerId,
      "job_post",
      `You posted a new job: ${jobData.title}`,
      {
        jobId: jobRef.id,
        jobTitle: jobData.title,
        jobType: jobData.type,
        jobCategory: jobData.category,
        salary: jobData.salary
      }
    )
    
    return jobRef.id
  } catch (error) {
    console.error("Error creating job:", error)
    throw new Error("Failed to create job posting")
  }
}

/**
 * Get a job posting by ID
 * @param jobId The ID of the job to retrieve
 * @returns The job posting data
 */
export async function getJob(jobId: string): Promise<any> {
  try {
    const jobRef = doc(db, "jobs", jobId)
    const jobSnap = await getDoc(jobRef)
    
    if (!jobSnap.exists()) {
      throw new Error("Job not found")
    }
    
    return {
      id: jobSnap.id,
      ...jobSnap.data(),
    }
  } catch (error) {
    console.error("Error fetching job:", error)
    throw new Error("Failed to get job posting")
  }
}

/**
 * Admin function to approve a job posting
 * @param jobId The ID of the job to approve
 * @param adminId The ID of the admin who approved the job
 */
export async function approveJob(jobId: string, adminId: string): Promise<void> {
  try {
    const jobRef = doc(db, "jobs", jobId)
    const jobSnap = await getDoc(jobRef)
    
    if (!jobSnap.exists()) {
      throw new Error("Job not found")
    }
    
    const jobData = jobSnap.data()
    
    // Update job with approved status
    await updateDoc(jobRef, {
      verificationStatus: "approved",
      verifiedAt: serverTimestamp(),
      verifiedBy: adminId,
      updatedAt: serverTimestamp()
    })
    
    // Also notify the employer that their job was approved
    const employerRef = doc(db, "users", jobData.employerId)
    const employerSnap = await getDoc(employerRef)
    
    if (employerSnap.exists()) {
      // Get employer data for notification
      const employerData = employerSnap.data()
      
      // Add notification for the specific employer
      await addAdminNotification(
        "Job Posting Approved",
        `Your job posting "${jobData.title}" has been approved and is now visible to job seekers.`,
        "success",
        employerData.id,
        `/employer/jobs/${jobId}`,
        "admin",
        adminId
      )

      // Add activity for the employer's activity feed
      await addEmployerActivity(
        jobData.employerId,
        "approval",
        `Your job posting for ${jobData.title} has been approved.`
      )
    }
  } catch (error) {
    console.error("Error approving job:", error)
    throw new Error("Failed to approve job posting")
  }
}

/**
 * Admin function to reject a job posting
 * @param jobId The ID of the job to reject
 * @param adminId The ID of the admin who rejected the job
 * @param reason The reason for rejection
 */
export async function rejectJob(jobId: string, adminId: string, reason: string): Promise<void> {
  try {
    const jobRef = doc(db, "jobs", jobId)
    const jobSnap = await getDoc(jobRef)
    
    if (!jobSnap.exists()) {
      throw new Error("Job not found")
    }
    
    const jobData = jobSnap.data()
    
    // Update job with rejected status and reason
    await updateDoc(jobRef, {
      verificationStatus: "rejected",
      rejectedAt: serverTimestamp(),
      rejectedBy: adminId,
      rejectionReason: reason,
      updatedAt: serverTimestamp(),
      active: false // Automatically deactivate rejected jobs
    })
    
    // Notify the employer that their job was rejected
    const employerRef = doc(db, "users", jobData.employerId)
    const employerSnap = await getDoc(employerRef)
    
    if (employerSnap.exists()) {
      // Get employer data for notification
      const employerData = employerSnap.data()
      
      // Add notification for the specific employer
      await addAdminNotification(
        "Job Posting Rejected",
        `Your job posting "${jobData.title}" has been rejected. Reason: ${reason}`,
        "error",
        employerData.id,
        `/employer/jobs/${jobId}`,
        "admin",
        adminId
      )
    }
  } catch (error) {
    console.error("Error rejecting job:", error)
    throw new Error("Failed to reject job posting")
  }
}

/**
 * Get all jobs that require verification by admin
 * @returns Array of pending job verifications
 */
export async function getPendingJobVerifications(): Promise<any[]> {
  try {
    const jobsQuery = query(
      collection(db, "jobs"),
      where("verificationStatus", "==", "pending"),
      orderBy("createdAt", "desc")
    )
    
    const jobsSnap = await getDocs(jobsQuery)
    return jobsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error("Error fetching pending job verifications:", error)
    throw new Error("Failed to fetch pending job verifications")
  }
}

/**
 * Get all verified jobs (approved and rejected)
 * @returns Array of verified job postings
 */
export async function getVerifiedJobs(status?: 'approved' | 'rejected'): Promise<any[]> {
  try {
    let jobsQuery;
    
    if (status) {
      // Filter by specific status (approved or rejected)
      jobsQuery = query(
        collection(db, "jobs"),
        where("verificationStatus", "==", status),
        orderBy("verifiedAt", "desc")
      )
    } else {
      // Get all verified jobs (both approved and rejected)
      jobsQuery = query(
        collection(db, "jobs"),
        where("verificationStatus", "in", ["approved", "rejected"]),
        orderBy("updatedAt", "desc")
      )
    }
    
    const jobsSnap = await getDocs(jobsQuery)
    return jobsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error("Error fetching verified jobs:", error)
    throw new Error("Failed to fetch verified jobs")
  }
}

/**
 * Search for job postings by keywords
 * @param searchQuery The search query
 * @param filters Optional filters (category, location, jobType)
 * @returns Array of matching job postings
 */
export async function searchJobs(
  searchQuery: string, 
  filters?: { 
    category?: string, 
    location?: string, 
    jobType?: string 
  }
): Promise<JobPosting[]> {
  try {
    // Start with base query that only includes approved jobs
    let jobsQuery = query(
      collection(db, "jobs"),
      where("isActive", "==", true),
      where("verificationStatus", "==", "approved"),
      orderBy("createdAt", "desc")
    )
    
    // Get all approved, active jobs
    const querySnapshot = await getDocs(jobsQuery)
    
    // Perform client-side filtering for search query and other filters
    let results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as JobPosting[]
    
    // Filter by search query (search in title, description, company name)
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/)
      
      results = results.filter(job => {
        const titleMatches = searchTerms.some(term => 
          job.title?.toLowerCase().includes(term)
        )
        
        const descriptionMatches = searchTerms.some(term => 
          job.description?.toLowerCase().includes(term)
        )
        
        const companyMatches = searchTerms.some(term => 
          job.companyName?.toLowerCase().includes(term)
        )
        
        return titleMatches || descriptionMatches || companyMatches
      })
    }
    
    // Apply additional filters
    if (filters) {
      if (filters.category) {
        results = results.filter(job => job.category === filters.category)
      }
      
      if (filters.location) {
        results = results.filter(job => 
          job.location?.toLowerCase().includes(filters.location!.toLowerCase())
        )
      }
      
      if (filters.jobType) {
        results = results.filter(job => job.type === filters.jobType)
      }
    }
    
    return results
  } catch (error) {
    console.error("Error searching job postings:", error)
    throw new Error("Failed to search job postings")
  }
} 