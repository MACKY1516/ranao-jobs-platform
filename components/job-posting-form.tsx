"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, PhilippinePeso, Briefcase, Clock, Calendar, Building } from "lucide-react"
import { useRouter } from "next/navigation"
import { addJobPosting, updateJobPosting, JobPosting } from "@/lib/jobs"
import { useToast } from "@/components/ui/use-toast"
import { addAdminNotification } from "@/lib/notifications"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"



// Philippine cities with coordinates
const philippineCities = [
  { name: "Manila", coordinates: [14.5995, 120.9842] },
  { name: "Quezon City", coordinates: [14.676, 121.0437] },
  { name: "Davao City", coordinates: [7.1907, 125.4553] },
  { name: "Cebu City", coordinates: [10.3157, 123.8854] },
  { name: "Zamboanga City", coordinates: [6.9214, 122.079] },
  { name: "Taguig", coordinates: [14.5176, 121.0509] },
  { name: "Pasig", coordinates: [14.5764, 121.0851] },
  { name: "Cagayan de Oro", coordinates: [8.4542, 124.6319] },
  { name: "Parañaque", coordinates: [14.4793, 121.0198] },
  { name: "Dasmariñas", coordinates: [14.3294, 120.9367] },
  { name: "General Santos", coordinates: [6.1164, 125.1716] },
  { name: "Bacoor", coordinates: [14.4624, 120.9645] },
  { name: "Bacolod", coordinates: [10.6713, 122.9511] },
  { name: "Makati", coordinates: [14.5547, 121.0244] },
  { name: "Baguio", coordinates: [16.4023, 120.596] },
  { name: "Iloilo City", coordinates: [10.7202, 122.5621] },
  { name: "Marawi City", coordinates: [8.0, 124.3] },
  { name: "Cotabato City", coordinates: [7.2167, 124.25] },
  { name: "Butuan", coordinates: [8.9475, 125.5406] },
  { name: "Iligan", coordinates: [8.228, 124.2452] },
]

interface JobPostingFormProps {
  initialData?: JobPosting;
  isEdit?: boolean;
  userData?: any;
}

export function JobPostingForm({ initialData, isEdit = false, userData: userDataProp }: JobPostingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<any>(userDataProp || null)
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    company: initialData?.company || "",
    location: initialData?.location || "",
    city: initialData?.city || "",
    coordinates: initialData?.coordinates || [0, 0] as [number, number],
    type: initialData?.type || "",
    category: initialData?.category || "",
    salary: initialData?.salary || "",
    description: initialData?.description || "",
    requirements: initialData?.requirements || "",
    benefits: initialData?.benefits || "",
    applicationDeadline: initialData?.applicationDeadline || "",
    contactEmail: initialData?.contactEmail || "",
    contactPhone: initialData?.contactPhone || "",
    remote: initialData?.remote || false,
    featured: initialData?.featured || false,
    urgent: initialData?.urgent || false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load user data from localStorage if not provided as prop
  useEffect(() => {
    // If userData was provided as prop, no need to fetch from localStorage
    if (userDataProp) {
      // Still set form data based on user data
      setFormData(prev => ({
        ...prev,
        company: userDataProp.companyName || prev.company,
        contactEmail: userDataProp.email || prev.contactEmail
      }))
      return
    }
    
    const storedUser = localStorage.getItem("ranaojobs_user")
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUserData(userData)
      
      // Auto-populate company name and contact email from user data
      setFormData(prev => ({
        ...prev,
        company: userData.companyName || prev.company,
        contactEmail: userData.email || prev.contactEmail
      }))
    }
  }, [userDataProp])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // If city is selected, update coordinates
    if (name === "city") {
      const selectedCity = philippineCities.find((city) => city.name === value)
      if (selectedCity) {
        setFormData((prev) => ({
          ...prev,
          location: value + ", Philippines",
          coordinates: selectedCity.coordinates as [number, number],
        }))
      }
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = "Job title is required"
    if (!formData.company.trim()) newErrors.company = "Company name is required"
    if (!formData.city) newErrors.city = "City is required"
    if (!formData.type) newErrors.type = "Job type is required"
    if (!formData.category) newErrors.category = "Job category is required"
    if (!formData.description.trim()) newErrors.description = "Job description is required"
    if (!formData.requirements.trim()) newErrors.requirements = "Job requirements are required"
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "Contact email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !userData) return

    setIsSubmitting(true)

    try {
      // Get company name from user data or form input
      const companyName = userData.companyName || formData.company
      
      const jobData = {
        ...formData,
        employerId: userData.id,
        companyName: companyName,
        // Ensure both fields are set correctly
        company: companyName,
      }

      let jobId: string

      if (isEdit && initialData?.id) {
        // Update existing job
        await updateJobPosting(initialData.id, jobData)
        jobId = initialData.id
        toast({
          title: "Success",
          description: "Job posting updated successfully",
          variant: "default",
        })
      } else {
        // Create new job
        jobId = await addJobPosting(jobData)
        
        // Create admin notification for new job
        await addAdminNotification(
          "New Job Posted",
          `${companyName} posted a new job: ${formData.title}`,
          "info",
          "all",
          `/admin/jobs/${jobId}`,
          "employer",
          userData.id
        )
        
        toast({
          title: "Success",
          description: "Job posted successfully and is now live.",
          variant: "default",
        })
      }

      // Redirect to jobs page
      router.push("/employer/jobs")
    } catch (error) {
      console.error("Error posting job:", error)
      toast({
        title: "Error",
        description: "Failed to post job. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-6">
       
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-yellow-500" />
              Job Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior Software Engineer"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Tech Solutions Inc."
                  className={errors.company ? "border-red-500" : ""}
                  readOnly={userData?.companyName ? true : false}
                />
                {errors.company && <p className="text-red-500 text-sm">{errors.company}</p>}
                {userData?.companyName && (
                  <p className="text-xs text-gray-500">Using company name from your profile</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4 text-gray-500" />
                  City <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.city} onValueChange={(value) => handleSelectChange("city", value)}>
                  <SelectTrigger className={errors.city ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {philippineCities.map((city) => (
                      <SelectItem key={city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
                <div className="flex items-center mt-2">
                  <Checkbox
                    id="remote"
                    checked={formData.remote}
                    onCheckedChange={(checked) => handleCheckboxChange("remote", checked === true)}
                  />
                  <label htmlFor="remote" className="ml-2 text-sm text-gray-700">
                    This is a remote position
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary" className="flex items-center">
                  <PhilippinePeso className="mr-1 h-4 w-4 text-gray-500" />
                  Salary Range
                </Label>
                <Input
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="e.g. ₱30,000 - ₱40,000 per month"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center">
                  <Clock className="mr-1 h-4 w-4 text-gray-500" />
                  Job Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center">
                  <Building className="mr-1 h-4 w-4 text-gray-500" />
                  Job Category <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select job category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Customer Service">Customer Service</SelectItem>
                    <SelectItem value="Administrative">Administrative</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="IT Support">IT Support</SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Job Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a detailed description of the job role and responsibilities"
                className={`min-h-[120px] ${errors.description ? "border-red-500" : ""}`}
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">
                Requirements <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="List the skills, qualifications, and experience required for this position"
                className={`min-h-[120px] ${errors.requirements ? "border-red-500" : ""}`}
              />
              {errors.requirements && <p className="text-red-500 text-sm">{errors.requirements}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits & Perks</Label>
              <Textarea
                id="benefits"
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                placeholder="Describe the benefits and perks offered with this position"
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-yellow-500" />
              Application Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicationDeadline">Application Deadline</Label>
                <Input
                  id="applicationDeadline"
                  name="applicationDeadline"
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">
                  Contact Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="e.g. careers@company.com"
                  className={errors.contactEmail ? "border-red-500" : ""}
                  readOnly={userData?.email ? true : false}
                />
                {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail}</p>}
                {userData?.email && (
                  <p className="text-xs text-gray-500">Using email from your profile</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="e.g. +63 912 345 6789"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Job Visibility Options</h2>

            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleCheckboxChange("featured", checked === true)}
                />
                <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                  Feature this job (highlighted in search results)
                </label>
              </div>

              <div className="flex items-center">
                <Checkbox
                  id="urgent"
                  checked={formData.urgent}
                  onCheckedChange={(checked) => handleCheckboxChange("urgent", checked === true)}
                />
                <label htmlFor="urgent" className="ml-2 text-sm text-gray-700">
                  Mark as urgent (displays an urgent tag)
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Posting Job...
                </>
              ) : (
                "Post Job"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


