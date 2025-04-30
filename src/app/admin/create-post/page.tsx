
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image'; // Use Next Image for preview

const categories = ['Technology', 'Lifestyle', 'Health', 'Travel', 'Love', 'Others'];

// Updated schema: Use QuillEditor for 'content'
const postFormSchema = z.object({
    title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
    category: z.enum(categories as [string, ...string[]], {
        required_error: "You need to select a post category.",
    }),
    content: z.string().refine((value) => {
        // Basic check: Remove HTML tags and check if remaining text meets minimum length
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
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null); // Store the File object
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // State for image preview URL

    const { register, handleSubmit, formState: { errors }, control, setValue, trigger, watch } = useForm<PostFormInputs>({
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

    const watchedContent = watch('content');
    const watchedTitle = watch('title');
    const watchedImageUrl = watch('imageUrl'); // Keep watching URL input
    const watchedCategory = watch('category');
    const watchedExcerpt = watch('excerpt');

    React.useEffect(() => {
        if (!authLoading && !currentUser) {
            toast({ title: "Unauthorized", description: "You must be logged in to create a post.", variant: "destructive" });
            router.push('/login');
        }
    }, [authLoading, currentUser, router, toast]);

    // Effect to update image preview when file or URL changes
    useEffect(() => {
        let objectUrl: string | null = null;
        if (selectedImageFile) {
            objectUrl = URL.createObjectURL(selectedImageFile);
            setImagePreviewUrl(objectUrl);
            setValue('imageUrl', ''); // Clear URL if file is selected
        } else if (watchedImageUrl) {
             try {
                new URL(watchedImageUrl); // Basic validation
                setImagePreviewUrl(watchedImageUrl);
             } catch (_) {
                 setImagePreviewUrl(null); // Invalid URL
             }
        } else {
            setImagePreviewUrl(null); // No image selected or URL provided
        }
        return () => {
             if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
             }
        };
    }, [selectedImageFile, watchedImageUrl, setValue]);


    const onSubmit: SubmitHandler<PostFormInputs> = async (data) => {
        if (!currentUser) {
            toast({ title: "Authentication Error", description: "Cannot create post. User not found.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        let finalImageUrl = data.imageUrl; // Start with the URL field value

        try {
            // **Image Upload Logic (Placeholder)**
            if (selectedImageFile) {
                 console.warn("Image file selected, but upload functionality is not implemented. Using placeholder image URL.");
                 // In a real app:
                 // 1. Create a FormData object
                 // const formData = new FormData();
                 // formData.append('file', selectedImageFile);
                 // formData.append('upload_preset', 'your_cloudinary_preset'); // Example for Cloudinary
                 //
                 // 2. Send to your image upload endpoint or service (e.g., Cloudinary, S3)
                 // const uploadResponse = await fetch('YOUR_UPLOAD_ENDPOINT', {
                 //    method: 'POST',
                 //    body: formData,
                 // });
                 // const uploadResult = await uploadResponse.json();
                 // if (!uploadResponse.ok) throw new Error(uploadResult.error?.message || 'Image upload failed');
                 // finalImageUrl = uploadResult.secure_url; // Get the URL from the upload service
                 // console.log("Uploaded Image URL:", finalImageUrl);

                 // Using placeholder for now since upload isn't implemented
                 finalImageUrl = `https://picsum.photos/seed/${Date.now()}/1200/600`;
                 toast({title: "Image Upload Skipped", description: "Using a placeholder image URL as upload is not implemented."});
            }


            const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

            const postData = {
                title: data.title,
                category: data.category,
                content: data.content, // Content from Quill editor
                excerpt: data.excerpt,
                imageUrl: finalImageUrl, // Use the final URL (either from input or upload)
                tags: tagsArray,
                requestingUserId: currentUser.id,
            };


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
                console.error("[Create Post] Failed Request Payload:", postData);
                throw new Error(errorMsg);
            }

            toast({
                title: 'Post Created!',
                description: `Your post "${result.title}" has been published.`,
            });
            router.push(`/blogs/${result.slug}`);

        } catch (error) {
            console.error('Failed to create post:', error);
            toast({
                title: 'Creation Failed',
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
                variant: 'destructive',
            });
            setIsSubmitting(false);
        }
    };


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
            // Don't need to clear URL here, effect handles precedence
             toast({title: "Image Selected", description: "Image upload function is currently a placeholder."})
        } else {
            setSelectedImageFile(null);
        }
    };

    // Loading state UI
    if (authLoading || currentUser === undefined) {
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
                        <div className="flex justify-end">
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12">
            <Card className="max-w-4xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Create New Blog Post</CardTitle>
                    <CardDescription>Fill in the details below to publish a new post.</CardDescription>
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
                                 placeholder="Write your blog post here..."
                                 readOnly={isSubmitting} // Use readOnly for Quill
                                 className="bg-background" // Ensure background matches
                               />
                             )}
                           />
                            {errors.content && <p className="text-xs text-destructive mt-1">{errors.content.message}</p>}
                         </div>

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
                                        placeholder="Paste an image URL"
                                        disabled={isSubmitting || !!selectedImageFile} // Disable if file selected
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
                                     {/* <Button type="button" variant="outline" size="sm" disabled={!selectedImageFile || isSubmitting}>Crop Image (Not Implemented)</Button> */}
                                </div>
                             </div>
                             {/* Image Preview */}
                              <div className="mt-4">
                                 <p className="text-sm font-medium mb-2">Image Preview:</p>
                                 {imagePreviewUrl ? (
                                     <div className="relative h-40 w-full max-w-xs rounded-md overflow-hidden border">
                                         <Image
                                             src={imagePreviewUrl}
                                             alt="Selected preview"
                                             fill
                                             sizes="(max-width: 640px) 100vw, 320px" // Adjust sizes as needed
                                             className="object-contain" // Use contain to show full image
                                             onError={() => setImagePreviewUrl(null)}
                                         />
                                     </div>
                                  ) : (
                                      <div className="h-40 w-full max-w-xs rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                          No Image Selected
                                      </div>
                                  )}
                             </div>
                         </div>

                        <div>
                            <Label htmlFor="tags">Tags (Optional)</Label>
                            <Input id="tags" {...register('tags')} placeholder="Comma-separated tags, e.g., tech, lifestyle" disabled={isSubmitting} />
                            <p className="text-xs text-muted-foreground mt-1">Helps users find your post.</p>
                            {errors.tags && <p className="text-xs text-destructive mt-1">{errors.tags.message}</p>}
                        </div>

                        <Separator className="my-8" />

                        {/* Live Post Card Preview */}
                         <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Eye className="h-5 w-5 text-muted-foreground" /> Post Card Preview
                            </h3>
                             <Card className="bg-muted/30 p-0 w-full max-w-sm overflow-hidden"> {/* Adjust padding */}
                                <CardContent className="p-0">
                                    {/* Preview Image */}
                                     <div className="relative h-48 w-full bg-muted flex items-center justify-center text-muted-foreground">
                                        {imagePreviewUrl ? (
                                             <Image
                                                src={imagePreviewUrl}
                                                alt="Preview"
                                                fill
                                                sizes="384px" // Match max-w-sm
                                                className="object-cover"
                                                onError={(e) => e.currentTarget.style.display='none'}
                                            />
                                         ) : (
                                             <span>Image Preview</span>
                                         )}
                                         {watchedCategory && <span className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-semibold z-10">{watchedCategory}</span>}
                                     </div>

                                     {/* Preview Title */}
                                     <div className="p-4 pb-2">
                                         <h4 className="text-lg font-semibold mb-1 leading-tight line-clamp-2">
                                            {watchedTitle || <span className="text-muted-foreground">Title preview...</span>}
                                         </h4>
                                         {/* Preview Excerpt */}
                                         <p className="text-sm text-muted-foreground line-clamp-3">
                                             {watchedExcerpt || <span className="italic">Excerpt preview...</span>}
                                         </p>
                                     </div>

                                     {/* Basic Meta Preview */}
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground px-4 pb-4 border-t pt-3 mt-3">
                                         <Skeleton className="h-5 w-5 rounded-full" />
                                         <span className="text-xs">{currentUser?.name || 'Author'}</span>
                                         <span>·</span>
                                         <span className="text-xs">Just now</span>
                                      </div>
                                 </CardContent>
                             </Card>
                         </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4 border-t mt-8">
                            {/* TODO: Add Save Draft button later */}
                            {/* <Button type="button" variant="outline" className="mr-2" disabled={isSubmitting}>Save Draft</Button> */}
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
