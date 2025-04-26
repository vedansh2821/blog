'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, Bot, User, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatFlow, type ChatFlowInput, type ChatFlowOutput } from '@/ai/flows/chat-flow'; // Ensure types are imported
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
             // Use querySelector to find the viewport element within the ScrollArea
             const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            } else {
                // Fallback for direct element if querySelector fails
                 scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
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
             // Add initial bot message if chat is empty and sheet opens
            if (messages.length === 0) {
                setMessages([{ role: 'bot', content: "Hello! How can I help you today?" }]);
            }
        }
     }, [isOpen]); // Re-run only when isOpen changes

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const userMessage = input.trim();
        if (!userMessage || isLoading) return;

        const currentMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
        // Add user message to state immediately for UI update
        setMessages(currentMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare input for the flow (send previous messages for context)
            const flowInput: ChatFlowInput = {
                // Filter out any potential initial placeholder messages if needed
                history: currentMessages.slice(0, -1).filter(m => m.content),
                message: userMessage,
            };

            console.log("Sending to chatFlow:", flowInput); // Debug log

            // Call the Genkit flow
            const response: ChatFlowOutput = await chatFlow(flowInput);

            console.log("Received from chatFlow:", response); // Debug log

            // Add bot response to state
            setMessages(prev => [...prev, { role: 'bot', content: response.reply }]);

        } catch (error) {
            console.error("Error calling chat flow:", error);

            // Determine a more specific error message if possible
            let errorMessage = "Could not get a response. Please try again later.";
            if (error instanceof Error) {
                // Check for common configuration errors (like missing API key, though ai-instance should catch it)
                if (error.message.includes('API key not valid') || error.message.includes('GOOGLE_GENAI_API_KEY')) {
                    errorMessage = "Chatbot configuration error. Please contact support.";
                } else if (error.message.includes('deadline exceeded') || error.message.includes('timeout')) {
                     errorMessage = "The request timed out. Please try again.";
                }
                // You could add more specific checks here based on potential errors from Genkit or the LLM
            }

            // Add a generic error message to the chat UI
             setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I encountered an error processing your request." }]);

             // Show a toast notification with the more specific error
             toast({
                title: "Chatbot Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
             // Refocus input after response or error
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
                        className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 h-14 w-14" // Adjusted position slightly
                        aria-label="Open Chatbot"
                    >
                        <MessageSquare className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[90vw] max-w-[400px] sm:max-w-[540px] p-0 flex flex-col"> {/* Adjusted width */}
                    <SheetHeader className="p-4 border-b flex flex-row justify-between items-center"> {/* Added flex layout */}
                        <SheetTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary" />
                            Midnight Muse Assistant
                        </SheetTitle>
                         {/* Manual Close Button */}
                         <SheetClose asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 p-0"> {/* Removed absolute positioning */}
                                 <X className="h-4 w-4" />
                                 <span className="sr-only">Close Chat</span>
                             </Button>
                         </SheetClose>
                    </SheetHeader>

                    <ScrollArea className="flex-1 p-4 bg-muted/20" ref={scrollAreaRef}> {/* Added light background */}
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex items-end gap-2", // Changed to items-end for better avatar alignment
                                        message.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {message.role === 'bot' && (
                                        <Avatar className="h-8 w-8 border border-primary/50 flex-shrink-0">
                                            <AvatarFallback><Bot size={16} /></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div
                                        className={cn(
                                            "rounded-lg px-3 py-2 max-w-[80%] text-sm break-words shadow-sm", // Added shadow
                                            message.role === 'user'
                                                ? "bg-primary text-primary-foreground rounded-br-none" // Different rounding for user
                                                : "bg-background text-foreground rounded-bl-none border" // Different rounding for bot
                                        )}
                                    >
                                        {message.content}
                                    </div>
                                    {message.role === 'user' && (
                                        <Avatar className="h-8 w-8 border border-muted flex-shrink-0">
                                            <AvatarFallback><User size={16} /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-end gap-2 justify-start"> {/* Changed to items-end */}
                                     <Avatar className="h-8 w-8 border border-primary/50 flex-shrink-0">
                                          <AvatarFallback><Bot size={16} /></AvatarFallback>
                                     </Avatar>
                                     <div className="rounded-lg px-3 py-2 bg-muted text-muted-foreground rounded-bl-none"> {/* Different rounding */}
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
