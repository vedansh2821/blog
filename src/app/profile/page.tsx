
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, type AuthUser } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Edit, Save, Lock, Loader2, Mail, Phone, User as UserIcon, Users } from 'lucide-react'; // Added Users icon
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import BlogPostCard from '@/components/blog-post-card'; // Reuse for displaying posts
import type { Post } from '@/types/blog'; // Import Post type
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Import Table components

// Mock API call - replace with actual fetch
const fetchUserPosts = async (userId: string): Promise<Post[]> => {
    console.log(`[Profile] Fetching posts for user ID: ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate delay
    try {
        // Fetch using the authorId parameter
        const response = await fetch(`/api/posts?author=${userId}&limit=100`); // Fetch many posts for the user
        if (!response.ok) {
            throw new Error('Failed to fetch user posts');
        }
        const data = await response.json();
        // Convert dates
        return (data.posts || []).map((post: any) => ({
            ...post,
            publishedAt: new Date(post.publishedAt),
            updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
             // Ensure nested author has date object if present
             author: {
                 ...post.author,
                 joinedAt: post.author?.joinedAt ? new Date(post.author.joinedAt) : undefined,
             },
        }));
    } catch (error) {
        console.error('[Profile] Error fetching user posts:', error);
        return [];
    }
};

// Function to fetch all users (for admin)
const fetchAllUsers = async (requestingUserId: string): Promise<AuthUser[]> => {
    console.log('[Profile] Fetching all users for admin.');
    try {
        const response = await fetch('/api/users', {
            headers: {
                // Include the requesting user's ID for server-side authorization check
                 'X-Mock-User-ID': requestingUserId,
             }
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Failed to fetch users - Response status:", response.status);
            console.error("Failed to fetch users - Response body:", errorBody);
             throw new Error(`Failed to fetch users: ${response.statusText}`);
         }
        const usersData: AuthUser[] = await response.json();
        // Ensure dates are formatted correctly if necessary (mock DB already handles it)
         return usersData.map(user => ({
             ...user,
             joinedAt: user.joinedAt ? new Date(user.joinedAt) : undefined, // Convert if needed
         }));
    } catch (error) {
        console.error('[Profile] Error fetching all users:', error);
        throw error; // Re-throw to be caught by caller
    }
}


export default function ProfilePage() {
  const { currentUser, logout, updateCurrentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State for editable fields
  const [name, setName] = useState(currentUser?.name || '');
  const [dob, setDob] = useState<Date | undefined>(currentUser?.dob ? new Date(currentUser.dob) : undefined);
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // State for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // State for user's posts
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // State for admin user management
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [authLoading, currentUser, router]);

  // Fetch user posts and potentially all users (if admin) when currentUser is available
  useEffect(() => {
      if (currentUser?.id) {
          setLoadingPosts(true);
          fetchUserPosts(currentUser.id)
              .then(setUserPosts)
              .catch(err => toast({ title: "Error loading posts", description: "Could not fetch your posts.", variant: "destructive" }))
              .finally(() => setLoadingPosts(false));

           // If user is admin, fetch all users
           if (currentUser.role === 'admin') {
                setLoadingUsers(true);
                // Pass the current user's ID for authorization in the API call
                fetchAllUsers(currentUser.id)
                     .then(setAllUsers)
                     .catch(err => {
                         console.error("Error caught in component fetching all users:", err);
                         toast({ title: "Error Loading Users", description: err instanceof Error ? err.message : "Could not fetch user list.", variant: "destructive"})
                      })
                     .finally(() => setLoadingUsers(false));
           }
      }
  }, [currentUser?.id, currentUser?.role, toast]);


  // Update local state when currentUser changes (e.g., after login/update)
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
       setDob(currentUser.dob ? new Date(currentUser.dob) : undefined);
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);


  const handleProfileSave = async () => {
      if (!currentUser) return;
      setIsSavingProfile(true);
      try {
           // Format dob to 'YYYY-MM-DD' string or null before sending
           const dobString = dob ? format(dob, 'yyyy-MM-dd') : null;

           const response = await fetch('/api/profile', {
               method: 'PUT',
               headers: {
                   'Content-Type': 'application/json',
                    // Include authentication token/cookie header here if needed by your API
                   'X-Mock-User-ID': currentUser.id, // Sending mock header for simulation
               },
               body: JSON.stringify({ name, dob: dobString, phone }),
           });
           const updatedUser = await response.json();

           if (!response.ok) {
               throw new Error(updatedUser.error || 'Failed to update profile');
           }

           updateCurrentUser(updatedUser); // Update context
           toast({ title: "Profile Updated", description: "Your profile information has been saved." });
           setIsEditingProfile(false);
      } catch (error) {
          console.error("Profile update error:", error);
          toast({ title: "Update Failed", description: error instanceof Error ? error.message : "Could not save profile.", variant: "destructive" });
      } finally {
          setIsSavingProfile(false);
      }
  };

  const handlePasswordSave = async () => {
       setPasswordError(null);
       if (newPassword !== confirmPassword) {
           setPasswordError("New passwords do not match.");
           return;
       }
       if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            return;
        }
        if (!currentUser) return;

       setIsSavingPassword(true);
       try {
           const response = await fetch('/api/profile', { // Using POST for password change
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                    'X-Mock-User-ID': currentUser.id, // Mock header
               },
               body: JSON.stringify({ currentPassword, newPassword }),
           });
           const result = await response.json();

           if (!response.ok) {
               throw new Error(result.error || 'Failed to change password');
           }

           toast({ title: "Password Changed", description: "Your password has been updated successfully." });
           setIsChangingPassword(false);
           // Clear password fields
           setCurrentPassword('');
           setNewPassword('');
           setConfirmPassword('');
       } catch (error) {
           console.error("Password change error:", error);
           setPasswordError(error instanceof Error ? error.message : "Could not change password.");
           toast({ title: "Password Change Failed", description: error instanceof Error ? error.message : "Could not change password.", variant: "destructive" });
       } finally {
           setIsSavingPassword(false);
       }
   };

  if (authLoading || !currentUser) {
    // Show loading skeleton while auth check is happening or if no user
    return (
        <div className="container mx-auto py-12">
            <Card className="max-w-4xl mx-auto">
                <CardHeader className="text-center">
                     <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                     <Skeleton className="h-8 w-48 mx-auto mb-2" />
                     <Skeleton className="h-5 w-64 mx-auto" />
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                     <Skeleton className="h-40 w-full" />
                     <Skeleton className="h-40 w-full" />
                 </CardContent>
                 <CardFooter>
                     <Skeleton className="h-10 w-24" />
                 </CardFooter>
            </Card>
             <Skeleton className="h-8 w-32 mt-12 mb-6" />
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                 {Array.from({ length: 3 }).map((_, i) => (
                     <Skeleton key={i} className="h-72 w-full" />
                 ))}
             </div>
        </div>
     );
  }

   const joinedDate = currentUser.joinedAt instanceof Date ? currentUser.joinedAt : new Date(currentUser.joinedAt || Date.now());

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-4xl mx-auto mb-12 shadow-lg">
        <CardHeader className="text-center border-b pb-6">
           <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary">
             <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.name || 'User'} />
             <AvatarFallback className="text-3xl">{currentUser.name?.[0] || currentUser.email?.[0] || 'U'}</AvatarFallback>
           </Avatar>
          <CardTitle className="text-2xl">{currentUser.name || 'User Profile'}</CardTitle>
          <CardDescription>
            {currentUser.email} - Joined {format(joinedDate, 'MMMM d, yyyy')}
          </CardDescription>
           {currentUser.role === 'admin' && <span className="text-xs font-semibold text-destructive">(Administrator)</span>}
        </CardHeader>

        {/* Profile Information Section */}
        <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold">Personal Information</h3>
                  {!isChangingPassword && ( // Hide edit profile button when changing password
                      <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(!isEditingProfile)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                      </Button>
                  )}
             </div>

             <div className="space-y-4">
                 <div>
                     <Label htmlFor="profile-name">Name</Label>
                     <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditingProfile || isSavingProfile} />
                 </div>
                 <div>
                     <Label>Email</Label>
                     <div className="flex items-center gap-2">
                         <Mail className="h-4 w-4 text-muted-foreground" />
                         <span className="text-sm text-muted-foreground">{currentUser.email}</span>
                     </div>
                 </div>
                 <div>
                     <Label htmlFor="profile-dob">Date of Birth</Label>
                      {isEditingProfile ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !dob && "text-muted-foreground"
                                )}
                                disabled={isSavingProfile}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={dob}
                                onSelect={setDob}
                                initialFocus
                                captionLayout="dropdown-buttons"
                                fromYear={1900}
                                toYear={new Date().getFullYear()}
                              />
                            </PopoverContent>
                          </Popover>
                      ) : (
                           <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                               <span className="text-sm text-muted-foreground">{dob ? format(dob, 'MMMM d, yyyy') : 'Not set'}</span>
                           </div>
                       )}
                 </div>
                 <div>
                     <Label htmlFor="profile-phone">Phone Number</Label>
                     {isEditingProfile ? (
                         <Input id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., +1 555-123-4567" disabled={isSavingProfile}/>
                     ) : (
                          <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{phone || 'Not set'}</span>
                          </div>
                      )}
                 </div>
                 {isEditingProfile && (
                     <div className="flex justify-end">
                          <Button onClick={handleProfileSave} disabled={isSavingProfile}>
                              {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                              {isSavingProfile ? 'Saving...' : 'Save Profile'}
                          </Button>
                     </div>
                 )}
             </div>
        </CardContent>

         {/* Password Change Section */}
         <CardContent className="pt-6 border-t mt-6">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold">Change Password</h3>
                  {!isEditingProfile && ( // Hide change password button when editing profile
                      <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(!isChangingPassword)}>
                          <Lock className="mr-2 h-4 w-4" />
                           {isChangingPassword ? 'Cancel Change' : 'Change Password'}
                      </Button>
                  )}
             </div>

             {isChangingPassword && (
                 <form onSubmit={(e) => { e.preventDefault(); handlePasswordSave(); }} className="space-y-4">
                      <div>
                         <Label htmlFor="current-password">Current Password</Label>
                         <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required disabled={isSavingPassword} />
                     </div>
                     <div>
                         <Label htmlFor="new-password">New Password</Label>
                         <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isSavingPassword} />
                     </div>
                     <div>
                         <Label htmlFor="confirm-password">Confirm New Password</Label>
                         <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isSavingPassword} />
                     </div>
                     {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                     <div className="flex justify-end">
                          <Button type="submit" disabled={isSavingPassword}>
                             {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                             {isSavingPassword ? 'Saving...' : 'Save Password'}
                          </Button>
                      </div>
                 </form>
             )}
         </CardContent>

        <CardFooter className="pt-6 border-t mt-6 flex justify-end">
          <Button variant="destructive" onClick={logout}>Log Out</Button>
        </CardFooter>
      </Card>

      {/* Admin User Management Section */}
        {currentUser.role === 'admin' && (
            <Card className="max-w-4xl mx-auto mb-12 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> User Management</CardTitle>
                    <CardDescription>View and manage user accounts.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingUsers ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : allUsers.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Avatar</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>DOB</TableHead>
                                    <TableHead>Joined</TableHead>
                                    {/* Add Actions column if needed */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.photoURL || undefined} alt={user.name || 'User'} />
                                                <AvatarFallback>{user.name?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>{user.phone || 'N/A'}</TableCell>
                                        <TableCell>{user.dob ? format(new Date(user.dob), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                                        <TableCell>{user.joinedAt ? format(new Date(user.joinedAt), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                                        {/* Add actions like edit role, delete user etc. */}
                                         {/* <TableCell>
                                            <Button variant="outline" size="sm">Actions</Button>
                                        </TableCell> */}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground">No other users found.</p>
                    )}
                </CardContent>
            </Card>
        )}


      {/* User's Posts Section */}
        <div>
            <h2 className="text-2xl font-bold mb-6 mt-12">Your Posts</h2>
            {loadingPosts ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                     {Array.from({ length: 3 }).map((_, i) => (
                        <div key={`skel-post-${i}`} className="space-y-3">
                             <Skeleton className="h-48 w-full" />
                             <Skeleton className="h-6 w-3/4" />
                             <Skeleton className="h-4 w-full" />
                         </div>
                     ))}
                 </div>
            ) : userPosts.length > 0 ? (
                 <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                     {userPosts.map(post => (
                         <BlogPostCard key={post.id} post={post} />
                     ))}
                 </div>
             ) : (
                 <p className="text-center text-muted-foreground mt-8">You haven't created any posts yet.</p>
             )}
         </div>

    </div>
  );
}
