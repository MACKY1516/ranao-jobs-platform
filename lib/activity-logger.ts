import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore"

export async function recordActivity(
  userId: string,
  type: string,
  description: string,
  metadata: Record<string, any> = {}
) {
  try {
    const activityData = {
      userId,
      type,
      description,
      metadata,
      timestamp: serverTimestamp()
    }

    // Add to activity_log_all collection
    await addDoc(collection(db, "activity_log_all"), activityData)
    
    console.log("Activity recorded successfully:", activityData)

    // Record in userActivities collection
    await addDoc(collection(db, "userActivities"), {
      userId,
      type,
      description,
      timestamp: serverTimestamp(),
      metadata
    })

    // Check if this is a jobseeker activity and record in activity_jobseek collection
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const userRole = metadata.activeRole || userData.activeRole || userData.role;
      
      // If user is a jobseeker or multi-role acting as jobseeker, record in activity_jobseek
      if (userRole === "jobseeker") {
        await addDoc(collection(db, "activity_jobseek"), {
          userId,
          type,
          description,
          timestamp: serverTimestamp(),
          metadata: {
            ...metadata,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || ""
          }
        });
      }
      
      // If the user is an admin, also record in all_admin collection
      if (userData.role === "admin") {
        await addDoc(collection(db, "all_admin"), {
          userId,
          type,
          description,
          timestamp: serverTimestamp(),
          metadata,
          adminName: userData.firstName + " " + userData.lastName,
          adminEmail: userData.email
        })
      }
    }
  } catch (error) {
    console.error("Error recording activity:", error)
  }
} 