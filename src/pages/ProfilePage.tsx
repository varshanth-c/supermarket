// src/pages/ProfilePage.tsx (Corrected)
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const ProfilePage = () => {
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // The form state can still use 'name' for simplicity
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '', // <-- CHANGED: Use profile.full_name to populate the form
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    // Check for changes against the correct property
    if (
      formData.name === (profile?.name || '') && // <-- CHANGED
      formData.phone === (profile?.phone || '') &&
      formData.address === (profile?.address || '')
    ) {
      toast({
        title: "No Changes",
        description: "You haven't made any changes to your profile.",
      });
      setIsUpdating(false);
      return;
    }

    try {
      // We pass the formData object with the 'name' property. 
      // The updateProfile function in the context will handle mapping it to 'full_name'.
      const { error } = await updateProfile(formData);
      if (error) throw error;
      
      toast({
        title: 'Success!',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: unknown) {
      let message = 'There was a problem updating your profile.';
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        title: 'Update Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading || !profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
     <div className="container mx-auto py-10 px-4">
      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>Update your personal information here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ''} disabled />
              <p className="text-sm text-muted-foreground">Email address cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={formData.name} onChange={handleChange} placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="Your phone number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={formData.address} onChange={handleChange} placeholder="Your address" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={profile.role} disabled />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Profile
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};