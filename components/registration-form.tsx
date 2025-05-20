"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "@/lib/firebase"

// List of Barangays in Marawi City
const marawiBarangays = [
  "Amito Marantao",
  "Bacong",
  "Banggolo",
  "Barionaga Punod",
  "Basak Malutlut",
  "Bubong",
  "Buadi Itowa",
  "Bubonga Lilod",
  "Bubonga Ranao",
  "Cadayonan",
  "Cabingan",
  "Daguduban",
  "Dansalan",
  "Datu Naga",
  "Datu sa Dansalan",
  "East Basak",
  "Fort",
  "Gadongan",
  "Kapantaran",
  "Kilala",
  "Lilod Madaya",
  "Lilod Saduc",
  "Lumbaca Madaya",
  "Lumbac Toros",
  "Lumbatan",
  "Marinaut East",
  "Marinaut West",
  "Matampay",
  "Moncado Colony",
  "Moncado Kadingilan",
  "Norhaya Village",
  "Pagalamatan",
  "Panggao Saduc",
  "Pantaon",
  "Papandayan",
  "Pugaan",
  "Rapasun MSU",
  "Raya Madaya I",
  "Raya Madaya II",
  "Raya Saduc",
  "Sabala Amanao",
  "Sabala Manao",
  "Saber",
  "Sangkay",
  "South Madaya",
  "Timbangalan",
  "Tuca",
  "Tolali",
  "Wawalayan Calocan",
  "Wawalayan Marinaut",
]

interface RegistrationFormProps {
  onLoginClick?: () => void
  onRegisterSuccess?: () => void
}

export function RegistrationForm({ onLoginClick, onRegisterSuccess }: RegistrationFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "jobseeker", // Default role
    isMultiRole: false,
    // Jobseeker fields
    barangay: "",
    // Employer fields
    companyName: "",
    businessPermit: null as File | null,
    // Other
    agreeToTerms: false,
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, role: value })
  }

  const handleMultiRoleChange = (checked: boolean) => {
    setFormData({ ...formData, isMultiRole: checked })
  }

  const handleBarangayChange = (value: string) => {
    setFormData({ ...formData, barangay: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, businessPermit: e.target.files[0] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!formData.agreeToTerms) {
      setError("You must agree to the terms and conditions")
      return
    }

    // Role-specific validation
    if ((formData.role === "employer" || formData.isMultiRole) && !formData.companyName) {
      setError("Company name is required for employer accounts")
      return
    }

    if ((formData.role === "jobseeker" || formData.isMultiRole) && !formData.barangay) {
      setError("Please select your barangay")
      return
    }

    setIsLoading(true)

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user
      
      // Upload business permit if provided
      let businessPermitUrl = null
      if (formData.businessPermit && (formData.role === "employer" || formData.isMultiRole)) {
        const fileRef = ref(storage, `business-permits/${user.uid}/${formData.businessPermit.name}`)
        await uploadBytes(fileRef, formData.businessPermit)
        businessPermitUrl = await getDownloadURL(fileRef)
      }
      
      // Prepare user data for Firestore
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.isMultiRole ? "multi" : formData.role,
        activeRole: formData.role, // Set initial active role
        createdAt: new Date().toISOString(),
        // Role-specific data
        ...(formData.role === "jobseeker" || formData.isMultiRole
          ? { barangay: formData.barangay }
          : {}),
        ...(formData.role === "employer" || formData.isMultiRole
          ? {
              companyName: formData.companyName,
              businessPermitUrl: businessPermitUrl,
              isVerified: false, // Employers need verification
            }
          : {}),
      }
      
      // Add user data to Firestore
      await setDoc(doc(db, "users", user.uid), userData)
      
      // Store user info in localStorage for client-side access
      localStorage.setItem(
        "ranaojobs_user",
        JSON.stringify({
          id: user.uid,
          ...userData
        }),
      )

      // Trigger custom event for user state change
      window.dispatchEvent(new Event("userStateChange"))

      // Call success callback if provided
      if (onRegisterSuccess) {
        onRegisterSuccess()
      }

      // Redirect based on role
      if (formData.role === "employer") {
        router.push("/employer-home")
      } else {
        router.push("/jobseeker-home")
      }
    } catch (err: any) {
      console.error(err)
      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Please try another email or login.")
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.")
      } else {
        setError("An error occurred during registration: " + err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Account Type</Label>
          <RadioGroup value={formData.role} onValueChange={handleRoleChange} className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="jobseeker" id="jobseeker" />
              <Label htmlFor="jobseeker" className="font-normal">
                Jobseeker
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="employer" id="employer" />
              <Label htmlFor="employer" className="font-normal">
                Employer
              </Label>
            </div>
          </RadioGroup>

          {/* <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="multiRole"
              checked={formData.isMultiRole}
              onCheckedChange={(checked) => handleMultiRoleChange(checked as boolean)}
            />
            <Label htmlFor="multiRole" className="font-normal">
              Enable Multi-Role Account (access both Jobseeker and Employer features)
            </Label>
          </div> */}
        </div>

        {/* Dynamic fields based on role selection */}
        {(formData.role === "jobseeker" || formData.isMultiRole) && (
          <div className="space-y-4 p-4 border rounded-md bg-gray-50">
            <h3 className="font-medium">Jobseeker Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value="Marawi City" disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barangay">Barangay</Label>
                <Select value={formData.barangay} onValueChange={handleBarangayChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select barangay" />
                  </SelectTrigger>
                  <SelectContent>
                    {marawiBarangays.map((barangay) => (
                      <SelectItem key={barangay} value={barangay}>
                        {barangay}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {(formData.role === "employer" || formData.isMultiRole) && (
          <div className="space-y-4 p-4 border rounded-md bg-gray-50">
            <h3 className="font-medium">Employer Information</h3>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessPermit">Business Permit</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="businessPermit"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("businessPermit")?.click()}
                  className="w-full justify-start"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {formData.businessPermit ? formData.businessPermit.name : "Upload business permit"}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Upload a scanned copy of your business permit (PDF, JPG, or PNG)</p>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
          />
          <Label htmlFor="terms" className="text-sm font-normal">
            I agree to the{" "}
            <Link href="/terms" className="text-yellow-600 hover:text-yellow-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-yellow-600 hover:text-yellow-700">
              Privacy Policy
            </Link>
          </Label>
        </div>

        <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        Already have an account?{" "}
        {onLoginClick ? (
          <Button variant="link" className="p-0 text-yellow-600 hover:text-yellow-700" onClick={onLoginClick}>
            Login
          </Button>
        ) : (
          <Link href="/login" className="text-yellow-600 hover:text-yellow-700 font-medium">
            Login
          </Link>
        )}
      </div>
    </div>
  )
}
