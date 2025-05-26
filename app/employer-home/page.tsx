"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { AuthCheckModal } from "@/components/auth-check-modal"
import { Briefcase, Users, Clock, AlertCircle, ChevronRight, Bell, CheckCircle2, LogIn, Edit, User, FileText, XCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc, Timestamp } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { calculateEmployerProfileCompletion } from "@/lib/profileCompletion"

export default function EmployerHomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplicants: 0,
    activeJobs: 0,
    newApplicants: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  // Activity type icons mapping for employer activities (same as activity page)
  const activityIcons: Record<string, any> = {
    login: <LogIn className="h-4 w-4 text-green-600" />,
    job_edit: <Edit className="h-4 w-4 text-orange-600" />,
    profile_update: <User className="h-4 w-4 text-blue-600" />,
    job_post: <Briefcase className="h-4 w-4 text-yellow-600" />,
    job_delete: <Trash2 className="h-4 w-4 text-red-600" />,
    job_status_change: <Clock className="h-4 w-4 text-gray-500" />,
    application: <FileText className="h-4 w-4 text-purple-600" />,
    approval: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    rejection: <XCircle className="h-4 w-4 text-red-600" />,
    // Add other employer-specific activity types here with appropriate icons
    info: <Bell className="h-4 w-4 text-purple-600" /> // Default or general info icon
  }

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("ranaojobs_user")
    if (!storedUser) {
      setIsAuthModalOpen(true)
      return
    }

    const user = JSON.parse(storedUser)

    // Check if user has employer role
    if (user.role !== "employer" && user.role !== "multi") {
      router.push("/jobseeker-home")
      return
    }

    // If multi-role, ensure active role is employer
    if (user.role === "multi" && user.activeRole !== "employer") {
      user.activeRole = "employer"
      localStorage.setItem("ranaojobs_user", JSON.stringify(user))
    }

    setUserData(user)
    
    // Fetch employer data from Firestore
    const fetchEmployerData = async () => {
      try {
        // Get all jobs posted by this employer
        const jobsQuery = query(
          collection(db, "jobs"),
          where("employerId", "==", user.id),
          orderBy("createdAt", "desc")
        )
        const jobsSnapshot = await getDocs(jobsQuery)
        
        // Count ALL jobs regardless of approval status
        const totalJobs = jobsSnapshot.size
        
        // Count active jobs (isActive === true)
        const activeJobs = jobsSnapshot.docs.filter(doc => doc.data().isActive === true).length
        
        // Count total applicants across all jobs
        let applicantsCount = 0
        let newApplicantsCount = 0
        
        // Fetch total applicants count for the employer's jobs
        const applicationsQuery = query(
          collection(db, "applications"),
          where("employerId", "==", user.id)
        )
        const applicationsSnapshot = await getDocs(applicationsQuery)
        applicantsCount = applicationsSnapshot.size
        
        // Count new/unreviewed applications (assuming status is 'pending' or 'new')
        newApplicantsCount = applicationsSnapshot.docs.filter(doc => 
          doc.data().status === "pending" || doc.data().status === "new"
        ).length
        
        // Fetch recent activities from the dedicated 'activity_emp' collection
        const recentActivitiesQuery = query(
          collection(db, "activity_emp"),
          where("employerId", "==", user.id),
          orderBy("createdAt", "desc"),
          limit(5) // Limit to show only the most recent 5 activities
        )
        
        const recentActivitiesSnapshot = await getDocs(recentActivitiesQuery)
        
        const activityList = recentActivitiesSnapshot.docs.map(doc => {
          const data = doc.data()
          const createdTime = data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate() 
            : new Date(data.createdAt)
            
          return {
            id: doc.id,
            type: data.type || "info", // Use activity type from Firestore
            message: data.message || "",
            time: formatDistanceToNow(createdTime, { addSuffix: true }),
            metadata: data.metadata || {} // Include metadata field
          }
        })
        
        setRecentActivity(activityList)
        
        // Update stats
        setStats({
          totalJobs,
          totalApplicants: applicantsCount,
          activeJobs,
          newApplicants: newApplicantsCount
        })
        
        // Calculate profile completion using the new utility function
        const completionPercentage = await calculateEmployerProfileCompletion(user.id)
        setProfileCompletion(completionPercentage)
        
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching employer data:", error)
        toast({
          title: "Error",
          description: "Failed to load your dashboard data",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }
    
    fetchEmployerData()
  }, [router, toast])

  if (isLoading && !isAuthModalOpen) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      <main className="flex-grow pt-20 pb-10 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Welcome Banner */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  Welcome, {userData?.companyName || userData?.firstName || "Employer"}!
                </h1>
                <p className="text-gray-600">Complete your company profile to build credibility with applicants.</p>
              </div>
              <Link href="/employer/profile">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">Complete Profile</Button>
              </Link>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Company Profile Completion</span>
                <span className="text-sm font-medium">{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} className="h-2" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Jobs Posted</CardTitle>
                <CardDescription>All jobs (including pending approval)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{stats.totalJobs}</div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/employer/jobs">
                    <Button variant="ghost" size="sm" className="p-0 h-auto text-blue-600">
                      View all jobs
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Applicants</CardTitle>
                <CardDescription>Applications across all jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{stats.totalApplicants}</div>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/employer/applicants">
                    <Button variant="ghost" size="sm" className="p-0 h-auto text-purple-600">
                      View all applicants
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Active Jobs</CardTitle>
                <CardDescription>Jobs that are currently active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{stats.activeJobs}</div>
                  <div className="p-2 bg-orange-100 rounded-full">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/employer/jobs?filter=active">
                    <Button variant="ghost" size="sm" className="p-0 h-auto text-orange-600">
                      View active jobs
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">New Applicants</CardTitle>
                <CardDescription>Unreviewed job applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{stats.newApplicants}</div>
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/employer/applicants?filter=new">
                    <Button variant="ghost" size="sm" className="p-0 h-auto text-yellow-600">
                      View new applicants
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/post-job">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Post a Job
                </Button>
              </Link>
              <Link href="/employer/jobs">
                <Button variant="outline">View My Jobs</Button>
              </Link>
              <Link href="/employer/applicants">
                <Button variant="outline">View Applicants</Button>
              </Link>
              {/* <Link href="/employer-home/notification">
                <Button variant="outline" className="relative">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                  {stats.newApplicants > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {stats.newApplicants}
                    </span>
                  )}
                </Button>
              </Link> */}
            </div>
          </div>

          {/* Job Analytics */}

          <div className="grid grid-cols-1 gap-6">
            {/* Recent Activity */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50">
                          <div
                            className={`p-2 rounded-full flex-shrink-0 
                            ${
                              activity.type === "application"
                                ? "bg-blue-100"
                                : activity.type === "approval"
                                  ? "bg-green-100"
                                  : "bg-purple-100"
                            }`}
                          >
                            {/* Use the mapped icon based on activity type */}
                            {activityIcons[activity.type] || activityIcons.info}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.message}</p>
                            {activity.metadata && activity.metadata.changes && Object.keys(activity.metadata.changes).length > 0 && (
                              <div className="mt-1 text-xs text-gray-500 bg-gray-50 p-2 rounded-sm">
                                <p className="font-medium">Changes:</p>
                                <div className="max-h-20 overflow-y-auto">
                                  {Object.entries(activity.metadata.changes)
                                    .slice(0, 3) // Limit to first 3 changes to save space
                                    .map(([key, value], index) => (
                                      <p key={key + index} className="ml-2">
                                        <span className="font-semibold">{key}:</span> {
                                          typeof value === 'object' && value !== null 
                                            ? JSON.stringify(value).substring(0, 40) + (JSON.stringify(value).length > 40 ? '...' : '')  // Truncate long values
                                            : String(value).substring(0, 40) + (String(value).length > 40 ? '...' : '')
                                        }
                                      </p>
                                  ))}
                                  {Object.keys(activity.metadata.changes).length > 3 && (
                                    <p className="ml-2 text-blue-500">+{Object.keys(activity.metadata.changes).length - 3} more changes</p>
                                  )}
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No recent activities to display.
                    </div>
                  )}
                  {recentActivity.length > 0 && (
                    <div className="mt-4 text-center">
                      <Button variant="ghost" size="sm" onClick={() => router.push('/employer-home/activity')}>
                        View All Activity
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <AuthCheckModal
        isOpen={isAuthModalOpen}
        onClose={() => router.push("/")}
        title="Employer Account Required"
        message="You need to login or register as an employer to access this page."
      />
    </div>
  )
}
