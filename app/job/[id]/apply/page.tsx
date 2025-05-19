"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthCheckModal } from "@/components/auth-check-modal"

export default function JobApplicationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    coverLetter: "",
    resume: null as File | null,
    phoneNumber: "",
    agreeToTerms: false,
  })
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)

  // This would normally come from an API call using the job ID
  const job = {
    id: params.id,
    title: "Senior Frontend Developer",
    company: "Tech Solutions Inc.",
    location: "Marawi City, Banggolo",
  }

  // Check if user is logged in
  useEffect(() => {
    const userData = localStorage.getItem("ranaojobs_user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setIsLoggedIn(true)
        setUserRole(user.activeRole || user.role)

        // If user is an employer, redirect to job details
        if (user.role === "employer" || (user.role === "multi" && user.activeRole === "employer")) {
          router.push(`/job/${params.id}`)
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
        setIsLoggedIn(false)
        setUserRole(null)
      }
    } else {
      setIsLoggedIn(false)
      setUserRole(null)
      setIsAuthModalOpen(true)
    }

    // Listen for login/logout events
    const handleUserStateChange = () => {
      const userData = localStorage.getItem("ranaojobs_user")
      if (userData) {
        try {
          const user = JSON.parse(userData)
          setIsLoggedIn(true)
          setUserRole(user.activeRole || user.role)
          setIsAuthModalOpen(false)

          // If user is an employer, redirect to job details
          if (user.role === "employer" || (user.role === "multi" && user.activeRole === "employer")) {
            router.push(`/job/${params.id}`)
          }
        } catch (error) {
          console.error("Error parsing user data:", error)
          setIsLoggedIn(false)
          setUserRole(null)
          setIsAuthModalOpen(true)
        }
      } else {
        setIsLoggedIn(false)
        setUserRole(null)
        setIsAuthModalOpen(true)
      }
    }

    window.addEventListener("userStateChange", handleUserStateChange)
    return () => {
      window.removeEventListener("userStateChange", handleUserStateChange)
    }
  }, [params.id, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, resume: e.target.files[0] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    // Validation
    if (!formData.resume) {
      setError("Please upload your resume")
      return
    }

    if (!formData.agreeToTerms) {
      setError("You must agree to the terms and conditions")
      return
    }

    setIsSubmitting(true)

    try {
      // Mock API call - in a real app, this would be an API call
      setTimeout(() => {
        setSuccessMessage("Your application has been submitted successfully!")
        setIsSubmitting(false)

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push("/jobseeker-dashboard")
        }, 2000)
      }, 1500)
    } catch (err) {
      setError("An error occurred while submitting your application. Please try again.")
      setIsSubmitting(false)
    }
  }

  // If not logged in, show only the auth modal
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <div className="flex-grow flex items-center justify-center">
          <p>Please log in to continue...</p>
        </div>
        <Footer />
        <AuthCheckModal
          isOpen={isAuthModalOpen}
          onClose={() => router.push(`/job/${params.id}`)}
          title="Login Required"
          message="You need to login or register as a jobseeker to apply for this job."
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />

      {/* Page Header */}
      <section className="pt-24 pb-10 px-4 bg-gray-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold mb-2">Apply for Job</h1>
            <p className="text-gray-300">
              {job.title} at {job.company}
            </p>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-10 px-4 bg-gray-50 flex-grow">
        <div className="container mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Job Application</CardTitle>
              <CardDescription>
                Complete the form below to apply for this position. Fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+63 XXX XXX XXXX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resume">Resume/CV *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("resume")?.click()}
                      className="w-full justify-start"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {formData.resume ? formData.resume.name : "Upload resume (PDF, DOC, DOCX)"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Upload your resume in PDF, DOC, or DOCX format (max 5MB)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverLetter">Cover Letter</Label>
                  <Textarea
                    id="coverLetter"
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleInputChange}
                    placeholder="Introduce yourself and explain why you're a good fit for this position..."
                    className="min-h-[200px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    I agree to the terms and conditions and consent to the processing of my personal data for
                    recruitment purposes.
                  </Label>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push(`/job/${params.id}`)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}
