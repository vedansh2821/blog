
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Clock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CARD_SYMBOLS = ['🍎', '🍌', '🍒', '🍇', '🍓', '🍉', '🍍', '🥝']; // 8 pairs = 16 cards
const CARD_PAIRS = [...CARD_SYMBOLS, ...CARD_SYMBOLS];
const SHUFFLE_DELAY = 500; // ms
const FLIP_BACK_DELAY = 1000; // ms

interface MemoryCard {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Fisher-Yates (Knuth) Shuffle Algorithm
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export default function MemoryMatchGame() {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initializeGame = () => {
    const shuffledSymbols = shuffleArray([...CARD_PAIRS]);
    setCards(
      shuffledSymbols.map((symbol, index) => ({
        id: index,
        symbol: symbol,
        isFlipped: false,
        isMatched: false,
      }))
    );
    setFlippedIndices([]);
    setMoves(0);
    setGameOver(false);
    setGameStarted(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    // Initialize on mount (or start button press)
    // initializeGame(); // Start immediately or wait for button
  }, []);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      const [firstIndex, secondIndex] = flippedIndices;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.symbol === secondCard.symbol) {
        // Match found
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.symbol === firstCard.symbol ? { ...card, isMatched: true } : card
          )
        );
        setFlippedIndices([]); // Reset flipped cards immediately for match
      } else {
        // No match, flip back after delay
        timeoutRef.current = setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card, index) =>
              flippedIndices.includes(index) ? { ...card, isFlipped: false } : card
            )
          );
          setFlippedIndices([]);
        }, FLIP_BACK_DELAY);
      }
      setMoves((prev) => prev + 1);
    }
  }, [flippedIndices, cards]);


  // Check for game over
   useEffect(() => {
       if (gameStarted && cards.length > 0 && cards.every(card => card.isMatched)) {
           setGameOver(true);
       }
   }, [cards, gameStarted]);

  const handleCardClick = (index: number) => {
    if (
      flippedIndices.length === 2 || // Already 2 cards flipped
      cards[index].isFlipped || // Card already flipped/matched
      cards[index].isMatched ||
      gameOver ||
      !gameStarted
    ) {
      return;
    }

    // Flip the card
    setCards((prevCards) =>
      prevCards.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );

    setFlippedIndices((prev) => [...prev, index]);
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Memory Match</span>
          <div className="flex items-center gap-4 text-base">
            <span className="flex items-center gap-1"><CheckSquare className="h-4 w-4" /> Moves: {moves}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
         {!gameStarted ? (
              <div className="text-center p-8">
                  <p className="mb-4 text-lg">Match all the pairs!</p>
                  <Button onClick={initializeGame} size="lg">Start Game</Button>
              </div>
          ) : (
             <div className="grid grid-cols-4 gap-3 p-4 bg-muted/20 rounded-lg">
                {cards.map((card, index) => (
                <div
                    key={card.id}
                    className={cn(
                    "aspect-square rounded-md cursor-pointer transition-transform duration-300 transform-style-preserve-3d flex items-center justify-center bg-card border shadow-md",
                    card.isFlipped || card.isMatched ? "rotate-y-180 bg-background" : "bg-primary hover:scale-105",
                    card.isMatched && "opacity-60 cursor-default" // Slightly fade matched cards
                    )}
                    onClick={() => handleCardClick(index)}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div className="backface-hidden absolute inset-0 flex items-center justify-center">
                        {/* Front of card (Hidden when flipped) */}
                        <HelpCircle className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="backface-hidden rotate-y-180 absolute inset-0 flex items-center justify-center">
                        {/* Back of card (Visible when flipped) */}
                        <span className="text-4xl select-none">{card.symbol}</span>
                    </div>
                 </div>
                ))}
             </div>
         )}

        {gameOver && (
          <div className="mt-6 text-center p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-md">
            <h2 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">Congratulations!</h2>
            <p className="text-green-600 dark:text-green-400 mb-3">You matched all pairs in {moves} moves!</p>
            <Button onClick={initializeGame}>Play Again</Button>
          </div>
        )}
      </CardContent>
       {/* Basic CSS for 3D flip effect */}
       <style jsx>{`
         .transform-style-preserve-3d { transform-style: preserve-3d; }
         .rotate-y-180 { transform: rotateY(180deg); }
         .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
       `}</style>
    </Card>
  );
}
