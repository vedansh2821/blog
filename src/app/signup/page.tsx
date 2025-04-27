
'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
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
import { UserPlus, Loader2, Calendar as CalendarIcon, School, Cat } from 'lucide-react'; // Added icons
import { useAuth, type AuthUser } from '@/lib/auth/authContext'; // Import useAuth
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

const signupFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  dob: z.date({
    required_error: "Date of birth is required.",
    invalid_type_error: "Invalid date format.",
  }),
  firstSchool: z.string().min(2, { message: "First school name is required (min 2 characters)." }),
  petName: z.string().min(2, { message: "Pet's name is required (min 2 characters)." }),
})

type SignupFormInputs = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login, currentUser, loading: authLoading } = useAuth(); // Get auth state and loading state
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed from isLoading
  const [selectedDob, setSelectedDob] = useState<Date | undefined>();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
        name: '',
        email: '',
        password: '',
        dob: undefined,
        firstSchool: '',
        petName: '',
    }
  });

    // Watch DOB changes to update internal state for Calendar component
    const watchedDob = watch('dob');
    useEffect(() => {
        setSelectedDob(watchedDob);
    }, [watchedDob]);

   // Effect to redirect if already logged in
   useEffect(() => {
      if (!authLoading && currentUser) {
          console.log("User already logged in, redirecting to /");
          router.push('/');
      }
  }, [currentUser, authLoading, router]);

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    setIsSubmitting(true);
    try {
        // Format dob to 'YYYY-MM-DD' before sending
        const dobString = data.dob ? format(data.dob, 'yyyy-MM-dd') : null;

        const signupData = {
            name: data.name,
            email: data.email,
            password: data.password,
            dob: dobString,
            firstSchool: data.firstSchool,
            petName: data.petName,
        };

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

      // router.push('/'); // Redirect is handled by the useEffect now

    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred during signup.",
        variant: "destructive",
      });
      setIsSubmitting(false); // Ensure loading is reset on error
    }
     // No need to set loading to false on success because of redirect handled by useEffect
  };

   // Show loading skeleton or null while auth state is loading or redirecting
   if (authLoading || currentUser) {
     return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
             <Card className="w-full max-w-md">
                 <CardHeader>
                     <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                     <Skeleton className="h-4 w-1/2 mx-auto" />
                 </CardHeader>
                 <CardContent className="space-y-6">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full mt-2" />
                 </CardContent>
                  <CardFooter>
                      <Skeleton className="h-4 w-3/5 mx-auto" />
                  </CardFooter>
             </Card>
         </div>
     );
   }

  // Render the signup form only if not loading and not logged in
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join Midnight Muse today.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"> {/* Reduced space */}
             <div className="space-y-1"> {/* Reduced space */}
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} disabled={isSubmitting} autoComplete="name" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} disabled={isSubmitting} autoComplete="email" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} disabled={isSubmitting} autoComplete="new-password" />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>
             <div className="space-y-1">
                 <Label htmlFor="dob">Date of Birth</Label>
                 <Popover>
                     <PopoverTrigger asChild>
                       <Button
                         variant={"outline"}
                         className={cn(
                           "w-full justify-start text-left font-normal",
                           !selectedDob && "text-muted-foreground"
                         )}
                         disabled={isSubmitting}
                       >
                         <CalendarIcon className="mr-2 h-4 w-4" />
                         {selectedDob ? format(selectedDob, "PPP") : <span>Pick a date</span>}
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0">
                       <Calendar
                         mode="single"
                         selected={selectedDob}
                         onSelect={(date) => {
                           setSelectedDob(date);
                           setValue("dob", date as Date, { shouldValidate: true }); // Set RHF value
                         }}
                         initialFocus
                         captionLayout="dropdown-buttons"
                         fromYear={1900}
                         toYear={new Date().getFullYear() - 5} // Example: require users to be at least 5 years old
                       />
                     </PopoverContent>
                   </Popover>
                   {errors.dob && <p className="text-xs text-destructive mt-1">{errors.dob.message}</p>}
             </div>
              <div className="space-y-1">
                 <Label htmlFor="firstSchool">Name of Your First School</Label>
                 <div className="relative">
                     <School className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                     <Input id="firstSchool" {...register("firstSchool")} disabled={isSubmitting} className="pl-10" placeholder="e.g., Oakwood Elementary" />
                 </div>
                 {errors.firstSchool && <p className="text-xs text-destructive mt-1">{errors.firstSchool.message}</p>}
             </div>
              <div className="space-y-1">
                 <Label htmlFor="petName">Your First Pet's Name</Label>
                 <div className="relative">
                    <Cat className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="petName" {...register("petName")} disabled={isSubmitting} className="pl-10" placeholder="e.g., Buddy" />
                 </div>
                 {errors.petName && <p className="text-xs text-destructive mt-1">{errors.petName.message}</p>}
             </div>
            <Button type="submit" className="w-full mt-6" disabled={isSubmitting}> {/* Added margin-top */}
               {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm gap-3"> {/* Adjusted footer layout */}
          <p className="text-muted-foreground">
            Already have an account?&nbsp;
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log In
            </Link>
          </p>
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
            Forgot password?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
