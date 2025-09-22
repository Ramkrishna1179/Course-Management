'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Compass, UserPlus, LogIn } from 'lucide-react';
import { apiService } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { login } from '@/lib/store/slices/authSlice';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});

    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
      setErrors({
        username: !username ? 'Username is required' : '',
        email: !email ? 'Email is required' : '',
        password: !password ? 'Password is required' : '',
        confirmPassword: !confirmPassword ? 'Confirm password is required' : ''
      });
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all fields.',
        duration: 5000,
      });
      return;
    }

    if (username.length < 3) {
      setErrors({ username: 'Username must be at least 3 characters long' });
      toast({
        variant: 'destructive',
        title: 'Invalid Username',
        description: 'Username must be at least 3 characters long.',
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

    if (password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters long' });
      toast({
        variant: 'destructive',
        title: 'Weak Password',
        description: 'Password must be at least 6 characters long.',
        duration: 5000,
      });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      toast({
        variant: 'destructive',
        title: 'Password Mismatch',
        description: 'Passwords do not match. Please try again.',
        duration: 5000,
      });
      return;
    }

    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      setErrors({ 
        password: 'Password must contain at least one lowercase letter, one uppercase letter, and one number' 
      });
      toast({
        variant: 'destructive',
        title: 'Weak Password',
        description: 'Password must contain at least one lowercase letter, one uppercase letter, and one number.',
        duration: 5000,
      });
      return;
    }

    setIsSignupLoading(true);

    try {
      const response = await apiService.signup(username, email, password);
      
      if (response.success) {
        // After successful signup, automatically log in the user
        const loginResult = await dispatch(login({ email, password }));
        
        if (login.fulfilled.match(loginResult)) {
          toast({
            title: 'Account Created Successfully',
            description: 'Welcome to Course Compass!',
            duration: 3000,
          });
          
          // Redirect based on user role
          const userRole = loginResult.payload.user.role;
          if (userRole === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/');
          }
        } else {
          // If auto-login fails, still show success but redirect to login
          toast({
            title: 'Account Created Successfully',
            description: 'Please log in with your new credentials.',
            duration: 3000,
          });
          router.push('/admin/login');
        }
      } else {
        // Show specific error message
        const errorMessage = response.message || 
                           response.error || 
                           'Failed to create account. Please try again.';
        
        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: errorMessage,
          duration: 5000,
        });
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred. Please try again.';
      
      // Handle specific error types
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please check if the backend services are running.';
      } else if (error.message?.includes('409')) {
        errorMessage = 'Username or email already exists. Please try different credentials.';
      } else if (error.message?.includes('400')) {
        errorMessage = 'Invalid input. Please check your information and try again.';
      } else if (error.message?.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSignupLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSignup}>
          <CardHeader className="text-center">
             <div className="flex justify-center items-center gap-2 mb-2">
                <Compass className="h-10 w-10 text-accent" />
                <h1 className="font-headline text-3xl font-bold text-primary">Course Compass</h1>
             </div>
            <CardTitle className="text-2xl font-headline">Create Account</CardTitle>
            <CardDescription>Join Course Compass to discover amazing courses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors({...errors, username: ''});
                }}
                required
                disabled={isSignupLoading || isLoading}
                className={errors.username ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({...errors, email: ''});
                }}
                required
                disabled={isSignupLoading || isLoading}
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
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({...errors, password: ''});
                }}
                required
                disabled={isSignupLoading || isLoading}
                className={errors.password ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
                }}
                required
                disabled={isSignupLoading || isLoading}
                className={errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSignupLoading || isLoading}>
              {(isSignupLoading || isLoading) ? 'Creating Account...' : 'Create Account'}
              {!(isSignupLoading || isLoading) && <UserPlus className="ml-2 h-4 w-4" />}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <p>Already have an account?</p>
              <Link href="/admin/login" className="text-accent hover:underline font-medium">
                Sign in here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
