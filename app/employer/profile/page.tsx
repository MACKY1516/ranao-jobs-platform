"use client"

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
import { Upload, Save, Loader2, Clock } from "lucide-react"
import Image from "next/image"
import { BackButton } from "@/components/back-button"
import { RoleSwitcher } from "@/components/role-switcher"
import { getUserProfile, updateCompanyProfile, requestMultiRoleUpgrade } from "@/lib/users"
import { useToast } from "@/components/ui/use-toast"

export default function EmployerProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMultiRole, setIsMultiRole] = useState(false)
  const [wantsToUpgrade, setWantsToUpgrade] = useState(false)
  const [multiRoleRequestStatus, setMultiRoleRequestStatus] = useState<string | null>(null)
  const [profileData, setProfileData] = useState({
    companyName: "",
    industry: "",
    companySize: "",
    founded: "",
    website: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    country: "Philippines",
    postalCode: "",
    description: "",
    benefits: [] as string[],
    socialMedia: {
      linkedin: "",
      facebook: "",
      twitter: "",
    },
    logo: "/placeholder.svg?height=200&width=200",
    coverImage: "/placeholder.svg?height=400&width=1200",
    receiveApplications: true,
    notifyNewApplicants: true,
    publicProfile: true,
  })
  
  const [jobseekerData, setJobseekerData] = useState({
    firstName: "",
    lastName: "",
    professionalTitle: "",
    aboutMe: "",
  })

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("ranaojobs_user")
    if (!storedUser) {
      setIsAuthModalOpen(true)
      return
    }

    const user = JSON.parse(storedUser)

    // Check if user has employer role
    if (user.role !== "employer" && user.role !== "multi") {
      router.push("/jobseeker-home")
      return
    }

    // If multi-role, ensure active role is employer
    if (user.role === "multi" && user.activeRole !== "employer") {
      user.activeRole = "employer"
      localStorage.setItem("ranaojobs_user", JSON.stringify(user))
    }

    setIsMultiRole(user.role === "multi")
    setUserData(user)
    
    // Fetch user profile from Firestore
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile(user.id)
        
        // Check for multi-role status
        if (profile.role === "multi") {
          setIsMultiRole(true)
        } else if (profile.role === "multi-role" || profile.multiRoleRequested) {
          // Handle pending state - either from role="multi-role" or from multiRoleRequested flag
          setMultiRoleRequestStatus("pending")
        } else if (profile.multiRoleRejected) {
          setMultiRoleRequestStatus("rejected")
        }
        
        // Update profile data with user's data from Firestore
        setProfileData(prevData => ({
          ...prevData,
          companyName: profile.companyName || prevData.companyName,
          industry: profile.industry || prevData.industry,
          companySize: profile.companySize || prevData.companySize,
          founded: profile.founded || prevData.founded,
          website: profile.website || prevData.website,
          email: profile.email || prevData.email,
          phone: profile.phone || prevData.phone,
          address: profile.address || prevData.address,
          city: profile.city || prevData.city,
          province: profile.province || prevData.province,
          country: profile.country || prevData.country,
          postalCode: profile.postalCode || prevData.postalCode,
          description: profile.description || prevData.description,
          benefits: profile.benefits || prevData.benefits,
          socialMedia: {
            linkedin: profile.socialMedia?.linkedin || prevData.socialMedia.linkedin,
            facebook: profile.socialMedia?.facebook || prevData.socialMedia.facebook,
            twitter: profile.socialMedia?.twitter || prevData.socialMedia.twitter,
          },
          logo: profile.logo || prevData.logo,
          coverImage: profile.coverImage || prevData.coverImage,
          receiveApplications: profile.receiveApplications !== undefined 
            ? profile.receiveApplications 
            : prevData.receiveApplications,
          notifyNewApplicants: profile.notifyNewApplicants !== undefined 
            ? profile.notifyNewApplicants 
            : prevData.notifyNewApplicants,
          publicProfile: profile.publicProfile !== undefined 
            ? profile.publicProfile 
            : prevData.publicProfile,
        }))
        
        // If user has multi-role, populate jobseeker data
        if (profile.role === "multi") {
          setJobseekerData({
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            professionalTitle: profile.professionalTitle || "",
            aboutMe: profile.aboutMe || "",
          })
        }
        
      } catch (error) {
        console.error("Error fetching user profile:", error)
        toast({
          title: "Error",
          description: "Failed to load your profile data",
          variant: "destructive",
        })
      } finally {
    setIsLoading(false)
      }
    }
    
    fetchUserProfile()
  }, [router, toast])

  // Add an event listener to refresh user data when role is updated by admin
  useEffect(() => {
    const handleUserRoleUpdate = async () => {
      if (!userData) return;
      
      try {
        // Re-fetch the user profile to get updated role info
        const updatedProfile = await getUserProfile(userData.id);
        
        if (updatedProfile.role === "multi") {
          // If role is now "multi", update UI to show multi-role features
          setIsMultiRole(true);
          setMultiRoleRequestStatus(null);
          
          // Update local user data
          const storedUser = localStorage.getItem("ranaojobs_user");
          if (storedUser) {
            const user = JSON.parse(storedUser);
            user.role = "multi";
            localStorage.setItem("ranaojobs_user", JSON.stringify(user));
            setUserData(user);
          }
          
          // Refresh the page to show multi-role features
          window.location.reload();
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    };

    window.addEventListener("userRoleUpdated", handleUserRoleUpdate);
    
    return () => {
      window.removeEventListener("userRoleUpdated", handleUserRoleUpdate);
    };
  }, [userData]);

  const handleSaveProfile = async () => {
    if (!userData) return
    
    setIsSaving(true)
    try {
      // Save company profile to Firestore
      await updateCompanyProfile(userData.id, {
        companyName: profileData.companyName,
        industry: profileData.industry,
        companySize: profileData.companySize,
        founded: profileData.founded,
        website: profileData.website,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        province: profileData.province,
        country: profileData.country,
        postalCode: profileData.postalCode,
        description: profileData.description,
        benefits: profileData.benefits,
        socialMedia: profileData.socialMedia,
        logo: profileData.logo,
        coverImage: profileData.coverImage,
        receiveApplications: profileData.receiveApplications,
        notifyNewApplicants: profileData.notifyNewApplicants,
        publicProfile: profileData.publicProfile,
      })
      
      toast({
        title: "Success",
        description: "Company profile saved successfully",
      })
      
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save your profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRequestMultiRole = async () => {
    if (!userData) return
    
    setIsSaving(true)
    try {
      // Request multi-role upgrade in Firestore
      await requestMultiRoleUpgrade(userData.id, {
        firstName: jobseekerData.firstName,
        lastName: jobseekerData.lastName,
        professionalTitle: jobseekerData.professionalTitle,
        aboutMe: jobseekerData.aboutMe,
      })
      
      // Update local state for UI
      setMultiRoleRequestStatus("pending")
      setWantsToUpgrade(false)

      toast({
        title: "Request Submitted",
        description: "Your multi-role account request has been submitted for admin approval.",
      })
    } catch (error) {
      console.error("Error requesting account upgrade:", error)
      toast({
        title: "Error",
        description: "Failed to submit your upgrade request",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
          <BackButton className="mb-4" href="/employer-home" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Company Profile</h1>
              <p className="text-gray-600">Manage your company information and preferences</p>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              {isMultiRole && (
                <div className="mr-2">
                  <RoleSwitcher />
                </div>
              )}
              <Button 
                className="bg-yellow-500 hover:bg-yellow-600 text-black" 
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>

          {/* MultiRole Upgrade Card */}
          {!isMultiRole && !wantsToUpgrade && multiRoleRequestStatus !== "pending" && (
            <Card className="mb-6 border-yellow-500">
              <CardHeader className="bg-yellow-50">
                <CardTitle className="text-lg">Upgrade to MultiRole Account</CardTitle>
                <CardDescription>
                  Want to apply for jobs as a jobseeker while maintaining your employer profile? Upgrade to a MultiRole
                  account!
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-600 mb-4">
                  With a MultiRole account, you can easily switch between Employer and Jobseeker modes, allowing you to
                  both post job listings and apply for jobs. {multiRoleRequestStatus === "rejected" && (
                    <span className="text-red-600 font-medium">Your previous request was rejected. You may submit a new request.</span>
                  )}
                </p>
                <Button
                  variant="outline"
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  onClick={() => setWantsToUpgrade(true)}
                >
                  Request Upgrade
                </Button>
              </CardContent>
            </Card>
          )}

          {/* MultiRole Pending Approval Card */}
          {!isMultiRole && multiRoleRequestStatus === "pending" && (
            <Card className="mb-6 border-blue-500">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-lg">MultiRole Account Request Pending</CardTitle>
                <CardDescription>
                  Your request to upgrade to a MultiRole account is currently being reviewed by admins.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-600 mb-4">
                  Once approved, you'll be able to switch between Employer and Jobseeker modes. We'll notify you when your request has been processed.
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-600 text-sm font-medium">Pending Admin Approval</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* MultiRole Upgrade Form */}
          {!isMultiRole && wantsToUpgrade && (
            <Card className="mb-6 border-yellow-500">
              <CardHeader className="bg-yellow-50">
                <CardTitle className="text-lg">Complete Your Jobseeker Profile</CardTitle>
                <CardDescription>
                  Please provide the following information to request a MultiRole account
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Your first name" 
                      value={jobseekerData.firstName}
                      onChange={(e) => setJobseekerData({...jobseekerData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Your last name" 
                      value={jobseekerData.lastName}
                      onChange={(e) => setJobseekerData({...jobseekerData, lastName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professionalTitle">Professional Title</Label>
                  <Input 
                    id="professionalTitle" 
                    placeholder="e.g. Software Engineer" 
                    value={jobseekerData.professionalTitle}
                    onChange={(e) => setJobseekerData({...jobseekerData, professionalTitle: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aboutMe">About Me</Label>
                  <Textarea
                    id="aboutMe"
                    placeholder="Brief description about yourself and your professional background"
                    rows={3}
                    value={jobseekerData.aboutMe}
                    onChange={(e) => setJobseekerData({...jobseekerData, aboutMe: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <Button variant="outline" onClick={() => setWantsToUpgrade(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-yellow-500 hover:bg-yellow-600 text-black" 
                    onClick={handleRequestMultiRole}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="company" className="space-y-6">
            <TabsList className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <TabsTrigger value="company">Company Info</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            {/* Company Information Tab */}
            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Update your company details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={profileData.companyName}
                        onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select
                        value={profileData.industry}
                        onValueChange={(value) => setProfileData({ ...profileData, industry: value })}
                      >
                        <SelectTrigger id="industry">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Information Technology">Information Technology</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companySize">Company Size</Label>
                      <Select
                        value={profileData.companySize}
                        onValueChange={(value) => setProfileData({ ...profileData, companySize: value })}
                      >
                        <SelectTrigger id="companySize">
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="501-1000">501-1000 employees</SelectItem>
                          <SelectItem value="1000+">1000+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="founded">Year Founded</Label>
                      <Input
                        id="founded"
                        value={profileData.founded}
                        onChange={(e) => setProfileData({ ...profileData, founded: e.target.value })}
                        placeholder="e.g., 2010"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Contact Email</Label>
                      <Input
                        id="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="contact@example.com"
                      />
                    </div>
                  </div>

                    <div className="space-y-2">
                    <Label htmlFor="phone">Contact Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+63 912 345 6789"
                      />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      value={profileData.description}
                      onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                      rows={5}
                      placeholder="Describe your company, its mission, values, and what makes it unique..."
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={profileData.city}
                          onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">Province</Label>
                        <Input
                          id="province"
                          value={profileData.province}
                          onChange={(e) => setProfileData({ ...profileData, province: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={profileData.postalCode}
                          onChange={(e) => setProfileData({ ...profileData, postalCode: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={profileData.country}
                          onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Social Media</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={profileData.socialMedia.linkedin}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              socialMedia: { ...profileData.socialMedia, linkedin: e.target.value },
                            })
                          }
                          placeholder="https://linkedin.com/company/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={profileData.socialMedia.facebook}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              socialMedia: { ...profileData.socialMedia, facebook: e.target.value },
                            })
                          }
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          value={profileData.socialMedia.twitter}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              socialMedia: { ...profileData.socialMedia, twitter: e.target.value },
                            })
                          }
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Social Media</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={profileData.socialMedia.linkedin}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              socialMedia: { ...profileData.socialMedia, linkedin: e.target.value },
                            })
                          }
                          placeholder="https://linkedin.com/company/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={profileData.socialMedia.facebook}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              socialMedia: { ...profileData.socialMedia, facebook: e.target.value },
                            })
                          }
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          value={profileData.socialMedia.twitter}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              socialMedia: { ...profileData.socialMedia, twitter: e.target.value },
                            })
                          }
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Company Branding</CardTitle>
                  <CardDescription>Upload your company logo and customize your profile appearance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Company Logo</Label>
                    <div className="flex flex-col items-center p-6 border rounded-lg">
                      <div className="relative w-32 h-32 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={profileData.logo || "/placeholder.svg"}
                          alt="Company Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload a square logo (PNG, JPG). Recommended size: 200x200px
                      </p>
                      <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Cover Image</Label>
                    <div className="flex flex-col items-center p-6 border rounded-lg">
                      <div className="relative w-full h-40 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={profileData.coverImage || "/placeholder.svg"}
                          alt="Cover Image"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload a cover image (PNG, JPG). Recommended size: 1200x400px
                      </p>
                      <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Cover Image
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Company Benefits</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                      {profileData.benefits.map((benefit, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700"
                        >
                          {benefit}
                          <button
                            className="ml-2 text-gray-500 hover:text-gray-700"
                            onClick={() => {
                              const newBenefits = [...profileData.benefits]
                              newBenefits.splice(index, 1)
                              setProfileData({ ...profileData, benefits: newBenefits })
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <Input
                        className="flex-1 min-w-[150px] border-0 p-0 h-7 focus-visible:ring-0"
                        placeholder="Add a benefit..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value) {
                            e.preventDefault()
                            setProfileData({
                              ...profileData,
                              benefits: [...profileData.benefits, e.currentTarget.value],
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

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Account Preferences</CardTitle>
                  <CardDescription>Manage your account settings and notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="receiveApplications">Receive Job Applications</Label>
                      <p className="text-sm text-gray-500">Allow candidates to apply to your job postings</p>
                    </div>
                    <Switch
                      id="receiveApplications"
                      checked={profileData.receiveApplications}
                      onCheckedChange={(checked) => setProfileData({ ...profileData, receiveApplications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifyNewApplicants">New Applicant Notifications</Label>
                      <p className="text-sm text-gray-500">Receive email notifications for new job applications</p>
                    </div>
                    <Switch
                      id="notifyNewApplicants"
                      checked={profileData.notifyNewApplicants}
                      onCheckedChange={(checked) => setProfileData({ ...profileData, notifyNewApplicants: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="publicProfile">Public Company Profile</Label>
                      <p className="text-sm text-gray-500">Make your company profile visible to all users</p>
                    </div>
                    <Switch
                      id="publicProfile"
                      checked={profileData.publicProfile}
                      onCheckedChange={(checked) => setProfileData({ ...profileData, publicProfile: checked })}
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-4">Email Notification Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-medium">Job Application Updates</p>
                          <p className="text-sm text-gray-500">Notifications about application status changes</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-medium">Job Posting Expiration</p>
                          <p className="text-sm text-gray-500">Reminders when your job postings are about to expire</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-medium">Account Updates</p>
                          <p className="text-sm text-gray-500">Important updates about your account</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-medium">Marketing Communications</p>
                          <p className="text-sm text-gray-500">News, tips, and promotional offers</p>
                        </div>
                        <Switch />
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
        title="Employer Account Required"
        message="You need to login or register as an employer to access this page."
      />
    </div>
  )
}
