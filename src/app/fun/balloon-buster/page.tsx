
import React from 'react';
import BalloonBusterGame from '@/components/games/balloon-buster'; // Import the game component
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function BalloonBusterPage() {
  return (
    // Use w-full and max-w-none to allow the game container to expand,
    // but keep max-w-4xl on the game component itself for reasonable sizing.
    <div className="container mx-auto py-4 flex flex-col items-center w-full max-w-none">
        <div className="w-full max-w-4xl mb-4 self-start"> {/* Keep Back button aligned */}
             <Button asChild variant="outline" size="sm">
                 <Link href="/fun">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Fun Zone
                 </Link>
             </Button>
         </div>
        {/* BalloonBusterGame itself retains max-w-2xl or similar for gameplay area */}
        <BalloonBusterGame />
    </div>
  );
}
