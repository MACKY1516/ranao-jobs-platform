"use client"

import { Badge } from "@/components/ui/badge"

import { useEffect, useState, useRef } from "react"
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
import { Upload, FileText, Save, Loader2, Clock } from "lucide-react"
import Image from "next/image"
import { BackButton } from "@/components/back-button"
import { RoleSwitcher } from "@/components/role-switcher"
import { getUserProfile, updateUserProfile, requestMultiRoleUpgrade } from "@/lib/users"
import { uploadJobseekerPhoto, uploadJobseekerResume } from "@/lib/fileUpload"
import { useToast } from "@/components/ui/use-toast"
import { recordActivity } from "@/lib/activity-logger"

// Define a type for the additional document
interface AdditionalDocument {
  name: string;
  url: string;
  uploadedAt: string;
}

// Define a type for profile data 
interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  about: string;
  skills: string[];
  experience: Array<{
    id: number;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    id: number;
    degree: string;
    institution: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  certifications: Array<{
    id: number;
    name: string;
    issuer: string;
    date: string;
    description: string;
  }>;
  languages: string[];
  availability: string;
  salaryExpectation: string;
  isRemote: boolean;
  isRelocate: boolean;
  profilePhoto?: string;
  resume?: string;
  resumeFileName?: string;
  resumeUpdatedAt?: string;
  additionalDocuments: AdditionalDocument[];
}

export default function JobseekerProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMultiRole, setIsMultiRole] = useState(false)
  const [isPhotoUploading, setIsPhotoUploading] = useState(false)
  const [isResumeUploading, setIsResumeUploading] = useState(false)
  const [isDocumentUploading, setIsDocumentUploading] = useState(false)
  
  // Add state for preview data
  const [previewData, setPreviewData] = useState({
    photoUrl: "",
    resumeUrl: "",
  })
  
  // Add state for unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Add state for file objects to store temporarily before saving
  const [unsavedFiles, setUnsavedFiles] = useState<{
    profilePhoto: File | null,
    resume: File | null
  }>({
    profilePhoto: null,
    resume: null
  })
  
  const [profileData, setProfileData] = useState<ProfileData>({
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
    profilePhoto: "",
    resume: "",
    resumeFileName: "",
    resumeUpdatedAt: "",
    additionalDocuments: []
  })
  const [wantsToUpgrade, setWantsToUpgrade] = useState(false)
  const [multiRoleRequestStatus, setMultiRoleRequestStatus] = useState<"none" | "pending" | "rejected">("none")
  const [employerData, setEmployerData] = useState({
    companyName: "",
    companyIndustry: "",
    companySize: "",
    businessDescription: "",
    businessWebsite: ""
  })

  const photoInputRef = useRef<HTMLInputElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

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

    // Check for multi-role request status
    if (user.multiRoleRequested) {
      setMultiRoleRequestStatus("pending")
    } else if (user.multiRoleRejected) {
      setMultiRoleRequestStatus("rejected")
    }

    setIsMultiRole(user.role === "multi")
    setUserData(user)
    
    // Fetch profile data from Firebase
    const fetchProfileData = async () => {
      try {
        const profile = await getUserProfile(user.id);
        
        // Update state with profile data
        setProfileData(prevData => ({
          ...prevData,
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email || "",
          phone: profile.phone || "",
          location: profile.location || "",
          title: profile.title || prevData.title,
          about: profile.about || prevData.about,
          skills: profile.skills || prevData.skills,
          experience: profile.experience || prevData.experience,
          education: profile.education || prevData.education,
          certifications: profile.certifications || prevData.certifications,
          languages: profile.languages || prevData.languages,
          availability: profile.availability || prevData.availability,
          salaryExpectation: profile.salaryExpectation || prevData.salaryExpectation,
          isRemote: profile.isRemote !== undefined ? profile.isRemote : prevData.isRemote,
          isRelocate: profile.isRelocate !== undefined ? profile.isRelocate : prevData.isRelocate,
          profilePhoto: profile.profilePhoto || "",
          resume: profile.resume || "",
          resumeFileName: profile.resumeFileName || "",
          resumeUpdatedAt: profile.resumeUpdatedAt || "",
          additionalDocuments: profile.additionalDocuments || []
        }));
        
        // Initialize preview data
        setPreviewData({
          photoUrl: profile.profilePhoto || "",
          resumeUrl: profile.resume || "",
        });
        
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [router])

  // Add save function
  const handleSaveProfile = async () => {
    if (!userData) return;
    
    setIsSaving(true);
    try {
      let profileUpdates = { ...profileData };
      
      // Process profile photo if uploaded but not saved
      if (unsavedFiles.profilePhoto) {
        const photoUrl = await uploadJobseekerPhoto(unsavedFiles.profilePhoto, userData.id);
        profileUpdates.profilePhoto = photoUrl;
      }
      
      // Process resume if uploaded but not saved
      if (unsavedFiles.resume) {
        const resumeUrl = await uploadJobseekerResume(unsavedFiles.resume, userData.id);
        profileUpdates.resume = resumeUrl;
        profileUpdates.resumeFileName = unsavedFiles.resume.name;
        profileUpdates.resumeUpdatedAt = new Date().toISOString();
      }
      
      // Update Firestore with all changes
      await updateUserProfile(userData.id, profileUpdates);
      
      // Identify changes for activity logging
      const changes: Record<string, any> = {};
      // Compare current profileData with the initial data (need to fetch or store initial data)
      // For now, let's just log the updated fields. A more robust solution would involve storing initial state.
      
      // Simple comparison for basic fields
      if (profileUpdates.firstName !== profileData.firstName) changes.firstName = profileUpdates.firstName;
      if (profileUpdates.lastName !== profileData.lastName) changes.lastName = profileUpdates.lastName;
      if (profileUpdates.email !== profileData.email) changes.email = profileUpdates.email;
      if (profileUpdates.phone !== profileData.phone) changes.phone = profileUpdates.phone;
      if (profileUpdates.location !== profileData.location) changes.location = profileUpdates.location;
      if (profileUpdates.title !== profileData.title) changes.title = profileUpdates.title;
      if (profileUpdates.about !== profileData.about) changes.about = profileUpdates.about;
      if (profileUpdates.availability !== profileData.availability) changes.availability = profileUpdates.availability;
      if (profileUpdates.salaryExpectation !== profileData.salaryExpectation) changes.salaryExpectation = profileUpdates.salaryExpectation;
      if (profileUpdates.isRemote !== profileData.isRemote) changes.isRemote = profileUpdates.isRemote;
      if (profileUpdates.isRelocate !== profileData.isRelocate) changes.isRelocate = profileUpdates.isRelocate;

      // Compare array fields (skills, experience, education, certifications, languages, additionalDocuments)
      // This is a simplified comparison that checks if the array content is different
      if (JSON.stringify(profileUpdates.skills) !== JSON.stringify(profileData.skills)) changes.skills = profileUpdates.skills;
      if (JSON.stringify(profileUpdates.experience) !== JSON.stringify(profileData.experience)) changes.experience = profileUpdates.experience;
      if (JSON.stringify(profileUpdates.education) !== JSON.stringify(profileData.education)) changes.education = profileUpdates.education;
      if (JSON.stringify(profileUpdates.certifications) !== JSON.stringify(profileData.certifications)) changes.certifications = profileUpdates.certifications;
      if (JSON.stringify(profileUpdates.languages) !== JSON.stringify(profileData.languages)) changes.languages = profileUpdates.languages;
      if (JSON.stringify(profileUpdates.additionalDocuments) !== JSON.stringify(profileData.additionalDocuments)) changes.additionalDocuments = profileUpdates.additionalDocuments;

      // Include changes from uploaded files if they resulted in URL updates
      if (profileUpdates.profilePhoto && profileUpdates.profilePhoto !== profileData.profilePhoto) {
          changes.profilePhoto = profileUpdates.profilePhoto;
      }
       if (profileUpdates.resume && profileUpdates.resume !== profileData.resume) {
          changes.resume = profileUpdates.resume;
          changes.resumeFileName = profileUpdates.resumeFileName; // Include filename if resume changed
      }
      
      // Update local state
      setProfileData(profileUpdates);
      
      // Clear unsaved changes
      setUnsavedFiles({
        profilePhoto: null,
        resume: null
      });
      setHasUnsavedChanges(false);
      
      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully",
      });
      
      // Record profile update activity only if there were actual changes
      if (Object.keys(changes).length > 0) {
         await recordActivity(
           userData.id,
           "profile_update",
           `Jobseeker ${userData.firstName || ''} ${userData.lastName || ''} updated their profile`,
           {
             email: userData.email,
             changes: changes // Include the detected changes in metadata
           }
         );
      }
      
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save your profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleUpgradeToMultiRole = async () => {
    if (!userData) return
    
    // Validate required fields
    if (!employerData.companyName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your company name",
        variant: "destructive",
      })
      return
    }
    
    setIsSaving(true)
    try {
      // Request multi-role upgrade in Firestore
      await requestMultiRoleUpgrade(userData.id, employerData, true)
      
      // Update local state to show pending status
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userData) return
    
    try {
      setIsPhotoUploading(true)
      const file = e.target.files[0]
      
      // Validate file type
      if (!file.type.includes('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (PNG, JPG)",
          variant: "destructive",
        })
        return
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile photo must be under 2MB",
          variant: "destructive",
        })
        return
      }
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        const previewUrl = reader.result as string;
        
        // Update preview data
        setPreviewData({
          ...previewData,
          photoUrl: previewUrl
        });
        
        // Store file for later upload
        setUnsavedFiles({
          ...unsavedFiles,
          profilePhoto: file
        });
        
        // Set unsaved changes flag
        setHasUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Photo ready for upload",
        description: "Click 'Save Profile' to apply your changes",
      });
    } catch (error) {
      console.error("Error processing photo:", error)
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your photo",
        variant: "destructive",
      })
    } finally {
      setIsPhotoUploading(false)
    }
  }
  
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userData) return
    
    try {
      setIsResumeUploading(true)
      const file = e.target.files[0]
      
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, DOC, or DOCX file",
          variant: "destructive",
        })
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Resume must be under 5MB",
          variant: "destructive",
        })
        return
      }
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        const previewUrl = reader.result as string;
        
        // Update preview data
        setPreviewData({
          ...previewData,
          resumeUrl: previewUrl
        });
        
        // Update state for preview
        setProfileData({
          ...profileData,
          resumeFileName: file.name,
          resumeUpdatedAt: new Date().toISOString()
        });
        
        // Store file for later upload
        setUnsavedFiles({
          ...unsavedFiles,
          resume: file
        });
        
        // Set unsaved changes flag
        setHasUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Resume ready for upload",
        description: "Click 'Save Profile' to apply your changes",
      });
    } catch (error) {
      console.error("Error processing resume:", error)
      toast({
        title: "Upload failed", 
        description: "There was a problem processing your resume",
        variant: "destructive",
      })
    } finally {
      setIsResumeUploading(false)
    }
  }
  
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {    
    if (!e.target.files || !e.target.files[0] || !userData) return
    
    try {
      setIsDocumentUploading(true)
      const file = e.target.files[0]
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Document must be under 5MB",
          variant: "destructive",
        })
        return
      }
      
      // Create a reader to read the file as DataURL
      const reader = new FileReader()
      
      reader.onload = () => {
        try {
          const fileDataUrl = reader.result as string
          
          // Add document to preview
          const newDocument: AdditionalDocument = {
            name: file.name,
            url: fileDataUrl,
            uploadedAt: new Date().toISOString()
          }
          
          // Make sure additionalDocuments is initialized
          const currentDocuments = profileData.additionalDocuments || [];
          
          // Add to local state for preview (will be saved when user clicks Save Profile)
          setProfileData({
            ...profileData,
            additionalDocuments: [...currentDocuments, newDocument]
          })
          
          // Mark that we have unsaved changes
          setHasUnsavedChanges(true)
          
          toast({
            title: "Document ready for upload",
            description: "Click 'Save Profile' to apply your changes",
          })
        } catch (err) {
          console.error("Error processing document:", err)
          toast({
            title: "Upload failed", 
            description: "There was a problem processing your document",
            variant: "destructive",
          })
        } finally {
          setIsDocumentUploading(false)
        }
      }
      
      reader.onerror = () => {
        toast({
          title: "Upload failed", 
          description: "Failed to read document file",
          variant: "destructive",
        })
        setIsDocumentUploading(false)
      }
      
      // Start reading the file as DataURL
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Upload failed", 
        description: "There was a problem uploading your document",
        variant: "destructive",
      })
      setIsDocumentUploading(false)
    }
  }

  // Cleanup function to free resources when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any object URLs to avoid memory leaks
      if (profileData.additionalDocuments) {
        profileData.additionalDocuments.forEach(doc => {
          // Check if it's an object URL (not a data URL)
          if (doc.url.startsWith('blob:')) {
            URL.revokeObjectURL(doc.url);
          }
        });
      }
    };
  }, []);

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
                          <Button 
              className={`${hasUnsavedChanges ? 'bg-yellow-500 animate-pulse' : 'bg-yellow-500'} hover:bg-yellow-600 text-black`}
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
            </div>
          </div>

          {/* MultiRole Upgrade Card */}
          {!isMultiRole && !wantsToUpgrade && multiRoleRequestStatus !== "pending" && (
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
                  both apply for jobs and post job listings. {multiRoleRequestStatus === "rejected" && (
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
                  Once approved, you'll be able to switch between Jobseeker and Employer modes. We'll notify you when your request has been processed.
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
                <CardTitle className="text-lg">Complete Employer Information</CardTitle>
                <CardDescription>
                  Please provide the following information to upgrade to a multi-role account
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input 
                    id="companyName" 
                    placeholder="Your company's name" 
                    value={employerData.companyName}
                    onChange={(e) => setEmployerData({...employerData, companyName: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyIndustry">Industry</Label>
                    <Input 
                      id="companyIndustry" 
                      placeholder="e.g. Technology, Healthcare" 
                      value={employerData.companyIndustry}
                      onChange={(e) => setEmployerData({...employerData, companyIndustry: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size</Label>
                    <Input 
                      id="companySize" 
                      placeholder="Number of employees" 
                      value={employerData.companySize}
                      onChange={(e) => setEmployerData({...employerData, companySize: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description</Label>
                  <Textarea
                    id="businessDescription"
                    placeholder="Brief description of your business"
                    rows={3}
                    value={employerData.businessDescription}
                    onChange={(e) => setEmployerData({...employerData, businessDescription: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessWebsite">Business Website</Label>
                  <Input 
                    id="businessWebsite" 
                    placeholder="e.g. https://example.com" 
                    value={employerData.businessWebsite}
                    onChange={(e) => setEmployerData({...employerData, businessWebsite: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <Button variant="outline" onClick={() => setWantsToUpgrade(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-yellow-500 hover:bg-yellow-600 text-black" 
                    onClick={handleUpgradeToMultiRole}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Save Profile button at the top */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Profile</h2>

          </div>

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
                      <Image 
                        src={previewData.photoUrl || profileData.profilePhoto || "/placeholder.svg?height=96&width=96"} 
                        alt="Profile" 
                        fill 
                        className="object-cover" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-white"
                          onClick={() => photoInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      {unsavedFiles.profilePhoto && (
                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs px-1 rounded-bl">
                          Preview
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                      id="photo-upload"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isPhotoUploading}
                    >
                      {isPhotoUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>Upload Photo</>
                      )}
                    </Button>
                    {unsavedFiles.profilePhoto && (
                      <p className="text-xs text-amber-600 mt-1">Click 'Save Profile' to apply changes</p>
                    )}
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
                    <input
                      type="file"
                      ref={resumeInputRef}
                      onChange={handleResumeUpload}
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      id="resume-upload"
                    />
                    <Button 
                      className="bg-yellow-500 hover:bg-yellow-600 text-black"
                      onClick={() => resumeInputRef.current?.click()}
                      disabled={isResumeUploading}
                    >
                      {isResumeUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Resume
                        </>
                      )}
                    </Button>
                    {(previewData.resumeUrl || profileData.resume) && (
                      <div className="mt-4 text-left bg-gray-50 p-3 rounded-md relative">
                        {unsavedFiles.resume && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs px-1 rounded-bl">
                            Preview
                          </div>
                        )}
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-500" />
                          <div>
                            <p className="font-medium">{profileData.resumeFileName || "Resume"}</p>
                            <p className="text-xs text-gray-500">
                              {unsavedFiles.resume ? 
                                "Ready to save" : 
                                `Uploaded on ${new Date(profileData.resumeUpdatedAt || Date.now()).toLocaleDateString()}`
                              }
                            </p>
                          </div>
                        </div>
                        {unsavedFiles.resume && (
                          <p className="text-xs text-amber-600 mt-1">Click 'Save Profile' to apply changes</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Additional Documents</h3>
                    {profileData.additionalDocuments && profileData.additionalDocuments.length > 0 ? (
                      profileData.additionalDocuments.map((doc: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 flex justify-between items-center relative">
                          {hasUnsavedChanges && doc.uploadedAt && new Date(doc.uploadedAt) > new Date(Date.now() - 60000) && (
                            <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs px-1 rounded-bl">
                              Preview
                            </div>
                          )}
                          <div className="flex items-center">
                            <FileText className="h-8 w-8 mr-3 text-blue-500" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-gray-500">
                                {doc.uploadedAt && new Date(doc.uploadedAt).toLocaleDateString()}
                                {hasUnsavedChanges && doc.uploadedAt && new Date(doc.uploadedAt) > new Date(Date.now() - 60000) && 
                                  <span className="ml-2 text-amber-600">(Needs saving)</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.url, '_blank')}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500"
                              onClick={() => {
                                const updatedDocs = [...profileData.additionalDocuments];
                                updatedDocs.splice(index, 1);
                                setProfileData({
                                  ...profileData,
                                  additionalDocuments: updatedDocs
                                });
                                // Mark unsaved changes when removing documents
                                setHasUnsavedChanges(true);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic text-center p-4 border rounded-lg">
                        No documents uploaded yet.
                      </p>
                    )}

                    <input
                      type="file"
                      ref={documentInputRef}
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="document-upload"
                    />
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => documentInputRef.current?.click()}
                      disabled={isDocumentUploading}
                    >
                      {isDocumentUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Additional Document
                        </>
                      )}
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

