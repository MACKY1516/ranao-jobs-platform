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
import { db } from "@/lib/firebase"
import { collection, getDocs, doc } from "firebase/firestore"

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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [mapZoom, setMapZoom] = useState(10) // Default to regional zoom level

  // Get user's location
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
        },
        (error) => {
          console.error("Error getting user location:", error)
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
    }
  }, [])

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

  // Convert street address to coordinates for jobs that only have addresses
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      // This is a simplified approach - in a production app, you'd use a proper geocoding service
      // with appropriate rate limiting and error handling
      
      // Philippines-specific geocoding approximations for major cities
      const addressMap: Record<string, [number, number]> = {
        'manila': [14.5995, 120.9842],
        'cebu': [10.3157, 123.8854], 
        'davao': [7.1907, 125.4553],
        'quezon': [14.6760, 121.0437],
        'makati': [14.5547, 121.0244],
        'marawi': [8.0, 124.3],
        'iligan': [8.2289, 124.2444],
        'cagayan': [8.4542, 124.6319],
        'zamboanga': [6.9214, 122.0790]
      };
      
      const lowerAddress = address.toLowerCase();
      
      // Check for city matches
      for (const [city, coords] of Object.entries(addressMap)) {
        if (lowerAddress.includes(city)) {
          return coords;
        }
      }
      
      // Fallback to central Philippines
      return [12.8797, 121.774];
    } catch (error) {
      console.error(`Error geocoding address: ${address}`, error);
      return null;
    }
  };

  // Fetch jobs from Firestore
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true)
        
        // Get jobs from Firestore
        const jobsCollection = collection(db, "jobs")
        const jobsSnapshot = await getDocs(jobsCollection)
        
        if (jobsSnapshot.empty) {
          setError("No jobs found in the database.")
          setJobs([])
          setFilteredJobs([])
          setIsLoading(false)
          return
        }
        
        // Process job data and add coordinates if needed
        const jobsList: Job[] = [];
        
        for (const doc of jobsSnapshot.docs) {
          const jobData = doc.data();
          
          // Skip jobs without necessary data
          if (!jobData.title || !jobData.company || !jobData.location) {
            console.warn(`Job ${doc.id} missing required fields, skipping`);
            continue;
          }
          
          // Create base job object
          const job: any = {
            id: doc.id,
            title: jobData.title,
            company: jobData.company,
            category: jobData.category || "General",
            location: jobData.location,
            type: jobData.type || "Full-time",
            salary: jobData.salary,
            postedAt: jobData.postedAt?.toDate?.() || new Date().toISOString(),
            deadline: jobData.deadline,
            description: jobData.description
          };
          
          // Handle coordinates: use existing or geocode from location
          if (jobData.coordinates && 
              Array.isArray(jobData.coordinates) && 
              jobData.coordinates.length === 2) {
            
            job.coordinates = jobData.coordinates;
          } else {
            // Geocode the location to get coordinates
            const coords = await geocodeAddress(jobData.location);
            if (coords) {
              job.coordinates = coords;
            } else {
              // Skip jobs that can't be mapped
              console.warn(`Could not geocode location for job ${doc.id}, skipping`);
              continue;
            }
          }
          
          jobsList.push(job as Job);
        }
        
        setJobs(jobsList)
        setFilteredJobs(jobsList)
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

    if (categoryFilter && categoryFilter !== "all") {
      result = result.filter((job) => job.category === categoryFilter)
    }

    if (locationFilter && locationFilter !== "all") {
      result = result.filter((job) => job.location.includes(locationFilter))
    }

    setFilteredJobs(result)
  }, [jobs, searchTerm, categoryFilter, locationFilter])

  // Get unique categories and locations for filters
  const categories = [...new Set(jobs.map((job) => job.category).filter(Boolean))]
  const locations = [...new Set(jobs.map((job) => {
    const parts = job.location.split(",");
    return parts.length > 0 ? parts[0].trim() : job.location;
  }))]

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
              <JobMap 
                jobs={filteredJobs} 
                height="100%" 
                initialCenter={userLocation || undefined}
                initialZoom={mapZoom}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
