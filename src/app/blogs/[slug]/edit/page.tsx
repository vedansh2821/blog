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

// Add 'Love' and 'Others' to the categories
const categories = ['Technology', 'Lifestyle', 'Health', 'Travel', 'Love', 'Others'];

const postFormSchema = z.object({
    title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
    category: z.enum(categories as [string, ...string[]], {
        required_error: "You need to select a post category.",
    }),
    heading: z.string().min(5, { message: 'Heading must be at least 5 characters.' }),
    // Ensure these can be strings (from input) or arrays (processed)
    subheadings: z.union([z.string(), z.array(z.string())]).optional(),
    paragraphs: z.union([z.string(), z.array(z.string())]).optional(),
    excerpt: z.string().min(10).max(200).optional().or(z.literal('')), // Optional or empty string
    imageUrl: z.string().optional().or(z.literal('')),
    tags: z.string().optional(), // Comma-separated tags
});

type PostFormInputs = z.infer<typeof postFormSchema>;

// Helper to fetch post details
const fetchPostDetailsForEdit = async (slug: string): Promise<Post | null> => {
    try {
        console.log(`[Edit Page] Fetching post details for slug: ${slug}`);
        const response = await fetch(`/api/posts/${slug}`);
        if (!response.ok) {
            if (response.status === 404) {
                 console.log(`[Edit Page] Post not found (404) for slug: ${slug}`);
                 return null;
             }
            const errorText = await response.text();
            console.error(`[Edit Page] Failed to fetch post data: ${response.status} - ${errorText}`);
            throw new Error('Failed to fetch post data');
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
             } : undefined, // Make sure author is correctly typed or handled if missing
        };
    } catch (error) {
        console.error(`[Edit Page] Error fetching post details for ${slug}:`, error);
        return null;
    }
};


export default function EditPostPage() {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;
    const { currentUser, loading: authLoading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [postData, setPostData] = useState<Post | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false); // Track authorization
    const [selectedImage, setSelectedImage] = useState<File | null>(null); // Store selected image


    const { register, handleSubmit, formState: { errors }, control, reset, setValue } = useForm<PostFormInputs>({
        resolver: zodResolver(postFormSchema),
         defaultValues: { // Add default values
            title: '',
            category: undefined,
            heading: '',
            subheadings: '', // Initialize as string for input
            paragraphs: '',   // Initialize as string for textarea
            excerpt: '',
            imageUrl: '',
            tags: '',
        },
    });

    // Fetch post data and check authorization
    useEffect(() => {
        if (!slug || authLoading) return; // Wait for slug and auth state

        const loadAndAuthorize = async () => {
            setIsLoadingData(true);
            const fetchedPost = await fetchPostDetailsForEdit(slug);

            if (!fetchedPost) {
                toast({ title: "Error", description: "Post not found.", variant: "destructive" });
                router.push('/blogs'); // Redirect if post not found
                return;
            }

            setPostData(fetchedPost);

            // Authorization check
            if (!currentUser) {
                toast({ title: "Unauthorized", description: "You must be logged in to edit posts.", variant: "destructive" });
                router.push('/login');
                return;
            }

            const canEdit = currentUser.role === 'admin' || currentUser.id === fetchedPost.author?.id;
            setIsAuthorized(canEdit);

            if (!canEdit) {
                toast({ title: "Forbidden", description: "You do not have permission to edit this post.", variant: "destructive" });
                router.push(`/blogs/${slug}`); // Redirect back to post view
                return;
            }


            // Pre-fill the form if authorized and post data is loaded
            reset({
                title: fetchedPost.title,
                category: fetchedPost.category as PostFormInputs['category'], // Cast category
                heading: fetchedPost.heading || '', // Provide default empty string
                // Convert arrays to strings for the input fields
                subheadings: fetchedPost.subheadings?.join(', ') || '',
                paragraphs: fetchedPost.paragraphs?.join('\n') || '',
                excerpt: fetchedPost.excerpt || '',
                imageUrl: fetchedPost.imageUrl || '',
                tags: fetchedPost.tags?.join(', ') || '', // Join tags array into string
            });

            setIsLoadingData(false);
        };

        loadAndAuthorize();

    }, [slug, currentUser, authLoading, router, toast, reset]);



    const onSubmit: SubmitHandler<PostFormInputs> = async (data) => {
        if (!currentUser || !postData || !isAuthorized) {
            toast({ title: "Error", description: "Cannot update post. Authorization or data missing.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

            // Process subheadings and paragraphs based on their current type (string from input or array from state)
            const subheadingsArray = typeof data.subheadings === 'string'
                ? (data.subheadings.trim() ? data.subheadings.split(',').map(s => s.trim()).filter(s => s) : [])
                : (Array.isArray(data.subheadings) ? data.subheadings.filter(s => typeof s === 'string' && s.trim()) : []);

            const paragraphsArray = typeof data.paragraphs === 'string'
                ? (data.paragraphs.trim() ? data.paragraphs.split('\n').map(p => p.trim()).filter(p => p) : [])
                : (Array.isArray(data.paragraphs) ? data.paragraphs.filter(p => typeof p === 'string' && p.trim()) : []);


            // Only send fields that are part of the form schema + requestingUserId
            const updatePayload = {
                title: data.title,
                category: data.category,
                heading: data.heading,
                subheadings: subheadingsArray, // Send the processed array
                paragraphs: paragraphsArray,   // Send the processed array
                excerpt: data.excerpt,
                imageUrl: data.imageUrl, // TODO: Handle image upload separately
                tags: tagsArray,
                requestingUserId: currentUser.id, // Include user ID for API authorization
            };

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
            // Redirect back to the updated post page
            router.push(`/blogs/${result.post.slug}`); // Use slug from response if it might change

        } catch (error) {
            console.error('Failed to update post:', error);
            toast({
                title: 'Update Failed',
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
                variant: 'destructive',
            });
            setIsSubmitting(false);
        }
    };

    // Loading state while fetching data or checking auth
    if (isLoadingData || authLoading) {
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
                        <Skeleton className="h-40 w-full" />
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

    // Render nothing or a message if not authorized (should have been redirected, but as fallback)
    if (!isAuthorized) {
        return (
            <div className="container mx-auto py-12 text-center">
                <p className="text-destructive">You are not authorized to edit this post.</p>
            </div>
        );
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            // TODO: Implement image upload logic here (e.g., to Firebase Storage)
            // For now, just clear the imageUrl input if a file is selected
            setValue('imageUrl', '', { shouldValidate: true });
            toast({title: "Image Selected", description: "Image upload functionality not yet implemented. URL field cleared."})
        } else {
            setSelectedImage(null);
        }
    };

    // Render the form once loading is complete and user is authorized
    return (
        <div className="container mx-auto py-12">
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl">Edit Blog Post</CardTitle>
                    <CardDescription>Update the details for your post below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" {...register('title')} disabled={isSubmitting} />
                            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="category">Category</Label>
                            {/* Use Controller or setValue for Select */}
                            <Select
                                defaultValue={postData?.category} // Set default value from fetched data
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

                        {/* Structured Content Input */}
                        <div>
                            <Label htmlFor="heading">Main Heading</Label>
                            <Input id="heading" {...register('heading')} disabled={isSubmitting} />
                            {errors.heading && <p className="text-xs text-destructive mt-1">{errors.heading.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="subheadings">Subheadings (Optional, comma-separated)</Label>
                             <Input
                                id="subheadings"
                                placeholder="e.g., Introduction, Main Points, Conclusion"
                                disabled={isSubmitting}
                                {...register('subheadings')} // Directly register string input
                            />
                            {/* Validation might need adjustment if error expects array */}
                            {errors.subheadings && typeof errors.subheadings.message === 'string' && <p className="text-xs text-destructive mt-1">{errors.subheadings.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="paragraphs">Paragraphs (Optional, separate each with a newline)</Label>
                            <Textarea
                                id="paragraphs"
                                rows={5}
                                placeholder="Write your blog post content here..."
                                disabled={isSubmitting}
                                {...register('paragraphs')} // Directly register string input
                            />
                             {/* Validation might need adjustment if error expects array */}
                            {errors.paragraphs && typeof errors.paragraphs.message === 'string' && <p className="text-xs text-destructive mt-1">{errors.paragraphs.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                             <Textarea id="excerpt" rows={3} {...register('excerpt')} placeholder="A short summary of the post (10-200 characters)." disabled={isSubmitting} />
                            {errors.excerpt && <p className="text-xs text-destructive mt-1">{errors.excerpt.message}</p>}
                        </div>


                        <div>
                            <Label htmlFor="image">Image</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    disabled={isSubmitting}
                                    onChange={handleImageChange}
                                    className="flex-grow"
                                />
                                {postData?.imageUrl && !selectedImage && (
                                     <img src={postData.imageUrl} alt="Current" className="h-16 w-16 object-cover rounded-md" />
                                 )}
                                {selectedImage && (
                                     <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
                                 )}
                                {/* TODO: Add Crop Button/Functionality */}
                                {/* <Button type="button" variant="outline" size="sm" disabled={!selectedImage || isSubmitting}>Crop</Button> */}
                             </div>
                              <p className="text-xs text-muted-foreground mt-1">Upload a new image to replace the existing one. Cropping functionality is not yet implemented.</p>
                             {errors.imageUrl && <p className="text-xs text-destructive mt-1">{errors.imageUrl.message}</p>} {/* Assuming imageUrl validation is still useful */}
                        </div>

                        <div>
                            <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
                            <Input id="tags" {...register('tags')} placeholder="e.g., tech, lifestyle, tips" disabled={isSubmitting} />
                            {errors.tags && <p className="text-xs text-destructive mt-1">{errors.tags.message}</p>}
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
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
