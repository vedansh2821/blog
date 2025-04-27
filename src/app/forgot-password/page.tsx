
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
import { Loader2, KeyRound, Mail, School, Cat, Eye, EyeOff } from 'lucide-react';

// Step 1: Enter Email
const step1Schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});
type Step1Inputs = z.infer<typeof step1Schema>;

// Step 2: Security Questions
const step2Schema = z.object({
  firstSchool: z.string().min(1, { message: "Answer cannot be empty." }),
  petName: z.string().min(1, { message: "Answer cannot be empty." }),
});
type Step2Inputs = z.infer<typeof step2Schema>;

// Step 3: Reset Password
const step3Schema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Apply error to confirmPassword field
});
type Step3Inputs = z.infer<typeof step3Schema>;


export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null); // Store user ID after email verification
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const step1Form = useForm<Step1Inputs>({ resolver: zodResolver(step1Schema) });
  const step2Form = useForm<Step2Inputs>({ resolver: zodResolver(step2Schema) });
  const step3Form = useForm<Step3Inputs>({ resolver: zodResolver(step3Schema) });

  // Step 1 Handler: Find User by Email
  const handleStep1Submit: SubmitHandler<Step1Inputs> = async (data) => {
    setIsLoading(true);
    try {
      // API call to check if email exists and get user ID (or just confirm existence)
      const response = await fetch('/api/auth/verify-email', { // NEW API Endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'User not found or error verifying email.');
      }

      setEmail(data.email); // Store email for Step 2/3 context
      setUserId(result.userId); // Store the user ID returned by the API
      setStep(2); // Move to Step 2
      toast({ title: "Email Verified", description: "Please answer your security questions." });

    } catch (error) {
      console.error("Email verification error:", error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Could not find an account with that email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 Handler: Verify Security Questions
  const handleStep2Submit: SubmitHandler<Step2Inputs> = async (data) => {
    if (!userId) return; // Should not happen if flow is correct
    setIsLoading(true);
    try {
       // API call to verify answers against the stored user data
       const response = await fetch('/api/auth/verify-security', { // NEW API Endpoint
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ userId, firstSchoolAnswer: data.firstSchool, petNameAnswer: data.petName }),
       });
       const result = await response.json();

       if (!response.ok) {
         throw new Error(result.error || 'Incorrect security question answers.');
       }

       setStep(3); // Move to Step 3
       toast({ title: "Security Questions Verified", description: "You can now reset your password." });

    } catch (error) {
      console.error("Security question verification error:", error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Incorrect answers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3 Handler: Reset Password
  const handleStep3Submit: SubmitHandler<Step3Inputs> = async (data) => {
    if (!userId) return; // Should not happen
    setIsLoading(true);
    try {
      // API call to update the user's password
      const response = await fetch('/api/auth/reset-password', { // NEW API Endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: data.newPassword }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password.');
      }

      toast({
        title: "Password Reset Successful!",
        description: "Your password has been updated. Please log in with your new password.",
      });
      router.push('/login'); // Redirect to login page

    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Password Reset Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          {step === 1 && <CardDescription>Enter your email to begin the recovery process.</CardDescription>}
          {step === 2 && <CardDescription>Answer your security questions for {email}.</CardDescription>}
          {step === 3 && <CardDescription>Enter a new password for {email}.</CardDescription>}
        </CardHeader>

        <CardContent>
          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" {...step1Form.register("email")} disabled={isLoading} className="pl-10" />
                </div>
                {step1Form.formState.errors.email && <p className="text-xs text-destructive mt-1">{step1Form.formState.errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <KeyRound className="mr-2 h-4 w-4" />}
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>
            </form>
          )}

          {/* Step 2: Security Questions */}
          {step === 2 && (
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="firstSchool">Name of your first school?</Label>
                 <div className="relative">
                     <School className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                     <Input id="firstSchool" {...step2Form.register("firstSchool")} disabled={isLoading} className="pl-10" />
                 </div>
                {step2Form.formState.errors.firstSchool && <p className="text-xs text-destructive mt-1">{step2Form.formState.errors.firstSchool.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="petName">Your first pet's name?</Label>
                 <div className="relative">
                    <Cat className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="petName" {...step2Form.register("petName")} disabled={isLoading} className="pl-10" />
                 </div>
                {step2Form.formState.errors.petName && <p className="text-xs text-destructive mt-1">{step2Form.formState.errors.petName.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <KeyRound className="mr-2 h-4 w-4" />}
                {isLoading ? "Verifying..." : "Verify Answers"}
              </Button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="newPassword">New Password</Label>
                 <div className="relative">
                    <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        {...step3Form.register("newPassword")}
                        disabled={isLoading}
                        className="pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                     >
                         {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                 </div>
                {step3Form.formState.errors.newPassword && <p className="text-xs text-destructive mt-1">{step3Form.formState.errors.newPassword.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                 <div className="relative">
                    <Input
                         id="confirmPassword"
                         type={showConfirmPassword ? "text" : "password"}
                         {...step3Form.register("confirmPassword")}
                         disabled={isLoading}
                         className="pr-10"
                     />
                     <Button
                         type="button"
                         variant="ghost"
                         size="icon"
                         className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                         aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                     </Button>
                  </div>
                {step3Form.formState.errors.confirmPassword && <p className="text-xs text-destructive mt-1">{step3Form.formState.errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <KeyRound className="mr-2 h-4 w-4" />}
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center text-sm">
          <Link href="/login" className="text-primary hover:underline font-medium">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
