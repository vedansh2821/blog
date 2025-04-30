
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller, type SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Keep for excerpt
// Import the new Quill editor
import QuillEditor from '@/components/rich-text-editor/QuillEditor';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import type { Post } from '@/types/blog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image'; // Use Next Image

const categories = ['Technology', 'Lifestyle', 'Health', 'Travel', 'Love', 'Others'];

// Updated Schema for the edit form: Use QuillEditor for 'content'
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
            content: typeof data.content === 'string' ? data.content : '', // Ensure content is string
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
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null); // Store File object
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    // React Hook Form setup
    const { register, handleSubmit, formState: { errors }, control, reset, setValue, watch } = useForm<PostFormInputs>({
        resolver: zodResolver(postFormSchema),
        defaultValues: {
            title: '',
            category: undefined,
            content: '',
            excerpt: '',
            imageUrl: '',
            tags: '',
        },
    });

    const watchedImageUrl = watch('imageUrl'); // Keep watching URL

    // Effect to load post data and check authorization
    useEffect(() => {
        if (!slug || authLoading) return;

        const loadAndAuthorize = async () => {
            setIsLoadingData(true);
            setIsAuthorized(false);

            const fetchedPost = await fetchPostDetailsForEdit(slug);

            if (!fetchedPost) {
                toast({ title: "Error", description: "Post not found.", variant: "destructive" });
                router.push('/blogs');
                setIsLoadingData(false);
                return;
            }

            setPostData(fetchedPost);
            setImagePreviewUrl(fetchedPost.imageUrl); // Set initial preview

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
                router.push(`/blogs/${slug}`);
                setIsLoadingData(false);
                return;
            }

            reset({
                title: fetchedPost.title || '',
                category: fetchedPost.category as PostFormInputs['category'],
                content: fetchedPost.content || '', // Use content field
                excerpt: fetchedPost.excerpt || '',
                imageUrl: fetchedPost.imageUrl || '',
                tags: fetchedPost.tags?.join(', ') || '',
            });

            setIsLoadingData(false);
        };

        loadAndAuthorize();

    }, [slug, currentUser, authLoading, router, toast, reset]);


    // Effect to update image preview when file or URL changes
    useEffect(() => {
        let objectUrl: string | null = null;
        if (selectedImageFile) {
            objectUrl = URL.createObjectURL(selectedImageFile);
            setImagePreviewUrl(objectUrl);
            setValue('imageUrl', ''); // Clear URL if file is selected
        } else if (watchedImageUrl) {
             try {
                new URL(watchedImageUrl);
                setImagePreviewUrl(watchedImageUrl);
             } catch (_) {
                 // If URL is invalid, revert to original post image or null
                 setImagePreviewUrl(postData?.imageUrl || null);
             }
        } else if (postData?.imageUrl){
            // If URL field is cleared, revert to original post image
            setImagePreviewUrl(postData.imageUrl);
        } else {
            setImagePreviewUrl(null);
        }
        // Clean up
        return () => {
             if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
             }
        };
    }, [selectedImageFile, watchedImageUrl, postData?.imageUrl, setValue]);


    // Function to handle form submission for updates
    const onSubmit: SubmitHandler<PostFormInputs> = async (data) => {
        if (!currentUser || !postData || !isAuthorized) {
            toast({ title: "Error", description: "Cannot update post. Authorization or data missing.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        let finalImageUrl = data.imageUrl; // Start with the URL field value

        try {
            // **Image Upload Logic (Placeholder)**
            if (selectedImageFile) {
                console.warn("Image file selected, but upload functionality is not implemented. Using placeholder image URL.");
                // In a real app, implement upload logic here similar to create-post page
                 // const formData = new FormData();
                 // formData.append('file', selectedImageFile);
                 // ... send formData to upload endpoint ...
                 // finalImageUrl = uploadResult.secure_url;
                 finalImageUrl = postData.imageUrl; // Use original URL as placeholder for now
                 toast({title: "Image Upload Skipped", description: "Using the existing image URL as upload is not implemented."});
            }

            const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

            const updatePayload = {
                title: data.title,
                category: data.category,
                content: data.content, // Content from Quill editor
                excerpt: data.excerpt,
                imageUrl: finalImageUrl,
                tags: tagsArray,
                requestingUserId: currentUser.id,
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
            // Redirect back to the updated post page (using potentially new slug)
            router.push(`/blogs/${result.post.slug}`);

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

    // Function to handle image file selection
    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
             // Optional: Add size/type validation here
             const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
             if (file.size > MAX_FILE_SIZE) {
                  toast({ title: "File Too Large", description: "Image must be less than 5MB.", variant: "destructive" });
                  e.target.value = ''; // Reset file input
                  return;
             }
              if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
                 toast({ title: "Invalid File Type", description: "Please select a JPG, PNG, GIF, or WEBP image.", variant: "destructive" });
                 e.target.value = ''; // Reset file input
                 return;
             }
            setSelectedImageFile(file);
            toast({title: "Image Selected", description: "Image upload function is currently a placeholder."})
        } else {
            setSelectedImageFile(null);
        }
    };

    // Loading state UI
    if (isLoadingData || authLoading) {
        return (
            <div className="container mx-auto py-12">
                <Card className="max-w-4xl mx-auto">
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
                        <div className="flex justify-end space-x-2">
                            <Skeleton className="h-10 w-20" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="container mx-auto py-12 text-center">
                <p className="text-destructive">You are not authorized to edit this post.</p>
            </div>
        );
    }

    // Main component render: Edit form
    return (
        <div className="container mx-auto py-12">
            <Card className="max-w-4xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Edit Blog Post</CardTitle>
                    <CardDescription>Update the details for your post below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" {...register('title')} disabled={isSubmitting} placeholder="Enter a catchy title" />
                            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Select
                                // Use value prop bound to RHF control for dynamic updates
                                // Use Controller if Select doesn't directly support `value` prop update
                                value={watch('category')} // Watch the value for the Select trigger display
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

                         {/* Quill Rich Text Editor */}
                         <div className="space-y-1">
                           <Label htmlFor="content">Content</Label>
                           <Controller
                             name="content"
                             control={control}
                             render={({ field }) => (
                               <QuillEditor // Use QuillEditor
                                 value={field.value}
                                 onChange={field.onChange} // Pass onChange directly
                                 placeholder="Edit your blog post content here..."
                                 readOnly={isSubmitting} // Use readOnly for Quill
                                 className="bg-background" // Ensure background matches
                               />
                             )}
                           />
                           {errors.content && <p className="text-xs text-destructive mt-1">{errors.content.message}</p>}
                         </div>


                        <div>
                            <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                             <Textarea id="excerpt" rows={3} {...register('excerpt')} placeholder="Short summary (10-200 characters). If empty, one will be generated." disabled={isSubmitting} />
                            {errors.excerpt && <p className="text-xs text-destructive mt-1">{errors.excerpt.message}</p>}
                        </div>

                         {/* Image Handling */}
                         <div>
                             <Label>Featured Image</Label>
                             <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <div className="flex-grow space-y-2">
                                    <Label htmlFor="imageUrl" className="text-sm font-normal">Image URL</Label>
                                    <Input
                                        id="imageUrl"
                                        {...register('imageUrl')}
                                        placeholder="Paste an image URL"
                                        disabled={isSubmitting || !!selectedImageFile}
                                    />
                                     {errors.imageUrl && <p className="text-xs text-destructive mt-1">{errors.imageUrl.message}</p>}
                                </div>
                                <div className="text-center text-sm text-muted-foreground sm:pt-8">OR</div>
                                <div className="flex-grow space-y-2">
                                     <Label htmlFor="imageFile" className="text-sm font-normal">Upload Image</Label>
                                     <Input
                                         id="imageFile"
                                         type="file"
                                         accept="image/jpeg,image/png,image/gif,image/webp"
                                         disabled={isSubmitting}
                                         onChange={handleImageFileChange}
                                         className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                     />
                                      <p className="text-xs text-muted-foreground">Max 5MB. JPG, PNG, GIF, WEBP.</p>
                                      {/* TODO: Add Crop Button/Functionality if needed */}
                                </div>
                             </div>
                             {/* Image Preview */}
                              <div className="mt-4">
                                 <p className="text-sm font-medium mb-2">Image Preview:</p>
                                  {imagePreviewUrl ? (
                                      <div className="relative h-40 w-full max-w-xs rounded-md overflow-hidden border">
                                          <Image
                                              src={imagePreviewUrl}
                                              alt="Image preview"
                                              fill
                                              sizes="(max-width: 640px) 100vw, 320px"
                                              className="object-contain"
                                              onError={() => setImagePreviewUrl(postData?.imageUrl || null)} // Revert on error
                                          />
                                      </div>
                                  ) : (
                                      <div className="h-40 w-full max-w-xs rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                          No Image Preview
                                      </div>
                                  )}
                              </div>
                         </div>

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
