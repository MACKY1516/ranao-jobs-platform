"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAdminToast } from "@/components/admin-toast"
import { 
  Loader2, 
  Building, 
  MapPin, 
  Clock, 
  Briefcase, 
  CalendarDays, 
  PhilippinePeso, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  User 
} from "lucide-react"
import { getJob, approveJob, rejectJob } from "@/lib/jobs"
import { getUserProfile } from "@/lib/users"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// Job data interface
interface JobData {
  id: string
  title: string
  companyName: string
  employerId: string
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  location: string
  jobType: string
  salary: {
    min: number
    max: number
    currency: string
    period: string
  }
  createdAt: any
  verificationStatus: string
  rejectionReason?: string
}

// Employer data interface
interface EmployerData {
  id: string
  companyName: string
  email: string
  industry: string
  companySize: string
  logo?: string
}

export default function JobVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params)
  const jobId = unwrappedParams.id
  const router = useRouter()
  const { success, error } = useAdminToast()
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [employerData, setEmployerData] = useState<EmployerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  // Fetch job and employer data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get job document from Firestore
        const jobDoc = await getJob(jobId)
        
        if (!jobDoc) {
          error("Job not found")
          router.push("/admin/jobs/verification")
          return
        }
        
        setJobData(jobDoc)
        
        // Get employer information
        const employer = await getUserProfile(jobDoc.employerId)
        
        setEmployerData({
          id: employer.id,
          companyName: employer.companyName || "Unknown Company",
          email: employer.email || "",
          industry: employer.industry || "Not specified",
          companySize: employer.companySize || "Not specified",
          logo: employer.logo
        })
        
      } catch (err) {
        console.error("Error fetching job data:", err)
        error("Failed to load job data")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [jobId, router, error])

  const handleApproveJob = async () => {
    if (!jobData) return
    
    setIsActionLoading(true)
    try {
      // Get current admin user
      const storedUser = localStorage.getItem("ranaojobs_user")
      if (!storedUser) {
        router.push("/admin/login")
        return
      }
      
      const admin = JSON.parse(storedUser)
      
      // Approve job
      await approveJob(jobData.id, admin.id)
      
      // Update local state
      setJobData(prev => prev ? {
        ...prev,
        verificationStatus: "approved"
      } : null)
      
      // Show success message
      success(`Job "${jobData.title}" has been approved`)
      
      // Redirect back after a delay
      setTimeout(() => {
        router.push("/admin/jobs/verification")
      }, 1500)
    } catch (err) {
      console.error("Error approving job:", err)
      error("Failed to approve job")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleOpenRejectDialog = () => {
    setIsRejectDialogOpen(true)
  }

  const handleRejectJob = async () => {
    if (!jobData) return
    
    if (!rejectionReason.trim()) {
      error("Please provide a reason for rejection")
      return
    }

    setIsActionLoading(true)
    try {
      // Get current admin user
      const storedUser = localStorage.getItem("ranaojobs_user")
      if (!storedUser) {
        router.push("/admin/login")
        return
      }
      
      const admin = JSON.parse(storedUser)
      
      // Reject job
      await rejectJob(jobData.id, admin.id, rejectionReason)
      
      // Update local state
      setJobData(prev => prev ? {
        ...prev,
        verificationStatus: "rejected",
        rejectionReason: rejectionReason
      } : null)
      
      // Show success message
      error(`Job "${jobData.title}" has been rejected`)
      
      // Close dialog
      setIsRejectDialogOpen(false)
      
      // Redirect back after a delay
      setTimeout(() => {
        router.push("/admin/jobs/verification")
      }, 1500)
    } catch (err) {
      console.error("Error rejecting job:", err)
      error("Failed to reject job")
    } finally {
      setIsActionLoading(false)
    }
  }
  
  // Format date for display
  const formatDate = (date: any): string => {
    if (!date) return "Unknown"
    
    if (date.toDate) {
      return format(date.toDate(), "MMM d, yyyy")
    }
    
    return "Unknown"
  }

  if (isLoading) {
    return (
      <AdminLayout title="Job Verification Details">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Job Verification Details">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            Job Verification: {jobData?.title}
          </h2>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/admin/jobs/verification")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
            {jobData?.verificationStatus === "pending" && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={handleOpenRejectDialog}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Reject
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700" 
                  onClick={handleApproveJob}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status Banner */}
        {jobData?.verificationStatus === "approved" && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <p className="font-medium text-green-800">This job posting has been approved</p>
              <p className="text-sm text-green-600">It is now visible to job seekers</p>
            </div>
          </div>
        )}

        {jobData?.verificationStatus === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <p className="font-medium text-red-800">This job posting has been rejected</p>
              <p className="text-sm text-red-600">Reason: {jobData.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Company Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Details about the company posting this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                {employerData?.logo ? (
                  <img src={employerData.logo} alt={employerData.companyName} className="h-full w-full object-contain" />
                ) : (
                  <Building className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium">{employerData?.companyName}</h3>
                <p className="text-sm text-gray-500">{employerData?.industry}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{employerData?.companySize}</Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => router.push(`/admin/users/${employerData?.id}`)}
                  >
                    <User className="h-3 w-3 mr-1" />
                    View Employer Profile
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              <div className="flex items-center mt-1 gap-2">
                <span>Status:</span>
                {jobData?.verificationStatus === "pending" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Pending Approval
                  </span>
                )}
                {jobData?.verificationStatus === "approved" && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Approved
                  </span>
                )}
                {jobData?.verificationStatus === "rejected" && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    Rejected
                  </span>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Details - Left Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{jobData?.title}</h3>
                  <p className="text-gray-500">{jobData?.companyName}</p>
                </div>

                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{jobData?.location}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{jobData?.jobType}</span>
                </div>

                <div className="flex items-center gap-1">
                  <PhilippinePeso className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {jobData?.salary?.min && jobData?.salary?.max 
                      ? `${jobData.salary.currency || '$'}${jobData.salary.min.toLocaleString()} - ${jobData.salary.currency || '$'}${jobData.salary.max.toLocaleString()} ${jobData.salary.period || 'per year'}`
                      : 'Salary not specified'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Posted on {formatDate(jobData?.createdAt)}</span>
                </div>
              </div>

              {/* Job Details - Right Column */}
              <div className="space-y-3">
                <div>
                  <p className="font-medium mb-1">Job Type</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{jobData?.jobType}</Badge>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-1">Benefits</p>
                  <div className="flex flex-wrap gap-2">
                    {jobData?.benefits && jobData.benefits.length > 0 ? (
                      jobData.benefits.map((benefit, index) => (
                        <Badge key={index} variant="outline">{benefit}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No benefits listed</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-medium">Job Description</h3>
              <div className="text-sm text-gray-600 whitespace-pre-wrap">
                {jobData?.description || "No description provided"}
              </div>
            </div>

            {/* Responsibilities */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-medium">Responsibilities</h3>
              {jobData?.responsibilities && jobData.responsibilities.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {jobData.responsibilities.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No responsibilities listed</p>
              )}
            </div>

            {/* Requirements */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-medium">Requirements</h3>
              {jobData?.requirements && jobData.requirements.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {jobData.requirements.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No requirements listed</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reject Confirmation Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Job Posting</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this job posting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectJob} disabled={isActionLoading}>
              {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Reject Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
} 