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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { Skeleton } from '@/components/ui/skeleton';

// Add 'Love' and 'Others' to the categories
const categories = ['Technology', 'Lifestyle', 'Health', 'Travel', 'Love', 'Others'];

const postFormSchema = z.object({
    title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
    category: z.enum(categories as [string, ...string[]], { // Ensure zod knows the enum values
        required_error: "You need to select a post category.",
    }),
    heading: z.string().min(5, { message: 'Heading must be at least 5 characters.' }),
    subheadings: z.array(z.string()).optional(), // Array of subheadings
    paragraphs: z.array(z.string()).optional(), // Array of paragraphs
    // content: z.string().min(50, { message: 'Content must be at least 50 characters.' }),
    excerpt: z.string().min(10).max(200).optional().or(z.literal('')), // Optional or empty string
    // imageUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
    imageUrl: z.string().optional().or(z.literal('')),
    tags: z.string().optional(), // Comma-separated tags
});

type PostFormInputs = z.infer<typeof postFormSchema>;

export default function CreatePostPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { currentUser, loading: authLoading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null); // Store selected image

    const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<PostFormInputs>({
        resolver: zodResolver(postFormSchema),
        defaultValues: {
            title: '',
            category: undefined,
            heading: '',
            subheadings: [],
            paragraphs: [],
            excerpt: '',
            imageUrl: '',
            tags: '',
        },
    });

    React.useEffect(() => {
        // Redirect if not logged in or still loading auth state
        if (!authLoading && !currentUser) {
            toast({ title: "Unauthorized", description: "You must be logged in to create a post.", variant: "destructive" });
            router.push('/login');
        }
    }, [authLoading, currentUser, router, toast]);


    const onSubmit: SubmitHandler<PostFormInputs> = async (data) => {
        if (!currentUser) {
            toast({ title: "Authentication Error", description: "Cannot create post. User not found.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
            const postData = {
                ...data,
                tags: tagsArray,
                requestingUserId: currentUser.id, // Include the user ID for the API
            };

            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });

            const result = await response.json();

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
            setIsSubmitting(false);
        }
    };

    if (authLoading || !currentUser) {
        // Show a loading skeleton or similar while checking auth/redirecting
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            // Set image URL to empty string, to prevent validation error for URL format
            setValue('imageUrl', '', { shouldValidate: true });
        } else {
            setSelectedImage(null);
        }
    };

    return (
        <div className="container mx-auto py-12">
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl">Create New Blog Post</CardTitle>
                    <CardDescription>Fill in the details below to publish a new post.</CardDescription>
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
                            {/* Need to use Controller for ShadCN Select with RHF */}
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

                        {/* Structured Content Input */}
                        <div>
                            <Label htmlFor="heading">Main Heading</Label>
                            <Input id="heading" {...register('heading')} disabled={isSubmitting} />
                            {errors.heading && <p className="text-xs text-destructive mt-1">{errors.heading.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="subheadings">Subheadings (Optional, comma-separated)</Label>
                            <Input id="subheadings"
                                placeholder="e.g., Introduction, Main Points, Conclusion"
                                disabled={isSubmitting}
                                {...register('subheadings', {
                                    setValueAs: (value) => value ? value.split(',').map(s => s.trim()) : []
                                })}
                            />
                            {errors.subheadings && <p className="text-xs text-destructive mt-1">{errors.subheadings.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="paragraphs">Paragraphs (Optional, separate each with a newline)</Label>
                            <Textarea id="paragraphs"
                                rows={5}
                                placeholder="Write your blog post content here..."
                                disabled={isSubmitting}
                                {...register('paragraphs', {
                                    setValueAs: (value) => value ? value.split('\n').map(p => p.trim()).filter(p => p) : []
                                })}
                            />
                            {errors.paragraphs && <p className="text-xs text-destructive mt-1">{errors.paragraphs.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                            <Textarea id="excerpt" rows={3} {...register('excerpt')} placeholder="A short summary of the post (10-200 characters)." disabled={isSubmitting} />
                            {errors.excerpt && <p className="text-xs text-destructive mt-1">{errors.excerpt.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="imageUrl">Image</Label>
                            {/* Image Upload */}
                            <Input
                                id="imageUrl"
                                type="file"
                                accept="image/*"
                                disabled={isSubmitting}
                                onChange={handleImageChange}
                            />
                            {/* Display Selected Image */}
                            {selectedImage && (
                                <div className="mt-2">
                                    <img
                                        src={URL.createObjectURL(selectedImage)}
                                        alt="Selected"
                                        className="max-h-40 rounded-md shadow-sm"
                                    />
                                </div>
                            )}
                            {errors.imageUrl && <p className="text-xs text-destructive mt-1">{errors.imageUrl.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
                            <Input id="tags" {...register('tags')} placeholder="e.g., tech, lifestyle, tips" disabled={isSubmitting} />
                            {errors.tags && <p className="text-xs text-destructive mt-1">{errors.tags.message}</p>}
                        </div>


                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
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
