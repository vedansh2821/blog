'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const NEWSLETTER_COOKIE_NAME = 'newsletter_dismissed';
const MODAL_DELAY_MS = 15000; // 15 seconds

export default function NewsletterSignupModal() {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Check if the modal has been dismissed before using a cookie
        const dismissed = document.cookie.split('; ').find(row => row.startsWith(`${NEWSLETTER_COOKIE_NAME}=`));

        if (!dismissed) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, MODAL_DELAY_MS);

            // Cleanup the timer if the component unmounts
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsOpen(false);
        // Set a cookie to prevent showing the modal again for this session/duration
        // Expires in 7 days
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${NEWSLETTER_COOKIE_NAME}=true; expires=${expires}; path=/; SameSite=Lax`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return; // Basic validation

        setIsSubmitting(true);
        // Simulate API call to subscribe
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Subscribing email:', email);

        setIsSubmitting(false);
        toast({
            title: "Subscribed!",
            description: "Thanks for joining our newsletter.",
        });
        setEmail('');
        handleDismiss(); // Close and set cookie after successful subscription
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl">Stay Updated!</DialogTitle>
                    <DialogDescription className="text-center">
                        Subscribe to our newsletter for the latest blog posts, news, and insights delivered straight to your inbox.
                    </DialogDescription>
                     {/* Manual Close Button for Accessibility */}
                     <DialogClose asChild>
                         <Button variant="ghost" size="icon" className="absolute right-4 top-4 h-6 w-6 p-0" onClick={handleDismiss}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                          </Button>
                      </DialogClose>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="newsletter-email" className="text-right sr-only">
                                Email
                            </Label>
                           <div className="relative col-span-4">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="newsletter-email"
                                    type="email"
                                    placeholder="your.email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                    disabled={isSubmitting}
                                />
                           </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                             {isSubmitting ? "Subscribing..." : "Subscribe Now"}
                        </Button>
                    </DialogFooter>
                </form>
                 <Button variant="link" size="sm" className="mt-2 text-xs text-muted-foreground mx-auto" onClick={handleDismiss}>
                      No thanks
                 </Button>
            </DialogContent>
        </Dialog>
    );
}
