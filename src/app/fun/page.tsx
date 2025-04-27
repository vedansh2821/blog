
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gamepad2, Construction, Puzzle, Route } from 'lucide-react'; // Added Puzzle, Route icons
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from '@/lib/utils'; // Import cn


// Example Placeholder Game Card Component
const GameCard = ({ title, description, href, icon, disabled = false }: { title: string; description: string; href: string; icon: React.ReactNode; disabled?: boolean }) => (
  <Card className={cn("hover:shadow-lg transition-shadow flex flex-col", disabled ? "opacity-50 pointer-events-none" : "")}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow flex items-end">
       <Button asChild variant="link" className="p-0 h-auto" disabled={disabled}>
          <Link href={href}>
            {disabled ? "Coming Soon" : "Play Game"}
            {!disabled && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-4 w-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>}
          </Link>
       </Button>
    </CardContent>
  </Card>
);

export default function FunTabPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Fun Zone!</h1>
       <Alert className="mb-12 max-w-xl mx-auto border-primary/50 bg-primary/5 text-primary">
         <Construction className="h-5 w-5" />
         <AlertTitle>Under Development</AlertTitle>
         <AlertDescription>
           This section is currently being built. More fun games and activities are coming soon! (Some games below are basic implementations)
         </AlertDescription>
       </Alert>
      <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
        Take a break and enjoy some simple games.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {/* Balloon Buster Game Card */}
         <GameCard
            title="Balloon Buster"
            description="Pop as many balloons as you can before time runs out!"
            href="/fun/balloon-buster"
            icon={<Gamepad2 className="h-5 w-5 text-primary" />}
         />

         {/* Platformer Fun Game Card */}
         <GameCard
            title="Platformer Fun"
            description="Jump and run through this basic platformer!"
            href="/fun/platformer-fun" // Update href when implemented
            icon={<Route className="h-5 w-5 text-primary" />} // Use Route icon
            disabled={false} // Enable the card
         />
         {/* Memory Match Game Card */}
         <GameCard
            title="Memory Match"
            description="Test your memory with this classic card game."
             href="/fun/memory-match" // Update href when implemented
            icon={<Puzzle className="h-5 w-5 text-primary" />} // Use Puzzle icon
             disabled={false} // Enable the card
         />
         {/* Add more game cards as needed */}
      </div>
    </div>
  );
}
