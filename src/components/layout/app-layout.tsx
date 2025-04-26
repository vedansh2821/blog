'use client';

import React, { useState } from 'react';
import Header from './header';
import Sidebar from './sidebar';
import Footer from './footer';
import BackToTopButton from '@/components/ui/back-to-top-button';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8 transition-all duration-300">
            {children}
          </main>
        </div>
        <Footer />
        <BackToTopButton />
      </div>
    </SidebarProvider>
  );
}
