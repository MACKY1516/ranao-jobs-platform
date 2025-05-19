"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoginForm } from "@/components/login-form"
import { RegistrationForm } from "@/components/registration-form"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultView?: "login" | "register"
}

export function AuthModal({ isOpen, onClose, defaultView = "login" }: AuthModalProps) {
  const [view, setView] = useState<"login" | "register">(defaultView)

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      setView(defaultView)
    }
  }, [isOpen, defaultView])

  const handleLoginSuccess = () => {
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("userStateChange"))
    onClose()
  }

  const handleRegisterSuccess = () => {
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("userStateChange"))
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {view === "login" ? "Login to RANAOJobs" : "Create an Account"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {view === "login"
              ? "Enter your credentials to access your account"
              : "Join RANAOJobs to find your dream job or hire the perfect candidate"}
          </DialogDescription>
        </DialogHeader>

        {view === "login" ? (
          <LoginForm onRegisterClick={() => setView("register")} onLoginSuccess={handleLoginSuccess} />
        ) : (
          <RegistrationForm onLoginClick={() => setView("login")} onRegisterSuccess={handleRegisterSuccess} />
        )}
      </DialogContent>
    </Dialog>
  )
}
