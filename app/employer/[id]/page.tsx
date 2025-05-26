"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmployerRating } from "@/components/employer-rating"
import { MapPin, Globe, Mail, Phone, Calendar, Users, Briefcase, Star } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { doc, getDoc, addDoc, collection, updateDoc, serverTimestamp, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"

async function fetchEmployerById(id: string) {
  try {
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { ...data, id }; // Make sure id is included in the data
    }
    console.log(`Employer with ID ${id} not found`);
    return null;
  } catch (error) {
    console.error("Error fetching employer:", error);
    return null;
  }
}

export default function EmployerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params)
  const employerId = unwrappedParams.id
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [employer, setEmployer] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)

  // Check user role
  useEffect(() => {
    const userData = localStorage.getItem("ranaojobs_user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.activeRole || user.role)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  useEffect(() => {
    const loadEmployerData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchEmployerById(employerId);
        setEmployer(data);
      } catch (error) {
        console.error("Error loading employer:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEmployerData();
  }, [employerId])

  useEffect(() => {
    if (!employer?.id) return;
    // Replace with your actual Firestore jobs fetching logic
    // Example:
    // fetchJobsByEmployerId(employer.id).then(setJobs);
  }, [employer]);

  // Function to handle rating submission
  const handleRatingSubmit = async (rating: number, feedback: string, anonymous: boolean) => {
    try {
      if (!employer || !employer.id) {
        alert("Error: Company information not found");
        return;
      }
      
      // Get user data from localStorage
      const userData = localStorage.getItem("ranaojobs_user");
      if (!userData) {
        alert("You must be logged in to submit a review");
        return;
      }
      
      const user = JSON.parse(userData);
      if (!user.id) {
        alert("User information is incomplete");
        return;
      }
      
      // Create the company rating data
      const ratingData = {
        companyId: employer.id,
        companyName: companyName,
        userId: user.id,
        userName: anonymous ? 'Anonymous User' : (user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User'),
        rating: rating,
        review: feedback,
        anonymous: anonymous,
        timestamp: serverTimestamp(),
        status: 'active'
      };
      
      // Add the rating to Firestore
      const ratingRef = await addDoc(collection(db, "companyRatings"), ratingData);
      console.log("Rating submitted with ID: ", ratingRef.id);
      
      // Update the company's average rating and count
      const companyRef = doc(db, "users", employer.id);
      await updateDoc(companyRef, {
        totalRatingSum: increment(rating),
        totalRatingCount: increment(1),
        averageRating: ((employer.totalRatingSum || 0) + rating) / ((employer.totalRatingCount || 0) + 1),
        updatedAt: serverTimestamp()
      });
      
      // Show success message
      alert("Thank you for your rating!");
      setIsRatingDialogOpen(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto max-w-6xl px-4 pt-20 pb-10">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!employer) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto max-w-6xl px-4 pt-20 pb-10">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Default values for employer properties
  const companyName = employer.companyName || employer.name || "Company";
  const companyInitial = companyName ? companyName.charAt(0) : "C";
  const employerRating = employer.averageRating || 0;
  const reviewCount = employer.totalRatingCount || 0;
  const location = employer.address ? `${employer.address}, ${employer.city || 'Marawi City'}` : (employer.location || "Location not specified");
  const industry = employer.industry || "Industry not specified";
  const website = employer.website || "#";
  const email = employer.email || "contact@example.com";
  const phone = employer.phone || "Not specified";
  const foundedYear = employer.foundedYear || "Not specified";
  const employeeCount = employer.companySize || "Not specified";
  const socialMedia = employer.socialMedia || {};
  const description = employer.companyDescription || employer.description || "No description available for this company.";

  return (
    <div className="min-h-screen">
      <NavBar />

      <div className="container mx-auto max-w-6xl px-4 pt-20 pb-10">
        <BackButton className="mb-4" />

        {/* Employer Header */}
        <div className="bg-gray-900 text-white rounded-t-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-700 rounded-lg flex items-center justify-center text-2xl font-bold">
              {companyInitial}
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="text-2xl font-bold">{companyName}</h1>
                {employer.verified && <Badge className="bg-blue-500 text-white">Verified</Badge>}
              </div>

              <div className="flex items-center mt-1">
                <EmployerRating
                  employerId={employer.id || employerId}
                  employerName={companyName}
                  initialRating={employerRating}
                  showRatingButton={userRole === "jobseeker"}
                />
                <span className="text-sm text-gray-300 ml-2">({reviewCount} reviews)</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-300">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{location}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-1" />
                  <span>{industry}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Company Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {website.replace(/(^\w+:|^)\/\//, "")}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
                        {email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p>{phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Founded</p>
                      <p>{foundedYear}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Company Size</p>
                      <p>{employeeCount}</p>
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500 mb-2">Connect with {companyName}</p>
                  <div className="flex gap-2">
                    {Object.entries(socialMedia).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <span className="sr-only">{platform}</span>
                        {platform === "linkedin" && (
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        )}
                        {platform === "facebook" && (
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                          </svg>
                        )}
                        {platform === "twitter" && (
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                          </svg>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rate this Employer - Only visible to jobseekers */}
            {userRole === "jobseeker" && (
              <Card>
                <CardHeader>
                  <CardTitle>Rate this Employer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    Share your experience with {companyName} to help other job seekers make informed decisions.
                  </p>
                  <Button
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                    onClick={() => setIsRatingDialogOpen(true)}
                  >
                    Write a Review
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="jobs">Open Jobs</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About {companyName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{description}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="jobs" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Job Openings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {jobs.length > 0 ? (
                      <div className="space-y-4">
                        {jobs.map((job) => (
                          <div key={job.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <h3 className="font-medium hover:text-yellow-500">
                              <a href={`/job/${job.id}`}>{job.title}</a>
                            </h3>
                            <div className="flex flex-wrap gap-y-1 gap-x-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center">
                                <Briefcase className="h-3 w-3 mr-1" />
                                <span>{job.type}</span>
                              </div>
                              <div className="flex items-center text-green-600 font-medium">
                                <span>{job.salary}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-400">Posted {job.postedAt}</span>
                              <Button asChild size="sm" variant="outline">
                                <a href={`/job/${job.id}`}>View Details</a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No job openings available at the moment.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Footer />
      
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate this Employer</DialogTitle>
            <DialogDescription>
              Share your experience working with {companyName}
            </DialogDescription>
          </DialogHeader>
          
          <EmployerRating 
            employerId={employer?.id || employerId}
            employerName={companyName}
            initialRating={0}
            showRatingButton={false}
                          size="lg"
              directMode={true}
              onRatingSubmit={handleRatingSubmit}
            />
        </DialogContent>
      </Dialog>
    </div>
  )
}
