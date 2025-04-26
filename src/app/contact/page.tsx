'use client';

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

type ContactFormInputs = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ContactFormInputs>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit: SubmitHandler<ContactFormInputs> = async (data) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Contact form submitted:', data);

    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We'll get back to you shortly.",
    });
    reset(); // Reset form fields
  };

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Get In Touch</h1>
      <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
        Have questions, feedback, or just want to say hello? Fill out the form below or reach out through our contact details.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
         {/* Contact Info */}
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Contact Information</h2>
             <Card className="bg-card/50">
                 <CardContent className="p-6 space-y-4">
                     <div className="flex items-start gap-4">
                         <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                         <div>
                             <h3 className="font-semibold">Address</h3>
                             <p className="text-muted-foreground text-sm">123 Muse Lane, Creativity City, IdeaLand 10101</p>
                         </div>
                     </div>
                      <div className="flex items-start gap-4">
                          <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                          <div>
                              <h3 className="font-semibold">Email</h3>
                              <a href="mailto:hello@midnightmuse.com" className="text-primary text-sm hover:underline">hello@midnightmuse.com</a>
                          </div>
                      </div>
                      <div className="flex items-start gap-4">
                           <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                           <div>
                               <h3 className="font-semibold">Phone</h3>
                               <p className="text-muted-foreground text-sm">(555) 123-4567</p>
                           </div>
                       </div>
                 </CardContent>
             </Card>
        </div>

         {/* Contact Form */}
        <div>
             <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...register("name")} disabled={isSubmitting} />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} disabled={isSubmitting} />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" {...register("subject")} disabled={isSubmitting} />
                  {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject.message}</p>}
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" rows={5} {...register("message")} disabled={isSubmitting} />
                  {errors.message && <p className="text-xs text-destructive mt-1">{errors.message.message}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
        </div>
      </div>
    </div>
  );
}
