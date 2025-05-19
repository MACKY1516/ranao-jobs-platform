"use client"

import { useState, useEffect, useRef } from "react"
import { Search, User, Briefcase, Building2, X, AlertCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface SearchResult {
  id: string
  type: 'user' | 'job' | 'employer' | 'application'
  title: string
  subtitle: string
  link: string
}

export function AdminGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Debounce search query to avoid making too many Firestore queries
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  
  // Handle keyboard shortcut to open search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])
  
  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
      setResults([])
      return
    }
    
    const performSearch = async () => {
      setIsLoading(true)
      
      try {
        const searchResults: SearchResult[] = []
        
        // Search users
        const userQuery = query(
          collection(db, "users"),
          where("firstName", ">=", debouncedSearchQuery),
          where("firstName", "<=", debouncedSearchQuery + "\uf8ff"),
          limit(5)
        )
        
        const userSnapshot = await getDocs(userQuery)
        userSnapshot.forEach(doc => {
          const userData = doc.data()
          const role = userData.role || "jobseeker"
          const type = role === "employer" ? "employer" : "user"
          
          searchResults.push({
            id: doc.id,
            type: type as 'user' | 'employer',
            title: `${userData.firstName} ${userData.lastName || ""}`,
            subtitle: role === "employer" ? (userData.companyName || "Employer") : "Jobseeker",
            link: `/admin/users/${doc.id}`
          })
        })
        
        // Search jobs
        const jobQuery = query(
          collection(db, "jobs"),
          where("title", ">=", debouncedSearchQuery),
          where("title", "<=", debouncedSearchQuery + "\uf8ff"),
          limit(5)
        )
        
        const jobSnapshot = await getDocs(jobQuery)
        jobSnapshot.forEach(doc => {
          const jobData = doc.data()
          searchResults.push({
            id: doc.id,
            type: "job",
            title: jobData.title,
            subtitle: jobData.companyName || "Unknown Company",
            link: `/admin/jobs/${doc.id}`
          })
        })
        
        // Search applications
        const applicationQuery = query(
          collection(db, "applications"),
          orderBy("createdAt", "desc"),
          limit(3)
        )
        
        const applicationSnapshot = await getDocs(applicationQuery)
        const applicationPromises = applicationSnapshot.docs.map(async (docSnap) => {
          const appData = docSnap.data()
          
          // Fetch job title
          let jobTitle = "Unknown Job"
          if (appData.jobId) {
            try {
              const jobDocRef = doc(db, "jobs", appData.jobId);
              const jobDocSnap = await getDoc(jobDocRef);
              if (jobDocSnap.exists()) {
                jobTitle = jobDocSnap.data()?.title || "Unknown Job"
              }
            } catch (e) {
              console.error("Error fetching job:", e)
            }
          }
          
          return {
            id: docSnap.id,
            type: "application" as const,
            title: jobTitle,
            subtitle: `Application - ${appData.status || "Pending"}`,
            link: `/admin/applications/${docSnap.id}`
          }
        })
        
        const applicationResults = await Promise.all(applicationPromises)
        searchResults.push(...applicationResults)
        
        // Sort results by type
        const sortOrder: Record<string, number> = { user: 1, employer: 2, job: 3, application: 4 }
        searchResults.sort((a, b) => (sortOrder[a.type] || 99) - (sortOrder[b.type] || 99))
        
        setResults(searchResults)
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    performSearch()
  }, [debouncedSearchQuery])
  
  // Clear results when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
      setResults([])
    }
  }, [isOpen])
  
  const handleSelect = (result: SearchResult) => {
    setIsOpen(false)
    router.push(result.link)
  }
  
  const getIconForType = (type: string) => {
    switch (type) {
      case "user":
        return <User className="h-4 w-4 text-blue-500" />
      case "employer":
        return <Building2 className="h-4 w-4 text-green-500" />
      case "job":
        return <Briefcase className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <>
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search anything... (Ctrl+K)"
          className="w-64 pl-8 rounded-md border-gray-300 focus:border-yellow-500 focus:ring focus:ring-yellow-200 focus:ring-opacity-50"
          onClick={() => setIsOpen(true)}
          readOnly
        />
      </div>
      
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput 
          placeholder="Search users, jobs, employers..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          ref={inputRef}
        />
        <CommandList>
          {isLoading && (
            <div className="py-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-yellow-500" />
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          )}
          
          {!isLoading && searchQuery.length > 0 && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          
          {results.length > 0 && (
            <>
              <CommandGroup heading="Users">
                {results.filter(r => r.type === 'user').map(result => (
                  <CommandItem
                    key={`user-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-2"
                  >
                    {getIconForType(result.type)}
                    <div>
                      <p>{result.title}</p>
                      <p className="text-xs text-gray-500">{result.subtitle}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandGroup heading="Employers">
                {results.filter(r => r.type === 'employer').map(result => (
                  <CommandItem
                    key={`employer-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-2"
                  >
                    {getIconForType(result.type)}
                    <div>
                      <p>{result.title}</p>
                      <p className="text-xs text-gray-500">{result.subtitle}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandGroup heading="Jobs">
                {results.filter(r => r.type === 'job').map(result => (
                  <CommandItem
                    key={`job-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-2"
                  >
                    {getIconForType(result.type)}
                    <div>
                      <p>{result.title}</p>
                      <p className="text-xs text-gray-500">{result.subtitle}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandGroup heading="Applications">
                {results.filter(r => r.type === 'application').map(result => (
                  <CommandItem
                    key={`application-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-2"
                  >
                    {getIconForType(result.type)}
                    <div>
                      <p>{result.title}</p>
                      <p className="text-xs text-gray-500">{result.subtitle}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
} 