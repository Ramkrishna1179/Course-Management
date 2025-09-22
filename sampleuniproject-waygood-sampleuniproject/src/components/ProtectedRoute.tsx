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
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          await dispatch(checkAuth()).unwrap();
        } catch (error) {
          // Token is invalid, will be handled by Redux
        }
      }
      
      setIsChecking(false);
    };

    checkAuthentication();
  }, [dispatch]);

  useEffect(() => {
    if (isChecking) return;
    
    if (!isAuthenticated || !user) {
      router.push(fallbackPath);
      return;
    }

    // Check role requirements
    if (requiredRole === 'admin' && user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (requiredRole === 'user' && user.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }
  }, [isAuthenticated, user, isChecking, requiredRole, router, fallbackPath]);

  if (isChecking || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
