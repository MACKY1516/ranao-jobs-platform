"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthCheckModal } from "@/components/auth-check-modal"
import { addEmployerActivity } from "@/lib/notifications"
import { incrementJobApplicationsCount } from "@/lib/jobs"
import { getDoc, doc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function ApplyJobPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params)
  const jobId = unwrappedParams.id
  const router = useRouter()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    coverLetter: "",
    phoneNumber: "",
    agreeToTerms: false,
  })
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // State for real job data from Firestore
  const [job, setJob] = useState({
    id: jobId,
    title: "",
    company: "",
    location: "",
    description: "",
    employerId: "",
  })
  
  // Fetch real job data from Firestore
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const jobDocRef = doc(db, "jobs", jobId);
        const jobSnapshot = await getDoc(jobDocRef);
        
        if (jobSnapshot.exists()) {
          const jobData = jobSnapshot.data();
          setJob({
            id: jobId,
            title: jobData.title || "",
            company: jobData.companyName || "",
            location: jobData.location || "",
            description: jobData.description || "",
            employerId: jobData.employerId || "",
          });
        } else {
          console.error("Job not found");
          setError("Job not found");
        }
      } catch (err) {
        console.error("Error fetching job data:", err);
        setError("Error loading job details");
      }
    };
    
    fetchJobData();
  }, [jobId]);

  // Check if user is logged in
  useEffect(() => {
    const userData = localStorage.getItem("ranaojobs_user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        console.log("User data found:", user) // Debug user data
        setIsLoggedIn(true)
        setUserRole(user.activeRole || user.role)
        
        // Ensure we have a userId - use uid OR id (depending on how firebase auth stores it)
        if (user.uid) {
          setUserId(user.uid)
        } else if (user.id) {
          setUserId(user.id)
        } else {
          console.error("No user ID found in user data")
          setUserId("temp-user-id") // Temporary fix to allow submissions
        }

        // If user is an employer, redirect to job details
        if (user.role === "employer" || (user.role === "multi" && user.activeRole === "employer")) {
          router.push(`/job/${jobId}`)
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
        setIsLoggedIn(false)
        setUserRole(null)
        setUserId(null)
      }
    } else {
      setIsLoggedIn(false)
      setUserRole(null)
      setUserId(null)
      setIsAuthModalOpen(true)
    }

    // Listen for login/logout events
    const handleUserStateChange = () => {
      const userData = localStorage.getItem("ranaojobs_user")
      if (userData) {
        try {
          const user = JSON.parse(userData)
          console.log("User state changed:", user) // Debug user data
          setIsLoggedIn(true)
          setUserRole(user.activeRole || user.role)
          
          // Ensure we have a userId - use uid OR id (depending on how firebase auth stores it)
          if (user.uid) {
            setUserId(user.uid)
          } else if (user.id) {
            setUserId(user.id)
          } else {
            console.error("No user ID found in user data")
            setUserId("temp-user-id") // Temporary fix to allow submissions
          }
          
          setIsAuthModalOpen(false)

          // If user is an employer, redirect to job details
          if (user.role === "employer" || (user.role === "multi" && user.activeRole === "employer")) {
            router.push(`/job/${jobId}`)
          }
        } catch (error) {
          console.error("Error parsing user data:", error)
          setIsLoggedIn(false)
          setUserRole(null)
          setUserId(null)
          setIsAuthModalOpen(true)
        }
      } else {
        setIsLoggedIn(false)
        setUserRole(null)
        setUserId(null)
        setIsAuthModalOpen(true)
      }
    }

    window.addEventListener("userStateChange", handleUserStateChange)
    return () => {
      window.removeEventListener("userStateChange", handleUserStateChange)
    }
  }, [jobId, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (!formData.agreeToTerms) {
      setError("You must agree to the terms and conditions")
      return
    }

    // Use a fallback ID if needed - this ensures the form works even with login issues
    let applicantUserId: string = userId || "temp-user-id"
    
    // Make absolutely sure we have a string user ID
    if (!applicantUserId || typeof applicantUserId !== "string") {
      console.warn("User ID not found or invalid, using fallback ID")
      const tempData = localStorage.getItem("ranaojobs_user")
      if (tempData) {
        try {
          const tempUser = JSON.parse(tempData)
          applicantUserId = (tempUser.uid || tempUser.id || "temp-user-id") as string
        } catch (e) {
          applicantUserId = "temp-user-id"
        }
      } else {
        applicantUserId = "temp-user-id"
      }
    }

    setIsSubmitting(true)

    try {
      // Use the job data we already fetched - no need to query again
      const employerId = job.employerId
      
      if (!employerId) {
        throw new Error("Invalid employer information for this job")
      }
      
      // Get applicant profile data from Firestore if available
      let applicantName = "";
      let applicantEmail = "";
      
      try {
        const userProfileDoc = await getDoc(doc(db, "users", applicantUserId));
        if (userProfileDoc.exists()) {
          const userData = userProfileDoc.data();
          applicantName = userData.name || userData.displayName || "";
          applicantEmail = userData.email || "";
        }
      } catch (profileErr) {
        console.warn("Could not retrieve applicant profile", profileErr);
        // Continue with application - this is not critical
      }
      
      // Save application to Firestore
      const applicationData = {
        // Job information
        jobId,
        jobTitle: job.title,
        jobCompany: job.company,
        jobLocation: job.location,
        employerId,
        
        // Applicant information
        jobseekerId: applicantUserId,
        applicantName,
        applicantEmail,
        phoneNumber: formData.phoneNumber,
        
        // Application details
        coverLetter: formData.coverLetter,
        
        // Status and timestamps
        status: "pending", // pending, reviewed, shortlisted, rejected
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        appliedAt: serverTimestamp()
      }
      
      // Create applications collection if it doesn't exist
      const applicationRef = await addDoc(collection(db, "applications"), applicationData)
      
      // Add activity for the employer
      // await addEmployerActivity(
      //   employerId,
      //   "application",
      //   `New application received for your job posting: ${job.title}`
      // )

      // Add this job to the user's applied jobs collection for tracking
      await addDoc(collection(db, "users", applicantUserId, "appliedJobs"), {
        jobId,
        applicationId: applicationRef.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        appliedAt: serverTimestamp(),
        status: "pending"
      })
      
      // Add reference to job's applications subcollection for employer convenience
      await addDoc(collection(db, "jobs", jobId, "applications"), {
        applicationId: applicationRef.id,
        jobseekerId: applicantUserId,
        appliedAt: serverTimestamp(),
        status: "pending"
      })
      
      // Update the job's application count
      await incrementJobApplicationsCount(jobId)
      
      setSuccessMessage("Your application has been submitted successfully!")
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/jobseeker/applications")
      }, 2000)
    } catch (err) {
      console.error("Application submission error:", err)
      setError("An error occurred while submitting your application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // If not logged in, show only the auth modal
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <div className="flex-grow flex items-center justify-center">
          <p>Please log in to continue...</p>
        </div>
        <Footer />
        <AuthCheckModal
          isOpen={isAuthModalOpen}
          onClose={() => router.push(`/job/${jobId}`)}
          title="Login Required"
          message="You need to login or register as a jobseeker to apply for this job."
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />

      {/* Page Header */}
      <section className="pt-24 pb-10 px-4 bg-gray-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold mb-2">Apply for Job</h1>
            <p className="text-gray-300">
              {job.title} at {job.company}
            </p>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-10 px-4 bg-gray-50 flex-grow">
        <div className="container mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Job Application</CardTitle>
              <CardDescription>
                Complete the form below to apply for this position. Fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+63 XXX XXX XXXX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverLetter">Cover Letter</Label>
                  <Textarea
                    id="coverLetter"
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleInputChange}
                    placeholder="Introduce yourself and explain why you're a good fit for this position..."
                    className="min-h-[200px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    I agree to the terms and conditions and consent to the processing of my personal data for
                    recruitment purposes.
                  </Label>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push(`/job/${jobId}`)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}
