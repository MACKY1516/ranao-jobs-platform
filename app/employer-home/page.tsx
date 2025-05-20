"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { AuthCheckModal } from "@/components/auth-check-modal"
import { Briefcase, Users, Clock, AlertCircle, ChevronRight, Bell, CheckCircle2 } from "lucide-react"
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
    jobsAwaitingApproval: 0,
    newApplicants: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

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
        
        // Count pending jobs (those with isActive = false or undefined)
        const pendingJobs = jobsSnapshot.docs.filter(doc => {
          const data = doc.data()
          return data.isActive === false || data.isActive === undefined
        }).length
        
        // Count total applicants across all jobs
        let applicantsCount = 0
        let newApplicantsCount = 0
        
        // Get applications for all jobs
        const jobIds = jobsSnapshot.docs.map(doc => doc.id)
        
        if (jobIds.length > 0) {
          const applicationsQuery = query(
            collection(db, "applications"),
            where("employerId", "==", user.id)
          )
          const applicationsSnapshot = await getDocs(applicationsQuery)
          
          applicantsCount = applicationsSnapshot.size
          
          // Count new/unreviewed applications
          newApplicantsCount = applicationsSnapshot.docs.filter(doc => 
            doc.data().status === "pending" || doc.data().status === "new"
          ).length
          
          // Get recent activity from applications
          const recentActivitiesQuery = query(
            collection(db, "applications"),
            where("employerId", "==", user.id),
            orderBy("createdAt", "desc"),
            limit(5)
          )
          
          const recentActivitiesSnapshot = await getDocs(recentActivitiesQuery)
          
          const activities = await Promise.all(recentActivitiesSnapshot.docs.map(async (appDoc) => {
            const appData = appDoc.data()
            
            // Get job title
            let jobTitle = "Unknown Job"
            if (appData.jobId) {
              const jobDoc = await getDoc(doc(db, "jobs", appData.jobId))
              if (jobDoc.exists()) {
                jobTitle = jobDoc.data().title
              }
            }
            
            // Get applicant name
            let applicantName = "Someone"
            if (appData.userId) {
              const userDoc = await getDoc(doc(db, "users", appData.userId))
              if (userDoc.exists()) {
                const userData = userDoc.data()
                applicantName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || "Someone"
              }
            }
            
            const createdTime = appData.createdAt instanceof Timestamp 
              ? appData.createdAt.toDate() 
              : new Date(appData.createdAt)
              
            return {
              id: appDoc.id,
              type: "application",
              message: `${applicantName} applied to ${jobTitle}`,
              time: formatDistanceToNow(createdTime, { addSuffix: true })
            }
          }))
          
          // Add job approval notifications to activity feed
          const approvedJobs = jobsSnapshot.docs
            .filter(doc => doc.data().isActive)
            .map(doc => {
              const jobData = doc.data()
              const updatedTime = jobData.updatedAt instanceof Timestamp 
                ? jobData.updatedAt.toDate() 
                : new Date(jobData.updatedAt)
                
              return {
                id: `job-${doc.id}`,
                type: "approval",
                message: `Your job posting for ${jobData.title} has been approved`,
                time: formatDistanceToNow(updatedTime, { addSuffix: true })
              }
            })
            .slice(0, 2) // Only take latest 2 approved jobs
          
          setRecentActivity([...activities, ...approvedJobs]
            .sort((a, b) => {
              // Sort by time (this is a rough approximation since the times are strings)
              return new Date(b.time).getTime() - new Date(a.time).getTime()
            })
            .slice(0, 5) // Limit to 5 activities
          )
        }
        
        // Update stats
        setStats({
          totalJobs,
          totalApplicants: applicantsCount,
          jobsAwaitingApproval: pendingJobs,
          newApplicants: newApplicantsCount
        })
        
        // Calculate profile completion using the new utility function
        const completionPercentage = await calculateEmployerProfileCompletion(user.id);
        setProfileCompletion(completionPercentage);
        
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
                <CardTitle className="text-lg">Jobs Awaiting Approval</CardTitle>
                <CardDescription>Jobs pending admin approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{stats.jobsAwaitingApproval}</div>
                  <div className="p-2 bg-orange-100 rounded-full">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/employer/jobs?filter=pending">
                    <Button variant="ghost" size="sm" className="p-0 h-auto text-orange-600">
                      View pending jobs
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
                            {activity.type === "application" ? (
                              <Users className={`h-4 w-4 text-blue-600`} />
                            ) : activity.type === "approval" ? (
                              <CheckCircle2 className={`h-4 w-4 text-green-600`} />
                            ) : (
                              <Bell className={`h-4 w-4 text-purple-600`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.message}</p>
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
                      <Button variant="ghost" size="sm" onClick={() => router.push('/employer/applicants')}>
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
