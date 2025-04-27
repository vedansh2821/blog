
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Example Placeholder Game Card Component
const GameCard = ({ title, description, href, icon }: { title: string; description: string; href: string; icon: React.ReactNode }) => (
  <Card className="hover:shadow-lg transition-shadow flex flex-col">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow flex items-end">
       <Button asChild variant="link" className="p-0 h-auto">
          <Link href={href}>
            Play Game
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-4 w-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
       </Button>
    </CardContent>
  </Card>
);

export default function FunTabPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Fun Zone!</h1>
      <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
        Take a break and enjoy some simple games. More coming soon!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {/* Balloon Buster Game Card */}
         <GameCard
            title="Balloon Buster"
            description="Pop as many balloons as you can before time runs out!"
            href="/fun/balloon-buster"
            icon={<Gamepad2 className="h-5 w-5 text-primary" />}
         />

         {/* Add Other Game Cards Here */}
         <GameCard
            title="Platformer Fun"
            description="Jump and run through exciting levels! (Coming Soon)"
            href="#" // Update href when implemented
            icon={<Gamepad2 className="h-5 w-5 text-muted-foreground" />}
         />
         <GameCard
            title="Memory Match"
            description="Test your memory with this classic card game. (Coming Soon)"
             href="#" // Update href when implemented
            icon={<Gamepad2 className="h-5 w-5 text-muted-foreground" />}
         />
         {/* Add more game cards as needed */}
      </div>
    </div>
  );
}
