
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Timer, Play } from 'lucide-react'; // Added Play icon
import { cn } from '@/lib/utils';

interface Balloon {
  id: number;
  x: number;
  y: number;
  color: string;
  popped: boolean;
  popTime?: number; // Track when it was popped for animation
}

const BALLOON_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#a855f7', '#ec4899'];
const GAME_DURATION = 30; // seconds
const BALLOON_SPAWN_INTERVAL = 600; // milliseconds (slightly faster)
const BALLOON_MOVE_SPEED = 1.8; // pixels per frame (slightly faster)
const BALLOON_SIZE = 50; // pixels
const POP_ANIMATION_DURATION = 200; // milliseconds

export default function BalloonBusterGame() {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const balloonIdCounter = useRef(0);
  const gameAreaWidth = useRef(0);
  const gameAreaHeight = useRef(0);

  // Function to clean up intervals and animation frame
  const cleanupGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    timerRef.current = null;
    spawnIntervalRef.current = null;
    gameLoopRef.current = null;
    console.log("Game cleanup performed.");
  }, []);

  const popBalloon = useCallback((id: number) => {
    if (gameState !== 'playing') return;
    const popTime = Date.now();
    setScore((prevScore) => prevScore + 1);
    setBalloons((prevBalloons) =>
      prevBalloons.map((balloon) =>
        balloon.id === id ? { ...balloon, popped: true, popTime } : balloon
      )
    );

    // Note: Balloon removal is now handled in the game loop based on popTime
     console.log(`Balloon ${id} popped.`);
  }, [gameState]);

  const spawnBalloon = useCallback(() => {
    // Ensure game is playing and ref is available
    if (gameState !== 'playing' || !gameAreaRef.current) return;

    // Get current dimensions
    const currentWidth = gameAreaRef.current.offsetWidth;
    const currentHeight = gameAreaRef.current.offsetHeight;

    // Update refs if dimensions changed (useful for resize, though not handled here)
    gameAreaWidth.current = currentWidth;
    gameAreaHeight.current = currentHeight;

    // Ensure dimensions are valid before spawning
    if (currentWidth <= 0 || currentHeight <= 0) {
        console.warn("Game area dimensions not ready for spawning or invalid.");
        return;
    }

    const newBalloon: Balloon = {
      id: balloonIdCounter.current++,
      x: Math.random() * (currentWidth - BALLOON_SIZE),
      y: currentHeight, // Start at the bottom edge
      color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
      popped: false,
    };
    setBalloons((prev) => [...prev, newBalloon]);
    // console.log("Spawned balloon:", newBalloon.id, "at", newBalloon.x, newBalloon.y); // Debug log
  }, [gameState]);


  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    const now = Date.now();

    setBalloons((prevBalloons) =>
      prevBalloons
        .map((balloon) => {
          if (balloon.popped) {
              // Check if pop animation duration has passed
              if (balloon.popTime && now - balloon.popTime > POP_ANIMATION_DURATION) {
                  return null; // Mark for removal
              }
              return balloon; // Keep popped balloon during animation
          }
          // Move non-popped balloons
          return { ...balloon, y: balloon.y - BALLOON_MOVE_SPEED };
        })
        .filter((balloon): balloon is Balloon => balloon !== null && balloon.y > -BALLOON_SIZE) // Remove nulls and off-screen balloons
    );

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);


  const startGame = () => {
    console.log("Starting game...");
    cleanupGame(); // Clear any previous game state/intervals

    // Get initial dimensions correctly
    if (gameAreaRef.current) {
        gameAreaWidth.current = gameAreaRef.current.offsetWidth;
        gameAreaHeight.current = gameAreaRef.current.offsetHeight;
        console.log("Game area dimensions:", gameAreaWidth.current, "x", gameAreaHeight.current);
         if(gameAreaWidth.current <= 0 || gameAreaHeight.current <= 0) {
             console.error("Cannot start game with invalid dimensions.");
             // Maybe show an error message to the user
             return;
         }
    } else {
        console.error("Game area ref not available on start.");
        return; // Cannot start without the ref
    }


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
          console.log("Game ended - Time up!");
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Start spawning balloons immediately after setting state to 'playing'
    spawnIntervalRef.current = setInterval(() => {
       // Use a local check for gameState as the state might not update instantly
       if (gameState === 'playing') { // Check the current state value
           spawnBalloon();
       } else if (spawnIntervalRef.current) {
            clearInterval(spawnIntervalRef.current); // Clear if game ended
            spawnIntervalRef.current = null;
             console.log("Stopped spawning interval.");
       }
    }, BALLOON_SPAWN_INTERVAL);
  };

   // Effect to start the game loop and intervals only when gameState becomes 'playing'
   // This replaces starting them directly in startGame
   useEffect(() => {
       if (gameState === 'playing') {
           console.log("GameState is 'playing', starting loop and intervals.");
           gameLoopRef.current = requestAnimationFrame(gameLoop);
           spawnIntervalRef.current = setInterval(spawnBalloon, BALLOON_SPAWN_INTERVAL);
           timerRef.current = setInterval(() => {
               setTimeLeft((prevTime) => {
                   if (prevTime <= 1) {
                       cleanupGame();
                       setGameState('ended');
                       console.log("Game ended - Time up (from useEffect timer)!");
                       return 0;
                   }
                   return prevTime - 1;
               });
           }, 1000);

           // Return cleanup specific to this effect instance
           return () => {
                console.log("Cleaning up from 'playing' state effect.");
                if (timerRef.current) clearInterval(timerRef.current);
                if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
                if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
           };
       }
   }, [gameState, gameLoop, spawnBalloon, cleanupGame]); // Dependencies for the effect


  // Cleanup on unmount
   useEffect(() => {
     return cleanupGame; // Ensure cleanup happens if the component unmounts
   }, [cleanupGame]);


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="bg-card/80 rounded-t-lg">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="font-bold">Balloon Buster</span>
          <div className="flex items-center gap-4 text-base">
            <span className="flex items-center gap-1 font-medium"><Target className="h-5 w-5 text-primary" /> {score}</span>
            <span className="flex items-center gap-1 font-medium"><Timer className="h-5 w-5 text-primary" /> {timeLeft}s</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Ensure Game Area has fixed height and width is responsive */}
        <div
          ref={gameAreaRef}
          className="relative w-full h-[500px] bg-gradient-to-b from-blue-300 to-blue-500 dark:from-sky-800 dark:to-sky-900 rounded-b-md overflow-hidden border-t-0 border border-blue-600 dark:border-sky-700 shadow-inner cursor-crosshair"
          style={{ touchAction: 'none' }} // Prevent default touch actions like scrolling
        >
          {/* Overlay Screens */}
          {(gameState === 'idle' || gameState === 'ended') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 rounded-b-md text-center p-4">
              {gameState === 'idle' && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-4">Ready to Pop?</h2>
                    <p className="text-lg text-gray-200 mb-6">Click or tap the balloons as they float up!</p>
                    <Button onClick={startGame} size="lg" className="bg-green-500 hover:bg-green-600 text-white shadow-lg">
                       <Play className="mr-2 h-5 w-5" /> Start Game
                    </Button>
                  </>
              )}
              {gameState === 'ended' && (
                <>
                  <h2 className="text-3xl font-bold mb-2 text-white">Game Over!</h2>
                  <p className="text-xl mb-4 text-gray-100">Your Score: <span className="font-bold text-yellow-400">{score}</span></p>
                  <Button onClick={startGame} size="lg" className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg">
                      Play Again
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Render Balloons - Map over state */}
           {balloons.map((balloon) => (
            <div
              key={balloon.id} // Use balloon.id for the key
              className={cn(
                "absolute rounded-full cursor-pointer transition-transform duration-150 flex items-center justify-center text-white font-bold text-xl select-none", // Base balloon style
                balloon.popped ? 'scale-150 opacity-0 rotate-45' : 'scale-100 opacity-100', // Pop animation
              )}
              style={{
                left: `${balloon.x}px`,
                top: `${balloon.y}px`,
                width: `${BALLOON_SIZE}px`,
                height: `${BALLOON_SIZE}px`,
                backgroundColor: balloon.color,
                backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)', // More subtle shine
                boxShadow: 'inset -3px -5px 10px rgba(0,0,0,0.2), 0 5px 10px rgba(0,0,0,0.25)', // Enhanced shadow
                transform: balloon.popped ? `scale(1.5) rotate(45deg)` : `scale(1)`,
                transition: `transform ${POP_ANIMATION_DURATION}ms ease-out, opacity ${POP_ANIMATION_DURATION}ms ease-out, top 1s linear`, // Smooth pop and movement
                willChange: 'transform, opacity, top', // Optimize rendering
              }}
              // Use onMouseDown for desktop clicks and onTouchStart for mobile taps
               onMouseDown={(e) => {e.preventDefault(); popBalloon(balloon.id);}} // Prevent text selection
               onTouchStart={(e) => {e.preventDefault(); popBalloon(balloon.id);}}
            >
                 {/* Subtle knot */}
                 <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-1.5 h-2.5 bg-gray-600/50 dark:bg-gray-400/50 rounded-b-full shadow-inner"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
