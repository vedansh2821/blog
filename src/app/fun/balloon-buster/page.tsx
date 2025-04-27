
import React from 'react';
import BalloonBusterGame from '@/components/games/balloon-buster'; // Import the game component
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function BalloonBusterPage() {
  return (
    <div className="container mx-auto py-8 flex flex-col items-center">
        <div className="w-full max-w-2xl mb-4">
             <Button asChild variant="outline" size="sm">
                 <Link href="/fun">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Fun Zone
                 </Link>
             </Button>
         </div>
        <BalloonBusterGame />
    </div>
  );
}
