'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Search, Sun, Moon, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import {
  SidebarTrigger
} from "@/components/ui/sidebar"


const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Blogs', href: '/blogs' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-md',
        isScrolled ? 'bg-background/80 shadow-md' : 'bg-transparent'
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
         {/* Sidebar Trigger - Now visible on all screen sizes */}
         <div>
           <SidebarTrigger />
         </div>
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity" aria-label="Midnight Muse Home">
            <Code2 className="h-6 w-6" />
            <span className="hidden sm:inline">Midnight Muse</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Input
              type="search"
              placeholder="Search posts..."
              className="h-9 w-40 pr-8 sm:w-56 rounded-full text-sm"
              aria-label="Search blog posts"
            />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="h-9 w-9 rounded-full"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Mobile Menu Button for Sheet */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
             <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
               </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b p-4">
                     <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-2 text-lg font-bold text-primary" aria-label="Midnight Muse Home">
                       <Code2 className="h-5 w-5" />
                       <span>Midnight Muse</span>
                     </Link>
                      <Button variant="ghost" size="icon" onClick={closeMobileMenu} className="h-8 w-8">
                         <X className="h-4 w-4" />
                         <span className="sr-only">Close menu</span>
                       </Button>
                  </div>
                   <nav className="flex flex-col gap-4 p-4">
                     {navItems.map((item) => (
                       <Link
                         key={item.name}
                         href={item.href}
                         onClick={closeMobileMenu}
                         className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                       >
                         {item.name}
                       </Link>
                     ))}
                   </nav>
                   <div className="mt-auto border-t p-4">
                      <div className="relative">
                          <Input
                            type="search"
                            placeholder="Search posts..."
                            className="h-9 w-full pr-8 rounded-full text-sm"
                            aria-label="Search blog posts"
                          />
                          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                   </div>
                </div>
              </SheetContent>
           </Sheet>

        </div>
      </div>
    </header>
  );
}
