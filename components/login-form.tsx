"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { recordActivity } from "@/lib/activity-logger"
import { addEmployerActivity } from "@/lib/notifications"

interface LoginFormProps {
  onRegisterClick?: () => void
  onLoginSuccess?: () => void
}

export function LoginForm({ onRegisterClick, onLoginSuccess }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid))
      
      if (!userDoc.exists()) {
        setError("User profile not found")
        return
      }
      
      const userData = userDoc.data()
      
      // Check if employer account is blocked/rejected
      if ((userData.role === "employer" || 
          (userData.role === "multi" && userData.activeRole === "employer")) && 
          userData.verificationRejected === true) {
        
        const rejectionReason = userData.rejectionReason || "No specific reason provided."
        setError(`Your employer account has been blocked. Reason: ${rejectionReason}`)
        
        // Sign out from Firebase auth since we're rejecting the login
        await auth.signOut()
        return
      }
      
      const userDataForStorage = {
        id: user.uid,
        email: user.email,
        role: userData.role,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        activeRole: userData.activeRole || userData.role,
        ...userData,
      }
      
      // Store user data in local storage
      localStorage.setItem("ranaojobs_user", JSON.stringify(userDataForStorage))

      // Record login activity
      await recordActivity(
        user.uid,
        "login",
        `${userData.role === "employer" ? "Employer" : userData.role === "jobseeker" ? "Jobseeker" : "User"} logged in`,
        {
          role: userData.role,
          activeRole: userData.activeRole || userData.role,
          email: user.email
        }
      );

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("userStateChange"))

      if (onLoginSuccess) onLoginSuccess()

      // Redirect based on user role
      const role = userData.role
      
      if (role === "admin") {
        router.push("/admin")
      } else if (role === "employer") {
        router.push("/employer-home")
      } else if (role === "jobseeker") {
        router.push("/jobseeker-home")
      } else if (role === "multi") {
        // For multi-role users, redirect based on their active role
        const activeRole = userData.activeRole || "jobseeker"
        if (activeRole === "employer") {
          router.push("/employer-home")
        } else {
          router.push("/jobseeker-home")
        }
      } else {
        // Default route if role is not recognized
        router.push("/")
      }
      
    } catch (err: any) {
      console.error(err)
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password")
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later")
      } else {
        setError("An error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Button variant="link" className="p-0 h-auto text-sm text-yellow-500 hover:text-yellow-600">
            Forgot Password?
          </Button>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(!!checked)} />
        <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
          Remember me
        </Label>
      </div>

      <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Button variant="link" className="p-0 h-auto text-yellow-500 hover:text-yellow-600" onClick={onRegisterClick}>
            Register
          </Button>
        </p>
      </div>
    </form>
  )
}
