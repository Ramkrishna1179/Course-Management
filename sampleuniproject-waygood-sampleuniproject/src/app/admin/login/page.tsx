'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Compass, LogIn } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { login } from '@/lib/store/slices/authSlice';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{email?: string, password?: string}>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // clear previous errors
    setErrors({});

    // Basic validation
    if (!email || !password) {
      setErrors({
        email: !email ? 'Email is required' : '',
        password: !password ? 'Password is required' : ''
      });
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter both email and password.',
        duration: 5000,
      });
      return;
    }

    if (!email.includes('@')) {
      setErrors({ email: 'Please enter a valid email address' });
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        duration: 5000,
      });
      return;
    }

    try {
      const result = await dispatch(login({ email, password })).unwrap();
      
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
        duration: 3000,
      });
      
      // Redirect based on user role
      const userRole = result.user.role;
      if (userRole === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred. Please try again.';
      
      // Handle specific error types
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please check if the backend services are running.';
      } else if (error.message?.includes('401')) {
        errorMessage = 'Invalid credentials. Please check your email and password.';
      } else if (error.message?.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
             <div className="flex justify-center items-center gap-2 mb-2">
                <Compass className="h-10 w-10 text-accent" />
                <h1 className="font-headline text-3xl font-bold text-primary">Course Compass</h1>
             </div>
            <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({...errors, email: ''});
                }}
                required
                disabled={isLoading}
                className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({...errors, password: ''});
                }}
                required
                disabled={isLoading}
                className={errors.password ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
              {!isLoading && <LogIn className="ml-2 h-4 w-4" />}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <p>Don't have an account?</p>
              <Link href="/signup" className="text-accent hover:underline font-medium">
                Create a new account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
