
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
import { LogIn, Loader2 } from 'lucide-react';
import { useAuth, type AuthUser } from '@/lib/auth/authContext'; // Import useAuth and AuthUser

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }), // Basic validation
});

type LoginFormInputs = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login, currentUser } = useAuth(); // Get login function from context
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Assuming the API returns the user object on successful login
      const user: AuthUser = result;
      login(user); // Update auth context

      toast({
        title: "Login Successful!",
        description: `Welcome back, ${user.name || user.email}!`,
      });

      router.push('/'); // Redirect to homepage after successful login

    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
      setIsLoading(false); // Ensure loading is reset on error
    }
    // No need to set loading to false on success because of redirect
  };

   // Redirect if already logged in
   if (currentUser) {
       // You might want to show a loading state briefly before redirecting
       // or simply redirect immediately.
       router.push('/');
       return null; // Return null or a loading indicator while redirecting
   }


  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          <CardDescription>Log in to your Midnight Muse account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} disabled={isLoading} autoComplete="email" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} disabled={isLoading} autoComplete="current-password"/>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
               {/* TODO: Add Forgot Password link */}
               {/* <div className="text-right">
                 <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                   Forgot password?
                 </Link>
               </div> */}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="mr-2 h-4 w-4" />}
              {isLoading ? "Logging In..." : "Log In"}
            </Button>
          </form>
           {/* Optional: Add social login buttons here */}
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?&nbsp;
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign Up
              </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
