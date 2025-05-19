"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAdminToast } from "@/components/admin-toast"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

interface SiteSettings {
  general: {
    siteName: string
    siteUrl: string
    adminEmail: string
    supportEmail: string
  }
  regional: {
    timezone: string
    dateFormat: string
    currency: string
    language: string
  }
  jobListings: {
    autoApproveJobs: boolean
    jobExpiryDays: number
  }
  appearance: {
    primaryColor: string
    secondaryColor: string
  }
  notifications: {
    newUserNotification: boolean
    newJobNotification: boolean
    verificationNotification: boolean
    welcomeEmail: string
  }
  security: {
    minPasswordLength: number
    requireSpecialChars: boolean
    enable2FA: boolean
    sessionTimeout: number
  }
  api: {
    enableApi: boolean
    apiKey: string
    webhookUrl: string
  }
}

const defaultSettings: SiteSettings = {
  general: {
    siteName: "RANAOJobs",
    siteUrl: "https://ranaojobs.com",
    adminEmail: "admin@ranaojobs.com",
    supportEmail: "support@ranaojobs.com"
  },
  regional: {
    timezone: "Asia/Manila",
    dateFormat: "MM/DD/YYYY",
    currency: "PHP (₱)",
    language: "English"
  },
  jobListings: {
    autoApproveJobs: false,
    jobExpiryDays: 30
  },
  appearance: {
    primaryColor: "#FFD700",
    secondaryColor: "#1F2937"
  },
  notifications: {
    newUserNotification: true,
    newJobNotification: true,
    verificationNotification: true,
    welcomeEmail: "Welcome to RANAOJobs! We're excited to have you join our platform. Get started by completing your profile and exploring job opportunities in Marawi City."
  },
  security: {
    minPasswordLength: 8,
    requireSpecialChars: true,
    enable2FA: false,
    sessionTimeout: 30
  },
  api: {
    enableApi: true,
    apiKey: "sk_live_51NzQwISJgVn8DkDECmEGKbZSRSj7LWrQOSXyNwH",
    webhookUrl: "https://example.com/webhook"
  }
}

export default function SettingsPage() {
  const { success, error } = useAdminToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)

  // Load settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "site-settings"))
        
        if (settingsDoc.exists()) {
          // Get data from Firestore
          const data = settingsDoc.data() as SiteSettings
          setSettings(data)
        } else {
          // If no settings exist, create default settings in Firestore
          await setDoc(doc(db, "settings", "site-settings"), defaultSettings)
        }
      } catch (err) {
        console.error("Error loading settings:", err)
        error("Failed to load settings")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSettings()
  }, [error])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Update settings in Firestore - cast to a plain object with no type
      await updateDoc(doc(db, "settings", "site-settings"), JSON.parse(JSON.stringify(settings)))
      success("Settings saved successfully")
    } catch (err) {
      console.error("Error saving settings:", err)
      error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle input changes for different setting types
  const updateSettings = (category: keyof SiteSettings, field: string, value: any) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: value
      }
    })
  }

  if (isLoading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Settings">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>Manage your platform configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general">
              <TabsList className="mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Site Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="site-name">Site Name</Label>
                      <Input 
                        id="site-name" 
                        value={settings.general.siteName}
                        onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="site-url">Site URL</Label>
                      <Input 
                        id="site-url" 
                        value={settings.general.siteUrl}
                        onChange={(e) => updateSettings('general', 'siteUrl', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Admin Email</Label>
                      <Input 
                        id="admin-email" 
                        value={settings.general.adminEmail}
                        onChange={(e) => updateSettings('general', 'adminEmail', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="support-email">Support Email</Label>
                      <Input 
                        id="support-email" 
                        value={settings.general.supportEmail}
                        onChange={(e) => updateSettings('general', 'supportEmail', e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Regional Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input 
                        id="timezone" 
                        value={settings.regional.timezone}
                        onChange={(e) => updateSettings('regional', 'timezone', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-format">Date Format</Label>
                      <Input 
                        id="date-format" 
                        value={settings.regional.dateFormat}
                        onChange={(e) => updateSettings('regional', 'dateFormat', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Input 
                        id="currency" 
                        value={settings.regional.currency}
                        onChange={(e) => updateSettings('regional', 'currency', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Input 
                        id="language" 
                        value={settings.regional.language}
                        onChange={(e) => updateSettings('regional', 'language', e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Job Listing Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-approve-jobs">Auto-approve job listings</Label>
                        <p className="text-sm text-gray-500">
                          Automatically approve job listings from verified employers
                        </p>
                      </div>
                      <Switch 
                        id="auto-approve-jobs" 
                        checked={settings.jobListings.autoApproveJobs}
                        onCheckedChange={(checked) => updateSettings('jobListings', 'autoApproveJobs', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="job-expiry">Job listing expiry</Label>
                        <p className="text-sm text-gray-500">Number of days before job listings expire</p>
                      </div>
                      <Input 
                        id="job-expiry" 
                        className="w-20" 
                        value={settings.jobListings.jobExpiryDays}
                        onChange={(e) => updateSettings('jobListings', 'jobExpiryDays', Number(e.target.value))} 
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Theme Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="primary-color" 
                          value={settings.appearance.primaryColor}
                          onChange={(e) => updateSettings('appearance', 'primaryColor', e.target.value)} 
                        />
                        <div 
                          className="w-10 h-10 rounded-md" 
                          style={{ backgroundColor: settings.appearance.primaryColor }} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="secondary-color" 
                          value={settings.appearance.secondaryColor}
                          onChange={(e) => updateSettings('appearance', 'secondaryColor', e.target.value)} 
                        />
                        <div 
                          className="w-10 h-10 rounded-md" 
                          style={{ backgroundColor: settings.appearance.secondaryColor }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Logo Settings</h3>
                  <div className="space-y-2">
                    <Label htmlFor="logo-upload">Upload Logo</Label>
                    <Input id="logo-upload" type="file" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="new-user-notification">New user registrations</Label>
                        <p className="text-sm text-gray-500">Receive email notifications for new user registrations</p>
                      </div>
                      <Switch 
                        id="new-user-notification" 
                        checked={settings.notifications.newUserNotification}
                        onCheckedChange={(checked) => updateSettings('notifications', 'newUserNotification', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="new-job-notification">New job listings</Label>
                        <p className="text-sm text-gray-500">Receive email notifications for new job listings</p>
                      </div>
                      <Switch 
                        id="new-job-notification" 
                        checked={settings.notifications.newJobNotification}
                        onCheckedChange={(checked) => updateSettings('notifications', 'newJobNotification', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="verification-notification">Employer verification requests</Label>
                        <p className="text-sm text-gray-500">
                          Receive email notifications for new employer verification requests
                        </p>
                      </div>
                      <Switch 
                        id="verification-notification" 
                        checked={settings.notifications.verificationNotification}
                        onCheckedChange={(checked) => updateSettings('notifications', 'verificationNotification', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Templates</h3>
                  <div className="space-y-2">
                    <Label htmlFor="welcome-email">Welcome Email</Label>
                    <Textarea
                      id="welcome-email"
                      className="min-h-[150px]"
                      value={settings.notifications.welcomeEmail}
                      onChange={(e) => updateSettings('notifications', 'welcomeEmail', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Password Policy</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="min-password-length">Minimum password length</Label>
                        <p className="text-sm text-gray-500">Minimum number of characters required for passwords</p>
                      </div>
                      <Input 
                        id="min-password-length" 
                        className="w-20" 
                        value={settings.security.minPasswordLength}
                        onChange={(e) => updateSettings('security', 'minPasswordLength', Number(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="require-special-chars">Require special characters</Label>
                        <p className="text-sm text-gray-500">Require at least one special character in passwords</p>
                      </div>
                      <Switch 
                        id="require-special-chars" 
                        checked={settings.security.requireSpecialChars}
                        onCheckedChange={(checked) => updateSettings('security', 'requireSpecialChars', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Account Security</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable-2fa">Enable Two-Factor Authentication</Label>
                        <p className="text-sm text-gray-500">Require two-factor authentication for admin accounts</p>
                      </div>
                      <Switch 
                        id="enable-2fa" 
                        checked={settings.security.enable2FA}
                        onCheckedChange={(checked) => updateSettings('security', 'enable2FA', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="session-timeout">Session timeout (minutes)</Label>
                        <p className="text-sm text-gray-500">Automatically log out inactive users after this period</p>
                      </div>
                      <Input 
                        id="session-timeout" 
                        className="w-20" 
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSettings('security', 'sessionTimeout', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="api" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">API Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable-api">Enable API Access</Label>
                        <p className="text-sm text-gray-500">
                          Allow external applications to access the platform via API
                        </p>
                      </div>
                      <Switch 
                        id="enable-api" 
                        checked={settings.api.enableApi}
                        onCheckedChange={(checked) => updateSettings('api', 'enableApi', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id="api-key"
                          value={settings.api.apiKey}
                          onChange={(e) => updateSettings('api', 'apiKey', e.target.value)}
                          type="password"
                          className="font-mono"
                        />
                        <Button 
                          variant="outline"
                          onClick={() => updateSettings('api', 'apiKey', `sk_live_${Math.random().toString(36).substring(2, 15)}`)}
                        >
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Webhook Settings</h3>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      value={settings.api.webhookUrl}
                      onChange={(e) => updateSettings('api', 'webhookUrl', e.target.value)}
                      placeholder="https://your-webhook-url.com"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => setSettings(defaultSettings)}
            >
              Reset to Defaults
            </Button>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></span>
                  Saving...
                </span>
              ) : (
                "Save Settings"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  )
}
