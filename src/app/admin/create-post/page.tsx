'use client';

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { Skeleton } from '@/components/ui/skeleton';

// Ensure categories match those used in mock-sql or fetched dynamically
const categories = ['Technology', 'Lifestyle', 'Health', 'Travel', 'Love', 'Others'];

const postFormSchema = z.object({
    title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
    category: z.enum(categories as [string, ...string[]], {
        required_error: "You need to select a post category.",
    }),
    heading: z.string().min(5, { message: 'Heading must be at least 5 characters.' }),
    // Store raw input as strings, process before sending
    subheadings: z.string().optional(), // Comma-separated string
    paragraphs: z.string().optional(),   // Newline-separated string
    excerpt: z.string().min(10).max(200, { message: 'Excerpt must be between 10 and 200 characters.' }).optional().or(z.literal('')),
    imageUrl: z.string().url({ message: 'Please enter a valid image URL.' }).optional().or(z.literal('')),
    tags: z.string().optional(), // Comma-separated tags
});

type PostFormInputs = z.infer<typeof postFormSchema>;

export default function CreatePostPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { currentUser, loading: authLoading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<PostFormInputs>({
        resolver: zodResolver(postFormSchema),
        defaultValues: {
            title: '',
            category: undefined,
            heading: '',
            subheadings: '',
            paragraphs: '',
            excerpt: '',
            imageUrl: '',
            tags: '',
        },
    });

    // Effect for redirecting unauthorized users
    React.useEffect(() => {
        if (!authLoading && !currentUser) {
            toast({ title: "Unauthorized", description: "You must be logged in to create a post.", variant: "destructive" });
            router.push('/login');
        }
    }, [authLoading, currentUser, router, toast]);

    // Function to handle form submission
    const onSubmit: SubmitHandler<PostFormInputs> = async (data) => {
        if (!currentUser) {
            toast({ title: "Authentication Error", description: "Cannot create post. User not found.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Process tags, subheadings, and paragraphs from string input to arrays
            const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
            const subheadingsArray = data.subheadings ? data.subheadings.split(',').map(s => s.trim()).filter(s => s) : [];
            const paragraphsArray = data.paragraphs ? data.paragraphs.split('\n').map(p => p.trim()).filter(p => p) : [];

            // Construct the payload for the API
            const postData = {
                title: data.title,
                category: data.category,
                heading: data.heading,
                subheadings: subheadingsArray, // Send processed array
                paragraphs: paragraphsArray,   // Send processed array
                excerpt: data.excerpt,
                imageUrl: data.imageUrl, // Image URL takes precedence if file not handled
                tags: tagsArray,
                requestingUserId: currentUser.id, // Include the user ID for the API auth
            };

            // TODO: Implement image upload logic if selectedImage exists
            // If an image file is selected, upload it (e.g., to Firebase Storage)
            // and get the URL. Then, set postData.imageUrl to that URL.
            // For now, we only use the URL input.
            if (selectedImage) {
                 console.warn("Image file selected, but upload functionality is not implemented. Using URL field if provided.");
                 // In a real app:
                 // const uploadedImageUrl = await uploadImage(selectedImage); // Your upload function
                 // postData.imageUrl = uploadedImageUrl;
            }


            console.log("[Create Post] Sending data to API:", postData);

            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });

            const result = await response.json();
            console.log("[Create Post] API response:", result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create post');
            }

            toast({
                title: 'Post Created!',
                description: `Your post "${result.title}" has been published.`,
            });
            // Redirect to the newly created post page
            router.push(`/blogs/${result.slug}`);

        } catch (error) {
            console.error('Failed to create post:', error);
            toast({
                title: 'Creation Failed',
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
                variant: 'destructive',
            });
            setIsSubmitting(false); // Only set submitting false on error
        }
        // Don't set isSubmitting to false on success because we redirect
    };

    // Function to handle image file selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            // Clear the imageUrl input if a file is selected, as file takes precedence (once upload is implemented)
            setValue('imageUrl', '', { shouldValidate: true });
            toast({title: "Image Selected", description: "Image upload not implemented. URL field cleared. Provide a URL instead for now."})
        } else {
            setSelectedImage(null);
        }
    };

    // Loading state UI
    if (authLoading || currentUser === undefined) {
        return (
            <div className="container mx-auto py-12">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <div className="flex justify-end">
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Main component render
    return (
        <div className="container mx-auto py-12">
            <Card className="max-w-3xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Create New Blog Post</CardTitle>
                    <CardDescription>Fill in the details below to publish a new post.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Title Input */}
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" {...register('title')} disabled={isSubmitting} placeholder="Enter a catchy title" />
                            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
                        </div>

                        {/* Category Select */}
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Select
                                onValueChange={(value) => setValue('category', value as PostFormInputs['category'], { shouldValidate: true })}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && <p className="text-xs text-destructive mt-1">{errors.category.message}</p>}
                        </div>

                        {/* Structured Content: Heading */}
                        <div>
                            <Label htmlFor="heading">Main Heading</Label>
                            <Input id="heading" {...register('heading')} disabled={isSubmitting} placeholder="Main heading for the post"/>
                            {errors.heading && <p className="text-xs text-destructive mt-1">{errors.heading.message}</p>}
                        </div>

                        {/* Structured Content: Subheadings */}
                        <div>
                            <Label htmlFor="subheadings">Subheadings (Optional)</Label>
                            <Input id="subheadings"
                                placeholder="Separate subheadings with commas, e.g., Intro, Point 1, Conclusion"
                                disabled={isSubmitting}
                                {...register('subheadings')}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Comma-separated list.</p>
                            {errors.subheadings && <p className="text-xs text-destructive mt-1">{errors.subheadings.message}</p>}
                        </div>

                        {/* Structured Content: Paragraphs */}
                        <div>
                            <Label htmlFor="paragraphs">Paragraphs</Label>
                            <Textarea id="paragraphs"
                                rows={8} // Increased rows for better writing experience
                                placeholder="Write your blog content here. Separate paragraphs with a new line (press Enter)."
                                disabled={isSubmitting}
                                {...register('paragraphs')}
                            />
                             <p className="text-xs text-muted-foreground mt-1">Each new line will be treated as a separate paragraph.</p>
                            {errors.paragraphs && <p className="text-xs text-destructive mt-1">{errors.paragraphs.message}</p>}
                        </div>

                        {/* Excerpt */}
                        <div>
                            <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                            <Textarea id="excerpt" rows={3} {...register('excerpt')} placeholder="A short summary shown in post listings (10-200 characters)." disabled={isSubmitting} />
                            {errors.excerpt && <p className="text-xs text-destructive mt-1">{errors.excerpt.message}</p>}
                        </div>

                         {/* Image Handling */}
                         <div>
                             <Label htmlFor="image">Featured Image</Label>
                             <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <div className="flex-grow space-y-2">
                                    <Label htmlFor="imageUrl" className="text-sm font-normal">Image URL</Label>
                                    <Input
                                        id="imageUrl"
                                        {...register('imageUrl')}
                                        placeholder="Paste an image URL (e.g., from Unsplash)"
                                        disabled={isSubmitting || !!selectedImage} // Disable if file selected
                                    />
                                     {errors.imageUrl && <p className="text-xs text-destructive mt-1">{errors.imageUrl.message}</p>}
                                </div>
                                <div className="text-center text-sm text-muted-foreground sm:pt-8">OR</div>
                                <div className="flex-grow space-y-2">
                                     <Label htmlFor="imageFile" className="text-sm font-normal">Upload Image (Optional)</Label>
                                     <Input
                                         id="imageFile"
                                         type="file"
                                         accept="image/*"
                                         disabled={isSubmitting}
                                         onChange={handleImageChange}
                                         className="cursor-pointer"
                                     />
                                      <p className="text-xs text-muted-foreground">Upload is currently not implemented. Please use the URL field.</p>
                                </div>
                             </div>
                             {/* Image Preview */}
                             {selectedImage && (
                                 <div className="mt-4">
                                     <p className="text-sm font-medium mb-2">Selected Image Preview:</p>
                                     <img
                                         src={URL.createObjectURL(selectedImage)}
                                         alt="Selected preview"
                                         className="max-h-40 rounded-md shadow-sm object-cover border"
                                     />
                                 </div>
                             )}
                         </div>

                        {/* Tags Input */}
                        <div>
                            <Label htmlFor="tags">Tags (Optional)</Label>
                            <Input id="tags" {...register('tags')} placeholder="Comma-separated tags, e.g., tech, lifestyle, coding" disabled={isSubmitting} />
                            <p className="text-xs text-muted-foreground mt-1">Helps users find your post.</p>
                            {errors.tags && <p className="text-xs text-destructive mt-1">{errors.tags.message}</p>}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting} size="lg">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                {isSubmitting ? 'Publishing...' : 'Publish Post'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
