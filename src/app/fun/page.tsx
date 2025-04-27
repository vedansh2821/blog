
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';

// Example Game Card Component (Placeholder)
const GameCard = ({ title, description }: { title: string; description: string }) => (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add Game Cards Here */}
        <GameCard
          title="Balloon Buster"
          description="Pop the balloons before they fly away! (Coming Soon)"
        />
        <GameCard
          title="Platformer Fun"
          description="Jump and run through exciting levels! (Coming Soon)"
        />
        <GameCard
            title="Memory Match"
            description="Test your memory with this classic card game. (Coming Soon)"
        />
        {/* Add more placeholder game cards as needed */}
      </div>
    </div>
  );
}
