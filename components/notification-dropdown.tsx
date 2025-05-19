"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, Clock, User, Briefcase, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
  link: string
  type: "application" | "message" | "job" | "system" | "interview"
}

export function NotificationDropdown() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Simulate API call to fetch notifications
    const fetchNotifications = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // In a real app, this would be an API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data
        const mockNotifications: Notification[] = [
          {
            id: "1",
            title: "New Applicant",
            description: "John Doe applied for Senior Frontend Developer",
            timestamp: "10 minutes ago",
            read: false,
            link: "/employer/applicants/1",
            type: "application",
          },
          {
            id: "2",
            title: "Interview Scheduled",
            description: "Interview with Tech Solutions Inc. tomorrow at 10:00 AM",
            timestamp: "1 hour ago",
            read: false,
            link: "/jobseeker/applications/1",
            type: "interview",
          },
          {
            id: "3",
            title: "Job Approved",
            description: "Your job posting for UX Designer has been approved",
            timestamp: "3 hours ago",
            read: true,
            link: "/employer/jobs/3",
            type: "job",
          },
          {
            id: "4",
            title: "New Message",
            description: "You have a new message from Sarah Williams",
            timestamp: "Yesterday",
            read: true,
            link: "/messages/4",
            type: "message",
          },
          {
            id: "5",
            title: "Profile Update",
            description: "Your profile has been viewed 15 times this week",
            timestamp: "2 days ago",
            read: true,
            link: "/jobseeker/profile",
            type: "system",
          },
        ]

        setNotifications(mockNotifications)
      } catch (err) {
        setError("Failed to load notifications")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const markAsRead = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))

    // Navigate to the link
    router.push(notification.link)
    setOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "application":
        return <User className="h-5 w-5 text-blue-500" />
      case "interview":
        return <Clock className="h-5 w-5 text-green-500" />
      case "job":
        return <Briefcase className="h-5 w-5 text-purple-500" />
      case "message":
        return <CheckCircle className="h-5 w-5 text-yellow-500" />
      case "system":
        return <AlertCircle className="h-5 w-5 text-gray-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white">
          <Bell className="h-5 w-5 text-white" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-yellow-500 text-black">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="flex items-center justify-between p-4">
          <DropdownMenuLabel className="text-base">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-8">
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Bell className="h-6 w-6 mx-auto mb-2" />
            <p>No new notifications</p>
          </div>
        ) : (
          <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-4 cursor-pointer ${notification.read ? "opacity-70" : "bg-yellow-50 dark:bg-yellow-900/10"}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{notification.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{notification.timestamp}</p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2 opacity-50 hover:opacity-100"
                      onClick={(e) => markAsRead(notification.id, e)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-2 text-center cursor-pointer" onClick={() => router.push("/notifications")}>
          <p className="w-full text-sm text-yellow-500">View all notifications</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
