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
import { EnhancedJobFilters, JobFilters } from "@/components/enhanced-job-filters"
import { Skeleton } from "@/components/ui/skeleton"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, limit, where, DocumentData, Query, Firestore } from "firebase/firestore"

export default function FindJobsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [jobs, setJobs] = useState<{id: string}[]>([])
  const [totalJobs, setTotalJobs] = useState(0)
  const [rawJobData, setRawJobData] = useState<any[]>([]) // For debugging
  const [showDebug, setShowDebug] = useState(false) // Toggle debug view
  const [searchTerm, setSearchTerm] = useState("")
  const [location, setLocation] = useState("")
  const [appliedFilters, setAppliedFilters] = useState<JobFilters>({})
  const [filteredJobs, setFilteredJobs] = useState<any[]>([])
  const [sortBy, setSortBy] = useState("relevance")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5) // Number of jobs per page

  useEffect(() => {
    setMounted(true)
    fetchJobs()
  }, [])

  // Get current jobs for pagination
  const indexOfLastJob = currentPage * itemsPerPage
  const indexOfFirstJob = indexOfLastJob - itemsPerPage
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob)
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)

  // Change page
  const paginate = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Fetch jobs from Firestore
  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      // Simplified query: just fetch all jobs without ordering requirements
      const jobsCollection = collection(db, "jobs")
      
      console.log("Fetching jobs from Firestore...")
      const snapshot = await getDocs(jobsCollection)
      console.log(`Found ${snapshot.size} jobs in Firestore`)
      
      const jobsList = snapshot.docs.map(doc => ({ id: doc.id }))
      
      // Store raw job data for filtering
      const rawData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setRawJobData(rawData)
      setFilteredJobs(rawData)
      
      setJobs(jobsList)
      setTotalJobs(rawData.length)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching jobs:", error)
      setIsLoading(false)
      setJobs([])
    }
  }

  // Handle filters change from EnhancedJobFilters component
  const handleFiltersChange = (filters: JobFilters) => {
    setAppliedFilters(filters)
    applyFilters(filters, searchTerm, location)
  }

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters(appliedFilters, searchTerm, location)
  }

  // Apply all filters to the job data
  const applyFilters = (filters: JobFilters, searchKeyword: string, searchLocation: string) => {
    setIsLoading(true)
    
    // Start with all raw job data
    let filtered = [...rawJobData]
    
    // Apply search term filter
    if (searchKeyword) {
      const lowercaseSearch = searchKeyword.toLowerCase()
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(lowercaseSearch) || 
        job.company?.toLowerCase().includes(lowercaseSearch) ||
        job.tags?.some((tag: string) => tag.toLowerCase().includes(lowercaseSearch))
      )
    }
    
    // Apply location filter from search bar
    if (searchLocation) {
      const lowercaseLocation = searchLocation.toLowerCase()
      filtered = filtered.filter(job => 
        job.location?.toLowerCase().includes(lowercaseLocation)
      )
    }
    
    // Apply job type filters
    if (filters.jobTypes && filters.jobTypes.length > 0) {
      filtered = filtered.filter(job => 
        filters.jobTypes!.includes(job.type)
      )
    }
    
    // Apply experience level filter
    if (filters.experienceLevel && filters.experienceLevel !== "any") {
      filtered = filtered.filter(job => {
        // This depends on how experience level is stored in your job data
        // Adjust this logic based on your actual data structure
        if (filters.experienceLevel === "entry") {
          return job.experienceLevel === "Entry Level" || job.experience?.includes("0-2")
        } else if (filters.experienceLevel === "mid") {
          return job.experienceLevel === "Mid Level" || job.experience?.includes("3-5")
        } else if (filters.experienceLevel === "senior") {
          return job.experienceLevel === "Senior Level" || job.experience?.includes("5+")
        } else if (filters.experienceLevel === "executive") {
          return job.experienceLevel === "Executive Level" || job.experience?.includes("10+")
        }
        return true
      })
    }
    
    // Apply salary range filter
    if (filters.salaryRange && (filters.salaryRange[0] > 20000 || filters.salaryRange[1] < 100000)) {
      filtered = filtered.filter(job => {
        // This is a simplistic approach - in reality, salary might be stored as a range or as a string
        // You would need to parse it based on your actual data structure
        if (typeof job.salaryMin === 'number' && typeof job.salaryMax === 'number') {
          return job.salaryMin >= filters.salaryRange![0] && job.salaryMax <= filters.salaryRange![1]
        } else if (job.salary) {
          // Try to parse salary range from string like "₱25,000 - ₱35,000"
          const salaryMatch = job.salary.match(/₱([\d,]+)\s*-\s*₱([\d,]+)/)
          if (salaryMatch) {
            const min = parseInt(salaryMatch[1].replace(/,/g, ''))
            const max = parseInt(salaryMatch[2].replace(/,/g, ''))
            return min >= filters.salaryRange![0] && max <= filters.salaryRange![1]
          }
        }
        return true
      })
    }
    
    // Apply location filters from sidebar
    if (filters.locations && filters.locations.length > 0) {
      filtered = filtered.filter(job => 
        filters.locations!.some(loc => job.location?.includes(loc))
      )
    }
    
    // Apply industry filters
    if (filters.industries && filters.industries.length > 0) {
      filtered = filtered.filter(job => 
        filters.industries!.includes(job.category) || 
        filters.industries!.some(ind => job.tags?.includes(ind))
      )
    }
    
    // Apply sorting
    if (sortBy === "recent") {
      filtered.sort((a, b) => {
        const dateA = a.postedAt?.seconds || 0
        const dateB = b.postedAt?.seconds || 0
        return dateB - dateA
      })
    } else if (sortBy === "salary-high") {
      filtered.sort((a, b) => {
        // Extract max salary for comparison
        const getMaxSalary = (job: any) => {
          if (typeof job.salaryMax === 'number') return job.salaryMax
          if (job.salary) {
            const match = job.salary.match(/₱([\d,]+)\s*-\s*₱([\d,]+)/)
            if (match) return parseInt(match[2].replace(/,/g, ''))
          }
          return 0
        }
        return getMaxSalary(b) - getMaxSalary(a)
      })
    } else if (sortBy === "salary-low") {
      filtered.sort((a, b) => {
        // Extract min salary for comparison
        const getMinSalary = (job: any) => {
          if (typeof job.salaryMin === 'number') return job.salaryMin
          if (job.salary) {
            const match = job.salary.match(/₱([\d,]+)\s*-\s*₱([\d,]+)/)
            if (match) return parseInt(match[1].replace(/,/g, ''))
          }
          return 0
        }
        return getMinSalary(a) - getMinSalary(b)
      })
    }
    
    // Update filtered jobs and count
    setFilteredJobs(filtered)
    setTotalJobs(filtered.length)
    // Reset to first page when filters change
    setCurrentPage(1)
    setIsLoading(false)
  }

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value)
    applyFilters(appliedFilters, searchTerm, location)
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
            <form onSubmit={handleSearch} className="w-full max-w-4xl flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input 
                  type="text" 
                  placeholder="Job title, keywords, or company" 
                  className="pl-10 h-12  text-black" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input 
                  type="text" 
                  placeholder="City, state, or remote" 
                  className="pl-10 h-12 text-black" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <Button type="submit" className="h-12 px-6 bg-yellow-500 hover:bg-yellow-600 text-black font-medium">
                Search Jobs
              </Button>
            </form>
            
            {/* Debug Button */}
            {/* <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </Button> */}
          </div>
        </div>
      </section>
      
      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-gray-100 border-t border-b border-gray-200 p-4">
          <div className="container mx-auto max-w-6xl">
            <h3 className="font-bold mb-2">Firestore Debug Data:</h3>
            <div className="bg-white p-4 rounded shadow-sm overflow-auto max-h-[300px]">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(rawJobData, null, 2)}
              </pre>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => fetchJobs()}>
                Refresh Job Data
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <section className="py-10 px-4 bg-gray-50 flex-grow">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="w-full lg:w-1/4">
              <EnhancedJobFilters 
                className="sticky top-24" 
                onFilterChange={handleFiltersChange} 
              />
            </div>

            {/* Job Listings */}
            <div className="w-full lg:w-3/4">
              <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{totalJobs} Jobs Found</h2>
                    <p className="text-sm text-gray-500">
                      {filteredJobs.length > 0 
                        ? `Showing ${indexOfFirstJob + 1}-${Math.min(indexOfLastJob, filteredJobs.length)} of ${filteredJobs.length} jobs` 
                        : 'Based on your search criteria'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <Badge variant="outline" className="flex items-center gap-1 bg-gray-100">
                        Search: {searchTerm}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0 ml-1" 
                          onClick={() => {
                            setSearchTerm("")
                            applyFilters(appliedFilters, "", location)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    
                    {location && (
                      <Badge variant="outline" className="flex items-center gap-1 bg-gray-100">
                        Location: {location}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0 ml-1" 
                          onClick={() => {
                            setLocation("")
                            applyFilters(appliedFilters, searchTerm, "")
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center">
                    <Select defaultValue={sortBy} onValueChange={handleSortChange}>
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
                  {filteredJobs.length > 0 ? (
                    currentJobs.map((job) => (
                      <JobCard key={job.id} variant="horizontal" jobId={job.id} />
                    ))
                  ) : (
                    <div className="text-center p-10 bg-white rounded-lg">
                      <p className="text-gray-500">No jobs found. Please try a different search.</p>
                    </div>
                  )}
                </div>
                  ) : (
                    <div className="text-center p-10 bg-white rounded-lg">
                      <p className="text-gray-500">No jobs available at the moment.</p>
                    </div>
                  )}
                </>
              )}

              {/* Pagination */}
              {filteredJobs.length > 0 && (
                <div className="flex justify-center mt-10">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &lt;
                    </Button>
                    
                    {/* Generate pagination numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                      // Logic to show relevant page numbers around current page
                      let pageNum = 1;
                      if (totalPages <= 5) {
                        // If 5 or fewer pages, show all pages 1 through totalPages
                        pageNum = idx + 1;
                      } else if (currentPage <= 3) {
                        // If on pages 1-3, show pages 1-5
                        pageNum = idx + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // If on last 3 pages, show last 5 pages
                        pageNum = totalPages - 4 + idx;
                      } else {
                        // Otherwise show current page and 2 pages before and after
                        pageNum = currentPage - 2 + idx;
                      }
                      
                      return (
                        <Button 
                          key={pageNum}
                          variant="outline" 
                          size="sm"
                          className={currentPage === pageNum ? "bg-yellow-500 text-black border-yellow-500" : ""}
                          onClick={() => paginate(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
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
