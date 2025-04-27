
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Import useRouter
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; // Removed CardHeader, CardTitle
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, User, MessageSquare, Send, CornerUpLeft, Star, ThumbsUp, Share2, Facebook, Twitter, Linkedin, Eye, Edit, Trash2 } from 'lucide-react'; // Added Edit, Trash2 icons
import { format } from 'date-fns';
import BlogPostCard from '@/components/blog-post-card'; // Re-use for related posts
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth/authContext'; // Import useAuth
import type { Author, Comment, Post, RelatedPost } from '@/types/blog'; // Import types


// Mock Data - Replace with actual data fetching functions using /api routes

// Helper function to create mock post data (already exists, ensure it aligns with Post type)
const fetchPostDetails = async (slug: string): Promise<Post | null> => {
  console.log(`[fetchPostDetails] Fetching post with slug: ${slug}`);
  try {
      const response = await fetch(`/api/posts/${slug}`);
      if (!response.ok) {
          if (response.status === 404) {
              console.log(`[fetchPostDetails] Post not found (404) for slug: ${slug}`);
              return null;
          }
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data: Post = await response.json();
       // Convert date strings to Date objects
       if (data.publishedAt) data.publishedAt = new Date(data.publishedAt);
       if (data.updatedAt) data.updatedAt = new Date(data.updatedAt);
      console.log(`[fetchPostDetails] Post data received for slug: ${slug}`, data);
      return data;
  } catch (error) {
      console.error(`[fetchPostDetails] Error fetching post ${slug}:`, error);
      return null; // Return null on error
  }
};


const fetchComments = async (postId: string): Promise<Comment[]> => {
  console.log(`[fetchComments] Fetching comments for postId: ${postId}`);
    try {
        const response = await fetch(`/api/comments?postId=${postId}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        const commentsData: Comment[] = await response.json();
        // Convert timestamp strings to Date objects
        const parseTimestamps = (comments: Comment[]): Comment[] => {
             return comments.map(comment => ({
                ...comment,
                timestamp: new Date(comment.timestamp),
                replies: comment.replies ? parseTimestamps(comment.replies) : [],
            }));
        }
        return parseTimestamps(commentsData);
    } catch (error) {
        console.error(`[fetchComments] Error fetching comments for ${postId}:`, error);
        return []; // Return empty array on error
    }
};

const fetchRelatedPosts = async (category: string, currentPostSlug: string): Promise<RelatedPost[]> => {
  console.log(`[fetchRelatedPosts] Fetching related posts for category: ${category}, excluding: ${currentPostSlug}`);
    try {
        // Fetch posts from the same category, limit to a few more than needed (e.g., 4)
        // Filtering out the current post will happen client-side
        const response = await fetch(`/api/posts?category=${encodeURIComponent(category)}&limit=4`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        const data: { posts: Post[] } = await response.json(); // Assuming API returns { posts: [...] }

        // Filter out the current post and take the first 3
        const related = data.posts
            .filter(post => post.slug !== currentPostSlug)
            .slice(0, 3)
             // Map to RelatedPost structure if necessary (might already match)
             .map(post => ({
                 ...post,
                  author: { // Ensure only basic author info is included if needed by RelatedPost type
                      id: post.author.id,
                      name: post.author.name,
                      slug: post.author.slug,
                      avatarUrl: post.author.avatarUrl,
                  }
             }));

         console.log(`[fetchRelatedPosts] Found ${related.length} related posts.`);
         return related as RelatedPost[]; // Cast if necessary after mapping

    } catch (error) {
         console.error(`[fetchRelatedPosts] Error fetching related posts for category ${category}:`, error);
         return []; // Return empty array on error
    }
}

// --- Components ---

const PostSkeleton: React.FC = () => (
  <div className="container mx-auto py-8 max-w-4xl">
    <Skeleton className="h-10 w-3/4 mb-4" />
    <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-5 w-16" />
    </div>
    <Skeleton className="h-96 w-full mb-8 rounded-lg" />
    <div className="space-y-4">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
      <Skeleton className="h-6 w-full mt-6" />
       <Skeleton className="h-6 w-full" />
       <Skeleton className="h-6 w-3/4" />
    </div>
     {/* Skeleton for Comments Section */}
      <div className="mt-16 max-w-3xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-20 w-full mb-4" /> {/* Comment Form Skeleton */}
          <Separator className="my-6" />
          <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                 <div key={i} className="flex gap-4 py-4">
                     <Skeleton className="h-10 w-10 rounded-full mt-1" />
                     <div className="flex-1 space-y-2">
                         <Skeleton className="h-4 w-1/4" />
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-3 w-1/2" />
                     </div>
                 </div>
              ))}
         </div>
      </div>
       {/* Skeleton for Related Posts Section */}
       <div className="mt-16">
          <Skeleton className="h-8 w-40 mb-6 mx-auto" />
           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
               {Array.from({ length: 3 }).map((_, i) => (
                   <div key={`skel-rel-${i}`} className="space-y-3">
                       <Skeleton className="h-48 w-full" />
                       <Skeleton className="h-6 w-3/4" />
                       <Skeleton className="h-4 w-full" />
                       <Skeleton className="h-4 w-5/6" />
                        <div className="flex justify-between items-center pt-2">
                           <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                   </div>
               ))}
           </div>
       </div>
  </div>
);

const CommentForm: React.FC<{ postId: string, onCommentSubmit: (comment: Comment) => void, replyTo?: string | null }> = ({ postId, onCommentSubmit, replyTo }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth(); // Get current user

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentUser) {
         if (!currentUser) {
            toast({ title: "Login Required", description: "Please log in to comment.", variant: "destructive" });
         }
        return;
    }

    setIsSubmitting(true);

     const commentData = {
        postId,
        content: content.trim(),
        author: { // Pass author details
             id: currentUser.id,
             name: currentUser.name || currentUser.email, // Use name or fallback to email
             avatarUrl: currentUser.photoURL || undefined // Pass avatar URL if available
         },
         replyTo: replyTo || undefined, // Pass replyTo if it exists
     };


    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commentData),
        });

        if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.error || `Failed to post comment: ${response.statusText}`);
         }

        const newComment: Comment = await response.json();
         newComment.timestamp = new Date(newComment.timestamp); // Ensure timestamp is Date object

        onCommentSubmit(newComment); // Update UI optimistically or after API success
        setContent('');
        toast({
            title: replyTo ? "Reply posted!" : "Comment posted!",
            description: "Your thoughts have been added.",
        });

    } catch (error) {
        console.error("Error posting comment:", error);
        toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to post comment.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 mb-8">
       <Label htmlFor="comment-content" className="sr-only">
         {replyTo ? 'Your Reply' : 'Your Comment'}
       </Label>
      <Textarea
        id="comment-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={replyTo ? "Write your reply..." : (currentUser ? "Add your comment..." : "Log in to leave a comment...")}
        className="mb-2"
        rows={3}
        required
        disabled={isSubmitting || !currentUser}
      />
      <Button type="submit" disabled={isSubmitting || !content.trim() || !currentUser}>
        <Send className="mr-2 h-4 w-4" />
        {isSubmitting ? 'Posting...' : (replyTo ? 'Post Reply' : 'Post Comment')}
      </Button>
       {!currentUser && (
            <p className="text-xs text-muted-foreground mt-2">
               Please <Link href="/login" className="text-primary hover:underline">log in</Link> or <Link href="/signup" className="text-primary hover:underline">sign up</Link> to comment.
            </p>
       )}
    </form>
  );
};

const CommentItem: React.FC<{ comment: Comment, postId: string, onReply: (commentId: string) => void }> = ({ comment, postId, onReply }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [likes, setLikes] = useState(comment.likes || 0);
    const commentTimestamp = typeof comment.timestamp === 'string' ? new Date(comment.timestamp) : comment.timestamp;

    const handleLike = () => {
        // In real app, send like update to API
        setLikes(prev => prev + 1); // Optimistic update
    }

    return (
    <div className="flex gap-4 py-4">
      <Link href={`/authors/${comment.author.slug}`} passHref>
        <Avatar className="h-10 w-10 mt-1 cursor-pointer">
            <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
            <AvatarFallback>{comment.author.name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
           <Link href={`/authors/${comment.author.slug}`} passHref>
              <span className="font-semibold text-sm cursor-pointer hover:text-primary">{comment.author.name || 'Anonymous'}</span>
           </Link>
          <time className="text-xs text-muted-foreground">
             {isValid(commentTimestamp) ? format(commentTimestamp, 'MMM d, yyyy HH:mm') : 'Invalid Date'}
          </time>
        </div>
        <p className="text-sm mb-2">{comment.content}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
           <Button variant="ghost" size="sm" className="h-auto p-0 text-xs hover:text-primary" onClick={handleLike}>
                <ThumbsUp className="mr-1 h-3 w-3" /> {likes > 0 ? likes : ''} Like
           </Button>
           <Button variant="ghost" size="sm" className="h-auto p-0 text-xs hover:text-primary" onClick={() => onReply(comment.id)}>
                <CornerUpLeft className="mr-1 h-3 w-3" /> Reply
           </Button>
           {comment.replies && comment.replies.length > 0 && (
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs hover:text-primary" onClick={() => setShowReplies(!showReplies)}>
                 {showReplies ? 'Hide' : 'Show'} {comment.replies.length} Replies
               </Button>
            )}
        </div>
         {showReplies && comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 pl-6 border-l border-border/50">
                {comment.replies.map(reply => (
                  <CommentItem key={reply.id} comment={reply} postId={postId} onReply={onReply} />
                ))}
              </div>
            )}
      </div>
    </div>
  );
};

// Helper function to check if a date is valid
 function isValid(date: Date) {
   return date instanceof Date && !isNaN(date.getTime());
 }

// --- Main Page Component ---

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // State for delete operation
  const { toast } = useToast();
  const { currentUser } = useAuth(); // Get current user from context

   // Determine if the current user can edit/delete this post
   const canEditOrDelete = currentUser && post && (currentUser.id === post.author.id || currentUser.role === 'admin');


  useEffect(() => {
    if (!slug) return;

    const loadData = async () => {
      setLoading(true);
      setPost(null);
      setComments([]);
      setRelatedPosts([]);
      try {
        const postData = await fetchPostDetails(slug);
        if (postData) {
           setPost(postData);
           // Only fetch comments and related posts if post exists
           const [commentsData, relatedPostsData] = await Promise.all([
             fetchComments(postData.id), // Use postData.id which is guaranteed if postData exists
             fetchRelatedPosts(postData.category, postData.slug) // Pass slug to exclude
           ]);
           setComments(commentsData);
           setRelatedPosts(relatedPostsData);
        } else {
           console.error(`Post not found for slug: ${slug}`);
           toast({
               title: "Post Not Found",
               description: "The requested blog post could not be found.",
               variant: "destructive",
           });
           // Optional: Redirect to 404 or blogs page
           // router.push('/not-found'); // Or router.replace(...)
        }
      } catch (error) {
        console.error("Failed to load post data:", error);
        toast({
            title: "Error Loading Post",
            description: "Could not load post details.",
            variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug, toast, router]); // Add router to dependencies if using it for redirect

  const handleCommentSubmit = (newComment: Comment) => {
      // Add the new comment/reply to the state
      setComments(prevComments => {
          if (replyingTo) {
               const addReply = (commentsList: Comment[]): Comment[] => {
                    return commentsList.map(c => {
                        if (c.id === replyingTo) {
                           return { ...c, replies: [newComment, ...(c.replies || [])] }; // Prepend new reply
                        }
                        if (c.replies && c.replies.length > 0) {
                            return { ...c, replies: addReply(c.replies) };
                        }
                       return c;
                    });
               };
               return addReply(prevComments);
          } else {
               return [newComment, ...prevComments]; // Prepend new top-level comment
          }
       });

      // Clear replying state if it was a reply
      if (replyingTo) {
         setReplyingTo(null);
      }

       // Update comment count display optimistically
        setPost(prevPost => prevPost ? {...prevPost, commentCount: (prevPost.commentCount || 0) + 1} : null);
  };

  const handleStartReply = (commentId: string) => {
        if (!currentUser) {
             toast({ title: "Login Required", description: "Please log in to reply.", variant: "destructive" });
             return;
        }
        setReplyingTo(commentId);
        const commentFormElement = document.getElementById('comment-section');
        commentFormElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

   const handleRatePost = async (rating: number) => {
        if (!post) return;
        console.log(`Rating post ${post.id} with ${rating} stars`);
        toast({
          title: "Rating Submitted",
          description: `You rated this post ${rating} stars.`,
        });
         setPost(prevPost => {
            if (!prevPost) return null;
            const currentRating = prevPost.rating ?? 0;
            const newAvgRating = (currentRating + rating) / 2; // Simple avg for mock
            return {...prevPost, rating: parseFloat(newAvgRating.toFixed(1))}
         });
    };

    // --- Edit and Delete Handlers ---
    const handleEdit = () => {
         if (!canEditOrDelete) return;
         // TODO: Implement navigation to an edit page or open an edit modal
         console.log("Edit button clicked for post:", post?.slug);
         toast({ title: "Edit Functionality", description: "Redirecting to edit page (not implemented yet)." });
         // router.push(`/blogs/${post.slug}/edit`); // Example redirect
     };

     const handleDelete = async () => {
         if (!canEditOrDelete || !post) return;
         setIsDeleting(true);
         console.log("Attempting to delete post:", post.slug);

         try {
             // --- Make API Call to DELETE endpoint ---
             // Get token or necessary headers for authentication if needed
             const headers: HeadersInit = { 'Content-Type': 'application/json' };
             if (currentUser && currentUser.id) {
                 // SIMULATING sending user ID for backend check (Replace with actual auth token)
                 headers['X-Mock-User-ID'] = currentUser.id;
                 console.log(`[Delete Request] Sending mock user ID: ${currentUser.id}`);
             }

             const response = await fetch(`/api/posts/${post.slug}`, {
                 method: 'DELETE',
                 headers: headers,
             });

             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || `Failed to delete post: ${response.statusText}`);
             }

             toast({
                 title: "Post Deleted",
                 description: "The blog post has been successfully deleted.",
             });
             router.push('/blogs'); // Redirect to blogs list after deletion

         } catch (error) {
             console.error("Failed to delete post:", error);
             toast({
                 title: "Delete Failed",
                 description: error instanceof Error ? error.message : "Could not delete the post.",
                 variant: "destructive",
             });
         } finally {
             setIsDeleting(false);
         }
     };
     // --- End Edit and Delete Handlers ---


  if (loading) {
    return <PostSkeleton />;
  }

  if (!post) {
     return (
         <div className="container mx-auto py-16 text-center">
             <h1 className="text-2xl font-semibold text-destructive mb-4">Post Not Found</h1>
             <p className="text-muted-foreground mb-6">
                 Sorry, the post you are looking for does not exist or could not be loaded.
             </p>
             <Button asChild>
                 <Link href="/blogs">Back to Blogs</Link>
             </Button>
         </div>
      );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post.title;
  const postPublishedAt = typeof post.publishedAt === 'string' ? new Date(post.publishedAt) : post.publishedAt;


  return (
    <div className="container mx-auto py-8">
       <article className="max-w-4xl mx-auto">
         <header className="mb-8 relative"> {/* Added relative positioning */}
           <Badge variant="secondary" className="mb-2">{post.category}</Badge>
           <h1 className="text-4xl font-bold tracking-tight mb-4">{post.title}</h1>
           <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
             {/* Author Link */}
             <Link href={`/authors/${post.author.slug}`} className="flex items-center gap-2 hover:text-primary transition-colors">
               <Avatar className="h-8 w-8">
                 <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                 <AvatarFallback>{post.author.name?.charAt(0)?.toUpperCase() || 'A'}</AvatarFallback>
               </Avatar>
               <span>By {post.author.name || 'Unknown Author'}</span>
             </Link>
             {/* Meta Info */}
             <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {isValid(postPublishedAt) ? (
                     <time dateTime={postPublishedAt.toISOString()}>{format(postPublishedAt, 'MMMM d, yyyy')}</time>
                  ) : (
                     <span>Invalid Date</span>
                   )}
             </div>
             <div className="flex items-center gap-1"> <MessageSquare className="h-4 w-4" /> <span>{post.commentCount || 0} Comments</span> </div>
             {post.rating != null && <div className="flex items-center gap-1"> <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> <span>{post.rating.toFixed(1)}</span> </div> }
             {post.views != null && <div className="flex items-center gap-1"> <Eye className="h-4 w-4" /> <span>{post.views} Views</span> </div> }
           </div>

            {/* Edit/Delete Buttons - Conditionally Rendered */}
            {canEditOrDelete && (
                 <div className="absolute top-0 right-0 flex gap-2">
                     <Button variant="outline" size="sm" onClick={handleEdit}>
                         <Edit className="mr-1 h-4 w-4" /> Edit
                     </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                               <Button variant="destructive" size="sm" disabled={isDeleting}>
                                   <Trash2 className="mr-1 h-4 w-4" /> Delete
                               </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                   <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the post
                                      "{post.title}".
                                   </AlertDialogDescription>
                               </AlertDialogHeader>
                              <AlertDialogFooter>
                                   <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                       {isDeleting ? 'Deleting...' : 'Delete Post'}
                                   </AlertDialogAction>
                               </AlertDialogFooter>
                           </AlertDialogContent>
                       </AlertDialog>
                 </div>
             )}


         </header>

         <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
             <Image
               src={post.imageUrl}
               alt={post.title}
               fill
               priority
               sizes="(max-width: 768px) 100vw, 896px"
               className="object-cover"
             />
         </div>

          <div
             className="prose prose-quoteless prose-neutral dark:prose-invert max-w-none"
             dangerouslySetInnerHTML={{ __html: post.content }}
           />

            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                 <span className="font-semibold mr-2">Tags:</span>
                 {post.tags.map(tag => (
                     <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-accent">
                       <Link href={`/tags/${tag}`}>{tag}</Link>
                      </Badge>
                   ))}
              </div>
             )}

           <div className="mt-8 py-4 border-t border-b flex flex-col sm:flex-row items-center justify-center gap-4">
                <span className="text-sm font-medium">Rate this post:</span>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <Button key={star} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-yellow-500" onClick={() => handleRatePost(star)}>
                            <Star className={`h-5 w-5 ${ (post.rating != null && star <= Math.round(post.rating)) ? 'fill-yellow-500 text-yellow-500' : '' }`} />
                        </Button>
                    ))}
                 </div>
           </div>

          {/* Author Box */}
           <Card className="mt-12 mb-8 bg-secondary/50">
             <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
               <Link href={`/authors/${post.author.slug}`} passHref>
                 <Avatar className="h-20 w-20 cursor-pointer">
                   <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                   <AvatarFallback>{post.author.name?.substring(0, 2)?.toUpperCase() || 'AU'}</AvatarFallback>
                 </Avatar>
               </Link>
               <div className="text-center sm:text-left">
                 <Link href={`/authors/${post.author.slug}`} passHref>
                   <h4 className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer">{post.author.name}</h4>
                 </Link>
                 <p className="text-sm text-muted-foreground mt-1 mb-2">{post.author.bio || 'Author bio not available.'}</p>
                 {/* Assuming social links are part of Author type, conditionally render */}
                 {/* {post.author.socialLinks && ( ... )} */}
               </div>
             </CardContent>
           </Card>

           <div className="mt-8 mb-12 p-6 rounded-lg bg-card border text-center">
               <h3 className="text-xl font-semibold mb-3">Enjoyed this post?</h3>
               <p className="text-muted-foreground mb-4">Share it with your friends or subscribe for more content!</p>
               <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                 <Button>Subscribe to Newsletter</Button>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="outline">
                            <Share2 className="mr-2 h-4 w-4" /> Share Post
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                         <DropdownMenuItem onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')} className="cursor-pointer"> <Facebook className="mr-2 h-4 w-4" /> Facebook </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank')} className="cursor-pointer"> <Twitter className="mr-2 h-4 w-4" /> Twitter </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`, '_blank')} className="cursor-pointer"> <Linkedin className="mr-2 h-4 w-4" /> LinkedIn </DropdownMenuItem>
                       </DropdownMenuContent>
                    </DropdownMenu>
               </div>
           </div>
        </article>

         {relatedPosts.length > 0 && (
            <section className="mt-16">
               <h2 className="text-2xl font-bold mb-6 text-center">Related Posts</h2>
               <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((relatedPost) => (
                      // Cast relatedPost to the type expected by BlogPostCard if necessary
                      <BlogPostCard key={relatedPost.id} post={relatedPost as any} />
                    ))}
                </div>
             </section>
         )}

       <section id="comment-section" className="mt-16 max-w-3xl mx-auto">
         <h2 className="text-2xl font-bold mb-6">{post.commentCount || 0} Comments</h2>
         <CommentForm postId={post.id} onCommentSubmit={handleCommentSubmit} replyTo={replyingTo}/>
          {replyingTo && (
                <div className="mb-4 p-2 bg-accent/50 rounded-md text-sm flex justify-between items-center">
                    <span>Replying to comment...</span> {/* Maybe show author name? */}
                     <Button variant="ghost" size="sm" className="h-auto p-1" onClick={() => setReplyingTo(null)}>Cancel Reply</Button>
                </div>
           )}
         <Separator className="my-6" />
         <div className="space-y-4">
           {comments.length > 0 ? (
              comments.map(comment => (
                 <React.Fragment key={comment.id}>
                    <CommentItem comment={comment} postId={post.id} onReply={handleStartReply} />
                    <Separator className="last:hidden" />
                </React.Fragment>
            ))
           ) : (
              <p className="text-muted-foreground text-center py-4">Be the first to comment!</p>
           )}
         </div>
       </section>
    </div>
  );
}
