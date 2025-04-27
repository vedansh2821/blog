
'use client';

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Loader2 } from 'lucide-react';
import { useAuth, type AuthUser } from '@/lib/auth/authContext'; // Import useAuth

const signupFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  // confirmPassword: z.string() // Add confirmation if needed
})
// .refine((data) => data.password === data.confirmPassword, { // Example confirmation validation
//   message: "Passwords don't match",
//   path: ["confirmPassword"],
// });

type SignupFormInputs = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login, currentUser } = useAuth(); // Get login function to log user in after signup
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupFormSchema),
  });

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    setIsLoading(true);
    try {
        // Omit confirmPassword if it exists in the schema before sending
        const { /*confirmPassword,*/ ...signupData } = data;

        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signupData),
        });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed');
      }

      // Assuming the API returns the user object on successful signup
       const user: AuthUser = result;
       login(user); // Automatically log the user in

      toast({
        title: "Signup Successful!",
        description: `Welcome, ${user.name || user.email}! Your account has been created.`,
      });

      router.push('/'); // Redirect to homepage after successful signup

    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred during signup.",
        variant: "destructive",
      });
      setIsLoading(false); // Ensure loading is reset on error
    }
     // No need to set loading to false on success because of redirect
  };

   // Redirect if already logged in
   if (currentUser) {
      router.push('/');
      return null;
   }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join Midnight Muse today.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
             <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} disabled={isLoading} autoComplete="name" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} disabled={isLoading} autoComplete="email" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} disabled={isLoading} autoComplete="new-password" />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>
             {/* <div className="space-y-2">
               <Label htmlFor="confirmPassword">Confirm Password</Label>
               <Input id="confirmPassword" type="password" {...register("confirmPassword")} disabled={isLoading} />
               {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
             </div> */}
            <Button type="submit" className="w-full" disabled={isLoading}>
               {isLoading ? <Loader2 className="animate-spin mr-2" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?&nbsp;
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
