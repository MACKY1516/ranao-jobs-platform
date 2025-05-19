"use client"

import { Badge } from "@/components/ui/badge"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { AuthCheckModal } from "@/components/auth-check-modal"
import { Upload, FileText, Save } from "lucide-react"
import Image from "next/image"
import { BackButton } from "@/components/back-button"
import { RoleSwitcher } from "@/components/role-switcher"

export default function JobseekerProfilePage() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMultiRole, setIsMultiRole] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    title: "Frontend Developer",
    about: "Experienced frontend developer with 5 years of experience in React, Next.js, and TypeScript.",
    skills: ["React", "Next.js", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind CSS"],
    experience: [
      {
        id: 1,
        title: "Senior Frontend Developer",
        company: "Tech Solutions Inc.",
        location: "Marawi City",
        startDate: "Jan 2021",
        endDate: "Present",
        description: "Leading frontend development for multiple web applications using React and Next.js.",
      },
      {
        id: 2,
        title: "Frontend Developer",
        company: "Digital Innovations",
        location: "Cagayan de Oro",
        startDate: "Mar 2018",
        endDate: "Dec 2020",
        description: "Developed responsive web applications and implemented UI/UX designs.",
      },
    ],
    education: [
      {
        id: 1,
        degree: "Bachelor of Science in Computer Science",
        institution: "Mindanao State University",
        location: "Marawi City",
        startDate: "2014",
        endDate: "2018",
        description: "Graduated with honors. Specialized in web development and software engineering.",
      },
    ],
    certifications: [
      {
        id: 1,
        name: "React Developer Certification",
        issuer: "Meta",
        date: "2022",
        description: "Advanced certification in React development",
      },
    ],
    languages: ["English", "Filipino", "Maranao"],
    availability: "Full-time",
    salaryExpectation: "₱60,000 - ₱80,000",
    isRemote: true,
    isRelocate: false,
  })
  const [wantsToUpgrade, setWantsToUpgrade] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("ranaojobs_user")
    if (!storedUser) {
      setIsAuthModalOpen(true)
      return
    }

    const user = JSON.parse(storedUser)

    // Check if user has jobseeker role
    if (user.role !== "jobseeker" && user.role !== "multi") {
      router.push("/employer-home")
      return
    }

    // If multi-role, ensure active role is jobseeker
    if (user.role === "multi" && user.activeRole !== "jobseeker") {
      user.activeRole = "jobseeker"
      localStorage.setItem("ranaojobs_user", JSON.stringify(user))
    }

    setIsMultiRole(user.role === "multi")
    setUserData(user)
    setProfileData((prev) => ({
      ...prev,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
    }))
    setIsLoading(false)
  }, [router])

  const handleSaveProfile = () => {
    // In a real app, this would save to a database
    alert("Profile saved successfully!")
  }

  const handleUpgradeToMultiRole = () => {
    // In a real app, this would trigger a verification process
    // For now, we'll just update the user's role in localStorage
    if (userData) {
      const updatedUser = { ...userData, role: "multi", activeRole: "jobseeker" }
      localStorage.setItem("ranaojobs_user", JSON.stringify(updatedUser))
      setUserData(updatedUser)
      setIsMultiRole(true)
      setWantsToUpgrade(false)

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("userStateChange"))

      alert("Your account has been upgraded to MultiRole! You can now switch between Jobseeker and Employer roles.")
    }
  }

  if (isLoading && !isAuthModalOpen) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      <main className="flex-grow pt-20 pb-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <BackButton className="mb-4" href="/jobseeker-home" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Profile Settings</h1>
              <p className="text-gray-600">Manage your profile information and preferences</p>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              {isMultiRole && (
                <div className="mr-2">
                  <RoleSwitcher />
                </div>
              )}
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={handleSaveProfile}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* MultiRole Upgrade Card */}
          {!isMultiRole && !wantsToUpgrade && (
            <Card className="mb-6 border-yellow-500">
              <CardHeader className="bg-yellow-50">
                <CardTitle className="text-lg">Upgrade to MultiRole Account</CardTitle>
                <CardDescription>
                  Want to post jobs as an employer while maintaining your jobseeker profile? Upgrade to a MultiRole
                  account!
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-600 mb-4">
                  With a MultiRole account, you can easily switch between Jobseeker and Employer modes, allowing you to
                  both apply for jobs and post job listings.
                </p>
                <Button
                  variant="outline"
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  onClick={() => setWantsToUpgrade(true)}
                >
                  Upgrade My Account
                </Button>
              </CardContent>
            </Card>
          )}

          {/* MultiRole Upgrade Form */}
          {!isMultiRole && wantsToUpgrade && (
            <Card className="mb-6 border-yellow-500">
              <CardHeader className="bg-yellow-50">
                <CardTitle className="text-lg">Complete Your Employer Profile</CardTitle>
                <CardDescription>
                  Please provide the following information to complete your employer profile
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" placeholder="Your company name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select>
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyDescription">Company Description</Label>
                  <Textarea id="companyDescription" placeholder="Brief description of your company" rows={3} />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <Button variant="outline" onClick={() => setWantsToUpgrade(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={handleUpgradeToMultiRole}>
                    Complete Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="resume">Resume & Documents</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-4">
                      <Image src="/placeholder.svg?height=96&width=96" alt="Profile" fill className="object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="text-white">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Upload Photo
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        placeholder="City, Province"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Professional Tab */}
            <TabsContent value="professional">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>Update your professional details, skills, and experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Professional Title</Label>
                    <Input
                      id="title"
                      value={profileData.title}
                      onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                      placeholder="e.g. Frontend Developer"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about">About Me</Label>
                    <Textarea
                      id="about"
                      value={profileData.about}
                      onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
                      placeholder="Brief description about yourself"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                      {profileData.skills.map((skill, index) => (
                        <Badge key={index} className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                          {skill}
                          <button
                            className="ml-1 text-yellow-800"
                            onClick={() => {
                              const newSkills = [...profileData.skills]
                              newSkills.splice(index, 1)
                              setProfileData({ ...profileData, skills: newSkills })
                            }}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      <Input
                        className="flex-1 min-w-[150px] border-0 p-0 h-7 focus-visible:ring-0"
                        placeholder="Add a skill..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value) {
                            e.preventDefault()
                            setProfileData({
                              ...profileData,
                              skills: [...profileData.skills, e.currentTarget.value],
                            })
                            e.currentTarget.value = ""
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Work Experience</Label>
                      <Button variant="outline" size="sm">
                        Add Experience
                      </Button>
                    </div>

                    {profileData.experience.map((exp, index) => (
                      <Card key={index}>
                        <CardHeader className="p-4">
                          <div className="flex justify-between">
                            <div>
                              <CardTitle className="text-base">{exp.title}</CardTitle>
                              <CardDescription>
                                {exp.company} • {exp.location}
                              </CardDescription>
                            </div>
                            <div className="text-sm text-gray-500">
                              {exp.startDate} - {exp.endDate}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm">{exp.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Education</Label>
                      <Button variant="outline" size="sm">
                        Add Education
                      </Button>
                    </div>

                    {profileData.education.map((edu, index) => (
                      <Card key={index}>
                        <CardHeader className="p-4">
                          <div className="flex justify-between">
                            <div>
                              <CardTitle className="text-base">{edu.degree}</CardTitle>
                              <CardDescription>
                                {edu.institution} • {edu.location}
                              </CardDescription>
                            </div>
                            <div className="text-sm text-gray-500">
                              {edu.startDate} - {edu.endDate}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm">{edu.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Certifications</Label>
                      <Button variant="outline" size="sm">
                        Add Certification
                      </Button>
                    </div>

                    {profileData.certifications.map((cert, index) => (
                      <Card key={index}>
                        <CardHeader className="p-4">
                          <div className="flex justify-between">
                            <div>
                              <CardTitle className="text-base">{cert.name}</CardTitle>
                              <CardDescription>{cert.issuer}</CardDescription>
                            </div>
                            <div className="text-sm text-gray-500">{cert.date}</div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm">{cert.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Languages</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                      {profileData.languages.map((language, index) => (
                        <Badge key={index} className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          {language}
                          <button
                            className="ml-1 text-blue-800"
                            onClick={() => {
                              const newLanguages = [...profileData.languages]
                              newLanguages.splice(index, 1)
                              setProfileData({ ...profileData, languages: newLanguages })
                            }}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      <Input
                        className="flex-1 min-w-[150px] border-0 p-0 h-7 focus-visible:ring-0"
                        placeholder="Add a language..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value) {
                            e.preventDefault()
                            setProfileData({
                              ...profileData,
                              languages: [...profileData.languages, e.currentTarget.value],
                            })
                            e.currentTarget.value = ""
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resume Tab */}
            <TabsContent value="resume">
              <Card>
                <CardHeader>
                  <CardTitle>Resume & Documents</CardTitle>
                  <CardDescription>Upload your resume and other relevant documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-lg p-6 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="font-medium mb-2">Upload your resume</h3>
                    <p className="text-sm text-gray-500 mb-4">Supported formats: PDF, DOCX, DOC (Max 5MB)</p>
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Resume
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Additional Documents</h3>
                    <div className="border rounded-lg p-4 flex justify-between items-center">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 mr-3 text-blue-500" />
                        <div>
                          <p className="font-medium">Portfolio.pdf</p>
                          <p className="text-sm text-gray-500">Uploaded on Jan 15, 2023</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500">
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 flex justify-between items-center">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 mr-3 text-green-500" />
                        <div>
                          <p className="font-medium">CoverLetter.pdf</p>
                          <p className="text-sm text-gray-500">Uploaded on Jan 10, 2023</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500">
                          Delete
                        </Button>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Additional Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Job Preferences</CardTitle>
                  <CardDescription>Set your job preferences to receive relevant recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Select
                      value={profileData.availability}
                      onValueChange={(value) => setProfileData({ ...profileData, availability: value })}
                    >
                      <SelectTrigger id="availability">
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Freelance">Freelance</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary Expectation</Label>
                    <Input
                      id="salary"
                      value={profileData.salaryExpectation}
                      onChange={(e) => setProfileData({ ...profileData, salaryExpectation: e.target.value })}
                      placeholder="e.g. ₱60,000 - ₱80,000"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="remote">Open to Remote Work</Label>
                      <p className="text-sm text-gray-500">You're willing to work remotely</p>
                    </div>
                    <Switch
                      id="remote"
                      checked={profileData.isRemote}
                      onCheckedChange={(checked) => setProfileData({ ...profileData, isRemote: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="relocate">Willing to Relocate</Label>
                      <p className="text-sm text-gray-500">You're open to relocating for work</p>
                    </div>
                    <Switch
                      id="relocate"
                      checked={profileData.isRelocate}
                      onCheckedChange={(checked) => setProfileData({ ...profileData, isRelocate: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Job Alerts</Label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-gray-500">Receive job recommendations via email</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-medium">Application Updates</p>
                          <p className="text-sm text-gray-500">Get notified about your application status</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-medium">Interview Reminders</p>
                          <p className="text-sm text-gray-500">Receive reminders about upcoming interviews</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      <AuthCheckModal
        isOpen={isAuthModalOpen}
        onClose={() => router.push("/")}
        title="Jobseeker Account Required"
        message="You need to login or register as a jobseeker to access this page."
      />
    </div>
  )
}
