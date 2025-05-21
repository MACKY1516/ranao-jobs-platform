"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface EnhancedJobFiltersProps {
  className?: string
  onFilterChange?: (filters: any) => void
}

export function EnhancedJobFilters({ className, onFilterChange }: EnhancedJobFiltersProps) {
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
    setInitialLoad(false)
  }, [])
  
  // Create a stable filter object with useCallback to avoid recreating it on every render
  const getFiltersObject = useCallback(() => {
    return {
      keyword: keywordFilter,
      jobType: jobTypeFilters,
      experience: experienceFilter,
      locations: locationFilters,
      industry: industryFilters,
      salary: {
        min: salaryRange[0],
        max: salaryRange[1],
      },
    }
  }, [keywordFilter, jobTypeFilters, experienceFilter, locationFilters, industryFilters, salaryRange])
  
  // Only trigger filter change when explicitly requested
  useEffect(() => {
    if (!mounted || initialLoad) return
    
    if (shouldApplyFilters && onFilterChange) {
      onFilterChange(getFiltersObject())
      setShouldApplyFilters(false) // Reset after applying
    }
  }, [shouldApplyFilters, onFilterChange, getFiltersObject, mounted, initialLoad])

  // Don't render during SSR to prevent hydration mismatch
  if (!mounted) {
    return null
  }
  
  const handleJobTypeChange = (type: string, checked: boolean) => {
    setJobTypeFilters(prev => {
      if (checked) {
        return [...prev, type]
      } else {
        return prev.filter(t => t !== type)
      }
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
  
  const resetFilters = () => {
    setKeywordFilter("")
    setJobTypeFilters([])
    setExperienceFilter("any")
    setLocationFilters([])
    setIndustryFilters([])
    setSalaryRange([20000, 100000])
    
    // Apply the reset filters
    if (onFilterChange) {
      onFilterChange({
        keyword: "",
        jobType: [],
        experience: "any",
        locations: [],
        industry: [],
        salary: {
          min: 20000,
          max: 100000,
        },
      })
    }
  }

  const formatSalary = (value: number) => {
    return `₱${value.toLocaleString()}`
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
                {formatSalary(salaryRange[0])} - {formatSalary(salaryRange[1])}
              </span>
            </div>
            <Slider
              defaultValue={[20000, 100000]}
              min={0}
              max={200000}
              step={5000}
              value={salaryRange}
              onValueChange={setSalaryRange}
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
