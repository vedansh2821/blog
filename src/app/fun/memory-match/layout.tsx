
import React from 'react';

// This layout intentionally omits the standard AppLayout components
// to provide a more focused, full-screen experience for the game.
export default function MemoryMatchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* The game page content will fill this container */}
      <main className="flex-grow flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
