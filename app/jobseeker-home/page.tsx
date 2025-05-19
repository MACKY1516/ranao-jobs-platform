"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { AuthCheckModal } from "@/components/auth-check-modal"
import { Briefcase, MapPin, Upload, AlertCircle, MapIcon, User, Clock } from "lucide-react"
import Link from "next/link"

export default function JobseekerHomePage() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [profileCompletion, setProfileCompletion] = useState(40)
  const [hasResume, setHasResume] = useState(false)
  const [suggestedJobs, setSuggestedJobs] = useState([
    {
      id: "1",
      title: "Senior Frontend Developer",
      company: "Tech Solutions Inc.",
      location: "Marawi City",
      salary: "₱60,000 - ₱80,000",
      type: "Full-time",
      posted: "2 days ago",
      match: 95,
    },
    {
      id: "2",
      title: "UX Designer",
      company: "Creative Minds",
      location: "Iligan City",
      salary: "₱45,000 - ₱60,000",
      type: "Full-time",
      posted: "3 days ago",
      match: 88,
    },
    {
      id: "3",
      title: "Backend Developer",
      company: "Digital Solutions",
      location: "Cagayan de Oro",
      salary: "₱55,000 - ₱75,000",
      type: "Full-time",
      posted: "1 week ago",
      match: 82,
    },
    {
      id: "4",
      title: "Project Manager",
      company: "Innovative Systems",
      location: "Remote",
      salary: "₱70,000 - ₱90,000",
      type: "Contract",
      posted: "1 week ago",
      match: 78,
    },
  ])

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

  if (isLoading && !isAuthModalOpen) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <main className="flex-grow pt-20 pb-10 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Welcome Banner */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 dark:bg-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Hi, {userData?.firstName || "Jobseeker"}!</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Upload your profile picture and resume to increase your chances of getting hired.
                </p>
              </div>
              <Link href="/jobseeker/profile">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">Edit Profile</Button>
              </Link>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className="text-sm font-medium">{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} className="h-2" />
            </div>
          </div>

          {/* Resume Alert */}
          {!hasResume && (
            <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-600 dark:text-yellow-400">Resume Missing</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                You haven't uploaded your resume yet — Upload now to attract more employers.
              </AlertDescription>
              <Button className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-black" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Resume
              </Button>
            </Alert>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/jobseeker/applications">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Briefcase className="mr-2 h-4 w-4" />
                  My Applications
                </Button>
              </Link>
              <Link href="/job-map">
                <Button variant="outline">
                  <MapIcon className="mr-2 h-4 w-4" />
                  Explore Job Map
                </Button>
              </Link>
              <Link href="/jobseeker/profile">
                <Button variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Suggested Jobs */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Suggested Jobs</h2>
              <Link href="/find-jobs">
                <Button variant="link" className="text-yellow-600 dark:text-yellow-400">
                  View All Jobs
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestedJobs.map((job) => (
                <Card key={job.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription>{job.company}</CardDescription>
                      </div>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300">
                        {job.match}% Match
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <Briefcase className="h-4 w-4 mr-2" />
                        <span>{job.type}</span>
                      </div>
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Posted {job.posted}</span>
                      </div>
                      <div className="flex items-center font-medium text-green-600 dark:text-green-400">
                        {job.salary}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Link href={`/job/${job.id}`} className="w-full">
                      <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">View Job</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
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
