"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Calendar, DollarSign, ExternalLink } from "lucide-react"
import Link from "next/link"
import { EmployerRating } from "@/components/employer-rating"
import { formatDistanceToNow } from "date-fns"

interface JobCardProps {
  variant?: "default" | "horizontal"
  jobId?: string
  companyId?: string
  job?: any // The job data from Firestore
}

export function JobCard({ variant = "default", jobId = "1", companyId = "1", job: jobData }: JobCardProps) {
  const [isJobseeker, setIsJobseeker] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [job, setJob] = useState<any>(null)

  // Check if user is jobseeker
  useEffect(() => {
    setMounted(true)
    const userData = localStorage.getItem("ranaojobs_user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setIsJobseeker(user.role === "jobseeker" || (user.role === "multi" && user.activeRole === "jobseeker"))
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Check user role from localStorage
    const storedUser = localStorage.getItem("ranaojobs_user")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setUserRole(user.activeRole || user.role)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }

    // Process job data
    if (jobData) {
      setJob(jobData)
    } else {
      // Fallback to mock data if no job data is provided
      setJob({
        id: jobId,
        title: "Senior Frontend Developer",
        company: "Tech Solutions Inc.",
        location: "Marawi City, Lanao del Sur",
        type: "Full-time",
        category: "Development",
        salary: "₱60,000 - ₱80,000",
        postedAt: "2 days ago",
        deadline: "30 days remaining",
        tags: ["React", "TypeScript", "Next.js"],
      })
    }
  }, [jobData, jobId])

  // Format date and time
  const formatPostedDate = (timestamp: any) => {
    if (!timestamp) return "Recently"
    
    try {
      // Convert Firestore timestamp to JS Date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Recently"
    }
  }

  // Format salary range
  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return "Competitive"
    if (!min) return `Up to ₱${max.toLocaleString()}`
    if (!max) return `From ₱${min.toLocaleString()}`
    return `₱${min.toLocaleString()} - ₱${max.toLocaleString()}`
  }

  if (!mounted || !job) {
    return null
  }

  // Format location
  const formatLocation = (location: any) => {
    if (!location) return "Location not specified"
    
    if (typeof location === 'string') return location
    
    const parts = []
    if (location.city) parts.push(location.city)
    if (location.province) parts.push(location.province)
    if (location.remote) parts.push("Remote")
    
    return parts.length > 0 ? parts.join(", ") : "Location not specified"
  }

  if (variant === "horizontal") {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <div className="p-6 flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h3 className="text-xl font-semibold hover:text-yellow-500 transition-colors">
                  <Link href={`/job/${job.id}`}>{job.title}</Link>
                </h3>
                <Badge variant="outline" className="w-fit">
                  {job.type || "Full-time"}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4 mr-1" />
                  <span>{job.company || job.employerName}</span>
                  <EmployerRating
                    employerId={companyId || job.employerId}
                    employerName={job.company || job.employerName}
                    initialRating={job.employerRating || 0}
                    showRatingButton={false}
                    size="sm"
                  />
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{formatLocation(job.location)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Posted {job.postedAt || formatPostedDate(job.createdAt)}</span>
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>{job.salary || formatSalary(job.minSalary, job.maxSalary)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {(job.tags || job.skills || []).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="bg-gray-100 dark:bg-gray-700">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={`/job/${job.id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ExternalLink className="h-4 w-4" />
                    View Details
                  </Button>
                </Link>

                <Link href={`/employer/${companyId || job.employerId}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ExternalLink className="h-4 w-4" />
                    View Profile
                  </Button>
                </Link>

                {isJobseeker && (
                  <Link href={`/job/${job.id}/apply`}>
                    <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                      Apply Now
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold hover:text-yellow-500 transition-colors">
            <Link href={`/job/${job.id}`}>{job.title}</Link>
          </h3>
          <Badge variant="outline">{job.type || "Full-time"}</Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Building2 className="h-4 w-4 mr-1" />
            <Link href={`/employer/${companyId || job.employerId}`} className="hover:text-yellow-500">
              {job.company || job.employerName}
            </Link>
            <EmployerRating
              employerId={companyId || job.employerId}
              employerName={job.company || job.employerName}
              initialRating={job.employerRating || 0}
              showRatingButton={false}
              size="sm"
            />
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{formatLocation(job.location)}</span>
          </div>
          <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>{job.salary || formatSalary(job.minSalary, job.maxSalary)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(job.tags || job.skills || []).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="bg-gray-100 dark:bg-gray-700">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Link href={`/job/${job.id}`}>
            <Button variant="outline" size="sm" className="gap-1">
              View Details
            </Button>
          </Link>

          <Link href={`/employer/${companyId || job.employerId}`}>
            <Button variant="outline" size="sm" className="gap-1">
              View Profile
            </Button>
          </Link>

          {userRole !== "employer" && (
            <Link href={`/job/${job.id}/apply`}>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">Apply Now</Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
