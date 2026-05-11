// frontend/src/presentation/pages/Settings/SettingsPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Bell, Shield, LogOut, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { authService } from "@/microservices/auth/application/authService";
import { authAPI } from "@/microservices/auth/infrastructure/api/authAPI";
import { quizAPI } from "@/microservices/quiz/infrastructure/api/quizAPI";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function SettingsPage() {
  const { user, logout } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    scholarshipAlerts: true,
    universityUpdates: false,
    dataUsageConsent: false
  });
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordState, setPasswordState] = useState({ loading: false, error: null, success: null });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || user.username || '');
      setProfilePicture(user.profilePicture || '');
      if (user.preferences) {
        setPreferences(user.preferences);
      }
    }
  }, [user]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image exceeds 5MB limit.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await authService.updateProfile({ name, email, profilePicture, preferences });
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordState({ ...passwordState, error: "New passwords don't match" });
      return;
    }
    setPasswordState({ loading: true, error: null, success: null });
    try {
      await authAPI.changePassword({ oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword });
      setPasswordState({ loading: false, error: null, success: "Password changed successfully!" });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordState({ loading: false, error: null, success: null });
      }, 2000);
    } catch (err) {
      setPasswordState({ loading: false, error: err.response?.data?.error || err.message || "Failed to change password", success: null });
    }
  };

  const handleDownloadData = async () => {
    try {
      let quizHistory = [];
      try {
        const res = await quizAPI.getUserHistory(user.id);
        quizHistory = res.data?.history || [];
      } catch (err) {
        console.warn("Could not fetch quiz history for download", err);
      }
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text("ILM-ORA User Data Report", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      // Profile Info
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Profile Information", 14, 45);
      
      autoTable(doc, {
        startY: 50,
        head: [['Field', 'Value']],
        body: [
          ['Name', user.name || 'N/A'],
          ['Email', user.email || user.username || 'N/A'],
          ['User ID', user.id || 'N/A']
        ],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }
      });
      
      // Preferences
      let finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("Preferences", 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Preference', 'Status']],
        body: [
          ['Email Notifications', preferences.emailNotifications ? 'Enabled' : 'Disabled'],
          ['Scholarship Alerts', preferences.scholarshipAlerts ? 'Enabled' : 'Disabled'],
          ['University Updates', preferences.universityUpdates ? 'Enabled' : 'Disabled'],
          ['Data Usage Consent', preferences.dataUsageConsent ? 'Granted' : 'Denied']
        ],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }
      });
      
      // Quiz History
      finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("Quiz History", 14, finalY);
      
      if (quizHistory.length === 0) {
        doc.setFontSize(10);
        doc.text("No quiz history found.", 14, finalY + 10);
      } else {
        const quizBody = quizHistory.map((q, i) => [
          i + 1,
          new Date(q.createdAt || q.startTime || new Date()).toLocaleDateString(),
          q.status || 'Completed',
          q.score !== undefined ? `${q.score}%` : 'N/A'
        ]);
        
        autoTable(doc, {
          startY: finalY + 5,
          head: [['#', 'Date', 'Status', 'Score']],
          body: quizBody,
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] }
        });
      }
      
      const fileName = `ilm-ora-${(user.name || 'user').replace(/\s+/g, '_').toLowerCase()}_data.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("Failed to download data", err);
      setMessage({ type: 'error', text: 'Failed to download data.' });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-2 sm:p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {message && (
                  <div className={`p-3 rounded text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-400' : 'bg-green-100 text-green-700 border border-green-400'}`}>
                    {message.text}
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24 border">
                    <AvatarImage src={profilePicture} alt={name || "User"} className="object-cover" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Change Photo
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">JPG or PNG, max 5MB</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                </div>

                <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive updates via email</div>
                  </div>
                </div>
                <Switch 
                  checked={preferences.emailNotifications} 
                  onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Scholarship Alerts</div>
                  <div className="text-sm text-muted-foreground">Notify about new scholarships</div>
                </div>
                <Switch 
                  checked={preferences.scholarshipAlerts} 
                  onCheckedChange={(checked) => setPreferences({ ...preferences, scholarshipAlerts: checked })} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">University Updates</div>
                  <div className="text-sm text-muted-foreground">News from saved universities</div>
                </div>
                <Switch 
                  checked={preferences.universityUpdates} 
                  onCheckedChange={(checked) => setPreferences({ ...preferences, universityUpdates: checked })} 
                />
              </div>

              <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : "Save Preferences"}
              </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>Manage your privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">Data Usage Consent</div>
                      <div className="text-sm text-muted-foreground">Allow researchers and universities to use your data</div>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.dataUsageConsent} 
                    onCheckedChange={(checked) => {
                       const newPrefs = { ...preferences, dataUsageConsent: checked };
                       setPreferences(newPrefs);
                       authService.updateProfile({ preferences: newPrefs }).catch(console.error);
                    }} 
                  />
                </div>

                <div className="pt-6 border-t">
                  <h4 className="font-semibold mb-4">Account Actions</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" onClick={() => setIsPasswordModalOpen(true)}>Change Password</Button>
                    <Button variant="outline" className="w-full justify-start" onClick={handleDownloadData}>Download My Data</Button>
                  </div>
                </div>

                <div className="pt-6 border-t flex justify-end">
                  <Button variant="outline" size="sm" className="text-muted-foreground hover:text-destructive" onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>Enter your current password and a new password.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {passwordState.error && <div className="p-3 rounded text-sm bg-red-100 text-red-700">{passwordState.error}</div>}
              {passwordState.success && <div className="p-3 rounded text-sm bg-green-100 text-green-700">{passwordState.success}</div>}
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Current Password</Label>
                <Input id="oldPassword" type="password" value={passwordData.oldPassword} onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
              <Button onClick={handleChangePasswordSubmit} disabled={passwordState.loading}>
                {passwordState.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}