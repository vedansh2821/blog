
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
const POP_ANIMATION_DURATION = 150; // milliseconds

export default function BalloonBusterGame() {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle'); // idle, playing, ended
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const balloonIdCounter = useRef(0);

  const popBalloon = useCallback((id: number) => {
    if (gameState !== 'playing') return;
    setScore((prevScore) => prevScore + 1);
    setBalloons((prevBalloons) =>
      prevBalloons.map((balloon) =>
        balloon.id === id ? { ...balloon, popped: true } : balloon
      )
    );

    // Remove the balloon after the pop animation duration
    setTimeout(() => {
      setBalloons((prevBalloons) => prevBalloons.filter(b => b.id !== id));
    }, POP_ANIMATION_DURATION);
  }, [gameState]);

  const spawnBalloon = useCallback(() => {
    if (!gameAreaRef.current || gameState !== 'playing') return;

    const gameArea = gameAreaRef.current;
    const gameAreaWidth = gameArea.offsetWidth;
    const gameAreaHeight = gameArea.offsetHeight; // Get height for starting position

    // Ensure dimensions are valid before spawning
    if (gameAreaWidth <= 0 || gameAreaHeight <= 0) {
        console.warn("Game area dimensions not ready for spawning.");
        return;
    }

    const newBalloon: Balloon = {
      id: balloonIdCounter.current++,
      x: Math.random() * (gameAreaWidth - BALLOON_SIZE),
      y: gameAreaHeight, // Start at the bottom edge
      color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
      popped: false,
    };
    setBalloons((prev) => [...prev, newBalloon]);
  }, [gameState]);


  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    setBalloons((prevBalloons) =>
      prevBalloons
        .filter((balloon) => !balloon.popped) // Only move non-popped balloons
        .map((balloon) => ({
          ...balloon,
          y: balloon.y - BALLOON_MOVE_SPEED, // Move upwards
        }))
        .filter((balloon) => balloon.y > -BALLOON_SIZE) // Remove if off-screen top
    );

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

   // Cleanup function
   const cleanupGame = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        timerRef.current = null;
        spawnIntervalRef.current = null;
        gameLoopRef.current = null;
   }, []);


  const startGame = () => {
    cleanupGame(); // Clear any previous game state/intervals
    setScore(0);
    setBalloons([]);
    setTimeLeft(GAME_DURATION);
    setGameState('playing');
    balloonIdCounter.current = 0;

    // Start game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          cleanupGame(); // Stop everything
          setGameState('ended');
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Start spawning balloons
    spawnIntervalRef.current = setInterval(() => {
       // Check gameState inside interval callback as well
       if (gameState === 'playing') {
           spawnBalloon();
       } else {
           if(spawnIntervalRef.current) clearInterval(spawnIntervalRef.current); // Stop spawning if game ended prematurely
       }
    }, BALLOON_SPAWN_INTERVAL);

    // Return cleanup function for useEffect
    return cleanupGame;
  };

  // Cleanup on unmount
   useEffect(() => {
     return cleanupGame;
   }, [cleanupGame]);


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
          className="relative w-full h-[400px] bg-gradient-to-b from-blue-300 to-blue-500 rounded-md overflow-hidden border border-blue-600 shadow-inner cursor-crosshair" // Added gradient bg and border
          style={{ touchAction: 'none', minHeight: '400px' }} // Ensure min height
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10 rounded-md">
               <p className="text-xl font-semibold mb-4 text-white">Ready to pop some balloons?</p>
              <Button onClick={startGame} size="lg">Start Game</Button>
            </div>
          )}
          {gameState === 'ended' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10 rounded-md">
              <h2 className="text-2xl font-bold mb-2 text-white">Game Over!</h2>
              <p className="text-xl mb-4 text-white">Your Score: {score}</p>
              <Button onClick={startGame} size="lg">Play Again</Button>
            </div>
          )}

          {/* Render Balloons */}
          {balloons.map((balloon) => (
            <div
              key={balloon.id}
              className={cn(
                "absolute rounded-full cursor-pointer transition-transform duration-150 flex items-center justify-center text-white font-bold text-xl", // Base balloon style
                 balloon.popped ? 'scale-150 opacity-0 rotate-45' : 'scale-100 opacity-100', // Pop animation
              )}
              style={{
                left: `${balloon.x}px`,
                top: `${balloon.y}px`,
                width: `${BALLOON_SIZE}px`,
                height: `${BALLOON_SIZE}px`,
                backgroundColor: balloon.color,
                backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%)', // Shine effect
                boxShadow: 'inset -2px -4px 8px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)', // Inset shadow for depth
                borderBottom: `1px solid ${balloon.color}80`, // Slight darker bottom border
                transform: balloon.popped ? `scale(1.5) rotate(45deg)` : `scale(1)`, // Ensure transform matches class for JS fallback maybe
                transition: `transform ${POP_ANIMATION_DURATION}ms ease-out, opacity ${POP_ANIMATION_DURATION}ms ease-out`, // Smooth pop transition
              }}
              // Use onMouseDown for desktop clicks and onTouchStart for mobile taps
              onMouseDown={() => popBalloon(balloon.id)}
              onTouchStart={(e) => {
                  e.preventDefault(); // Prevent click event after touch
                  popBalloon(balloon.id);
              }}
            >
                {/* Optional: Add a subtle string/knot at the bottom */}
                {/* <div className="absolute bottom-[-5px] left-1/2 transform -translate-x-1/2 w-1 h-2 bg-gray-600 rounded-b-full"></div> */}
                {/* {balloon.popped && <span>POP!</span>} */}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

