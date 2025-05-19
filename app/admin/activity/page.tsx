"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, limit, where, Timestamp, doc, updateDoc } from "firebase/firestore"
import { formatDistanceToNow, format } from "date-fns"
import { User, Briefcase, AlertTriangle, Settings, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Activity {
  id: string
  title: string
  message: string
  createdAt: Timestamp | Date | string
  isRead: boolean
  type: 'info' | 'warning' | 'success' | 'error'
  link?: string
  activityType?: 'jobseeker' | 'employer' | 'admin' | 'system'
  relatedUserId?: string
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'jobseeker' | 'employer' | 'admin' | 'system'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true)
      try {
        // Construct query to get all activities
        const activitiesQuery = query(
          collection(db, "adminNotifications"),
          orderBy("createdAt", "desc"),
          limit(100)
        )

        const querySnapshot = await getDocs(activitiesQuery)
        const activitiesData = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt || new Date()
          } as Activity
        })

        setActivities(activitiesData)
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  // Filter activities based on active tab and search query
  const filteredActivities = activities.filter(activity => {
    // Filter by tab
    if (activeTab !== 'all' && activity.activityType !== activeTab) {
      return false
    }
    
    // Filter by search query
    if (searchQuery && !activity.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !activity.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    return true
  })

  // Format date for display
  const formatActivityDate = (date: Timestamp | Date | string) => {
    try {
      let dateObj: Date
      
      if (date instanceof Timestamp) {
        dateObj = date.toDate()
      } else if (date instanceof Date) {
        dateObj = date
      } else if (typeof date === 'string') {
        dateObj = new Date(date)
      } else {
        return 'N/A'
      }
      
      return format(dateObj, 'MMM dd, yyyy HH:mm')
    } catch (e) {
      return 'N/A'
    }
  }

  // Get icon for activity type
  const getActivityIcon = (type?: string) => {
    switch (type) {
      case 'jobseeker':
        return <User className="h-5 w-5 text-blue-500" />;
      case 'employer':
        return <Briefcase className="h-5 w-5 text-green-500" />;
      case 'system':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Settings className="h-5 w-5 text-yellow-500" />;
    }
  };
  
  // Get badge for activity type
  const getActivityBadge = (type?: string) => {
    switch (type) {
      case 'jobseeker':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Jobseeker</Badge>;
      case 'employer':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Employer</Badge>;
      case 'system':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">System</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Admin</Badge>;
    }
  };

  return (
    <AdminLayout title="User Activity Log">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>User Activity Log</CardTitle>
                <CardDescription>
                  Track all user actions and system events
                </CardDescription>
              </div>
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search activities..."
                  className="pl-9 w-full md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Activities</TabsTrigger>
                <TabsTrigger value="jobseeker" className="flex items-center gap-1">
                  <User className="h-4 w-4" /> Jobseekers
                </TabsTrigger>
                <TabsTrigger value="employer" className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> Employers
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-1">
                  <Settings className="h-4 w-4" /> Admin
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> System
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {renderActivitiesList()}
              </TabsContent>
              
              <TabsContent value="jobseeker" className="space-y-4">
                {renderActivitiesList()}
              </TabsContent>
              
              <TabsContent value="employer" className="space-y-4">
                {renderActivitiesList()}
              </TabsContent>
              
              <TabsContent value="admin" className="space-y-4">
                {renderActivitiesList()}
              </TabsContent>
              
              <TabsContent value="system" className="space-y-4">
                {renderActivitiesList()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
  
  // Helper function to render activities list
  function renderActivitiesList() {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      )
    }
    
    if (filteredActivities.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500">No activities found</p>
        </div>
      )
    }
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.map(activity => (
              <TableRow key={activity.id} className={!activity.isRead ? "bg-gray-50" : ""}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getActivityIcon(activity.activityType)}
                    {getActivityBadge(activity.activityType)}
                  </div>
                </TableCell>
                <TableCell>{activity.title}</TableCell>
                <TableCell className="max-w-xs truncate">{activity.message}</TableCell>
                <TableCell>{formatActivityDate(activity.createdAt)}</TableCell>
                <TableCell>
                  {activity.isRead ? 
                    <Badge variant="outline" className="bg-gray-50">Read</Badge> : 
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">Unread</Badge>}
                </TableCell>
                <TableCell>
                  {activity.link && (
                    <Button variant="outline" size="sm" onClick={() => window.location.href = activity.link!}>
                      View
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }
} 