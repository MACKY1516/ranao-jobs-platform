"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmployerRating } from "@/components/employer-rating"
import { MapPin, Globe, Mail, Phone, Calendar, Users, Briefcase } from "lucide-react"
import { BackButton } from "@/components/back-button"

export default function EmployerProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Mock employer data - in a real app, this would come from an API
  const employer = {
    id: params.id,
    name: "Tech Solutions Inc.",
    logo: null,
    description:
      "Tech Solutions Inc. is a leading technology company specializing in web and mobile application development. We work with clients across various industries to deliver innovative digital solutions.",
    industry: "Technology",
    location: "Marawi City, Banggolo",
    website: "https://techsolutions.example.com",
    email: "contact@techsolutions.example.com",
    phone: "+63 123 456 7890",
    foundedYear: "2015",
    employeeCount: "11-50 employees",
    rating: 4.2,
    reviewCount: 15,
    verified: true,
    socialMedia: {
      linkedin: "https://linkedin.com/company/techsolutions",
      facebook: "https://facebook.com/techsolutions",
      twitter: "https://twitter.com/techsolutions",
    },
  }

  // Mock job listings from this employer
  const jobs = [
    {
      id: "1",
      title: "Senior Frontend Developer",
      location: "Marawi City",
      type: "Full-time",
      salary: "₱60,000 - ₱80,000",
      postedAt: "2 days ago",
    },
    {
      id: "2",
      title: "Backend Engineer",
      location: "Marawi City",
      type: "Full-time",
      salary: "₱65,000 - ₱85,000",
      postedAt: "1 week ago",
    },
    {
      id: "3",
      title: "UI/UX Designer",
      location: "Remote",
      type: "Full-time",
      salary: "₱50,000 - ₱70,000",
      postedAt: "2 weeks ago",
    },
  ]

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
        <div className="container mx-auto max-w-6xl px-4 pt-20 pb-10">
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

      <div className="container mx-auto max-w-6xl px-4 pt-20 pb-10">
        <BackButton className="mb-4" />

        {/* Employer Header */}
        <div className="bg-gray-900 text-white rounded-t-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-700 rounded-lg flex items-center justify-center text-2xl font-bold">
              {employer.name.charAt(0)}
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="text-2xl font-bold">{employer.name}</h1>
                {employer.verified && <Badge className="bg-blue-500 text-white">Verified</Badge>}
              </div>

              <div className="flex items-center mt-1">
                <EmployerRating
                  employerId={employer.id}
                  employerName={employer.name}
                  initialRating={employer.rating}
                  showRatingButton={userRole === "jobseeker"}
                />
                <span className="text-sm text-gray-300 ml-2">({employer.reviewCount} reviews)</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-300">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{employer.location}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-1" />
                  <span>{employer.industry}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Company Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <a
                        href={employer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {employer.website.replace(/(^\w+:|^)\/\//, "")}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href={`mailto:${employer.email}`} className="text-blue-600 hover:underline">
                        {employer.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p>{employer.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Founded</p>
                      <p>{employer.foundedYear}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Company Size</p>
                      <p>{employer.employeeCount}</p>
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500 mb-2">Connect with {employer.name}</p>
                  <div className="flex gap-2">
                    {Object.entries(employer.socialMedia).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <span className="sr-only">{platform}</span>
                        {platform === "linkedin" && (
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        )}
                        {platform === "facebook" && (
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                          </svg>
                        )}
                        {platform === "twitter" && (
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                          </svg>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rate this Employer - Only visible to jobseekers */}
            {userRole === "jobseeker" && (
              <Card>
                <CardHeader>
                  <CardTitle>Rate this Employer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    Share your experience with {employer.name} to help other job seekers make informed decisions.
                  </p>
                  <Button
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                    onClick={() => {
                      // Open rating dialog
                      const ratingComponent = document.querySelector("[data-employer-rating]")
                      if (ratingComponent) {
                        ;(ratingComponent as HTMLElement).click()
                      }
                    }}
                  >
                    Write a Review
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="jobs">Open Jobs</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About {employer.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{employer.description}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="jobs" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Job Openings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {jobs.length > 0 ? (
                      <div className="space-y-4">
                        {jobs.map((job) => (
                          <div key={job.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <h3 className="font-medium hover:text-yellow-500">
                              <a href={`/job/${job.id}`}>{job.title}</a>
                            </h3>
                            <div className="flex flex-wrap gap-y-1 gap-x-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center">
                                <Briefcase className="h-3 w-3 mr-1" />
                                <span>{job.type}</span>
                              </div>
                              <div className="flex items-center text-green-600 font-medium">
                                <span>{job.salary}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-400">Posted {job.postedAt}</span>
                              <Button asChild size="sm" variant="outline">
                                <a href={`/job/${job.id}`}>View Details</a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No job openings available at the moment.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Footer />

      {/* Hidden button for rating dialog trigger */}
      <button
        className="hidden"
        data-employer-rating
        onClick={() => {
          const ratingDialog = document.querySelector("[data-rating-dialog]")
          if (ratingDialog) {
            ;(ratingDialog as HTMLElement).click()
          }
        }}
      />

      {/* Rating component with hidden trigger */}
      <div className="hidden">
        <EmployerRating employerId={employer.id} employerName={employer.name} initialRating={0} />
      </div>
    </div>
  )
}
