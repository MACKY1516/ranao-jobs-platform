"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { AdminDataTable } from "@/components/admin-data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAdminToast } from "@/components/admin-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPendingJobVerifications, getVerifiedJobs, approveJob, rejectJob } from "@/lib/jobs"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"

// Job interface
interface JobVerification {
  id: string
  title: string
  companyName: string
  employerId: string
  location: string
  jobType: string
  createdAt: any
  verificationStatus: string
}

export default function JobVerificationPage() {
  const router = useRouter()
  const { success, error } = useAdminToast()
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [jobToReject, setJobToReject] = useState<JobVerification | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState("")
  
  // State for job data
  const [pendingJobs, setPendingJobs] = useState<JobVerification[]>([])
  const [approvedJobs, setApprovedJobs] = useState<JobVerification[]>([])
  const [rejectedJobs, setRejectedJobs] = useState<JobVerification[]>([])

  // Load job verification data from Firestore
  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true)
      try {
        // Get current admin user
        const userData = localStorage.getItem("ranaojobs_user")
        if (!userData) {
          router.push("/admin/login")
          return
        }
        
        // Get all pending jobs
        const pendingData = await getPendingJobVerifications()
        const pendingJobsFormatted = pendingData.map(job => ({
          id: job.id,
          title: job.title || "Untitled Job",
          companyName: job.companyName || "Unknown Company",
          employerId: job.employerId,
          location: job.location || "Remote",
          jobType: job.jobType || "Full-time",
          createdAt: formatTimestamp(job.createdAt),
          verificationStatus: "pending"
        }))
        
        setPendingJobs(pendingJobsFormatted)
        
        // Get approved jobs
        const approvedData = await getVerifiedJobs("approved")
        const approvedJobsFormatted = approvedData.map(job => ({
          id: job.id,
          title: job.title || "Untitled Job",
          companyName: job.companyName || "Unknown Company",
          employerId: job.employerId,
          location: job.location || "Remote",
          jobType: job.jobType || "Full-time",
          createdAt: formatTimestamp(job.createdAt),
          verificationStatus: "approved"
        }))
        
        setApprovedJobs(approvedJobsFormatted)
        
        // Get rejected jobs
        const rejectedData = await getVerifiedJobs("rejected")
        const rejectedJobsFormatted = rejectedData.map(job => ({
          id: job.id,
          title: job.title || "Untitled Job",
          companyName: job.companyName || "Unknown Company",
          employerId: job.employerId,
          location: job.location || "Remote",
          jobType: job.jobType || "Full-time",
          createdAt: formatTimestamp(job.createdAt),
          verificationStatus: "rejected"
        }))
        
        setRejectedJobs(rejectedJobsFormatted)
        
      } catch (err) {
        console.error("Error loading job verifications:", err)
        error("Failed to load job verifications data")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadJobs()
  }, [router, error])
  
  // Format timestamps for display
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "Unknown"
    
    if (timestamp.toDate) {
      return format(timestamp.toDate(), "MMM d, yyyy")
    }
    
    return "Unknown"
  }

  const handleApproveJob = async (job: JobVerification) => {
    setIsLoading(true)
    try {
      // Get current admin user
      const userData = localStorage.getItem("ranaojobs_user")
      if (!userData) {
        router.push("/admin/login")
        return
      }
      
      const admin = JSON.parse(userData)
      
      // Call approve function
      await approveJob(job.id, admin.id)
      
      // Remove from pending list
      setPendingJobs(current => 
        current.filter(item => item.id !== job.id)
      )
      
      // Add to approved list
      const approvedJob = {
        ...job,
        verificationStatus: 'approved'
      }
      setApprovedJobs(current => [approvedJob, ...current])
      
      // Show success message
      success(`Job "${job.title}" by ${job.companyName} has been approved`)
    } catch (err) {
      console.error("Error approving job:", err)
      error(`Failed to approve job "${job.title}"`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenRejectDialog = (job: JobVerification) => {
    setJobToReject(job)
    setRejectionReason("")
    setIsRejectDialogOpen(true)
  }

  const confirmRejectJob = async () => {
    if (!jobToReject) return
    if (!rejectionReason.trim()) {
      error("Please provide a reason for rejection")
      return
    }
    
    setIsLoading(true)
    try {
      // Get current admin user
      const userData = localStorage.getItem("ranaojobs_user")
      if (!userData) {
        router.push("/admin/login")
        return
      }
      
      const admin = JSON.parse(userData)
      
      // Call reject function
      await rejectJob(jobToReject.id, admin.id, rejectionReason)
      
      // Remove from pending list
      setPendingJobs(current => 
        current.filter(item => item.id !== jobToReject.id)
      )
      
      // Add to rejected list
      const rejectedJobItem = {
        ...jobToReject,
        verificationStatus: 'rejected'
      }
      setRejectedJobs(current => [rejectedJobItem, ...current])
      
      // Show success message
      error(`Job "${jobToReject.title}" by ${jobToReject.companyName} has been rejected`)
      
      // Close dialog
      setIsRejectDialogOpen(false)
      setJobToReject(null)
    } catch (err) {
      console.error("Error rejecting job:", err)
      error(`Failed to reject job "${jobToReject.title}"`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminLayout title="Job Posting Verification">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Posting Verification</CardTitle>
            <CardDescription>Review and approve job postings before they're visible to jobseekers</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">Pending ({pendingJobs.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({approvedJobs.length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({rejectedJobs.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {isLoading && !isRejectDialogOpen ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                  </div>
                ) : pendingJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No pending job verification requests</p>
                  </div>
                ) : (
                  <AdminDataTable
                    columns={[
                      { key: "title", title: "Job Title" },
                      { key: "companyName", title: "Company" },
                      { key: "location", title: "Location" },
                      { key: "jobType", title: "Job Type" },
                      { key: "createdAt", title: "Created" },
                    ]}
                    data={pendingJobs}
                    searchable={true}
                    actions={[
                      {
                        label: "View Details",
                        onClick: (row) => router.push(`/admin/jobs/verification/${row.id}`),
                      },
                      {
                        label: "Approve",
                        onClick: handleApproveJob,
                      },
                      {
                        label: "Reject",
                        onClick: handleOpenRejectDialog,
                      },
                    ]}
                    onRowClick={(row) => router.push(`/admin/jobs/verification/${row.id}`)}
                  />
                )}
              </TabsContent>

              <TabsContent value="approved">
                {approvedJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No approved jobs</p>
                  </div>
                ) : (
                  <AdminDataTable
                    columns={[
                      { key: "title", title: "Job Title" },
                      { key: "companyName", title: "Company" },
                      { key: "location", title: "Location" },
                      { key: "jobType", title: "Job Type" },
                      { key: "createdAt", title: "Created" },
                    ]}
                    data={approvedJobs}
                    searchable={true}
                    actions={[
                      {
                        label: "View Details",
                        onClick: (row) => router.push(`/admin/jobs/verification/${row.id}`),
                      },
                    ]}
                    onRowClick={(row) => router.push(`/admin/jobs/verification/${row.id}`)}
                  />
                )}
              </TabsContent>

              <TabsContent value="rejected">
                {rejectedJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No rejected jobs</p>
                  </div>
                ) : (
                  <AdminDataTable
                    columns={[
                      { key: "title", title: "Job Title" },
                      { key: "companyName", title: "Company" },
                      { key: "location", title: "Location" },
                      { key: "jobType", title: "Job Type" },
                      { key: "createdAt", title: "Created" },
                    ]}
                    data={rejectedJobs}
                    searchable={true}
                    actions={[
                      {
                        label: "View Details",
                        onClick: (row) => router.push(`/admin/jobs/verification/${row.id}`),
                      },
                    ]}
                    onRowClick={(row) => router.push(`/admin/jobs/verification/${row.id}`)}
                  />
                )}
              </TabsContent>
            </Tabs>
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
            <Button variant="destructive" onClick={confirmRejectJob} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Reject Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
} 