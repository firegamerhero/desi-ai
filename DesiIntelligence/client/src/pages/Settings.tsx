import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, User, Bell, Globe, Shield, Save, Eye, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import Textarea from "@/components/ui/textarea"; // Assumed import
import Calendar from "@/components/ui/calendar"; // Assumed import


const Settings = () => {
  const { user, updateUserPreference } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { isMobile } = useMobile();
  const [isUpdating, setIsUpdating] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [botName, setBotName] = useState(user?.botName || "Desi AI");
  const [emailNotifications, setEmailNotifications] = useState(true);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleSaveProfile = async () => {
    setIsUpdating(true);

    try {
      // Update user preferences
      await updateUserPreference({
        displayName,
        botName,
      });

      // Update on server
      await apiRequest("PATCH", "/api/user/preferences", {
        displayName,
        botName,
      });

      toast({
        title: "Settings Updated",
        description: "Your profile settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {!isMobile && <Sidebar />}

      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-dark-600">
        <div className="container max-w-4xl py-8 px-4">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-heading font-semibold">Settings</h1>
          </div>

          <Tabs defaultValue="profile">
            <TabsList className="mb-8">
              <TabsTrigger value="profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="language" className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                Language
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="productivity" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Productivity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and how Desi AI interacts with you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">What Desi AI calls you</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This is how Desi AI will address you in conversations
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="botName">What you call Desi AI</Label>
                    <Input
                      id="botName"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Customize what you want to call your AI assistant
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email}
                      disabled
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your account email address
                    </p>
                  </div>

                  <Button 
                    onClick={handleSaveProfile}
                    className="flex items-center"
                    disabled={isUpdating}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive updates and important information via email
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">New Features</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Get notified when new features are available
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Button className="flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="language">
              <Card>
                <CardHeader>
                  <CardTitle>Language Settings</CardTitle>
                  <CardDescription>
                    Choose your preferred language for interactions with Desi AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Default Language</Label>
                    <select 
                      id="language" 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-400 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-dark-400"
                      defaultValue={user?.preferredLanguage || "english"}
                    >
                      <option value="english">English</option>
                      <option value="hindi">हिंदी (Hindi)</option>
                      <option value="hinglish">Hinglish</option>
                    </select>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This is the language Desi AI will use by default in conversations
                    </p>
                  </div>

                  <Button className="flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    Save Language Preference
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Status</CardTitle>
                  <CardDescription>
                    Manage your premium subscription and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gray-50 dark:bg-dark-400 p-4 rounded-lg">
                    <h3 className="font-medium text-lg">
                      {user?.isPremium ? "Premium Account" : "Free Account"}
                    </h3>
                    {user?.isPremium && user?.premiumExpiresAt && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your premium subscription is active until{" "}
                        {new Date(user.premiumExpiresAt).toLocaleDateString()}
                      </p>
                    )}
                    {!user?.isPremium && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Upgrade to premium to unlock enhanced features including increased image generations,
                        memory features, and document uploading capabilities.
                      </p>
                    )}
                  </div>

                  {!user?.isPremium && (
                    <Button className="w-full bg-gradient-to-r from-accent-400 to-accent-600 text-gray-900 hover:from-accent-500 hover:to-accent-700">
                      Upgrade to Premium
                    </Button>
                  )}

                  {user?.isPremium && (
                    <>
                      <Button variant="outline" className="w-full mb-3">
                        Manage Subscription
                      </Button>
                      {user?.isOwner && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-medium mb-2">Owner Testing Options</h4>
                          <Button 
                            variant="secondary" 
                            className="w-full"
                            onClick={() => {
                              updateUserPreference({
                                ...user,
                                isPremium: !user.isPremium
                              });
                              toast({
                                title: `Switched to ${!user.isPremium ? 'Premium' : 'Free'} Mode`,
                                description: "Testing mode switched successfully"
                              });
                            }}
                          >
                            Test {user.isPremium ? 'Free' : 'Premium'} Mode
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>Customize how Desi AI looks and feels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Message Animations</h3>
                      <p className="text-sm text-gray-500">Enable smooth animations for messages</p>
                    </div>
                    <Switch
                      checked={user?.animationsEnabled}
                      onCheckedChange={(checked) => 
                        updateUserPreference({
                          ...user,
                          animationsEnabled: checked
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Dark Mode</h3>
                      <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                    </div>
                    <Switch
                      checked={user?.darkMode}
                      onCheckedChange={(checked) => 
                        updateUserPreference({
                          ...user,
                          darkMode: checked
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="productivity">
              <Card>
                <CardHeader>
                  <CardTitle>Productivity Tools</CardTitle>
                  <CardDescription>Manage your notes, reminders and calendar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Quick Notes</h3>
                      <Textarea 
                        placeholder="Write a new note..."
                        className="mb-2"
                      />
                      <Button size="sm">Save Note</Button>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Reminders</h3>
                      <div className="flex gap-2 mb-2">
                        <Input type="text" placeholder="Reminder title" />
                        <Input type="datetime-local" />
                        <Button size="sm">Add</Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Calendar</h3>
                      <Calendar
                        mode="single"
                        className="rounded-md border"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;