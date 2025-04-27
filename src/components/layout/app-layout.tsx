'use client';

import React from 'react';
import Header from './header';
import Sidebar from './sidebar';
import Footer from './footer';
import BackToTopButton from '@/components/ui/back-to-top-button';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'; // Import useSidebar
import Chatbot from '@/components/chatbot'; // Import the Chatbot component
import { cn } from '@/lib/utils'; // Import cn

// Inner layout component to access sidebar state
function MainContent({ children }: { children: React.ReactNode }) {
  const { state: sidebarState, isMobile } = useSidebar(); // Get sidebar state and mobile status

  // Adjust padding based on sidebar state (only on desktop)
  const mainPadding = !isMobile && sidebarState === 'expanded' ? 'pl-[calc(var(--sidebar-width)_+_1rem)]' : 'pl-[calc(var(--sidebar-width-icon)_+_1rem)]';

  return (
     <main className={cn(
        "flex-1 p-4 md:p-8 transition-all duration-300", // Base padding and transitions
        !isMobile ? mainPadding : 'pl-4' // Apply conditional padding on desktop
     )}>
        {children}
      </main>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1 relative"> {/* Added relative positioning */}
          <Sidebar /> {/* Sidebar will be positioned fixed/absolute by its own component */}
           {/* Wrap children with MainContent to apply dynamic padding */}
           <MainContent>
              {children}
            </MainContent>
        </div>
        <Footer />
        <Chatbot />
        <BackToTopButton />
      </div>
    </SidebarProvider>
  );
}

