
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import type { Post } from '@/types/blog';
import { Skeleton } from '@/components/ui/skeleton';

// Ensure categories match those used elsewhere
const categories = ['Technology', 'Lifestyle', 'Health', 'Travel', 'Love', 'Others'];

// Updated Schema for the edit form: Use 'content' instead of structured fields
const postFormSchema = z.object({
    title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
    category: z.enum(categories as [string, ...string[]], {
        required_error: "You need to select a post category.",
    }),
    content: z.string().min(50, { message: 'Content must be at least 50 characters.' }), // Main content field
    excerpt: z.string().min(10).max(200, { message: 'Excerpt must be between 10 and 200 characters.' }).optional().or(z.literal('')),
    imageUrl: z.string().url({ message: 'Please enter a valid image URL.' }).optional().or(z.literal('')),
    tags: z.string().optional(), // Comma-separated tags
});

type PostFormInputs = z.infer<typeof postFormSchema>;

// Helper to fetch post details specifically for editing
const fetchPostDetailsForEdit = async (slug: string): Promise<Post | null> => {
    try {
        console.log(`[Edit Page] Fetching post details for slug: ${slug}`);
        const response = await fetch(`/api/posts/${slug}`);
        if (!response.ok) {
            const errorText = await response.text().catch(() => `Status: ${response.status}`);
            console.error(`[Edit Page] Failed to fetch post data for ${slug}: ${errorText}`);
            return null;
        }
        const data = await response.json();
        console.log(`[Edit Page] Post data fetched successfully for ${slug}`);
        // Convert date strings to Date objects before returning
        return {
            ...data,
            publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
            author: data.author ? {
                 ...data.author,
                 joinedAt: data.author.joinedAt ? new Date(data.author.joinedAt) : undefined,
             } : undefined,
            // Ensure content is a string, even if fetched data is structured
            content: typeof data.content === 'string' ? data.content : (data.paragraphs?.join('\n') || ''),
        };
    } catch (error) {
        console.error(`[Edit Page] Error fetching post details for ${slug}:`, error);
        return null;
    }
};

// Edit Post Page Component
export default function EditPostPage() {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;
    const { currentUser, loading: authLoading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [postData, setPostData] = useState<Post | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    // React Hook Form setup
    const { register, handleSubmit, formState: { errors }, control, reset, setValue } = useForm<PostFormInputs>({
        resolver: zodResolver(postFormSchema),
        defaultValues: { // Initialize with empty strings or undefined
            title: '',
            category: undefined,
            content: '', // Use content field
            excerpt: '',
            imageUrl: '',
            tags: '',
        },
    });

    // Effect to load post data and check authorization
    useEffect(() => {
        if (!slug || authLoading) return; // Wait for slug and auth state

        const loadAndAuthorize = async () => {
            setIsLoadingData(true);
            setIsAuthorized(false); // Reset authorization state

            const fetchedPost = await fetchPostDetailsForEdit(slug);

            if (!fetchedPost) {
                toast({ title: "Error", description: "Post not found.", variant: "destructive" });
                router.push('/blogs'); // Redirect if post not found
                setIsLoadingData(false);
                return;
            }

            setPostData(fetchedPost);

            // Authorization check
            if (!currentUser) {
                toast({ title: "Unauthorized", description: "You must be logged in to edit posts.", variant: "destructive" });
                router.push('/login');
                setIsLoadingData(false);
                return;
            }

            const canEdit = currentUser.role === 'admin' || currentUser.id === fetchedPost.author?.id;
            setIsAuthorized(canEdit);

            if (!canEdit) {
                toast({ title: "Forbidden", description: "You do not have permission to edit this post.", variant: "destructive" });
                router.push(`/blogs/${slug}`); // Redirect back to post view
                setIsLoadingData(false);
                return;
            }

            // Pre-fill the form if authorized and post data is loaded
            reset({
                title: fetchedPost.title || '',
                category: fetchedPost.category as PostFormInputs['category'], // Cast category
                content: fetchedPost.content || '', // Use content field
                excerpt: fetchedPost.excerpt || '',
                imageUrl: fetchedPost.imageUrl || '',
                tags: fetchedPost.tags?.join(', ') || '', // Convert tags array back to string
            });

            setIsLoadingData(false);
        };

        loadAndAuthorize();

    }, [slug, currentUser, authLoading, router, toast, reset]);

    // Function to handle form submission for updates
    const onSubmit: SubmitHandler<PostFormInputs> = async (data) => {
        if (!currentUser || !postData || !isAuthorized) {
            toast({ title: "Error", description: "Cannot update post. Authorization or data missing.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            // Process tags from string input to array
            const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

            // Construct the payload for the API update - send 'content' directly
            const updatePayload = {
                title: data.title,
                category: data.category,
                content: data.content, // Send the content from the textarea
                excerpt: data.excerpt,
                imageUrl: data.imageUrl, // Handle image upload separately if needed
                tags: tagsArray,
                requestingUserId: currentUser.id, // Include user ID for API authorization
            };

            // TODO: Implement image upload logic if selectedImage exists
            if (selectedImage) {
                 console.warn("Image file selected, but upload functionality is not implemented. Using URL field if provided.");
                 // In a real app:
                 // const uploadedImageUrl = await uploadImage(selectedImage);
                 // updatePayload.imageUrl = uploadedImageUrl;
            }

            console.log(`[Edit Page] Sending update payload for slug ${slug}:`, updatePayload);

            const response = await fetch(`/api/posts/${slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload),
            });

            const result = await response.json();
            console.log(`[Edit Page] API response for update:`, result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update post');
            }

            toast({
                title: 'Post Updated!',
                description: `The post "${result.post.title}" has been saved.`,
            });
            // Redirect back to the updated post page (using the potentially new slug from response)
            router.push(`/blogs/${result.post.slug}`);

        } catch (error) {
            console.error('Failed to update post:', error);
            toast({
                title: 'Update Failed',
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
            setValue('imageUrl', '', { shouldValidate: true });
            toast({title: "Image Selected", description: "Image upload not implemented. URL field cleared. Provide a URL instead."});
        } else {
            setSelectedImage(null);
        }
    };

    // Loading state UI
    if (isLoadingData || authLoading) {
        return (
            <div className="container mx-auto py-12">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                         {/* Match skeleton structure to form fields */}
                         <Skeleton className="h-10 w-full" /> {/* Title */}
                         <Skeleton className="h-10 w-full" /> {/* Category */}
                         <Skeleton className="h-64 w-full" /> {/* Content */}
                         <Skeleton className="h-20 w-full" /> {/* Excerpt */}
                         <Skeleton className="h-24 w-full" /> {/* Image */}
                         <Skeleton className="h-10 w-full" /> {/* Tags */}
                        <div className="flex justify-end space-x-2">
                            <Skeleton className="h-10 w-20" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Render message or redirect if not authorized
    if (!isAuthorized) {
        // The redirect should handle this, but keep a fallback message
        return (
            <div className="container mx-auto py-12 text-center">
                <p className="text-destructive">You are not authorized to edit this post.</p>
            </div>
        );
    }

    // Main component render: Edit form
    return (
        <div className="container mx-auto py-12">
            <Card className="max-w-3xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Edit Blog Post</CardTitle>
                    <CardDescription>Update the details for your post below.</CardDescription>
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
                                // Set default value using defaultValue prop on Select
                                defaultValue={postData?.category}
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

                        {/* Content Textarea */}
                        <div>
                            <Label htmlFor="content">Content</Label>
                            <Textarea id="content"
                                rows={15} // Increased rows
                                placeholder="Write your blog content here. You can use Markdown or basic HTML for formatting."
                                disabled={isSubmitting}
                                {...register('content')}
                            />
                            <p className="text-xs text-muted-foreground mt-1">The main body of your post.</p>
                            {errors.content && <p className="text-xs text-destructive mt-1">{errors.content.message}</p>}
                        </div>


                        {/* Excerpt */}
                        <div>
                            <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                             <Textarea id="excerpt" rows={3} {...register('excerpt')} placeholder="Short summary (10-200 characters). If empty, one will be generated." disabled={isSubmitting} />
                            {errors.excerpt && <p className="text-xs text-destructive mt-1">{errors.excerpt.message}</p>}
                        </div>

                         {/* Image Handling */}
                         <div>
                             <Label>Featured Image</Label>
                             <div className="flex flex-col gap-4">
                                 {/* Current/Selected Image Preview */}
                                 <div className="flex items-center gap-4">
                                     <Label htmlFor="imageUrl" className="text-sm font-normal w-20 shrink-0">Current URL</Label>
                                     <Input
                                         id="imageUrl"
                                         {...register('imageUrl')}
                                         placeholder="Paste image URL"
                                         className="flex-grow"
                                         disabled={isSubmitting || !!selectedImage}
                                     />
                                      {(postData?.imageUrl && !selectedImage) && (
                                         <img src={postData.imageUrl} alt="Current" className="h-16 w-16 object-cover rounded-md border" />
                                     )}
                                      {selectedImage && (
                                         <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="h-16 w-16 object-cover rounded-md border" />
                                      )}
                                 </div>
                                 {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl.message}</p>}

                                  {/* Image Upload Option */}
                                 <div className="flex items-center gap-4">
                                      <Label htmlFor="imageFile" className="text-sm font-normal w-20 shrink-0">Upload New</Label>
                                     <Input
                                         id="imageFile"
                                         type="file"
                                         accept="image/*"
                                         disabled={isSubmitting}
                                         onChange={handleImageChange}
                                         className="cursor-pointer flex-grow"
                                     />
                                 </div>
                                  <p className="text-xs text-muted-foreground">Upload & Crop functionality is not yet implemented. Use the URL field above.</p>
                                  {/* TODO: Add Crop Button/Functionality */}
                                  {/* <Button type="button" variant="outline" size="sm" disabled={!selectedImage || isSubmitting}>Crop Image (Not Implemented)</Button> */}
                             </div>
                         </div>


                        {/* Tags Input */}
                        <div>
                            <Label htmlFor="tags">Tags (Optional)</Label>
                            <Input id="tags" {...register('tags')} placeholder="Comma-separated tags, e.g., tech, tips" disabled={isSubmitting} />
                             <p className="text-xs text-muted-foreground mt-1">Helps categorize your post.</p>
                            {errors.tags && <p className="text-xs text-destructive mt-1">{errors.tags.message}</p>}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} size="lg">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
