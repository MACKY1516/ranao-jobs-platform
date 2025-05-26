"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface EnhancedJobFiltersProps {
  className?: string
  onFilterChange?: (filters: any) => void
}

export interface JobFilters {
  keywords?: string
  jobTypes?: string[]
  experienceLevel?: string
  salaryRange?: [number, number]
  locations?: string[]
  industries?: string[]
}

// These should be fetched from your database or API in a real app
const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Remote", "Temporary"];
const locations = ["Marawi City", "Iligan City", "Cagayan de Oro", "Manila", "Remote"];
const industries = ["Technology", "Healthcare", "Education", "Finance", "Marketing", "Administration", "Customer Service", "Engineering", "Sales"];

export function EnhancedJobFilters({ className, onFiltersChange }: EnhancedJobFiltersProps) {

  const [mounted, setMounted] = useState(false)
  const [salaryRange, setSalaryRange] = useState([20000, 100000])
  const [initialLoad, setInitialLoad] = useState(true)
  
  // Filter states
  const [keywordFilter, setKeywordFilter] = useState("")
  const [jobTypeFilters, setJobTypeFilters] = useState<string[]>([])
  const [experienceFilter, setExperienceFilter] = useState("any")
  const [locationFilters, setLocationFilters] = useState<string[]>([])
  const [industryFilters, setIndustryFilters] = useState<string[]>([])
  // State to track if filters should be applied
  const [shouldApplyFilters, setShouldApplyFilters] = useState(false)

  // Only run once on mount
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Only update filters when explicitly requested
  useEffect(() => {
    const active: string[] = []
    
    if (filters.keywords) active.push("keywords")
    if (filters.jobTypes && filters.jobTypes.length > 0) active.push("jobTypes")
    if (filters.experienceLevel && filters.experienceLevel !== "any") active.push("experienceLevel")
    if (filters.salaryRange && (filters.salaryRange[0] > 20000 || filters.salaryRange[1] < 100000)) active.push("salary")
    if (filters.locations && filters.locations.length > 0) active.push("locations")
    if (filters.industries && filters.industries.length > 0) active.push("industries")
    
    setActiveFilters(active)
  }, [filters])


  // Don't render during SSR to prevent hydration mismatch
  if (!mounted) {
    return null
  }
  
  const formatSalary = (value: number) => {
    return `₱${value.toLocaleString()}`
  }

  const toggleJobType = (type: string) => {
    setFilters(prev => {
      const updatedTypes = prev.jobTypes?.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...(prev.jobTypes || []), type]
      
      return { ...prev, jobTypes: updatedTypes }

    })
    // Don't automatically apply filters
  }
  
  const handleLocationChange = (location: string, checked: boolean) => {
    setLocationFilters(prev => {
      if (checked) {
        return [...prev, location]
      } else {
        return prev.filter(l => l !== location)
      }
    })
    // Don't automatically apply filters
  }
  
  const handleIndustryChange = (industry: string, checked: boolean) => {
    setIndustryFilters(prev => {
      if (checked) {
        return [...prev, industry]
      } else {
        return prev.filter(i => i !== industry)
      }
    })
    // Don't automatically apply filters
  }
  
  const handleExperienceChange = (value: string) => {
    setExperienceFilter(value)
    // Don't automatically apply filters
  }
  
  const handleKeywordSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShouldApplyFilters(true)
  }
  
  const handleKeywordSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }

  const applyFilters = () => {
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }

  const resetFilters = () => {
    setFilters({
      keywords: "",
      jobTypes: [],
      experienceLevel: "any",
      salaryRange: [20000, 100000],
      locations: [],
      industries: []
    })
    
    if (onFiltersChange) {
      onFiltersChange({})
    }

  }

  const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Remote"]
  const locations = ["Marawi City", "Iligan City", "Cagayan de Oro", "Davao City", "Remote"]
  const industries = [
    "Technology",
    "Healthcare",
    "Education",
    "Finance",
    "Government",
    "Retail",
    "Manufacturing",
    "Agriculture",
  ]
  
  const applyFilters = () => {
    setShouldApplyFilters(true)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Filters</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-gray-500"
              onClick={resetFilters}
            >
              Reset All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.map((filter) => {
                let label = ""
                switch (filter) {
                  case "keywords":
                    label = `Keywords: ${filters.keywords}`
                    break
                  case "jobTypes":
                    label = `Job Types: ${filters.jobTypes?.length}`
                    break
                  case "experienceLevel":
                    label = `Experience: ${filters.experienceLevel}`
                    break
                  case "salary":
                    label = `Salary: ${formatSalary(filters.salaryRange![0])} - ${formatSalary(filters.salaryRange![1])}`
                    break
                  case "locations":
                    label = `Locations: ${filters.locations?.length}`
                    break
                  case "industries":
                    label = `Industries: ${filters.industries?.length}`
                    break
                }

                return (
                  <Badge key={filter} variant="outline" className="flex items-center gap-1 bg-gray-100">
                    {label}
                    <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => removeFilter(filter)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )
              })}
            </div>
          )}

          {/* Search Keywords */}
          <div className="space-y-2">
            <Label>Keywords</Label>
            <form onSubmit={handleKeywordSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                type="text" 
                placeholder="Search job titles, skills..." 
                className="pl-8" 
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
              />
            </form>
          </div>

          {/* Job Type */}
          <div className="space-y-2">
            <Label>Job Type</Label>
            <div className="space-y-2">
              {jobTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`job-type-${type.toLowerCase()}`}
                    checked={jobTypeFilters.includes(type)}
                    onCheckedChange={(checked) => handleJobTypeChange(type, checked === true)}
                  />
                  <label
                    htmlFor={`job-type-${type.toLowerCase()}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label>Experience Level</Label>
            <RadioGroup 
              value={experienceFilter} 
              onValueChange={handleExperienceChange}
            >
              {[
                { value: "any", label: "Any Experience" },
                { value: "entry", label: "Entry Level" },
                { value: "mid", label: "Mid Level" },
                { value: "senior", label: "Senior Level" },
                { value: "executive", label: "Executive Level" },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`experience-${option.value}`} />
                  <label
                    htmlFor={`experience-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Salary Range */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Salary Range</Label>
              <span className="text-sm text-gray-500">
                {formatSalary(filters.salaryRange![0])} - {formatSalary(filters.salaryRange![1])}
              </span>
            </div>
            <Slider
              min={0}
              max={200000}
              step={5000}
              value={filters.salaryRange}
              onValueChange={handleSalaryChange}
              className="py-4"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="space-y-2">
              {locations.map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`location-${location.toLowerCase().replace(/\s+/g, "-")}`}
                    checked={locationFilters.includes(location)}
                    onCheckedChange={(checked) => handleLocationChange(location, checked === true)}
                  />
                  <label
                    htmlFor={`location-${location.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {location}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label>Industry</Label>
            <div className="space-y-2">
              {industries.map((industry) => (
                <div key={industry} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`industry-${industry.toLowerCase()}`}
                    checked={industryFilters.includes(industry)}
                    onCheckedChange={(checked) => handleIndustryChange(industry, checked === true)}
                  />
                  <label
                    htmlFor={`industry-${industry.toLowerCase()}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {industry}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Apply Filters Button */}
          <Button 
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
            onClick={applyFilters}
          >
            Apply Filters
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}