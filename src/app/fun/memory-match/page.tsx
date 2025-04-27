
import React from 'react';
import MemoryMatchGame from '@/components/games/memory-match'; // Import the game component
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MemoryMatchPage() {
  return (
    <div className="container mx-auto py-4 flex flex-col items-center w-full max-w-none">
        <div className="w-full max-w-4xl mb-4 self-start"> {/* Keep Back button aligned */}
             <Button asChild variant="outline" size="sm">
                 <Link href="/fun">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Fun Zone
                 </Link>
             </Button>
         </div>
        {/* MemoryMatchGame component */}
        <MemoryMatchGame />
    </div>
  );
}
