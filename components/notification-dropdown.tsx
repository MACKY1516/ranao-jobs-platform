"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, Clock, User, Briefcase, AlertCircle, X, LogIn, Edit } from "lucide-react"
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
import { getEmployerNotifications, EmployerRelatedNotification } from "@/lib/notifications"
import { formatDistanceToNow } from "date-fns"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { recordActivity } from "@/lib/activity-logger"

export function NotificationDropdown() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<EmployerRelatedNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Get user data from local storage
        const storedUser = localStorage.getItem("ranaojobs_user")
        if (!storedUser) {
          // If no user, stop loading and return (or handle as needed)
          setIsLoading(false);
          return;
        }
        const user = JSON.parse(storedUser);

        // Check if the user is an employer or multi-role with active employer role
        if (user.role === "employer" || (user.role === "multi" && user.activeRole === "employer")) {
          const employerNotifications: EmployerRelatedNotification[] = await getEmployerNotifications(user.id);
          
          // The fetched data already conforms to EmployerRelatedNotification
          setNotifications(employerNotifications);
        } else {
          // If not an employer, set empty notifications
          setNotifications([]);
        }
      } catch (err: any) {
        setError("Failed to load notifications")
        console.error("Error fetching notifications in dropdown:", err)
        setNotifications([]); // Set empty array on error
      } finally {
        setIsLoading(false) // Make sure to set loading to false in all cases
      }
    }

    fetchNotifications()
  }, [])

  // Use isRead for unread count
  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  const markAsRead = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      // Get user data from local storage
      const storedUser = localStorage.getItem("ranaojobs_user")
      if (!storedUser) return;
      const user = JSON.parse(storedUser);

      // Update in Firestore
      const notificationRef = doc(db, "employernotifications", id);
      await updateDoc(notificationRef, {
        isRead: true
      });
      
      // Log activity
      await recordActivity(
        user.id,
        "notification_read",
        `Employer ${user.companyName || user.email} marked notification as read`,
        {
          notificationId: id,
          role: "employer"
        }
      );
      
      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  const markAllAsRead = async () => {
    try {
      // Get user data from local storage
      const storedUser = localStorage.getItem("ranaojobs_user")
      if (!storedUser) return;
      const user = JSON.parse(storedUser);

      // Get all unread notifications
      const unreadNotifications = notifications.filter(notification => !notification.isRead);
      
      // Update each unread notification in Firestore
      const updatePromises = unreadNotifications.map(notification => 
        updateDoc(doc(db, "employernotifications", notification.id), {
          isRead: true
        })
      );
      
      await Promise.all(updatePromises);
      
      // Log activity
      await recordActivity(
        user.id,
        "notifications_all_read",
        `Employer ${user.companyName || user.email} marked all notifications as read`,
        {
          count: unreadNotifications.length,
          role: "employer"
        }
      );
      
      // Update local state
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  const handleNotificationClick = async (notification: EmployerRelatedNotification) => {
    try {
      // Get user data from local storage
      const storedUser = localStorage.getItem("ranaojobs_user")
      if (!storedUser) return;
      const user = JSON.parse(storedUser);

      // Mark as read in Firestore
      const notificationRef = doc(db, "employernotifications", notification.id);
      await updateDoc(notificationRef, {
        isRead: true
      });
      
      // Log activity
      await recordActivity(
        user.id,
        "notification_click",
        `Employer ${user.companyName || user.email} clicked on notification: ${notification.title}`,
        {
          notificationId: notification.id,
          notificationType: notification.type,
          role: "employer"
        }
      );
      
      // Update local state
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)))

      // Navigate to the link if it exists
      if (notification.link) {
        router.push(notification.link);
      } else {
        // Navigate to the notifications page
        router.push("/employer-home/notification");
      }
      setOpen(false)
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
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
      case "login": // Add login case
          return <LogIn className="h-5 w-5 text-green-500" />; // Use LogIn icon
      case "job_edit": // Add job_edit case
          return <Edit className="h-5 w-5 text-orange-500" />; // Use Edit icon
      case "profile_update": // Add profile_update case
          return <User className="h-5 w-5 text-blue-500" />; // Use User icon
      // Add other relevant employer activity types here
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
        ) : ( // Restored rendering code
          <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
            {notifications.map((notification: EmployerRelatedNotification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-4 cursor-pointer ${notification.isRead ? "opacity-70" : "bg-yellow-50 dark:bg-yellow-900/10"}`} // Use isRead
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{notification.message}</p> {/* Use message */}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt.toDate()), { addSuffix: true }) : 'Timestamp missing'} {/* Format createdAt */}
                    </p>
                  </div>
                  {!notification.isRead && ( // Use isRead
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2 opacity-50 hover:opacity-100"
                      onClick={(e) => markAsRead(notification.id, e)} // Use isRead
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
        <DropdownMenuItem className="p-2 text-center cursor-pointer" onClick={() => router.push("/employer-home/notification")}> {/* Update link */}
          <p className="w-full text-sm text-yellow-500">View all notifications</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}