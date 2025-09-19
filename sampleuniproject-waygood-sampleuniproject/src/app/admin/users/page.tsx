'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Shield } from 'lucide-react';
import { apiService } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const token = apiService.getAuthToken();
        if (!token) {
          router.push('/admin/login');
          return;
        }

        const response = await apiService.getProfile();
        if (response.success && response.data) {
          if (response.data.role !== 'admin') {
            toast({
              variant: 'destructive',
              title: 'Access Denied',
              description: 'This page is only accessible by administrators.',
              duration: 5000,
            });
            router.push('/');
            return;
          }
          setUserProfile(response.data);
        } else {
          router.push('/admin/login');
        }
      } catch (error) {
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [router, toast]);


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h2 className="font-headline text-4xl font-bold mb-4 text-primary">
            User Management
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            This is a protected admin-only page. Only users with admin role can access this page.
          </p>
        </div>

        {/* Admin Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl">View All Users</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View and manage all registered users in the system. 
                This feature is only available to administrators.
              </p>
              <Button className="w-full" disabled>
                <Users className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <UserPlus className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl">Create Admin User</CardTitle>
                  <CardDescription>Add new administrator accounts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create new administrator accounts with elevated privileges.
                Only existing admins can create new admin users.
              </p>
              <Button className="w-full" disabled>
                <UserPlus className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl">System Settings</CardTitle>
                  <CardDescription>Configure system-wide settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage system configuration, security settings, and 
                other administrative functions.
              </p>
              <Button className="w-full" disabled>
                <Shield className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Admin Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Admin Access Confirmed
            </CardTitle>
            <CardDescription>
              You are successfully authenticated as an administrator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Username:</strong> {userProfile?.username}</p>
              <p><strong>Email:</strong> {userProfile?.email}</p>
              <p><strong>Role:</strong> <span className="text-accent font-semibold">{userProfile?.role}</span></p>
              <p><strong>Access Level:</strong> Full administrative privileges</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
