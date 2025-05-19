"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, getDoc, doc, orderBy, updateDoc, Timestamp, serverTimestamp } from "firebase/firestore"
import { format, parseISO, isValid } from "date-fns"

interface ApplicantListProps {
  jobId?: string
}

export function ApplicantList({ jobId }: ApplicantListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [applicants, setApplicants] = useState<any[]>([])
  const [filteredApplicants, setFilteredApplicants] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [jobTitle, setJobTitle] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem("ranaojobs_user")
    if (!storedUser) {
      setIsLoading(false)
      return
    }

    const user = JSON.parse(storedUser)
    
    // Fetch applications from Firestore
    const fetchApplications = async () => {
      try {
        let applicationsQuery;
        
      if (jobId) {
          // Fetch job details first
          const jobDoc = await getDoc(doc(db, "jobs", jobId))
          if (jobDoc.exists()) {
            setJobTitle(jobDoc.data().title || "Unknown Job")
          }
          
          applicationsQuery = query(
            collection(db, "applications"),
            where("jobId", "==", jobId),
            where("employerId", "==", user.id),
            orderBy("createdAt", "desc")
          )
        } else {
          // Fetch all applications for this employer
          applicationsQuery = query(
            collection(db, "applications"),
            where("employerId", "==", user.id),
            orderBy("createdAt", "desc")
          )
        }
        
        const applicationsSnapshot = await getDocs(applicationsQuery)
        
        if (applicationsSnapshot.empty) {
          setApplicants([])
          setFilteredApplicants([])
          setIsLoading(false)
          return
        }
        
        // Process application data
        const applicationsData = await Promise.all(
          applicationsSnapshot.docs.map(async (applicationDoc) => {
            const applicationData = applicationDoc.data()
            
            // Get job details
            let jobTitle = "Unknown Job"
            if (applicationData.jobId) {
              const jobDoc = await getDoc(doc(db, "jobs", applicationData.jobId))
              if (jobDoc.exists()) {
                const jobData = jobDoc.data()
                jobTitle = jobData.title || "Unknown Job"
              }
            }
            
            // Get applicant details
            let applicantInfo = { 
              name: "Unknown Applicant",
              email: applicationData.email || "No email provided",
              phone: applicationData.phone || "No phone provided"
            }
            
            if (applicationData.userId) {
              const userDoc = await getDoc(doc(db, "users", applicationData.userId))
              if (userDoc.exists()) {
                const userData = userDoc.data()
                applicantInfo = {
                  name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || "Unknown Applicant",
                  email: userData.email || applicationData.email || "No email provided",
                  phone: userData.phone || applicationData.phone || "No phone provided"
                }
              }
            }
            
            // Format the date
            let formattedDate = "Unknown date"
            if (applicationData.createdAt) {
              if (applicationData.createdAt instanceof Timestamp) {
                formattedDate = format(applicationData.createdAt.toDate(), 'yyyy-MM-dd')
              } else if (typeof applicationData.createdAt === 'string' && isValid(parseISO(applicationData.createdAt))) {
                formattedDate = format(parseISO(applicationData.createdAt), 'yyyy-MM-dd')
              }
            }
            
                         return {
               id: applicationDoc.id,
               name: applicantInfo.name,
               email: applicantInfo.email,
               phone: applicantInfo.phone,
               jobTitle: jobTitle,
               jobId: applicationData.jobId,
               appliedDate: formattedDate,
              status: applicationData.status || "new",
              resume: applicationData.resumeUrl || "",
              coverLetter: applicationData.coverLetter || "No cover letter provided",
              experience: applicationData.experience || "Not specified",
              skills: applicationData.skills || [],
              userId: applicationData.userId
            }
          })
        )
        
        setApplicants(applicationsData)
        setFilteredApplicants(applicationsData)
      } catch (error) {
        console.error("Error fetching applications:", error)
        toast({
          title: "Error",
          description: "Failed to load applications",
          variant: "destructive",
        })
      } finally {
      setIsLoading(false)
      }
    }
    
    fetchApplications()
  }, [jobId, toast])

  useEffect(() => {
    // Filter applicants based on search query and status filter
    let filtered = [...applicants]

    if (searchQuery) {
      filtered = filtered.filter(
        (applicant) =>
          applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (applicant.skills && applicant.skills.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase()))),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((applicant) => applicant.status === statusFilter)
    }

    setFilteredApplicants(filtered)
  }, [searchQuery, statusFilter, applicants])

  const handleRejectApplicant = (applicant: any) => {
    setSelectedApplicant(applicant)
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const confirmRejectApplicant = async () => {
    if (!selectedApplicant) return
    
    setIsLoading(true)
    try {
      // Update application status in Firestore
      const applicationRef = doc(db, "applications", selectedApplicant.id)
      await updateDoc(applicationRef, {
        status: "rejected",
        rejectionReason: rejectionReason,
        updatedAt: serverTimestamp()
      })
      
      // Update local state
      setApplicants(applicants.map(a => 
        a.id === selectedApplicant.id 
          ? { ...a, status: "rejected" } 
          : a
      ))
      
      toast({
        title: "Application rejected",
        description: "The application has been marked as rejected",
      })
      
    setShowRejectDialog(false)
    setSelectedApplicant(null)
    } catch (error) {
      console.error("Error rejecting application:", error)
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShortlistApplicant = async (applicant: any) => {
    setIsLoading(true)
    try {
      // Update application status in Firestore
      const applicationRef = doc(db, "applications", applicant.id)
      await updateDoc(applicationRef, {
        status: "shortlisted",
        updatedAt: serverTimestamp()
      })
      
      // Update local state
      setApplicants(applicants.map(a => 
        a.id === applicant.id 
          ? { ...a, status: "shortlisted" } 
          : a
      ))
      
      toast({
        title: "Application shortlisted",
        description: "The application has been shortlisted",
      })
    } catch (error) {
      console.error("Error shortlisting application:", error)
      toast({
        title: "Error",
        description: "Failed to shortlist application",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-100 text-blue-800">New</Badge>
      case "reviewed":
        return <Badge className="bg-yellow-100 text-yellow-800">Reviewed</Badge>
      case "shortlisted":
        return <Badge className="bg-green-100 text-green-800">Shortlisted</Badge>
      case "interviewed":
        return <Badge className="bg-purple-100 text-purple-800">Interviewed</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{jobId ? `Applicants for ${jobTitle}` : "All Applicants"}</h1>
          <p className="text-gray-500">
            {jobId
              ? `Review candidates who applied for this position`
              : "Manage all job applications across your listings"}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          {jobId && (
            <Link href={`/employer/jobs/${jobId}`}>
              <Button variant="outline">Back to Job</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search applicants..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="interviewed">Interviewed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="card" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="card">Card View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        {/* Card View */}
        <TabsContent value="card">
          {filteredApplicants.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No applicants found</h3>
              <p className="mt-2 text-gray-500">
                {applicants.length === 0
                  ? "You don't have any applicants yet."
                  : "No applicants match your current filters. Try adjusting your search criteria."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApplicants.map((applicant) => (
                <Card key={applicant.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{applicant.name}</h3>
                            <p className="text-sm text-gray-500">{applicant.jobTitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {getStatusBadge(applicant.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/employer/applicants/${applicant.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              {applicant.resume && (
                                <DropdownMenuItem 
                                  onClick={() => window.open(applicant.resume, '_blank')}
                                >
                                <Download className="mr-2 h-4 w-4" />
                                Download Resume
                              </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleShortlistApplicant(applicant)}>
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                Shortlist
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRejectApplicant(applicant)}
                                className="text-red-600"
                              >
                                <ThumbsDown className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center text-gray-500">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>{applicant.email}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{applicant.phone}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Applied: {applicant.appliedDate}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <FileText className="h-4 w-4 mr-2" />
                          <span>Experience: {applicant.experience}</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(applicant.skills) && applicant.skills.length > 0 ? (
                            applicant.skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-gray-100">
                              {skill}
                            </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No skills listed</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 border-t flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/employer/applicants/${applicant.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Profile
                      </Button>
                      {applicant.status !== "shortlisted" && applicant.status !== "rejected" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600"
                          onClick={() => handleShortlistApplicant(applicant)}
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Shortlist
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            window.open(
                              `https://mail.google.com/mail/?view=cm&fs=1&to=${applicant.email}&su=Regarding your application for ${applicant.jobTitle}`,
                              "_blank",
                            )
                          }}
                          variant="outline"
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Contact
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table">
          {filteredApplicants.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No applicants found</h3>
              <p className="mt-2 text-gray-500">
                {applicants.length === 0
                  ? "You don't have any applicants yet."
                  : "No applicants match your current filters. Try adjusting your search criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-4">Applicant</th>
                    {!jobId && <th className="text-left p-4">Position</th>}
                    <th className="text-left p-4">Applied On</th>
                    <th className="text-left p-4">Experience</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.map((applicant) => (
                    <tr key={applicant.id} className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{applicant.name}</p>
                            <p className="text-sm text-gray-500">{applicant.email}</p>
                          </div>
                        </div>
                      </td>
                      {!jobId && <td className="p-4">{applicant.jobTitle}</td>}
                      <td className="p-4">{applicant.appliedDate}</td>
                      <td className="p-4">{applicant.experience}</td>
                      <td className="p-4">{getStatusBadge(applicant.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/employer/applicants/${applicant.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {applicant.resume && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => window.open(applicant.resume, '_blank')}
                            >
                            <Download className="h-4 w-4" />
                          </Button>
                          )}
                          {applicant.status !== "shortlisted" && applicant.status !== "rejected" && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleShortlistApplicant(applicant)}>
                                <ThumbsUp className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleRejectApplicant(applicant)}>
                                <ThumbsDown className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Applicant</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedApplicant?.name}? This action will mark the application as
              rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason (Optional)
            </label>
            <textarea
              id="rejection-reason"
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
              rows={3}
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">
              This is for your internal records only and will not be sent to the applicant.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRejectApplicant}>
              Reject Applicant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
