
'use client';

import React from 'react';
import Header from './header';
import Sidebar from './sidebar';
import Footer from './footer';
import BackToTopButton from '@/components/ui/back-to-top-button';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

// Inner component to access sidebar context
const MainContent = ({ children }: { children: React.ReactNode }) => {
  const { state, isMobile } = useSidebar();

  return (
    <main
      className={cn(
        "flex-1 p-4 md:p-8 transition-all duration-300 ease-in-out",
        // Apply margin-left only on desktop when sidebar is expanded
        !isMobile && state === 'expanded' && "md:ml-[var(--sidebar-width)]",
        // Apply margin-left only on desktop when sidebar is collapsed
        !isMobile && state === 'collapsed' && "md:ml-[var(--sidebar-width-icon)]"
      )}
    >
      {children}
    </main>
  );
};


export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <MainContent>{children}</MainContent>
        </div>
        <Footer />
        <BackToTopButton />
      </div>
    </SidebarProvider>
  );
}
