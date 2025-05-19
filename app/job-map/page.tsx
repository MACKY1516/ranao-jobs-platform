"use client"

import { useState, useEffect } from "react"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { BackButton } from "@/components/back-button"
import { JobMap } from "@/components/job-map"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Search, MapPin, Briefcase } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

// Job interface
export interface Job {
  id: string
  title: string
  company: string
  category: string
  location: string
  coordinates: [number, number]
  salary?: string
  type: string
  postedAt: string
  deadline?: string
  description?: string
}

export default function JobMapPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Check authentication status
  useEffect(() => {
    const userData = localStorage.getItem("ranaojobs_user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setIsLoggedIn(true)
        setUserRole(user.activeRole || user.role)

        // Redirect if user is an employer
        if (user.activeRole === "employer" || (user.role === "employer" && !user.activeRole)) {
          router.push("/find-jobs")
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [router])

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true)
        // Mock data for demonstration - Philippines locations
        const mockJobs: Job[] = [
          {
            id: "job1",
            title: "Frontend Developer",
            company: "TechCorp Manila",
            category: "Development",
            location: "Manila, Philippines",
            coordinates: [14.5995, 120.9842],
            salary: "₱30,000 - ₱45,000",
            type: "Full-time",
            postedAt: "2023-05-01",
            deadline: "2023-06-01",
            description: "We are looking for a skilled Frontend Developer...",
          },
          {
            id: "job2",
            title: "UX Designer",
            company: "DesignHub Cebu",
            category: "Design",
            location: "Cebu City, Philippines",
            coordinates: [10.3157, 123.8854],
            salary: "₱25,000 - ₱40,000",
            type: "Full-time",
            postedAt: "2023-05-02",
            deadline: "2023-06-02",
            description: "Join our design team to create amazing user experiences...",
          },
          {
            id: "job3",
            title: "Data Analyst",
            company: "DataCo Davao",
            category: "Data Science",
            location: "Davao City, Philippines",
            coordinates: [7.1907, 125.4553],
            salary: "₱28,000 - ₱42,000",
            type: "Full-time",
            postedAt: "2023-05-03",
            deadline: "2023-06-03",
            description: "Looking for a data analyst to analyze complex datasets...",
          },
          {
            id: "job4",
            title: "IT Support Specialist",
            company: "CloudTech Iloilo",
            category: "IT Support",
            location: "Iloilo City, Philippines",
            coordinates: [10.7202, 122.5621],
            salary: "₱22,000 - ₱35,000",
            type: "Full-time",
            postedAt: "2023-05-04",
            deadline: "2023-06-04",
            description: "Join our IT support team to help clients with technical issues...",
          },
          {
            id: "job5",
            title: "Marketing Coordinator",
            company: "GrowthCo Marawi",
            category: "Marketing",
            location: "Marawi City, Philippines",
            coordinates: [8.0, 124.3],
            salary: "₱20,000 - ₱30,000",
            type: "Full-time",
            postedAt: "2023-05-05",
            deadline: "2023-06-05",
            description: "Lead our marketing efforts to drive growth...",
          },
          {
            id: "job6",
            title: "Administrative Assistant",
            company: "AdminPro Baguio",
            category: "Administrative",
            location: "Baguio City, Philippines",
            coordinates: [16.4023, 120.596],
            salary: "₱18,000 - ₱25,000",
            type: "Full-time",
            postedAt: "2023-05-06",
            deadline: "2023-06-06",
            description: "Support our office operations with administrative tasks...",
          },
          {
            id: "job7",
            title: "Customer Service Representative",
            company: "ServiceFirst Cagayan de Oro",
            category: "Customer Service",
            location: "Cagayan de Oro, Philippines",
            coordinates: [8.4542, 124.6319],
            salary: "₱19,000 - ₱28,000",
            type: "Full-time",
            postedAt: "2023-05-07",
            deadline: "2023-06-07",
            description: "Provide excellent customer service to our clients...",
          },
          {
            id: "job8",
            title: "Software Engineer",
            company: "CodeMasters Quezon City",
            category: "Development",
            location: "Quezon City, Philippines",
            coordinates: [14.676, 121.0437],
            salary: "₱35,000 - ₱50,000",
            type: "Full-time",
            postedAt: "2023-05-08",
            deadline: "2023-06-08",
            description: "Develop high-quality software solutions...",
          },
          {
            id: "job9",
            title: "Graphic Designer",
            company: "Creative Studios Makati",
            category: "Design",
            location: "Makati, Philippines",
            coordinates: [14.5547, 121.0244],
            salary: "₱25,000 - ₱38,000",
            type: "Full-time",
            postedAt: "2023-05-09",
            deadline: "2023-06-09",
            description: "Create stunning visual designs for our clients...",
          },
          {
            id: "job10",
            title: "Project Manager",
            company: "BuildRight Zamboanga",
            category: "Management",
            location: "Zamboanga City, Philippines",
            coordinates: [6.9214, 122.079],
            salary: "₱40,000 - ₱60,000",
            type: "Full-time",
            postedAt: "2023-05-10",
            deadline: "2023-06-10",
            description: "Lead project teams to successful delivery...",
          },
        ]

        setJobs(mockJobs)
        setFilteredJobs(mockJobs)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching jobs:", err)
        setError("Failed to load job listings. Please try again later.")
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [])

  // Filter jobs based on search term and filters
  useEffect(() => {
    let result = [...jobs]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term) ||
          job.description?.toLowerCase().includes(term),
      )
    }

    if (categoryFilter) {
      result = result.filter((job) => job.category === categoryFilter)
    }

    if (locationFilter) {
      result = result.filter((job) => job.location.includes(locationFilter))
    }

    setFilteredJobs(result)
  }, [jobs, searchTerm, categoryFilter, locationFilter])

  // Get unique categories and locations for filters
  const categories = [...new Set(jobs.map((job) => job.category))]
  const locations = [...new Set(jobs.map((job) => job.location.split(",")[0].trim()))]

  // If user is an employer, redirect to find-jobs
  if (isLoggedIn && userRole === "employer") {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />

      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center mb-4">
            <BackButton />
            <h1 className="text-2xl font-bold ml-2">Philippines Job Map</h1>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <div className="relative">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <div className="relative">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <Button
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("")
                  setLocationFilter("")
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="w-full h-[calc(100vh-240px)] rounded-lg overflow-hidden">
              <Skeleton className="w-full h-full" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="w-full h-[calc(100vh-240px)] bg-white rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-lg">
                No jobs found matching your criteria. Please try different filters.
              </p>
            </div>
          ) : (
            <div className="w-full h-[calc(100vh-240px)] rounded-lg overflow-hidden shadow-lg">
              <JobMap jobs={filteredJobs} height="100%" />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
