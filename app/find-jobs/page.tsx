"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { JobCard } from "@/components/job-card"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { Search, MapPin, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EnhancedJobFilters } from "@/components/enhanced-job-filters"
import { Skeleton } from "@/components/ui/skeleton"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit, startAfter, doc, getDoc } from "firebase/firestore"

export default function FindJobsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [totalJobs, setTotalJobs] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [locationTerm, setLocationTerm] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  
  // Active filters
  const [activeFilters, setActiveFilters] = useState<{
    jobType: string[],
    location: string,
    industry: string[]
  }>({
    jobType: [],
    location: "",
    industry: []
  })

  // Fetch jobs from Firestore
  useEffect(() => {
    setMounted(true)
    fetchJobs()
  }, [sortBy])

  const fetchJobs = async (searchParams: { newSearch?: boolean } = {}) => {
    setIsLoading(true)
    try {
      // Build the query
      let jobsQuery = collection(db, "jobs")
      
      // Default query to fetch only active and approved jobs
      let constraints: any[] = [
        where("isActive", "==", true),
        where("isApproved", "==", true)
      ]
      
      // Add search filters if provided
      if (searchTerm) {
        // This is a simplified search - in production you would use a more robust solution like Algolia or Firebase extensions
        constraints.push(where("title", ">=", searchTerm))
        constraints.push(where("title", "<=", searchTerm + "\uf8ff"))
      }
      
      if (locationTerm) {
        constraints.push(where("location.city", "==", locationTerm))
      }

      if (activeFilters.jobType.length > 0) {
        constraints.push(where("type", "in", activeFilters.jobType))
      }
      
      if (activeFilters.industry.length > 0) {
        constraints.push(where("category", "in", activeFilters.industry))
      }
      
      // Order by based on sort selection
      let orderByField = "createdAt"
      let orderDirection = "desc"
      
      if (sortBy === "salary-high") {
        orderByField = "maxSalary"
        orderDirection = "desc"
      } else if (sortBy === "salary-low") {
        orderByField = "minSalary"
        orderDirection = "asc"
      }
      
      // Create the final query
      let finalQuery = query(
        jobsQuery,
        ...constraints,
        orderBy(orderByField, orderDirection === "desc" ? "desc" : "asc"),
        limit(10)
      )
      
      // If we're paginating, start after the last visible document
      if (lastVisible && !searchParams.newSearch) {
        finalQuery = query(
          jobsQuery,
          ...constraints,
          orderBy(orderByField, orderDirection === "desc" ? "desc" : "asc"),
          startAfter(lastVisible),
          limit(10)
        )
      }
      
      // Execute the query
      const querySnapshot = await getDocs(finalQuery)
      
      // Process the results
      const jobsList: Array<any> = []
      querySnapshot.forEach((doc) => {
        jobsList.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      // Set the last visible document for pagination
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]
      
      if (searchParams.newSearch) {
        setJobs(jobsList)
      } else {
        setJobs((prev) => [...prev, ...jobsList])
      }
      
      if (lastDoc) {
        setLastVisible(lastDoc)
      }
      
      // Get total count (this is a simplified approach - in production you might want a counter)
      const countQuery = query(
        collection(db, "jobs"),
        where("isActive", "==", true),
        where("isApproved", "==", true)
      )
      const countSnapshot = await getDocs(countQuery)
      setTotalJobs(countSnapshot.size)
      
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    setLastVisible(null)
    fetchJobs({ newSearch: true })
  }

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters)
    setCurrentPage(1)
    setLastVisible(null)
    fetchJobs({ newSearch: true })
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setCurrentPage(1)
    setLastVisible(null)
  }

  const handleRemoveFilter = (type: string, value: string) => {
    if (type === "jobType") {
      setActiveFilters(prev => ({
        ...prev,
        jobType: prev.jobType.filter(item => item !== value)
      }))
    } else if (type === "location") {
      setActiveFilters(prev => ({ ...prev, location: "" }))
    } else if (type === "industry") {
      setActiveFilters(prev => ({
        ...prev,
        industry: prev.industry.filter(item => item !== value)
      }))
    }
    
    setCurrentPage(1)
    setLastVisible(null)
    fetchJobs({ newSearch: true })
  }

  // Load more jobs (pagination)
  const loadMoreJobs = async () => {
    if (lastVisible) {
      setCurrentPage(prev => prev + 1)
      fetchJobs()
    }
  }

  // Don't render during SSR to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />

      {/* Page Header */}
      <section className="pt-24 pb-10 px-4 bg-gray-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Perfect Job</h1>
            <p className="text-lg text-gray-300 max-w-3xl mb-8">
              Browse through thousands of job opportunities in Marawi City and beyond
            </p>

            {/* Search Bar */}
            <div className="w-full max-w-4xl flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input 
                  type="text" 
                  placeholder="Job title, keywords, or company"
                  className="pl-10 h-12"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input 
                  type="text" 
                  placeholder="City, state, or remote"
                  className="pl-10 h-12"
                  value={locationTerm}
                  onChange={(e) => setLocationTerm(e.target.value)}
                />
              </div>
              <Button 
                className="h-12 px-6 bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                onClick={handleSearch}
              >
                Search Jobs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 px-4 bg-gray-50 flex-grow">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="w-full lg:w-1/4">
              <EnhancedJobFilters 
                className="sticky top-24" 
                onFilterChange={handleFilterChange}
              />
            </div>

            {/* Job Listings */}
            <div className="w-full lg:w-3/4">
              <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{totalJobs} Jobs Found</h2>
                    <p className="text-sm text-gray-500">Based on your search criteria</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {activeFilters.jobType.map(type => (
                      <Badge key={type} variant="outline" className="flex items-center gap-1 bg-gray-100">
                        {type}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => handleRemoveFilter("jobType", type)}
                        >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                    ))}
                    
                    {activeFilters.location && (
                    <Badge variant="outline" className="flex items-center gap-1 bg-gray-100">
                        {activeFilters.location}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => handleRemoveFilter("location", activeFilters.location)}
                        >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                    )}
                    
                    {activeFilters.industry.map(industry => (
                      <Badge key={industry} variant="outline" className="flex items-center gap-1 bg-gray-100">
                        {industry}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => handleRemoveFilter("industry", industry)}
                        >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                    ))}
                  </div>

                  <div className="flex items-center">
                    <Select 
                      value={sortBy}
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="salary-high">Salary: High to Low</SelectItem>
                        <SelectItem value="salary-low">Salary: Low to High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {isLoading && jobs.length === 0 ? (
                <div className="space-y-6">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg p-6">
                      <Skeleton className="h-6 w-2/3 mb-4" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-1/3 mb-4" />
                      <div className="flex gap-2 mb-4">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {jobs.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                      {jobs.map((job) => (
                        <JobCard 
                          key={job.id} 
                          variant="horizontal" 
                          jobId={job.id} 
                          companyId={job.employerId}
                          job={job}
                        />
                      ))}
                      
                      {jobs.length < totalJobs && (
                        <div className="flex justify-center mt-6">
                          <Button 
                            onClick={loadMoreJobs} 
                            variant="outline" 
                            disabled={isLoading}
                          >
                            {isLoading ? "Loading..." : "Load More Jobs"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-6 text-center">
                      <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                      <p className="text-gray-500">Try adjusting your search criteria or filters</p>
                </div>
                  )}
                </>
              )}

              {/* Pagination */}
              {totalJobs > 10 && (
              <div className="flex justify-center mt-10">
                <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage(1)
                        setLastVisible(null)
                        fetchJobs({ newSearch: true })
                      }}
                    >
                    &lt;
                  </Button>
                    {Array.from({ length: Math.min(5, Math.ceil(totalJobs / 10)) }).map((_, i) => (
                      <Button 
                        key={i}
                        variant="outline" 
                        size="sm"
                        className={currentPage === i + 1 ? "bg-yellow-500 text-black border-yellow-500" : ""}
                        onClick={() => {
                          if (i + 1 < currentPage) {
                            setCurrentPage(i + 1)
                            setLastVisible(null)
                            fetchJobs({ newSearch: true })
                          } else if (i + 1 > currentPage) {
                            // This is a simplified approach as we can't easily jump pages in Firestore
                            // In production, you might consider a different pagination strategy
                            setCurrentPage(i + 1)
                            loadMoreJobs()
                          }
                        }}
                      >
                        {i + 1}
                  </Button>
                    ))}
                    <Button 
                      variant="outline" 
                      size="icon"
                      disabled={currentPage === Math.ceil(totalJobs / 10) || jobs.length === totalJobs}
                      onClick={loadMoreJobs}
                    >
                    &gt;
                  </Button>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
