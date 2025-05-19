"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Calendar, DollarSign, ExternalLink } from "lucide-react"
import Link from "next/link"
import { EmployerRating } from "@/components/employer-rating"

interface JobCardProps {
  variant?: "default" | "horizontal"
  jobId?: string
  companyId?: string
}

export function JobCard({ variant = "default", jobId = "1", companyId = "1" }: JobCardProps) {
  const [isJobseeker, setIsJobseeker] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

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
  }, [])

  // Mock job data
  const job = {
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
  }

  if (!mounted) {
    return null
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
                  {job.type}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4 mr-1" />
                  <span>{job.company}</span>
                  <EmployerRating
                    employerId={companyId}
                    employerName={job.company}
                    initialRating={4.2}
                    showRatingButton={false}
                    size="sm"
                  />
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Posted {job.postedAt}</span>
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>{job.salary}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {job.tags.map((tag) => (
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

                <Link href={`/employer/${companyId}`}>
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
          <Badge variant="outline">{job.type}</Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Building2 className="h-4 w-4 mr-1" />
            <Link href={`/employer/${companyId}`} className="hover:text-yellow-500">
              {job.company}
            </Link>
            <EmployerRating
              employerId={companyId}
              employerName={job.company}
              initialRating={4.2}
              showRatingButton={false}
              size="sm"
            />
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>{job.salary}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {job.tags.map((tag) => (
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

          <Link href={`/employer/${companyId}`}>
            <Button variant="outline" size="sm" className="gap-1">
              View Profile
            </Button>
          </Link>

          {userRole !== "employer" && (
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">Apply Now</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
