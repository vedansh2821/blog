
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, ArrowUp, Coins, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLAYER_SIZE = 30;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const MOVE_SPEED = 5;
const PLATFORM_HEIGHT = 20;
const PLATFORM_COLOR = 'rgb(100 116 139)'; // Slate-500
const PLAYER_COLOR = 'rgb(239 68 68)'; // Red-500
const GROUND_HEIGHT = 50;

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Player extends GameObject {
  vx: number; // Velocity X
  vy: number; // Velocity Y
  isOnGround: boolean;
}

interface Platform extends GameObject {}

export default function PlatformerGame() {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: 300,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    vx: 0,
    vy: 0,
    isOnGround: false,
  });
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [keysPressed, setKeysPressed] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const gameAreaWidth = useRef(0);
  const gameAreaHeight = useRef(0);

  const initializeGame = useCallback(() => {
      if (!gameAreaRef.current) return;
      gameAreaWidth.current = gameAreaRef.current.offsetWidth;
      gameAreaHeight.current = gameAreaRef.current.offsetHeight;

      const groundLevel = gameAreaHeight.current - GROUND_HEIGHT;

      setPlayer({
        x: 50,
        y: groundLevel - PLAYER_SIZE,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        vx: 0,
        vy: 0,
        isOnGround: true, // Start on ground
      });
      setPlatforms([
        // Ground Platform
        { x: 0, y: groundLevel, width: gameAreaWidth.current, height: GROUND_HEIGHT },
        // Example Platforms
        { x: 150, y: groundLevel - 80, width: 100, height: PLATFORM_HEIGHT },
        { x: 300, y: groundLevel - 150, width: 120, height: PLATFORM_HEIGHT },
        { x: 500, y: groundLevel - 100, width: 80, height: PLATFORM_HEIGHT },
      ]);
      setKeysPressed({});
      setScore(0);
      setLives(3);
      setGameOver(false);
      setGameStarted(true);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, []); // Empty dependency array - initialize once on start

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeysPressed((prev) => ({ ...prev, [e.key.toLowerCase()]: true }));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setKeysPressed((prev) => ({ ...prev, [e.key.toLowerCase()]: false }));
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Call initialize once component mounts and ref is available
    // initializeGame(); // Start automatically or wait for button

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [handleKeyDown, handleKeyUp]); // Add initializeGame here if you start automatically

   // Collision detection function
   const checkCollision = (obj1: GameObject, obj2: GameObject): boolean => {
     return (
       obj1.x < obj2.x + obj2.width &&
       obj1.x + obj1.width > obj2.x &&
       obj1.y < obj2.y + obj2.height &&
       obj1.y + obj1.height > obj2.y
     );
   };


  const gameLoop = useCallback(() => {
    if (gameOver || !gameStarted || !gameAreaRef.current) return;

    const currentWidth = gameAreaRef.current.offsetWidth;
    const currentHeight = gameAreaRef.current.offsetHeight;
    gameAreaWidth.current = currentWidth; // Update dimensions potentially
    gameAreaHeight.current = currentHeight;
    const groundLevel = currentHeight - GROUND_HEIGHT;


    setPlayer((prevPlayer) => {
        let nextX = prevPlayer.x;
        let nextY = prevPlayer.y;
        let nextVx = 0; // Horizontal movement is instant based on keys
        let nextVy = prevPlayer.vy + GRAVITY;
        let nextIsOnGround = false;

        // --- Horizontal Movement ---
        if (keysPressed['arrowleft'] || keysPressed['a']) {
            nextVx = -MOVE_SPEED;
        }
        if (keysPressed['arrowright'] || keysPressed['d']) {
            nextVx = MOVE_SPEED;
        }
        nextX += nextVx;

        // --- Jumping ---
        if ((keysPressed['arrowup'] || keysPressed['w'] || keysPressed[' ']) && prevPlayer.isOnGround) {
            nextVy = JUMP_FORCE;
        }

        // --- Apply Vertical Velocity ---
         nextY += nextVy;

        // --- Collision Detection & Resolution ---
        // Boundary checks (horizontal)
        if (nextX < 0) nextX = 0;
        if (nextX + prevPlayer.width > gameAreaWidth.current) {
            nextX = gameAreaWidth.current - prevPlayer.width;
        }


        // Platform collision (vertical)
        platforms.forEach(platform => {
           const playerBottom = nextY + prevPlayer.height;
           const playerPrevBottom = prevPlayer.y + prevPlayer.height; // Previous bottom edge

           // Check if player is moving downwards (vy > 0) and was previously above the platform
           if (nextVy >= 0 && playerPrevBottom <= platform.y) {
              // Potential vertical collision with top of platform
               if (
                 prevPlayer.x + prevPlayer.width > platform.x &&
                 prevPlayer.x < platform.x + platform.width && // Horizontal overlap
                 playerBottom >= platform.y && // Bottom edge is at or below platform top
                 prevPlayer.y < platform.y // Ensure player was above in the previous frame
               ) {
                 nextY = platform.y - prevPlayer.height; // Place player on top
                 nextVy = 0; // Stop vertical movement
                 nextIsOnGround = true; // Player is on ground (or platform)
               }
           }
           // Add checks for hitting platform from below or sides if needed
        });

        // Boundary check (vertical - bottom - game over condition maybe?)
        if (nextY + prevPlayer.height > gameAreaHeight.current + 50) { // Allow falling slightly off screen
             // Handle player falling off - e.g., lose a life, reset position
             setLives(prev => prev -1);
             if (lives <= 1) {
                 setGameOver(true);
             }
             // Reset player position (example)
              return {
                   ...prevPlayer,
                   x: 50,
                   y: groundLevel - PLAYER_SIZE,
                   vx: 0,
                   vy: 0,
                   isOnGround: true,
              };
         }

        // Prevent falling through ground (redundant if ground is a platform, but safe)
         if (!nextIsOnGround && nextY + prevPlayer.height >= groundLevel) {
              nextY = groundLevel - prevPlayer.height;
              nextVy = 0;
              nextIsOnGround = true;
          }


        return {
            ...prevPlayer,
            x: nextX,
            y: nextY,
            vx: nextVx, // Update vx based on keys, though we apply it directly
            vy: nextVy,
            isOnGround: nextIsOnGround,
        };
    });


    // --- Game Loop Continuation ---
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [keysPressed, platforms, gameOver, gameStarted, lives]);


  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Platformer Fun</span>
          <div className="flex items-center gap-4 text-lg">
            <span className="flex items-center gap-1"><Coins className="h-5 w-5 text-yellow-500" /> {score}</span>
            <span className="flex items-center gap-1"><Heart className="h-5 w-5 text-red-500" /> {lives}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={gameAreaRef}
          className="relative w-full h-[450px] bg-gradient-to-b from-sky-400 to-sky-600 rounded-b-md overflow-hidden border-t-0 border border-blue-700"
          style={{ touchAction: 'manipulation' }} // Allow touch controls without zoom etc.
        >
          {/* Game Over Screen */}
           {gameOver && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
               <h2 className="text-3xl font-bold mb-4 text-red-500">Game Over!</h2>
               <p className="text-xl mb-6 text-white">Final Score: {score}</p>
               <Button onClick={initializeGame} size="lg">Play Again</Button>
             </div>
           )}

           {/* Start Screen */}
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20">
                <p className="text-xl font-semibold mb-4 text-white">Ready for an adventure?</p>
                <Button onClick={initializeGame} size="lg">Start Game</Button>
              </div>
            )}

          {/* Platforms */}
          {platforms.map((platform, index) => (
            <div
              key={`platform-${index}`}
              className="absolute"
              style={{
                left: `${platform.x}px`,
                top: `${platform.y}px`,
                width: `${platform.width}px`,
                height: `${platform.height}px`,
                backgroundColor: index === 0 ? 'rgb(71 85 105)' : PLATFORM_COLOR, // Darker ground (slate-600)
                borderRadius: index === 0 ? '0' : '4px', // No radius for ground
                boxShadow: index === 0 ? 'none' : '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
          ))}

          {/* Player */}
          {gameStarted && (
            <div
              className="absolute transition-[left,top] duration-0" // Position transition handled by state update
              style={{
                left: `${player.x}px`,
                top: `${player.y}px`,
                width: `${player.width}px`,
                height: `${player.height}px`,
                backgroundColor: PLAYER_COLOR,
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          )}

           {/* Simple Touch Controls Overlay - OPTIONAL */}
           {gameStarted && (
               <div className="absolute bottom-4 left-4 right-4 flex justify-between md:hidden z-10 opacity-70">
                   <Button
                       size="icon"
                       className="rounded-full w-14 h-14 bg-gray-500/50 text-white"
                       onTouchStart={() => setKeysPressed(prev => ({ ...prev, arrowleft: true }))}
                       onTouchEnd={() => setKeysPressed(prev => ({ ...prev, arrowleft: false }))}
                   >
                       <ArrowLeft />
                   </Button>
                   <Button
                       size="icon"
                       className="rounded-full w-14 h-14 bg-gray-500/50 text-white"
                       onTouchStart={() => setKeysPressed(prev => ({ ...prev, arrowup: true }))}
                       onTouchEnd={() => setKeysPressed(prev => ({ ...prev, arrowup: false }))}
                   >
                       <ArrowUp />
                   </Button>
                   <Button
                       size="icon"
                       className="rounded-full w-14 h-14 bg-gray-500/50 text-white"
                       onTouchStart={() => setKeysPressed(prev => ({ ...prev, arrowright: true }))}
                       onTouchEnd={() => setKeysPressed(prev => ({ ...prev, arrowright: false }))}
                   >
                       <ArrowRight />
                   </Button>
               </div>
           )}

        </div>
      </CardContent>
    </Card>
  );
}
