
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Balloon {
  id: number;
  x: number;
  y: number;
  color: string;
  popped: boolean;
}

const BALLOON_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#a855f7', '#ec4899'];
const GAME_DURATION = 30; // seconds
const BALLOON_SPAWN_INTERVAL = 700; // milliseconds
const BALLOON_MOVE_SPEED = 1.5; // pixels per frame
const BALLOON_SIZE = 50; // pixels

export default function BalloonBusterGame() {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle'); // idle, playing, ended
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const balloonIdCounter = useRef(0);

  const popBalloon = useCallback((id: number) => {
    if (gameState !== 'playing') return;
    setBalloons((prevBalloons) =>
      prevBalloons.map((balloon) =>
        balloon.id === id ? { ...balloon, popped: true } : balloon
      )
    );
    setScore((prevScore) => prevScore + 1);
    // Optionally remove popped balloons after a delay for animation
    setTimeout(() => {
         setBalloons((prevBalloons) => prevBalloons.filter(b => b.id !== id));
    }, 150); // Short delay for pop effect
  }, [gameState]);

  const spawnBalloon = useCallback(() => {
    if (!gameAreaRef.current || gameState !== 'playing') return;
    const gameAreaWidth = gameAreaRef.current.offsetWidth;
    const newBalloon: Balloon = {
      id: balloonIdCounter.current++,
      x: Math.random() * (gameAreaWidth - BALLOON_SIZE),
      y: gameAreaRef.current.offsetHeight, // Start at the bottom
      color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
      popped: false,
    };
    setBalloons((prev) => [...prev, newBalloon]);
  }, [gameState]);


  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    setBalloons((prevBalloons) =>
      prevBalloons
        .map((balloon) => ({
          ...balloon,
          y: balloon.y - BALLOON_MOVE_SPEED,
        }))
        .filter((balloon) => balloon.y > -BALLOON_SIZE) // Remove if off-screen top
    );

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setBalloons([]);
    setTimeLeft(GAME_DURATION);
    setGameState('playing');
    balloonIdCounter.current = 0; // Reset counter

    // Start game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current!);
          setGameState('ended');
          if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Start spawning balloons
    const spawnInterval = setInterval(() => {
         if (gameState === 'playing') {
             spawnBalloon();
         } else {
             clearInterval(spawnInterval); // Clear interval if game state changes
         }
    }, BALLOON_SPAWN_INTERVAL);

    // Ensure spawn interval is cleared on game end
    return () => {
      clearInterval(spawnInterval);
       if (timerRef.current) clearInterval(timerRef.current);
       if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    }
  };

  // Cleanup on unmount
   useEffect(() => {
     return () => {
       if (timerRef.current) clearInterval(timerRef.current);
       if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
     };
   }, []);


  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Balloon Buster</span>
          <div className="flex items-center gap-4 text-lg">
            <span className="flex items-center gap-1"><Target className="h-5 w-5" /> {score}</span>
            <span className="flex items-center gap-1"><Timer className="h-5 w-5" /> {timeLeft}s</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={gameAreaRef}
          className="relative w-full h-[400px] bg-muted/30 rounded-md overflow-hidden border cursor-crosshair"
          style={{ touchAction: 'none' }} // Prevent default touch actions like scrolling
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
               <p className="text-xl font-semibold mb-4">Ready to pop some balloons?</p>
              <Button onClick={startGame}>Start Game</Button>
            </div>
          )}
          {gameState === 'ended' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
              <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
              <p className="text-xl mb-4">Your Score: {score}</p>
              <Button onClick={startGame}>Play Again</Button>
            </div>
          )}

          {balloons.map((balloon) => (
            <div
              key={balloon.id}
              className={cn(
                "absolute rounded-full cursor-pointer transition-transform duration-150",
                 balloon.popped ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
              )}
              style={{
                left: `${balloon.x}px`,
                top: `${balloon.y}px`,
                width: `${BALLOON_SIZE}px`,
                height: `${BALLOON_SIZE}px`,
                backgroundColor: balloon.color,
                // Simple shine effect
                backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 50%)',
                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                 border: '1px solid rgba(0,0,0,0.1)',
              }}
              // Use onMouseDown for better click detection on fast-moving elements
              // and onTouchStart for mobile
              onMouseDown={() => popBalloon(balloon.id)}
              onTouchStart={(e) => {
                  e.preventDefault(); // Prevent mouse event firing on touch devices
                  popBalloon(balloon.id);
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
