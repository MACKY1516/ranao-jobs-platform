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

interface ApplicantProfileProps {
  applicantId: string
}

export function ApplicantProfile({ applicantId }: ApplicantProfileProps) {
  const router = useRouter()
  const [applicant, setApplicant] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)

  useEffect(() => {
    // In a real app, this would be an API call to fetch applicant details
    // For now, we'll use mock data
    setTimeout(() => {
      setApplicant({
        id: applicantId,
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+63 123 456 7890",
        location: "Marawi City, Banggolo",
        jobTitle: "Senior Frontend Developer",
        jobId: "1",
        appliedDate: "May 18, 2023",
        status: "new",
        resume: "john_doe_resume.pdf",
        coverLetter:
          "I am excited to apply for the Senior Frontend Developer position at your company. With over 5 years of experience in frontend development, I believe I have the skills and expertise to contribute significantly to your team. I am particularly drawn to your company's focus on user experience and innovative solutions. I look forward to the opportunity to discuss how my background, skills, and experience would be a good match for this position.",
        experience: [
          {
            title: "Frontend Developer",
            company: "Tech Solutions Inc.",
            location: "Marawi City",
            period: "2020 - Present",
            description:
              "Developed and maintained responsive web applications using React, TypeScript, and modern CSS frameworks. Collaborated with UX designers and backend developers to implement new features and improve existing ones.",
          },
          {
            title: "Junior Web Developer",
            company: "Digital Innovations",
            location: "Marawi City",
            period: "2018 - 2020",
            description:
              "Built and maintained websites using HTML, CSS, and JavaScript. Worked on various client projects, ensuring responsive design and cross-browser compatibility.",
          },
        ],
        education: [
          {
            degree: "Bachelor of Science in Computer Science",
            institution: "Mindanao State University",
            location: "Marawi City",
            year: "2014 - 2018",
          },
        ],
        skills: ["JavaScript", "React", "TypeScript", "HTML", "CSS", "Redux", "Node.js", "Git", "Responsive Design"],
        languages: ["English (Fluent)", "Filipino (Native)"],
        portfolioUrl: "https://johndoe-portfolio.com",
        linkedinUrl: "https://linkedin.com/in/johndoe",
        githubUrl: "https://github.com/johndoe",
      })
      setIsLoading(false)
    }, 1000)
  }, [applicantId])

  const handleShortlistApplicant = () => {
    // In a real app, this would be an API call to shortlist the applicant
    setApplicant({ ...applicant, status: "shortlisted" })
  }

  const handleRejectApplicant = () => {
    setShowRejectDialog(true)
  }

  const confirmRejectApplicant = () => {
    // In a real app, this would be an API call to reject the applicant
    setApplicant({ ...applicant, status: "rejected" })
    setShowRejectDialog(false)
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
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-12 w-12 text-gray-500" />
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
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Resume
              </Button>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {applicant.skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-gray-100">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Languages</p>
              <div className="flex flex-wrap gap-2">
                {applicant.languages.map((language: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-gray-100">
                    {language}
                  </Badge>
                ))}
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
                {applicant.experience.map((exp: any, index: number) => (
                  <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <h3 className="font-medium">{exp.title}</h3>
                        <p className="text-sm text-gray-500">
                          {exp.company} • {exp.location}
                        </p>
                        <p className="text-sm text-gray-500">{exp.period}</p>
                        <p className="mt-2 text-sm">{exp.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="education" className="space-y-4">
                {applicant.education.map((edu: any, index: number) => (
                  <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <h3 className="font-medium">{edu.degree}</h3>
                        <p className="text-sm text-gray-500">
                          {edu.institution} • {edu.location}
                        </p>
                        <p className="text-sm text-gray-500">{edu.year}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-500 italic">No notes added yet.</p>
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
                  ></textarea>
                  <div className="mt-2 flex justify-end">
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">Save Notes</Button>
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
