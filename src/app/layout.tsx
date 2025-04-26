
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as specified in original request
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import AppLayout from '@/components/layout/app-layout';
import NewsletterSignupModal from '@/components/newsletter-signup-modal';
import Chatbot from '@/components/chatbot/chatbot'; // Import the Chatbot component

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Define CSS variable for Inter
});

// Assuming Geist fonts are preferred if Inter doesn't fit 'modern sans-serif'
// import { Geist_Sans } from 'geist/font/sans';
// import { Geist_Mono } from 'geist/font/mono';
// const geistSans = Geist_Sans;
// const geistMono = Geist_Mono;


export const metadata: Metadata = {
  title: 'Midnight Muse',
  description: 'A modern blog exploring various topics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Apply the font variable to the body */}
      <body className={`${inter.variable} antialiased font-sans`}>
        {/* <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}> */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // Keep dark as default
          enableSystem
          disableTransitionOnChange
        >
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
          <NewsletterSignupModal />
          <Chatbot /> {/* Add the Chatbot component here */}
        </ThemeProvider>
      </body>
    </html>
  );
}
