'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Search, Sun, Moon, Code2, LogIn, LogOut, UserPlus, User, ChevronDown, Gamepad2 } from 'lucide-react'; // Added Gamepad2
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from '@/lib/auth/authContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
   DropdownMenuGroup, // Added DropdownMenuGroup
 } from "@/components/ui/dropdown-menu"
 import { useToast } from '@/hooks/use-toast'; // Import useToast
 import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton


const navItems = [
  { name: 'Home', href: '/' },
  // { name: 'Blogs', href: '/blogs' }, // Replaced by dropdown
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'Fun', href: '/fun' }, // Added Fun tab
];

// Mock categories for dropdown (fetch from API if needed)
const blogCategories = [
  { name: 'Technology', slug: 'Technology' },
  { name: 'Lifestyle', slug: 'Lifestyle' },
  { name: 'Health', slug: 'Health' },
  { name: 'Travel', slug: 'Travel' },
  { name: 'Love', slug: 'Love' },
  { name: 'Others', slug: 'Others' },
];


export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { currentUser, logout, loading } = useAuth();
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    setMounted(true);
  }, []);


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
        closeMobileMenu();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLogout = () => {
      logout();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/'); // Redirect to home after logout
      closeMobileMenu();
  }


  const AuthButtons = () => {
     if (loading) {
        return <Skeleton className="h-9 w-24" />; // Show skeleton while loading auth state
     }
     if (currentUser) {
        return (
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.name || currentUser.email || 'User'} />
                     <AvatarFallback>{currentUser.name?.[0] || currentUser.email?.[0] || 'U'}</AvatarFallback>
                   </Avatar>
                 </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                   <div className="flex flex-col space-y-1">
                     <p className="text-sm font-medium leading-none">{currentUser.name || 'User'}</p>
                     <p className="text-xs leading-none text-muted-foreground">
                       {currentUser.email}
                     </p>
                   </div>
                 </DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile"><User className="mr-2 h-4 w-4" /> Profile</Link>
                 </DropdownMenuItem>
                  {/* Add Admin Dashboard link conditionally */}
                 {currentUser.role === 'admin' && (
                   <DropdownMenuItem asChild className="cursor-pointer">
                     <Link href="/admin/dashboard">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                       Admin Dashboard
                     </Link>
                   </DropdownMenuItem>
                 )}
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                 </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
        );
     }
      return (
         <>
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
               <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
               </Link>
            </Button>
            <Button size="sm" asChild className="hidden md:inline-flex">
               <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up
               </Link>
            </Button>
          </>
      );
  };

  const MobileAuthButtons = () => {
       if (loading) {
           return <Skeleton className="h-9 w-full mt-4" />;
       }
      if (currentUser) {
         return (
             <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                 <LogOut className="mr-2 h-4 w-4" /> Logout
             </Button>
         );
      }
       return (
          <>
            <Button variant="ghost" asChild className="w-full justify-start">
                <Link href="/login" onClick={closeMobileMenu}><LogIn className="mr-2 h-4 w-4" /> Login</Link>
            </Button>
            <Button asChild className="w-full justify-start mt-2">
                 <Link href="/signup" onClick={closeMobileMenu}><UserPlus className="mr-2 h-4 w-4" /> Sign Up</Link>
            </Button>
          </>
       );
   };


  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-md',
        isScrolled ? 'bg-background/80 shadow-md' : 'bg-transparent'
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
         <div> <SidebarTrigger /> </div>
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity" aria-label="Midnight Muse Home">
            <Code2 className="h-6 w-6" />
            <span className="hidden sm:inline">Midnight Muse</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              {item.name}
            </Link>
          ))}
           {/* Blog Categories Dropdown */}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors h-auto p-0">
                  Blogs <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/blogs">All Posts</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Categories</DropdownMenuLabel>
                   {blogCategories.map((category) => (
                      <DropdownMenuItem key={category.slug} asChild className="cursor-pointer">
                        <Link href={`/blogs?category=${category.slug}`}>{category.name}</Link>
                      </DropdownMenuItem>
                   ))}
                 </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4"> {/* Reduced gap slightly */}
           {/* Desktop Search Form */}
           <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
            <Input
              type="search"
              placeholder="Search..." // Shorter placeholder
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-9 w-32 pr-8 sm:w-48 rounded-full text-sm" // Adjusted width
              aria-label="Search blog posts"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-0 border-none bg-transparent cursor-pointer">
                <Search className="h-4 w-4 text-muted-foreground" />
            </button>
           </form>

          {/* Theme Toggle */}
          {mounted ? (
             <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="h-9 w-9 rounded-full">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
             </Button>
          ) : (
             <Skeleton className="h-9 w-9 rounded-full" /> // Placeholder while theme is loading
          )}

          {/* Authentication Buttons */}
          {mounted && <AuthButtons />} {/* Render AuthButtons only when mounted */}


          {/* Mobile Menu Button for Sheet */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
             <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
               </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 flex flex-col"> {/* Added flex-col */}
                <div className="flex items-center justify-between border-b p-4">
                     <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-2 text-lg font-bold text-primary" aria-label="Midnight Muse Home">
                       <Code2 className="h-5 w-5" /> <span>Midnight Muse</span>
                     </Link>
                      <Button variant="ghost" size="icon" onClick={closeMobileMenu} className="h-8 w-8"> <X className="h-4 w-4" /> <span className="sr-only">Close menu</span> </Button>
                </div>
                   {/* Mobile Navigation */}
                   <nav className="flex flex-col gap-4 p-4 flex-grow"> {/* Added flex-grow */}
                     {navItems.map((item) => (
                       <Link key={item.name} href={item.href} onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                         {item.name}
                       </Link>
                     ))}
                     {/* Mobile Blogs Link */}
                      <Link href="/blogs" onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                          Blogs
                      </Link>
                      {/* TODO: Add mobile categories accordion or similar */}
                   </nav>
                   {/* Mobile Search and Auth */}
                   <div className="border-t p-4 space-y-4">
                      {/* Mobile Search Form */}
                      <form onSubmit={handleSearchSubmit} className="relative">
                          <Input type="search" placeholder="Search posts..." value={searchQuery} onChange={handleSearchChange} className="h-9 w-full pr-8 rounded-full text-sm" aria-label="Search blog posts" />
                          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-0 border-none bg-transparent cursor-pointer"> <Search className="h-4 w-4 text-muted-foreground" /> </button>
                      </form>
                       {/* Mobile Auth Buttons */}
                       {mounted && <MobileAuthButtons />}
                   </div>
              </SheetContent>
           </Sheet>

        </div>
      </div>
    </header>
  );
}