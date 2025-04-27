
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';
import BalloonBusterGame from '@/components/games/balloon-buster'; // Import the game component

// Example Placeholder Game Card Component
const PlaceholderGameCard = ({ title, description }: { title: string; description: string }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Gamepad2 className="h-5 w-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{description}</p>
      {/* Add a link or button to launch the game later */}
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

      <div className="flex flex-col items-center gap-8">
        {/* Add Balloon Buster Game Component Here */}
        <BalloonBusterGame />

        {/* Add Other Game Cards Here */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
             <PlaceholderGameCard
                title="Platformer Fun"
                description="Jump and run through exciting levels! (Coming Soon)"
            />
             <PlaceholderGameCard
                 title="Memory Match"
                 description="Test your memory with this classic card game. (Coming Soon)"
             />
             {/* Add more placeholder game cards as needed */}
        </div>
      </div>
    </div>
  );
}
