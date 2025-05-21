"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { recordActivity } from "@/lib/activity-logger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PostJobPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [requirements, setRequirements] = useState("")
  const [location, setLocation] = useState("")
  const [salary, setSalary] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const userData = localStorage.getItem("ranaojobs_user")
      if (!userData) {
        throw new Error("Please log in to post jobs")
      }

      const user = JSON.parse(userData)
      const jobData = {
        title,
        description,
        requirements,
        location,
        salary,
        companyId: user.id,
        companyName: user.companyName,
        status: "active",
        createdAt: serverTimestamp()
      }

      // Add job to Firestore
      const docRef = await addDoc(collection(db, "jobs"), jobData)

      // Record job posting activity
      await recordActivity(
        user.id,
        "job_post",
        "Posted new job",
        {
          jobId: docRef.id,
          jobTitle: title,
          companyName: user.companyName
        }
      )

      router.push("/employer-dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Post a New Job</CardTitle>
          <CardDescription>Fill in the details to post a new job listing</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter job title"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter job description"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Requirements</label>
              <Textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Enter job requirements"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter job location"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Salary</label>
              <Input
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="Enter salary range"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Posting..." : "Post Job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 