
import React from 'react';

// This layout intentionally omits the standard AppLayout components
// to provide a more focused, full-screen experience for the game.
export default function PlatformerFunLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 dark:from-gray-800 dark:to-black">
      {/* The game page content will fill this container */}
      <main className="flex-grow flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
