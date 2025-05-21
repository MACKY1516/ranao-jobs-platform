"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { AuthCheckModal } from "@/components/auth-check-modal"
import { Calendar, Clock, MapPin, Search, Filter, CheckCircle2, XCircle, Clock3 } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, doc, getDoc, Timestamp } from "firebase/firestore"
import { format } from "date-fns"

export default function JobseekerApplicationsPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [applications, setApplications] = useState<any[]>([])

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("ranaojobs_user")
    if (!storedUser) {
      setIsAuthModalOpen(true)
      return
    }

    const user = JSON.parse(storedUser)

    // Check if user has jobseeker role
    if (user.role !== "jobseeker" && user.role !== "multi") {
      router.push("/employer-home")
      return
    }

    // If multi-role, ensure active role is jobseeker
    if (user.role === "multi" && user.activeRole !== "jobseeker") {
      user.activeRole = "jobseeker"
      localStorage.setItem("ranaojobs_user", JSON.stringify(user))
    }

    setUserData(user)
    setIsLoading(false)
  }, [router])

  const getStatusIcon = (status) => {
    switch (status) {
      case "Interview Scheduled":
        return <Calendar className="h-5 w-5 text-green-600" />
      case "Application Reviewed":
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />
      case "Application Submitted":
        return <Clock3 className="h-5 w-5 text-yellow-600" />
      case "Rejected":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "Offer Received":
        return <CheckCircle2 className="h-5 w-5 text-purple-600" />
      default:
        return <Clock3 className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadgeColor = (statusColor) => {
    switch (statusColor) {
      case "green":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "blue":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "yellow":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "red":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "purple":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  if (isLoading && !isAuthModalOpen) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      <main className="flex-grow pt-20 pb-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <BackButton className="mb-4" href="/jobseeker-home" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">My Applications</h1>
              <p className="text-gray-600">Track and manage your job applications</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid grid-cols-5 gap-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="interviews">Interviews</TabsTrigger>
              <TabsTrigger value="offers">Offers</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{application.jobTitle}</CardTitle>
                          <CardDescription>{application.company}</CardDescription>
                        </div>
                        <Badge className={getStatusBadgeColor(application.statusColor)}>{application.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{application.location}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Applied on {application.appliedDate}</span>
                          </div>
                          <div className="flex items-center text-sm font-medium text-green-600">
                            {application.salary}
                          </div>
                        </div>

                        {application.interviewDate && (
                          <div className="flex items-center p-2 bg-green-50 rounded-md text-sm text-green-800">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Interview scheduled for {application.interviewDate}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                          <div className="flex items-center">
                            {getStatusIcon(application.status)}
                            <span className="ml-2 text-sm">{application.status}</span>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/job/${application.id}`}>
                              <Button variant="outline" size="sm">
                                View Job
                              </Button>
                            </Link>
                            <Link href={`/jobseeker/applications/${application.id}`}>
                              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" size="sm">
                                Track Application
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="active">
              <div className="space-y-4">
                {applications
                  .filter((app) => app.status !== "Rejected")
                  .map((application) => (
                    <Card key={application.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{application.jobTitle}</CardTitle>
                            <CardDescription>{application.company}</CardDescription>
                          </div>
                          <Badge className={getStatusBadgeColor(application.statusColor)}>{application.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>{application.location}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>Applied on {application.appliedDate}</span>
                            </div>
                            <div className="flex items-center text-sm font-medium text-green-600">
                              {application.salary}
                            </div>
                          </div>

                          {application.interviewDate && (
                            <div className="flex items-center p-2 bg-green-50 rounded-md text-sm text-green-800">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>Interview scheduled for {application.interviewDate}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2">
                            <div className="flex items-center">
                              {getStatusIcon(application.status)}
                              <span className="ml-2 text-sm">{application.status}</span>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/job/${application.id}`}>
                                <Button variant="outline" size="sm">
                                  View Job
                                </Button>
                              </Link>
                              <Link href={`/jobseeker/applications/${application.id}`}>
                                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" size="sm">
                                  Track Application
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="interviews">
              <div className="space-y-4">
                {applications
                  .filter((app) => app.status === "Interview Scheduled")
                  .map((application) => (
                    <Card key={application.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{application.jobTitle}</CardTitle>
                            <CardDescription>{application.company}</CardDescription>
                          </div>
                          <Badge className={getStatusBadgeColor(application.statusColor)}>{application.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>{application.location}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>Applied on {application.appliedDate}</span>
                            </div>
                            <div className="flex items-center text-sm font-medium text-green-600">
                              {application.salary}
                            </div>
                          </div>

                          {application.interviewDate && (
                            <div className="flex items-center p-2 bg-green-50 rounded-md text-sm text-green-800">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>Interview scheduled for {application.interviewDate}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2">
                            <div className="flex items-center">
                              {getStatusIcon(application.status)}
                              <span className="ml-2 text-sm">{application.status}</span>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/job/${application.id}`}>
                                <Button variant="outline" size="sm">
                                  View Job
                                </Button>
                              </Link>
                              <Link href={`/jobseeker/applications/${application.id}`}>
                                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" size="sm">
                                  Track Application
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="offers">
              <div className="space-y-4">
                {applications
                  .filter((app) => app.status === "Offer Received")
                  .map((application) => (
                    <Card key={application.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{application.jobTitle}</CardTitle>
                            <CardDescription>{application.company}</CardDescription>
                          </div>
                          <Badge className={getStatusBadgeColor(application.statusColor)}>{application.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>{application.location}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>Applied on {application.appliedDate}</span>
                            </div>
                            <div className="flex items-center text-sm font-medium text-green-600">
                              {application.salary}
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <div className="flex items-center">
                              {getStatusIcon(application.status)}
                              <span className="ml-2 text-sm">{application.status}</span>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/job/${application.id}`}>
                                <Button variant="outline" size="sm">
                                  View Job
                                </Button>
                              </Link>
                              <Link href={`/jobseeker/applications/${application.id}`}>
                                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" size="sm">
                                  View Offer
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="rejected">
              <div className="space-y-4">
                {applications
                  .filter((app) => app.status === "Rejected")
                  .map((application) => (
                    <Card key={application.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{application.jobTitle}</CardTitle>
                            <CardDescription>{application.company}</CardDescription>
                          </div>
                          <Badge className={getStatusBadgeColor(application.statusColor)}>{application.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>{application.location}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>Applied on {application.appliedDate}</span>
                            </div>
                            <div className="flex items-center text-sm font-medium text-green-600">
                              {application.salary}
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <div className="flex items-center">
                              {getStatusIcon(application.status)}
                              <span className="ml-2 text-sm">{application.status}</span>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/job/${application.id}`}>
                                <Button variant="outline" size="sm">
                                  View Job
                                </Button>
                              </Link>
                              <Link href={`/find-jobs`}>
                                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" size="sm">
                                  Find Similar Jobs
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      <AuthCheckModal
        isOpen={isAuthModalOpen}
        onClose={() => router.push("/")}
        title="Jobseeker Account Required"
        message="You need to login or register as a jobseeker to access this page."
      />
    </div>
  )
}
