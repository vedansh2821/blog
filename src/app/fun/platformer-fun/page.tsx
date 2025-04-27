
import React from 'react';
import PlatformerGame from '@/components/games/platformer-fun'; // Import the game component
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PlatformerFunPage() {
  return (
    <div className="container mx-auto py-4 flex flex-col items-center w-full max-w-none">
        <div className="w-full max-w-4xl mb-4 self-start"> {/* Keep Back button aligned */}
             <Button asChild variant="outline" size="sm" className="bg-background/50 hover:bg-background/70 border-primary text-primary">
                 <Link href="/fun">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Fun Zone
                 </Link>
             </Button>
         </div>
        {/* PlatformerGame component */}
        <PlatformerGame />
    </div>
  );
}
