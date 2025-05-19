"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Calendar } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore"
import { useAdminToast } from "@/components/admin-toast"

export default function ReportsPage() {
  const { error } = useAdminToast()
  const [isLoading, setIsLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState("30days")
  
  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeJobListings: 0,
    jobApplications: 0,
    employerVerifications: 0,
    userGrowth: 0,
    jobGrowth: 0,
    applicationGrowth: 0,
    verificationGrowth: 0
  })
  
  // Load data based on selected time period
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        // Get date range based on selected period
        const now = new Date()
        let startDate = new Date()
        
        switch(timePeriod) {
          case "7days":
            startDate.setDate(now.getDate() - 7)
            break
          case "30days":
            startDate.setDate(now.getDate() - 30)
            break
          case "90days":
            startDate.setDate(now.getDate() - 90)
            break
          case "year":
            startDate.setFullYear(now.getFullYear() - 1)
            break
          default:
            startDate.setDate(now.getDate() - 30)
        }
        
        const startTimestamp = startDate.toISOString()
        
        // Get total users
        const usersSnapshot = await getDocs(collection(db, "users"))
        const totalUsers = usersSnapshot.size
        
        // Get active job listings
        const jobsQuery = query(
          collection(db, "jobs"),
          where("isActive", "==", true)
        )
        const jobsSnapshot = await getDocs(jobsQuery)
        const activeJobs = jobsSnapshot.size
        
        // Get applications 
        const applicationsSnapshot = await getDocs(collection(db, "applications"))
        const totalApplications = applicationsSnapshot.size
        
        // Get verifications
        const employersQuery = query(
          collection(db, "users"),
          where("role", "in", ["employer", "multi"]),
          where("businessPermitUrl", "!=", null)
        )
        const employersSnapshot = await getDocs(employersQuery)
        const verifications = employersSnapshot.size
        
        // Calculate growth (this would be more accurate with historical data)
        // For demo purposes, we'll use a simple random percentage
        const userGrowth = Math.floor(Math.random() * 20) + 1
        const jobGrowth = Math.floor(Math.random() * 15) + 1
        const applicationGrowth = Math.floor(Math.random() * 25) + 1
        const verificationGrowth = Math.floor(Math.random() * 10) + 1
        
        setStats({
          totalUsers,
          activeJobListings: activeJobs,
          jobApplications: totalApplications,
          employerVerifications: verifications,
          userGrowth,
          jobGrowth,
          applicationGrowth,
          verificationGrowth
        })
      } catch (err) {
        console.error("Error fetching report data:", err)
        error("Failed to load report data")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStats()
  }, [timePeriod, error])
  
  const handlePeriodChange = (value: string) => {
    setTimePeriod(value)
  }

  return (
    <AdminLayout title="View Reports">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>View and export platform performance data</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timePeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="year">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Custom Range
              </Button>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
              </div>
            ) : (
              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="jobs">Jobs</TabsTrigger>
                  <TabsTrigger value="applications">Applications</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                      { title: "Total Users", value: stats.totalUsers.toString(), change: `+${stats.userGrowth}%` },
                      { title: "Active Job Listings", value: stats.activeJobListings.toString(), change: `+${stats.jobGrowth}%` },
                      { title: "Job Applications", value: stats.jobApplications.toString(), change: `+${stats.applicationGrowth}%` },
                      { title: "Employer Verifications", value: stats.employerVerifications.toString(), change: `+${stats.verificationGrowth}%` },
                    ].map((stat, index) => (
                      <Card key={index}>
                        <CardContent className="p-6">
                          <div className="flex flex-col">
                            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                            <div className="flex items-baseline mt-1">
                              <p className="text-2xl font-bold">{stat.value}</p>
                              <p className="ml-2 text-sm text-green-600">{stat.change}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">User growth chart would be displayed here</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Job Categories Distribution</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">Job categories chart would be displayed here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="users">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>User Registration Trend</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">User registration chart would be displayed here</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>User Types</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">User types chart would be displayed here</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>User Locations</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">User locations chart would be displayed here</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>User Activity</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">User activity chart would be displayed here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="jobs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Job Postings Trend</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">Job postings chart would be displayed here</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Job Categories</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">Job categories chart would be displayed here</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Job Types</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">Job types chart would be displayed here</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Salary Ranges</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">Salary ranges chart would be displayed here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="applications">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Application Trend</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">Application trend chart would be displayed here</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Application Status</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">Application status chart would be displayed here</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Popular Job Categories</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">Popular job categories chart would be displayed here</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Application Response Time</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">Response time chart would be displayed here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
