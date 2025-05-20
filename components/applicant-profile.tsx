"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Briefcase,
  Calendar,
  Download,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { format, parseISO, formatDistanceToNow, isValid } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface ApplicantProfileProps {
  applicantId: string
}

export function ApplicantProfile({ applicantId }: ApplicantProfileProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [applicant, setApplicant] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get user data from localStorage for current user (employer)
    const storedUser = localStorage.getItem("ranaojobs_user")
    if (!storedUser) {
      setError("Authentication required")
      setIsLoading(false)
      return
    }

    const user = JSON.parse(storedUser)
    
    const fetchApplicantData = async () => {
      try {
        // Fetch application data by ID
        const applicationRef = doc(db, "applications", applicantId)
        const applicationSnapshot = await getDoc(applicationRef)
        
        if (!applicationSnapshot.exists()) {
          setError("Application not found")
          setIsLoading(false)
          return
        }
        
        const applicationData = applicationSnapshot.data()
        
        // Security check: verify this application belongs to the current employer
        if (applicationData.employerId !== user.id) {
          setError("You don't have permission to view this application")
          setIsLoading(false)
          return
        }
        
        // Get job details
        let jobTitle = "Unknown Job"
        let jobData = null
        if (applicationData.jobId) {
          const jobDoc = await getDoc(doc(db, "jobs", applicationData.jobId))
          if (jobDoc.exists()) {
            jobData = jobDoc.data()
            jobTitle = jobData.title || "Unknown Job"
          }
        }
        
        // Get applicant user details
        let userData = {
          name: "Unknown Applicant",
          email: applicationData.email || "No email provided",
          phone: applicationData.phone || "No phone provided",
          location: applicationData.location || "Unknown Location",
          profilePhoto: null,
          experience: [],
          education: [],
          skills: [],
          languages: [],
          resumeUrl: applicationData.resumeUrl || null,
          portfolioUrl: null,
          linkedinUrl: null,
          githubUrl: null
        }
        
        if (applicationData.userId) {
          const userDoc = await getDoc(doc(db, "users", applicationData.userId))
          if (userDoc.exists()) {
            const userProfile = userDoc.data()
            userData = {
              name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || "Unknown Applicant",
              email: userProfile.email || applicationData.email || "No email provided",
              phone: userProfile.phone || applicationData.phone || "No phone provided",
              location: userProfile.location || applicationData.location || "Unknown Location",
              profilePhoto: userProfile.profilePhoto || null,
              experience: userProfile.experience || [],
              education: userProfile.education || [],
              skills: userProfile.skills || applicationData.skills || [],
              languages: userProfile.languages || [],
              resumeUrl: applicationData.resumeUrl || userProfile.resume || null,
              portfolioUrl: userProfile.portfolioUrl || userProfile.website || null,
              linkedinUrl: userProfile.linkedinUrl || userProfile.linkedin || null,
              githubUrl: userProfile.githubUrl || userProfile.github || null
            }
          }
        }
        
        // Format the date
        let formattedDate = "Unknown date"
        let appliedDate = null
        if (applicationData.createdAt) {
          if (applicationData.createdAt instanceof Timestamp) {
            appliedDate = applicationData.createdAt.toDate()
            formattedDate = format(appliedDate, 'MMMM d, yyyy')
          } else if (typeof applicationData.createdAt === 'string' && isValid(parseISO(applicationData.createdAt))) {
            appliedDate = parseISO(applicationData.createdAt)
            formattedDate = format(appliedDate, 'MMMM d, yyyy')
          }
        }
        
        // Combine all data
        const applicantData = {
          id: applicationSnapshot.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          location: userData.location,
          profilePhoto: userData.profilePhoto,
          jobTitle: jobTitle,
          jobId: applicationData.jobId,
          employerId: applicationData.employerId,
          userId: applicationData.userId,
          appliedDate: formattedDate,
          appliedDateRaw: appliedDate,
          status: applicationData.status || "new",
          resume: userData.resumeUrl,
          coverLetter: applicationData.coverLetter || "No cover letter provided",
          experience: userData.experience,
          education: userData.education,
          skills: userData.skills,
          languages: userData.languages,
          portfolioUrl: userData.portfolioUrl,
          linkedinUrl: userData.linkedinUrl,
          githubUrl: userData.githubUrl,
          notes: applicationData.notes || "",
          rejectionReason: applicationData.rejectionReason || ""
        }
        
        setApplicant(applicantData)
      } catch (error) {
        console.error("Error fetching applicant data:", error)
        setError("Failed to load applicant data. Please try again later.")
        toast({
          title: "Error",
          description: "Failed to load applicant data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchApplicantData()
  }, [applicantId, toast])

  const handleShortlistApplicant = async () => {
    if (!applicant) return
    
    try {
      // Update application status in Firestore
      const applicationRef = doc(db, "applications", applicant.id)
      await updateDoc(applicationRef, {
        status: "shortlisted",
        updatedAt: serverTimestamp()
      })
      
      // Update local state
      setApplicant({ 
        ...applicant, 
        status: "shortlisted" 
      })
      
      toast({
        title: "Application shortlisted",
        description: "The applicant has been shortlisted successfully",
      })
    } catch (error) {
      console.error("Error shortlisting applicant:", error)
      toast({
        title: "Error",
        description: "Failed to shortlist the applicant",
        variant: "destructive",
      })
    }
  }

  const handleRejectApplicant = () => {
    setShowRejectDialog(true)
  }

  const confirmRejectApplicant = async () => {
    if (!applicant) return
    
    try {
      // Update application status in Firestore
      const applicationRef = doc(db, "applications", applicant.id)
      await updateDoc(applicationRef, {
        status: "rejected",
        rejectionReason: rejectionReason,
        updatedAt: serverTimestamp()
      })
      
      // Update local state
      setApplicant({ 
        ...applicant, 
        status: "rejected",
        rejectionReason: rejectionReason
      })
      
      toast({
        title: "Application rejected",
        description: "The applicant has been rejected successfully",
      })
      
      setShowRejectDialog(false)
    } catch (error) {
      console.error("Error rejecting applicant:", error)
      toast({
        title: "Error",
        description: "Failed to reject the applicant",
        variant: "destructive",
      })
    }
  }
  
  const saveApplicantNotes = async (notes: string) => {
    if (!applicant) return
    
    try {
      // Update notes in Firestore
      const applicationRef = doc(db, "applications", applicant.id)
      await updateDoc(applicationRef, {
        notes: notes,
        updatedAt: serverTimestamp()
      })
      
      // Update local state
      setApplicant({ 
        ...applicant, 
        notes: notes 
      })
      
      toast({
        title: "Notes saved",
        description: "Your notes have been saved successfully",
      })
    } catch (error) {
      console.error("Error saving notes:", error)
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      })
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

  if (error) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">Unable to load applicant</h3>
        <p className="mt-2 text-gray-500">{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/employer/applicants")}>
          Back to Applicants
        </Button>
      </div>
    )
  }

  if (!applicant) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">Applicant not found</h3>
        <p className="mt-2 text-gray-500">The applicant you're looking for doesn't exist or has been removed.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/employer/applicants")}>
          Back to Applicants
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{applicant.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500">Applied for {applicant.jobTitle}</p>
            {getStatusBadge(applicant.status)}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button
            onClick={() => {
              if (applicant?.email) {
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${applicant.email}`, "_blank")
              }
            }}
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            Contact via Email
          </Button>
          {applicant.status !== "shortlisted" && applicant.status !== "rejected" && (
            <>
              <Button variant="outline" className="text-green-600" onClick={handleShortlistApplicant}>
                <ThumbsUp className="mr-2 h-4 w-4" />
                Shortlist
              </Button>
              <Button variant="outline" className="text-red-600" onClick={handleRejectApplicant}>
                <ThumbsDown className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Applicant Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Applicant Information</CardTitle>
            <CardDescription>Contact details and basic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {applicant.profilePhoto ? (
                  <img 
                    src={applicant.profilePhoto} 
                    alt={`${applicant.name}'s profile photo`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <User className="h-12 w-12 text-gray-500" />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{applicant.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{applicant.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p>{applicant.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Applied On</p>
                  <p>{applicant.appliedDate}</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-sm font-medium mb-2">Resume</p>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={!applicant.resume}
                onClick={() => {
                  if (applicant.resume) {
                    window.open(applicant.resume, '_blank');
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                {applicant.resume ? "Download Resume" : "No Resume Available"}
              </Button>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {applicant.skills && Array.isArray(applicant.skills) && applicant.skills.length > 0 ? (
                  applicant.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-gray-100">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No skills specified</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Languages</p>
              <div className="flex flex-wrap gap-2">
                {applicant.languages && Array.isArray(applicant.languages) && applicant.languages.length > 0 ? (
                  applicant.languages.map((language: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-gray-100">
                      {language}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No languages specified</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Links</p>
              <div className="space-y-2">
                {applicant.portfolioUrl && (
                  <Button variant="link" className="p-0 h-auto text-blue-600" asChild>
                    <a href={applicant.portfolioUrl} target="_blank" rel="noopener noreferrer">
                      Portfolio
                    </a>
                  </Button>
                )}
                {applicant.linkedinUrl && (
                  <Button variant="link" className="p-0 h-auto text-blue-600" asChild>
                    <a href={applicant.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  </Button>
                )}
                {applicant.githubUrl && (
                  <Button variant="link" className="p-0 h-auto text-blue-600" asChild>
                    <a href={applicant.githubUrl} target="_blank" rel="noopener noreferrer">
                      GitHub
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applicant Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
            <CardDescription>Resume, cover letter, and other details</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cover-letter">
              <TabsList className="mb-4">
                <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="cover-letter" className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="whitespace-pre-line">{applicant.coverLetter}</p>
                </div>
              </TabsContent>

              <TabsContent value="experience" className="space-y-4">
                {applicant.experience && applicant.experience.length > 0 ? (
                  applicant.experience.map((exp: any, index: number) => (
                    <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <h3 className="font-medium">{exp.title}</h3>
                          <p className="text-sm text-gray-500">
                            {exp.company} {exp.location ? `• ${exp.location}` : ''}
                          </p>
                          <p className="text-sm text-gray-500">
                            {exp.startDate || ''} {exp.endDate ? `- ${exp.endDate}` : (exp.startDate ? '- Present' : '')}
                          </p>
                          <p className="mt-2 text-sm">{exp.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-500 italic">No experience information provided.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="education" className="space-y-4">
                {applicant.education && applicant.education.length > 0 ? (
                  applicant.education.map((edu: any, index: number) => (
                    <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <h3 className="font-medium">{edu.degree}</h3>
                          <p className="text-sm text-gray-500">
                            {edu.institution} {edu.location ? `• ${edu.location}` : ''}
                          </p>
                          <p className="text-sm text-gray-500">
                            {edu.startDate || ''} {edu.endDate ? `- ${edu.endDate}` : ''}
                          </p>
                          {edu.description && <p className="mt-2 text-sm">{edu.description}</p>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-500 italic">No education information provided.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className={applicant.notes ? "whitespace-pre-line" : "text-gray-500 italic"}>
                    {applicant.notes || "No notes added yet."}
                  </p>
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Add Notes
                  </label>
                  <textarea
                    id="notes"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    rows={4}
                    placeholder="Add private notes about this applicant..."
                    defaultValue={applicant.notes}
                  ></textarea>
                  <div className="mt-2 flex justify-end">
                    <Button 
                      className="bg-yellow-500 hover:bg-yellow-600 text-black"
                      onClick={() => {
                        const notesElement = document.getElementById('notes') as HTMLTextAreaElement;
                        if (notesElement) {
                          saveApplicantNotes(notesElement.value);
                        }
                      }}
                    >
                      Save Notes
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" onClick={() => router.push(`/employer/jobs/${applicant.jobId}/applicants`)}>
              View All Applicants
            </Button>
            <div className="flex gap-3">
              {applicant.status !== "shortlisted" && applicant.status !== "rejected" ? (
                <>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={handleShortlistApplicant}>
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Shortlist
                  </Button>
                  <Button variant="outline" className="text-red-600" onClick={handleRejectApplicant}>
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              ) : (
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Applicant</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {applicant.name}? This action will mark the application as rejected.
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

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Applicant</DialogTitle>
            <DialogDescription>Send a message to {applicant.name} regarding their application.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  id="subject"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  placeholder="e.g. Your application for Senior Frontend Developer"
                  defaultValue={`Your application for ${applicant.jobTitle}`}
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  rows={6}
                  placeholder="Enter your message..."
                  defaultValue={`Dear ${applicant.name},\n\nThank you for your application for the ${applicant.jobTitle} position at our company. We have reviewed your application and would like to discuss it further with you.\n\nBest regards,\nRANAOJobs Employer`}
                ></textarea>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
              onClick={() => setShowContactDialog(false)}
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
