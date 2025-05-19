"use client"

import { useState, useEffect } from "react"
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
}

export function EnhancedJobFilters({ className }: EnhancedJobFiltersProps) {
  const [mounted, setMounted] = useState(false)
  const [salaryRange, setSalaryRange] = useState([20000, 100000])
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    setMounted(true)
    setInitialLoad(false)
  }, [])

  // Don't render during SSR to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const formatSalary = (value: number) => {
    return `₱${value.toLocaleString()}`
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Filters</span>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-500">
              Reset All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Keywords */}
          <div className="space-y-2">
            <Label>Keywords</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="text" placeholder="Search job titles, skills..." className="pl-8" />
            </div>
          </div>

          {/* Job Type */}
          <div className="space-y-2">
            <Label>Job Type</Label>
            <div className="space-y-2">
              {["Full-time", "Part-time", "Contract", "Internship", "Remote"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox id={`job-type-${type.toLowerCase()}`} />
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
            <RadioGroup defaultValue="any">
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
              {["Marawi City", "Iligan City", "Cagayan de Oro", "Davao City", "Remote"].map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox id={`location-${location.toLowerCase().replace(/\s+/g, "-")}`} />
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
              {[
                "Technology",
                "Healthcare",
                "Education",
                "Finance",
                "Government",
                "Retail",
                "Manufacturing",
                "Agriculture",
              ].map((industry) => (
                <div key={industry} className="flex items-center space-x-2">
                  <Checkbox id={`industry-${industry.toLowerCase()}`} />
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
          <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">Apply Filters</Button>
        </CardContent>
      </Card>
    </div>
  )
}
