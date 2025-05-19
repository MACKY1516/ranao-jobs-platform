"use client"

import { useState, useEffect } from "react"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BackButton } from "@/components/back-button"
import { EmployerRating } from "@/components/employer-rating"
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Briefcase,
  GraduationCap,
  Users,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Mock job data - in a real app, this would come from an API
  const job = {
    id: params.id,
    title: "Senior Frontend Developer",
    company: "Tech Solutions Inc.",
    companyId: "1",
    location: "Marawi City, Lanao del Sur",
    type: "Full-time",
    category: "Development",
    salary: "₱60,000 - ₱80,000",
    postedAt: "2 days ago",
    deadline: "30 days remaining",
    description:
      "We are looking for a Senior Frontend Developer to join our team. You will be responsible for building user interfaces for our web applications using React and Next.js.",
    responsibilities: [
      "Develop and maintain user interfaces for web applications",
      "Collaborate with backend developers to integrate frontend with APIs",
      "Optimize applications for maximum speed and scalability",
      "Implement responsive design and ensure cross-browser compatibility",
      "Participate in code reviews and maintain code quality",
    ],
    requirements: [
      "3+ years of experience with React.js",
      "Strong proficiency in JavaScript, HTML, and CSS",
      "Experience with Next.js and TypeScript",
      "Familiarity with RESTful APIs and GraphQL",
      "Understanding of UI/UX design principles",
    ],
    benefits: [
      "Competitive salary package",
      "Health insurance",
      "13th month pay",
      "Flexible working hours",
      "Professional development opportunities",
    ],
    skills: ["React", "TypeScript", "Next.js", "HTML", "CSS", "JavaScript"],
    education: "Bachelor's degree in Computer Science or related field",
    experience: "3+ years of experience in frontend development",
    applicationCount: 12,
  }

  // Check user role
  useEffect(() => {
    const userData = localStorage.getItem("ranaojobs_user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.activeRole || user.role)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }

    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto max-w-4xl px-4 pt-20 pb-10">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <NavBar />

      <div className="container mx-auto max-w-4xl px-4 pt-20 pb-10">
        <BackButton className="mb-4" />

        {/* Job Header */}
        <div className="bg-gray-900 text-white rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <div className="flex items-center mt-1">
                <Building2 className="h-4 w-4 mr-1" />
                <Link href={`/employer/${job.companyId}`} className="hover:text-yellow-400 transition-colors">
                  {job.company}
                </Link>
                <div className="ml-2">
                  <EmployerRating
                    employerId={job.companyId}
                    employerName={job.company}
                    initialRating={4.2}
                    showRatingButton={false}
                    size="sm"
                  />
                </div>
              </div>
            </div>
            <Badge className="bg-yellow-500 text-black">{job.type}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-gray-300" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-300" />
              <span>Posted {job.postedAt}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-gray-300" />
              <span>Deadline: {job.deadline}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-400" />
              <span className="text-green-400 font-medium">{job.salary}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {userRole !== "employer" && (
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">Apply Now</Button>
            )}
            <Link href={`/employer/${job.companyId}`}>
              <Button variant="outline">View Profile</Button>
            </Link>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="description">
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="requirements">Requirements</TabsTrigger>
                    <TabsTrigger value="benefits">Benefits</TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                      <p className="text-gray-700">{job.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Responsibilities</h3>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        {job.responsibilities.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="requirements" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        {job.requirements.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="bg-gray-100">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="benefits" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Benefits</h3>
                      <ul className="space-y-2 text-gray-700">
                        {job.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Job Overview</h3>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <Briefcase className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Job Type</p>
                      <p className="font-medium">{job.type}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <GraduationCap className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Education</p>
                      <p className="font-medium">{job.education}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="font-medium">{job.experience}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Users className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Applications</p>
                      <p className="font-medium">{job.applicationCount} candidates</p>
                    </div>
                  </div>
                </div>

                {userRole !== "employer" && (
                  <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black mt-2">Apply Now</Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">About the Company</h3>
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center text-lg font-bold mr-3">
                    {job.company.charAt(0)}
                  </div>
                  <div>
                    <Link href={`/employer/${job.companyId}`} className="font-medium hover:text-yellow-500">
                      {job.company}
                    </Link>
                    <div className="flex items-center mt-1">
                      <EmployerRating
                        employerId={job.companyId}
                        employerName={job.company}
                        initialRating={4.2}
                        showRatingButton={false}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
                <Link href={`/employer/${job.companyId}`}>
                  <Button variant="outline" className="w-full">
                    View Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
