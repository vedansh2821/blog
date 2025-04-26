'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare, Bot, User, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatFlow } from '@/ai/flows/chat-flow'; // Assuming chatFlow is exported correctly
import { useToast } from '@/hooks/use-toast';


interface ChatMessage {
    role: 'user' | 'bot';
    content: string;
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollAreaRef.current) {
             const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }
    }, [messages]);

    // Focus input when sheet opens
     useEffect(() => {
        if (isOpen) {
            // Timeout needed because of sheet animation
            setTimeout(() => {
                 inputRef.current?.focus();
            }, 100);
             // Add initial bot message if chat is empty
            if (messages.length === 0) {
                setMessages([{ role: 'bot', content: "Hello! How can I help you today?" }]);
            }
        }
     }, [isOpen]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const userMessage = input.trim();
        if (!userMessage || isLoading) return;

        // Add user message to state
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setIsLoading(true);

        try {
            // Call the Genkit flow
            const response = await chatFlow({ history: messages, message: userMessage });

            // Add bot response to state
            setMessages(prev => [...prev, { role: 'bot', content: response.reply }]);
        } catch (error) {
            console.error("Error calling chat flow:", error);
            setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I encountered an error. Please try again." }]);
             toast({
                title: "Chatbot Error",
                description: "Could not get a response from the chatbot.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
             // Refocus input after response
            setTimeout(() => {
                 inputRef.current?.focus();
            }, 0);
        }
    };

    return (
        <>
            {/* Floating Action Button to open the chat */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="default"
                        size="icon"
                        className="fixed bottom-20 right-4 rounded-full shadow-lg z-50 h-14 w-14"
                        aria-label="Open Chatbot"
                    >
                        <MessageSquare className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary" />
                            Midnight Muse Assistant
                        </SheetTitle>
                         {/* Manual Close Button */}
                         <SheetClose asChild>
                             <Button variant="ghost" size="icon" className="absolute right-4 top-4 h-8 w-8 p-0">
                                 <X className="h-4 w-4" />
                                 <span className="sr-only">Close Chat</span>
                             </Button>
                         </SheetClose>
                    </SheetHeader>

                    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex items-start gap-3",
                                        message.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {message.role === 'bot' && (
                                        <Avatar className="h-8 w-8 border border-primary/50">
                                            <AvatarFallback><Bot size={16} /></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div
                                        className={cn(
                                            "rounded-lg px-3 py-2 max-w-[75%] text-sm break-words",
                                            message.role === 'user'
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {message.content}
                                    </div>
                                    {message.role === 'user' && (
                                        <Avatar className="h-8 w-8 border border-muted">
                                            <AvatarFallback><User size={16} /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-3 justify-start">
                                     <Avatar className="h-8 w-8 border border-primary/50">
                                          <AvatarFallback><Bot size={16} /></AvatarFallback>
                                     </Avatar>
                                     <div className="rounded-lg px-3 py-2 bg-muted text-muted-foreground">
                                         <Loader2 className="h-4 w-4 animate-spin" />
                                     </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <SheetFooter className="p-4 border-t bg-background">
                         <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1"
                                disabled={isLoading}
                                autoComplete="off"
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                <span className="sr-only">Send message</span>
                            </Button>
                         </form>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
