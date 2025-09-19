'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { checkAuth } from '@/lib/store/slices/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = 'user', 
  fallbackPath = '/admin/login' 
}: ProtectedRouteProps) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push(fallbackPath);
        return;
      }

      const userRole = user.role;
      
      if (requiredRole === 'admin' && userRole !== 'admin') {
        // User is not admin, redirect to main page
        router.push('/');
        return;
      }
      
      if (requiredRole === 'user' && userRole === 'admin') {
        // Admin trying to access user area, redirect to admin dashboard
        router.push('/admin/dashboard');
        return;
      }
      
      setIsAuthorized(true);
    }
  }, [isAuthenticated, user, isLoading, requiredRole, router, fallbackPath]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
