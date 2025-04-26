
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle, Bot, User, Loader2, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { chatWithBot, type ChatMessage } from '@/ai/flows/chat-flow';
import { useToast } from "@/hooks/use-toast";

interface DisplayMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Add initial greeting from bot
  useEffect(() => {
      if (messages.length === 0) {
          setMessages([
              { id: 'init-greet', role: 'bot', content: "Hello! I'm the Midnight Muse AI assistant. How can I help you find information on our blog today?" }
          ]);
      }
  }, [messages.length]);


  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
           // Use setTimeout to ensure DOM update completes before scrolling
           setTimeout(() => {
               scrollElement.scrollTop = scrollElement.scrollHeight;
           }, 0);
        }
    }
  }, [messages]);

  // Focus input when dialog opens
   useEffect(() => {
     if (isOpen) {
       // Delay focus slightly to ensure the input is rendered and interactive
       setTimeout(() => {
         inputRef.current?.focus();
       }, 100);
     }
   }, [isOpen]);


  const handleSendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const newUserMessage: DisplayMessage = { id: `user-${Date.now()}`, role: 'user', content: trimmedInput };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history for the flow (simple version: last few messages)
      // In a real app, you might want a more sophisticated history management
      const history: ChatMessage[] = messages.slice(-5).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          content: msg.content
      }));

      const botResponse = await chatWithBot({
          message: trimmedInput,
          // history: history // Enable if chat-flow supports history
      });
      const newBotMessage: DisplayMessage = { id: `bot-${Date.now()}`, role: 'bot', content: botResponse.response };
      setMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
       toast({
          title: "Error",
          description: "Sorry, I couldn't process your request. Please try again.",
          variant: "destructive",
        });
       // Optionally add an error message to the chat
       setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'bot', content: "I encountered an error. Please try again."}]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, toast]);


  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
     if (event.key === 'Enter' && !event.shiftKey) {
       event.preventDefault(); // Prevent form submission or newline in input
       handleSendMessage();
     }
   };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-4 right-16 rounded-full shadow-lg z-50 h-12 w-12"
          aria-label="Open Chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] p-0 flex flex-col max-h-[80vh]">
         <DialogHeader className="p-4 border-b">
           <DialogTitle className="flex items-center gap-2">
             <Bot className="h-5 w-5 text-primary" />
             Chat with AI Assistant
           </DialogTitle>
           <DialogDescription className="text-xs">
             Ask me about blog posts, topics, or authors.
           </DialogDescription>
           {/* Add explicit close button */}
            <DialogClose asChild>
               <Button variant="ghost" size="icon" className="absolute right-4 top-4 h-6 w-6 p-0">
                 <X className="h-4 w-4" />
                 <span className="sr-only">Close chat</span>
               </Button>
           </DialogClose>
         </DialogHeader>

         <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'bot' && (
                    <Avatar className="h-8 w-8 border border-primary flex-shrink-0">
                      <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.content}
                  </div>
                   {message.role === 'user' && (
                      <Avatar className="h-8 w-8 border flex-shrink-0">
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                    )}
                </div>
              ))}
               {isLoading && (
                  <div className="flex justify-start gap-3 items-center">
                      <Avatar className="h-8 w-8 border border-primary flex-shrink-0">
                         <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                     <div className="bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                   </div>
               )}
            </div>
          </ScrollArea>

         <DialogFooter className="p-4 border-t">
           <div className="flex w-full items-center space-x-2">
              <Input
                ref={inputRef}
                id="chat-input"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
                disabled={isLoading}
                autoComplete="off"
              />
              <Button type="button" size="icon" onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
