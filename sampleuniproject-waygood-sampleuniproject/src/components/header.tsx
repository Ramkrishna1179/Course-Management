'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass, Sparkles, UserCog, LogIn, UserPlus, LogOut, User, Shield, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { checkAuth, logout } from '@/lib/store/slices/authSlice';

// logo component
const Logo = () => (
  <Link href="/" className="flex items-center gap-2 text-primary hover:text-accent transition-colors">
    <Compass className="h-7 w-7 text-accent" />
    <span className="font-headline text-2xl font-bold tracking-tight">
      Course Compass
    </span>
  </Link>
);

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link href={href} className={cn("text-sm font-medium transition-colors hover:text-accent", isActive ? "text-accent" : "text-muted-foreground")}>
      {children}
    </Link>
  )
}

export default function Header() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check authentication status on component mount
    dispatch(checkAuth());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Logo />
        </div>
        
        <div className="flex items-center gap-6 text-sm md:ml-6">
          <NavLink href="/">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              <span>Search Courses</span>
            </div>
          </NavLink>
          <NavLink href="/courses/search">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Advanced Search</span>
            </div>
          </NavLink>
          <NavLink href="/course-match">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>AI Course Match</span>
            </div>
          </NavLink>
        </div>
        
        <div className="flex flex-1 items-center justify-end gap-2">
          {isLoading ? (
            <div className="animate-pulse bg-muted h-8 w-24 rounded"></div>
          ) : isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                <User className="h-4 w-4" />
                <span>Welcome, {user?.username || 'User'}!</span>
              </div>
              {user?.role === 'admin' && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/dashboard">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
