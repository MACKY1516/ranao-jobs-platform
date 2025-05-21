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
  onFiltersChange?: (filters: JobFilters) => void
}

export interface JobFilters {
  keywords?: string
  jobTypes?: string[]
  experienceLevel?: string
  salaryRange?: [number, number]
  locations?: string[]
  industries?: string[]
}

export function EnhancedJobFilters({ className, onFiltersChange }: EnhancedJobFiltersProps) {
  const [mounted, setMounted] = useState(false)
  const [filters, setFilters] = useState<JobFilters>({
    keywords: "",
    jobTypes: [],
    experienceLevel: "any",
    salaryRange: [20000, 100000],
    locations: [],
    industries: []
  })
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
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

  const toggleJobType = (type: string) => {
    setFilters(prev => {
      const updatedTypes = prev.jobTypes?.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...(prev.jobTypes || []), type]
      
      return { ...prev, jobTypes: updatedTypes }
    })
  }

  const toggleLocation = (location: string) => {
    setFilters(prev => {
      const updatedLocations = prev.locations?.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...(prev.locations || []), location]
      
      return { ...prev, locations: updatedLocations }
    })
  }

  const toggleIndustry = (industry: string) => {
    setFilters(prev => {
      const updatedIndustries = prev.industries?.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...(prev.industries || []), industry]
      
      return { ...prev, industries: updatedIndustries }
    })
  }

  const handleExperienceChange = (value: string) => {
    setFilters(prev => ({ ...prev, experienceLevel: value }))
  }

  const handleSalaryChange = (values: number[]) => {
    setFilters(prev => ({ ...prev, salaryRange: values as [number, number] }))
  }

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, keywords: e.target.value }))
  }

  const applyFilters = () => {
    const active: string[] = []
    
    if (filters.keywords) active.push("keywords")
    if (filters.jobTypes && filters.jobTypes.length > 0) active.push("jobTypes")
    if (filters.experienceLevel && filters.experienceLevel !== "any") active.push("experienceLevel")
    if (filters.salaryRange && (filters.salaryRange[0] > 20000 || filters.salaryRange[1] < 100000)) active.push("salary")
    if (filters.locations && filters.locations.length > 0) active.push("locations")
    if (filters.industries && filters.industries.length > 0) active.push("industries")
    
    setActiveFilters(active)
    
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
    setActiveFilters([])
    
    if (onFiltersChange) {
      onFiltersChange({})
    }
  }

  const removeFilter = (filter: string) => {
    switch (filter) {
      case "keywords":
        setFilters(prev => ({ ...prev, keywords: "" }))
        break
      case "jobTypes":
        setFilters(prev => ({ ...prev, jobTypes: [] }))
        break
      case "experienceLevel":
        setFilters(prev => ({ ...prev, experienceLevel: "any" }))
        break
      case "salary":
        setFilters(prev => ({ ...prev, salaryRange: [20000, 100000] }))
        break
      case "locations":
        setFilters(prev => ({ ...prev, locations: [] }))
        break
      case "industries":
        setFilters(prev => ({ ...prev, industries: [] }))
        break
    }
    
    setActiveFilters(prev => prev.filter(f => f !== filter))
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Filters</span>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-500" onClick={resetFilters}>
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
                placeholder="Job title, skills, or company" 
                className="pl-8" 
                value={filters.keywords}
                onChange={handleKeywordsChange}
              />
            </div>
          </div>

          {/* Job Type */}
          <div className="space-y-2">
            <Label>Job Type</Label>
            <div className="space-y-2">
              {jobTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`job-type-${type.toLowerCase()}`} 
                    checked={filters.jobTypes?.includes(type)}
                    onCheckedChange={() => toggleJobType(type)}
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
              value={filters.experienceLevel} 
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
                    checked={filters.locations?.includes(location)}
                    onCheckedChange={() => toggleLocation(location)}
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
                    checked={filters.industries?.includes(industry)}
                    onCheckedChange={() => toggleIndustry(industry)}
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
