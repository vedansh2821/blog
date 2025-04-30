
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller, type SubmitHandler, useWatch } from 'react-hook-form'; // Added useWatch
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Keep for excerpt
import RichTextEditor from '@/components/rich-text-editor/RichTextEditor'; // Import the new editor
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle, Eye } from 'lucide-react'; // Added Eye icon
import { useAuth } from '@/lib/auth/authContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils'; // Import cn
import { Separator } from '@/components/ui/separator'; // Import Separator

// Ensure categories match those used in mock-sql or fetched dynamically
const categories = ['Technology', 'Lifestyle', 'Health', 'Travel', 'Love', 'Others'];

// Updated schema: Use RichTextEditor for 'content'
const postFormSchema = z.object({
    title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
    category: z.enum(categories as [string, ...string[]], {
        required_error: "You need to select a post category.",
    }),
    content: z.string().refine((value) => {
        const textContent = value.replace(/<[^>]*>/g, '').trim();
        return textContent.length >= 50;
    }, {
        message: 'Content must contain at least 50 characters of text.',
    }),
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
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // State for image preview URL

    const { register, handleSubmit, formState: { errors }, control, setValue, trigger, watch } = useForm<PostFormInputs>({ // Added watch
        resolver: zodResolver(postFormSchema),
        defaultValues: {
            title: '',
            category: undefined,
            content: '', // Initialize content
            excerpt: '',
            imageUrl: '',
            tags: '',
        },
    });

    // Watch form values for the preview
    const watchedContent = watch('content');
    const watchedTitle = watch('title');
    const watchedImageUrl = watch('imageUrl');

    // Effect for redirecting unauthorized users
    React.useEffect(() => {
        if (!authLoading && !currentUser) {
            toast({ title: "Unauthorized", description: "You must be logged in to create a post.", variant: "destructive" });
            router.push('/login');
        }
    }, [authLoading, currentUser, router, toast]);

    // Effect to update image preview when file or URL changes
    useEffect(() => {
        if (selectedImage) {
            const objectUrl = URL.createObjectURL(selectedImage);
            setImagePreviewUrl(objectUrl);
            // Clean up the object URL when the component unmounts or the image changes
            return () => URL.revokeObjectURL(objectUrl);
        } else if (watchedImageUrl) {
             // Very basic URL validation for preview
             try {
                new URL(watchedImageUrl);
                setImagePreviewUrl(watchedImageUrl);
             } catch (_) {
                 setImagePreviewUrl(null); // Invalid URL
             }
        } else {
            setImagePreviewUrl(null); // No image selected or URL provided
        }
    }, [selectedImage, watchedImageUrl]);

    // Function to handle form submission
    const onSubmit: SubmitHandler<PostFormInputs> = async (data) => {
        if (!currentUser) {
            toast({ title: "Authentication Error", description: "Cannot create post. User not found.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Process tags from string input to array
            const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

            // Construct the payload for the API - send 'content' directly
            const postData = {
                title: data.title,
                category: data.category,
                content: data.content, // Send the content from the editor
                excerpt: data.excerpt,
                imageUrl: data.imageUrl, // Image URL takes precedence if file not handled
                tags: tagsArray,
                requestingUserId: currentUser.id, // Include the user ID for the API auth
            };

            // TODO: Implement image upload logic if selectedImage exists
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
                const errorMsg = result.error || 'Failed to create post';
                console.error(`[Create Post] API Error: ${response.status} - ${errorMsg}`);
                 // Log request payload on error for debugging
                console.error("[Create Post] Failed Request Payload:", postData);
                throw new Error(errorMsg);
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
                <Card className="max-w-4xl mx-auto"> {/* Increased max-width */}
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-10 w-full" /> {/* Title */}
                        <Skeleton className="h-10 w-full" /> {/* Category */}
                        <Skeleton className="h-64 w-full" /> {/* Content (Editor) */}
                        <Skeleton className="h-20 w-full" /> {/* Excerpt */}
                        <Skeleton className="h-24 w-full" /> {/* Image */}
                        <Skeleton className="h-10 w-full" /> {/* Tags */}
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
            <Card className="max-w-4xl mx-auto shadow-lg"> {/* Increased max-width */}
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

                        {/* Content Rich Text Editor */}
                        <div className="space-y-1">
                           <Label htmlFor="content">Content</Label>
                           <Controller
                             name="content"
                             control={control}
                             render={({ field }) => (
                               <RichTextEditor
                                 value={field.value}
                                 onChange={(value) => {
                                     field.onChange(value);
                                     // Optionally trigger validation on change
                                     // trigger('content');
                                 }}
                                 placeholder="Write your blog post here..."
                                 disabled={isSubmitting}
                               />
                             )}
                           />
                            {errors.content && <p className="text-xs text-destructive mt-1">{errors.content.message}</p>}
                         </div>

                        {/* Excerpt */}
                        <div>
                            <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                            <Textarea id="excerpt" rows={3} {...register('excerpt')} placeholder="A short summary shown in post listings (10-200 characters). If left empty, one will be generated." disabled={isSubmitting} />
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
                                      <p className="text-xs text-muted-foreground">Upload & Crop is currently not implemented. Please use the URL field.</p>
                                       {/* TODO: Add Crop Button/Functionality */}
                                       {/* <Button type="button" variant="outline" size="sm" disabled={!selectedImage || isSubmitting}>Crop Image</Button> */}
                                </div>
                             </div>
                             {/* Image Preview (using state variable) */}
                              <div className="mt-4">
                                 <p className="text-sm font-medium mb-2">Image Preview:</p>
                                 {imagePreviewUrl ? (
                                     <img
                                         src={imagePreviewUrl}
                                         alt="Selected preview"
                                         className="max-h-40 w-auto rounded-md shadow-sm object-contain border"
                                         onError={() => setImagePreviewUrl(null)} // Clear preview if URL is broken
                                     />
                                  ) : (
                                      <div className="h-40 w-full max-w-xs rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                          No Image Preview
                                      </div>
                                  )}
                             </div>
                         </div>

                        {/* Tags Input */}
                        <div>
                            <Label htmlFor="tags">Tags (Optional)</Label>
                            <Input id="tags" {...register('tags')} placeholder="Comma-separated tags, e.g., tech, lifestyle, coding" disabled={isSubmitting} />
                            <p className="text-xs text-muted-foreground mt-1">Helps users find your post.</p>
                            {errors.tags && <p className="text-xs text-destructive mt-1">{errors.tags.message}</p>}
                        </div>

                        <Separator className="my-8" />

                        {/* Live Preview Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Eye className="h-5 w-5 text-muted-foreground" /> Live Preview
                            </h3>
                            <Card className="bg-muted/30 p-4 min-h-[200px]">
                                <CardContent className="p-0">
                                    {watchedImageUrl && (
                                        <div className="relative w-full h-48 mb-4 rounded overflow-hidden">
                                             <img
                                                 src={watchedImageUrl}
                                                 alt="Preview"
                                                 className="absolute inset-0 w-full h-full object-cover"
                                                 onError={(e) => e.currentTarget.style.display='none'} // Hide if broken
                                             />
                                        </div>
                                    )}
                                    {watchedTitle && <h1 className="text-2xl font-bold mb-4">{watchedTitle}</h1>}
                                    {watchedContent ? (
                                        <div
                                            className="prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: watchedContent }}
                                        />
                                    ) : (
                                        <p className="text-muted-foreground italic">Content preview will appear here...</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>


                        {/* Submit Button */}
                        <div className="flex justify-end pt-4 border-t mt-8">
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
```