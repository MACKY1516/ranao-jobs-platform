"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Calendar } from "lucide-react"
import { db } from "@/lib/firebase"
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp, 
  startAt, 
  endAt,
  doc,
  getDoc
} from "firebase/firestore"
import { useAdminToast } from "@/components/admin-toast"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format, startOfDay, subDays, subMonths, subYears } from 'date-fns'

// Define interfaces for chart data
interface ChartDataPoint {
  name: string;
  value: number;
}

interface UserTypeCounts {
  jobseeker: number;
  employer: number;
  multi: number;
  admin: number;
}

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

  // Chart data state
  const [chartData, setChartData] = useState<{
    userGrowthData: { name: string; users: number }[];
    jobCategoriesData: ChartDataPoint[];
    userTypesData: ChartDataPoint[];
    userLocationsData: ChartDataPoint[];
    userActivityData: any[];
    jobPostingTrendData: { name: string; jobs: number }[];
    jobCategoriesChartData: ChartDataPoint[];
    jobTypesData: ChartDataPoint[];
    salaryRangesData: any[];
    applicationTrendData: { name: string; users: number }[];
    applicationStatusData: ChartDataPoint[];
    popularJobCategoriesData: ChartDataPoint[];
    responseTimeData: any[];
  }>({
    userGrowthData: [],
    jobCategoriesData: [],
    userTypesData: [],
    userLocationsData: [],
    userActivityData: [],
    jobPostingTrendData: [],
    jobCategoriesChartData: [],
    jobTypesData: [],
    salaryRangesData: [],
    applicationTrendData: [],
    applicationStatusData: [],
    popularJobCategoriesData: [],
    responseTimeData: []
  })
  
  // Helper function to format Firestore timestamps
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp.toISOString();
    if (timestamp?.toDate) return timestamp.toDate().toISOString();
    if (typeof timestamp === 'string') return timestamp;
    return null;
  };

  // Load data based on selected time period
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        // Get date range based on selected period
        const now = new Date()
        let startDate = new Date()
        let previousStartDate = new Date()
        
        switch(timePeriod) {
          case "7days":
            startDate = startOfDay(subDays(now, 7))
            previousStartDate = startOfDay(subDays(now, 14))
            break
          case "30days":
            startDate = startOfDay(subDays(now, 30))
            previousStartDate = startOfDay(subDays(now, 60))
            break
          case "90days":
            startDate = startOfDay(subDays(now, 90))
            previousStartDate = startOfDay(subDays(now, 180))
            break
          case "year":
            startDate = startOfDay(subYears(now, 1))
            previousStartDate = startOfDay(subYears(now, 2))
            break
          default:
            startDate = startOfDay(subDays(now, 30))
            previousStartDate = startOfDay(subDays(now, 60))
        }
        
        const startTimestamp = Timestamp.fromDate(startDate)
        const previousStartTimestamp = Timestamp.fromDate(previousStartDate)
        
        // Get total users and calculate growth
        const usersQuery = query(collection(db, "users"))
        const usersSnapshot = await getDocs(usersQuery)
        const totalUsers = usersSnapshot.size
        
        const newUsersQuery = query(
          collection(db, "users"),
          where("createdAt", ">=", startTimestamp)
        )
        const newUsersSnapshot = await getDocs(newUsersQuery)
        const newUsers = newUsersSnapshot.size
        
        const previousNewUsersQuery = query(
          collection(db, "users"),
          where("createdAt", ">=", previousStartTimestamp),
          where("createdAt", "<", startTimestamp)
        )
        const previousNewUsersSnapshot = await getDocs(previousNewUsersQuery)
        const previousNewUsers = previousNewUsersSnapshot.size
        
        const userGrowth = previousNewUsers > 0
          ? Math.round(((newUsers - previousNewUsers) / previousNewUsers) * 100)
          : newUsers > 0 ? 100 : 0

        // Format user data to handle timestamps
        const formatUserData = (doc: any) => {
          const data = doc.data()
          return {
            ...data,
            createdAt: formatTimestamp(data.createdAt),
            updatedAt: formatTimestamp(data.updatedAt)
          }
        }

        // Format job data to handle timestamps
        const formatJobData = (doc: any) => {
          const data = doc.data()
          return {
            ...data,
            createdAt: formatTimestamp(data.createdAt),
            updatedAt: formatTimestamp(data.updatedAt)
          }
        }

        // Format application data to handle timestamps
        const formatApplicationData = (doc: any) => {
          const data = doc.data()
          return {
            ...data,
            appliedAt: formatTimestamp(data.appliedAt),
            createdAt: formatTimestamp(data.createdAt),
            updatedAt: formatTimestamp(data.updatedAt)
          }
        }
        
        // Get active job listings and calculate growth
        const jobsQuery = query(
          collection(db, "jobs"),
          where("isActive", "==", true),
          where("verificationStatus", "==", "approved")
        )
        const jobsSnapshot = await getDocs(jobsQuery)
        const activeJobs = jobsSnapshot.size
        
        const newJobsQuery = query(
          collection(db, "jobs"),
          where("createdAt", ">=", startTimestamp),
          where("isActive", "==", true),
          where("verificationStatus", "==", "approved")
        )
        const newJobsSnapshot = await getDocs(newJobsQuery)
        const newJobs = newJobsSnapshot.size
        
        const previousNewJobsQuery = query(
          collection(db, "jobs"),
          where("createdAt", ">=", previousStartTimestamp),
          where("createdAt", "<", startTimestamp),
          where("isActive", "==", true),
          where("verificationStatus", "==", "approved")
        )
        const previousNewJobsSnapshot = await getDocs(previousNewJobsQuery)
        const previousNewJobs = previousNewJobsSnapshot.size
        
        const jobGrowth = previousNewJobs > 0
          ? Math.round(((newJobs - previousNewJobs) / previousNewJobs) * 100)
          : newJobs > 0 ? 100 : 0
        
        // Get applications and calculate growth
        const applicationsQuery = query(collection(db, "applications"))
        const applicationsSnapshot = await getDocs(applicationsQuery)
        const totalApplications = applicationsSnapshot.size
        
        const newApplicationsQuery = query(
          collection(db, "applications"),
          where("appliedAt", ">=", startTimestamp)
        )
        const newApplicationsSnapshot = await getDocs(newApplicationsQuery)
        const newApplications = newApplicationsSnapshot.size
        
        const previousApplicationsQuery = query(
          collection(db, "applications"),
          where("appliedAt", ">=", previousStartTimestamp),
          where("appliedAt", "<", startTimestamp)
        )
        const previousApplicationsSnapshot = await getDocs(previousApplicationsQuery)
        const previousApplications = previousApplicationsSnapshot.size
        
        const applicationGrowth = previousApplications > 0
          ? Math.round(((newApplications - previousApplications) / previousApplications) * 100)
          : newApplications > 0 ? 100 : 0
        
        // Get verifications
        const employersQuery = query(
          collection(db, "users"),
          where("role", "in", ["employer", "multi"]),
          where("isVerified", "==", true)
        )
        const employersSnapshot = await getDocs(employersQuery)
        const verifications = employersSnapshot.size
        
        const newVerificationsQuery = query(
          collection(db, "users"),
          where("role", "in", ["employer", "multi"]),
          where("isVerified", "==", true),
          where("updatedAt", ">=", startTimestamp)
        )
        const newVerificationsSnapshot = await getDocs(newVerificationsQuery)
        const newVerifications = newVerificationsSnapshot.size
        
        const previousVerificationsQuery = query(
          collection(db, "users"),
          where("role", "in", ["employer", "multi"]),
          where("isVerified", "==", true),
          where("updatedAt", ">=", previousStartTimestamp),
          where("updatedAt", "<", startTimestamp)
        )
        const previousVerificationsSnapshot = await getDocs(previousVerificationsQuery)
        const previousVerifications = previousVerificationsSnapshot.size
        
        const verificationGrowth = previousVerifications > 0
          ? Math.round(((newVerifications - previousVerifications) / previousVerifications) * 100)
          : newVerifications > 0 ? 100 : 0
        
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

        // Generate chart data
        // User growth trend data - last 6 months
        let userGrowthData = []
        for (let i = 5; i >= 0; i--) {
          const monthStart = startOfDay(subMonths(now, i))
          const monthEnd = i > 0 ? startOfDay(subMonths(now, i-1)) : now
          
          const monthUsersQuery = query(
            collection(db, "users"),
            where("createdAt", ">=", Timestamp.fromDate(monthStart)),
            where("createdAt", "<=", Timestamp.fromDate(monthEnd))
          )
          const monthUsersSnapshot = await getDocs(monthUsersQuery)
          
          userGrowthData.push({
            name: format(monthStart, 'MMM'),
            users: monthUsersSnapshot.size
          })
        }

        // Job categories distribution
        const categoryCounts: Record<string, number> = {}
        jobsSnapshot.docs.forEach(doc => {
          const job = formatJobData(doc)
          const category = job.category || 'Uncategorized'
          categoryCounts[category] = (categoryCounts[category] || 0) + 1
        })
        
        const jobCategoriesData: ChartDataPoint[] = Object.entries(categoryCounts)
          .map(([category, count]) => ({ name: category, value: count }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5) // Top 5 categories

        // User types data
        const userTypes: UserTypeCounts = { jobseeker: 0, employer: 0, multi: 0, admin: 0 }
        usersSnapshot.docs.forEach(doc => {
          const user = formatUserData(doc)
          const role = user.role || 'jobseeker'
          if (userTypes[role as keyof UserTypeCounts] !== undefined) {
            userTypes[role as keyof UserTypeCounts]++
          }
        })
        
        const userTypesData: ChartDataPoint[] = Object.entries(userTypes)
          .map(([type, count]) => ({ name: type, value: Number(count) }))
          .filter(item => item.value > 0)

        // Get top 5 locations
        const locationCounts: Record<string, number> = {}
        usersSnapshot.docs.forEach(doc => {
          const user = formatUserData(doc)
          const location = user.city || user.location || 'Unknown'
          locationCounts[location] = (locationCounts[location] || 0) + 1
        })
        
        const userLocationsData: ChartDataPoint[] = Object.entries(locationCounts)
          .map(([location, count]) => ({ name: location, value: count }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)

        // Job posting trend - last 6 months
        let jobPostingTrendData = []
        for (let i = 5; i >= 0; i--) {
          const monthStart = startOfDay(subMonths(now, i))
          const monthEnd = i > 0 ? startOfDay(subMonths(now, i-1)) : now
          
          const monthJobsQuery = query(
            collection(db, "jobs"),
            where("createdAt", ">=", Timestamp.fromDate(monthStart)),
            where("createdAt", "<=", Timestamp.fromDate(monthEnd)),
            where("isActive", "==", true),
            where("verificationStatus", "==", "approved")
          )
          const monthJobsSnapshot = await getDocs(monthJobsQuery)
          
          jobPostingTrendData.push({
            name: format(monthStart, 'MMM'),
            jobs: monthJobsSnapshot.size
          })
        }

        // Job types data
        const jobTypeCounts: Record<string, number> = {}
        jobsSnapshot.docs.forEach(doc => {
          const job = formatJobData(doc)
          const type = job.type || 'Unspecified'
          jobTypeCounts[type] = (jobTypeCounts[type] || 0) + 1
        })
        
        const jobTypesData: ChartDataPoint[] = Object.entries(jobTypeCounts)
          .map(([type, count]) => ({ name: type, value: count }))
          .sort((a, b) => b.value - a.value)

        // Application status data
        const statusCounts: Record<string, number> = { pending: 0, reviewed: 0, shortlisted: 0, rejected: 0, hired: 0 }
        applicationsSnapshot.docs.forEach(doc => {
          const application = formatApplicationData(doc)
          const status = application.status || 'pending'
          if (statusCounts[status] !== undefined) {
            statusCounts[status]++
          }
        })
        
        const applicationStatusData: ChartDataPoint[] = Object.entries(statusCounts)
          .map(([status, count]) => ({ name: status, value: Number(count) }))
          .filter(item => item.value > 0)

        // Set all chart data
        setChartData({
          userGrowthData,
          jobCategoriesData,
          userTypesData,
          userLocationsData,
          userActivityData: [], // This would require more complex queries
          jobPostingTrendData,
          jobCategoriesChartData: jobCategoriesData,
          jobTypesData,
          salaryRangesData: [], // This would require parsing salary ranges
          applicationTrendData: userGrowthData, // Using the same data for demo
          applicationStatusData,
          popularJobCategoriesData: jobCategoriesData,
          responseTimeData: [] // Would require more complex data
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

  // Chart colors
  const CHART_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444']

  const handleExport = () => {
    try {
      // Create data for export
      const dataStr = JSON.stringify({
        stats,
        charts: chartData,
        exportDate: new Date().toISOString(),
        period: timePeriod
      }, null, 2)

      // Create download link
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
      
      const exportFileDefaultName = `ranao-jobs-report-${format(new Date(), 'yyyy-MM-dd')}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    } catch (err) {
      console.error("Error exporting data:", err)
      error("Failed to export report data")
    }
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
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={handleExport}>
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
                      { title: "Total Users", value: stats.totalUsers.toString(), change: `${stats.userGrowth >= 0 ? '+' : ''}${stats.userGrowth}%` },
                      { title: "Active Job Listings", value: stats.activeJobListings.toString(), change: `${stats.jobGrowth >= 0 ? '+' : ''}${stats.jobGrowth}%` },
                      { title: "Job Applications", value: stats.jobApplications.toString(), change: `${stats.applicationGrowth >= 0 ? '+' : ''}${stats.applicationGrowth}%` },
                      { title: "Employer Verifications", value: stats.employerVerifications.toString(), change: `${stats.verificationGrowth >= 0 ? '+' : ''}${stats.verificationGrowth}%` },
                    ].map((stat, index) => (
                      <Card key={index}>
                        <CardContent className="p-6">
                          <div className="flex flex-col">
                            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                            <div className="flex items-baseline mt-1">
                              <p className="text-2xl font-bold">{stat.value}</p>
                              <p className={`ml-2 text-sm ${parseFloat(stat.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stat.change}
                              </p>
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
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData.userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Job Categories Distribution</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData.jobCategoriesData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {chartData.jobCategoriesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value, name, props) => [`${value} jobs`, props.payload.name]} />
                          </PieChart>
                        </ResponsiveContainer>
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
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData.userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>User Types</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData.userTypesData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {chartData.userTypesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} users`]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>User Locations</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.userLocationsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Users" fill="#8b5cf6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>User Growth by Month</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="users" fill="#10b981" />
                          </BarChart>
                        </ResponsiveContainer>
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
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData.jobPostingTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="jobs" stroke="#f59e0b" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Job Categories</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.jobCategoriesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value} jobs`]} />
                            <Legend />
                            <Bar dataKey="value" name="Jobs" fill="#10b981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Job Types</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData.jobTypesData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {chartData.jobTypesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} jobs`]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Jobs by Month</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.jobPostingTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="jobs" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
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
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData.applicationTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="users" name="Applications" stroke="#ec4899" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Application Status</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData.applicationStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {chartData.applicationStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} applications`]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Popular Job Categories</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.popularJobCategoriesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value} applications`]} />
                            <Legend />
                            <Bar dataKey="value" name="Applications" fill="#8b5cf6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Applications by Month</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.applicationTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="users" name="Applications" fill="#ef4444" />
                          </BarChart>
                        </ResponsiveContainer>
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
