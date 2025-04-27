
'use client';

import React, { useState, useEffect } from 'react';
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
import { format, isValid } from 'date-fns';
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
       // Convert date strings to Date objects safely
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
  // Replace with API call: /api/comments?postId=...
   try {
       const response = await fetch(`/api/comments?postId=${postId}`);
       if (!response.ok) {
           throw new Error(`API Error: ${response.status} ${response.statusText}`);
       }
       const data: Comment[] = await response.json();
       // Convert timestamps
       return data.map(comment => ({
            ...comment,
            timestamp: new Date(comment.timestamp),
            replies: (comment.replies || []).map(reply => ({
                ...reply,
                timestamp: new Date(reply.timestamp),
            }))
       })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
   } catch (error) {
       console.error(`[fetchComments] Error fetching comments for post ${postId}:`, error);
       return []; // Return empty array on error
   }
};

const fetchRelatedPosts = async (category: string, currentPostId: string): Promise<RelatedPost[]> => {
   // Replace with API call: /api/posts?category=...&limit=3&excludeId=...
   try {
       const response = await fetch(`/api/posts?category=${encodeURIComponent(category)}&limit=3&excludeId=${currentPostId}`);
       if (!response.ok) {
           throw new Error(`API Error: ${response.status} ${response.statusText}`);
       }
       const data: { posts: Post[] } = await response.json(); // API returns { posts: [...] } structure

       // Ensure data.posts is an array before mapping
       const posts = Array.isArray(data.posts) ? data.posts : [];

       // Map to RelatedPost type, converting dates
       return posts
           .map(p => ({
               id: p.id,
               title: p.title,
               slug: p.slug,
               excerpt: p.excerpt,
               imageUrl: p.imageUrl,
               category: p.category,
               author: { // Map only necessary author fields
                   id: p.author.id,
                   name: p.author.name,
                   avatarUrl: p.author.avatarUrl,
                   slug: p.author.slug,
               },
               publishedAt: new Date(p.publishedAt), // Convert date
               commentCount: p.commentCount,
           })) as RelatedPost[]; // Assert type if confident in mapping

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
    };

    setIsSubmitting(true);

    const commentData = {
        postId: postId,
        content: content,
        replyTo: replyTo || undefined, // Send undefined if null
        author: { // Send necessary author info
             id: currentUser.id,
             name: currentUser.name,
             avatarUrl: currentUser.photoURL,
             slug: currentUser.id // Assuming slug is ID for author links
         }
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
          // Convert timestamp back to Date object after receiving from API
          newComment.timestamp = new Date(newComment.timestamp);

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
              description: error instanceof Error ? error.message : "Could not post comment.",
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
        placeholder={replyTo ? "Write your reply..." : "Add your comment..."}
        className="mb-2"
        rows={3}
        required
        disabled={isSubmitting || !currentUser} // Disable if not logged in
      />
      <Button type="submit" disabled={isSubmitting || !content.trim() || !currentUser}>
        <Send className="mr-2 h-4 w-4" />
        {isSubmitting ? 'Posting...' : (replyTo ? 'Post Reply' : 'Post Comment')}
      </Button>
       {!currentUser && <p className="text-xs text-muted-foreground mt-2">Please <Link href="/login" className="underline">log in</Link> to comment.</p>}
    </form>
  );
};

const CommentItem: React.FC<{ comment: Comment, postId: string, onReply: (commentId: string) => void }> = ({ comment, postId, onReply }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [likes, setLikes] = useState(comment.likes || 0);

    const handleLike = () => {
        // TODO: In real app, send like update to API (e.g., PUT /api/comments/{comment.id}/like)
        setLikes(prev => prev + 1); // Optimistic update
    }

     const commentTimestamp = comment.timestamp instanceof Date ? comment.timestamp : new Date(comment.timestamp);


    return (
    <div className="flex gap-4 py-4">
       {/* Link author avatar/name to author page */}
       <Link href={`/authors/${comment.author.slug || comment.author.id}`} passHref>
           <Avatar className="h-10 w-10 mt-1 cursor-pointer">
              <AvatarImage src={comment.author.avatarUrl || undefined} alt={comment.author.name || 'User'} />
              <AvatarFallback>{comment.author.name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
           </Avatar>
       </Link>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
            <Link href={`/authors/${comment.author.slug || comment.author.id}`} passHref>
               <span className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer">{comment.author.name || 'Anonymous'}</span>
           </Link>
           {/* Ensure timestamp is valid before formatting */}
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
             fetchComments(postData.id),
             fetchRelatedPosts(postData.category, postData.id)
           ]);
           setComments(commentsData);
           setRelatedPosts(relatedPostsData);
        } else {
           console.error(`Post not found for slug: ${slug}`); // Log error instead of toast here
           // Let the component render the "not found" message below
           // Optional: Redirect to 404 or blogs page after a delay?
           // setTimeout(() => router.push('/not-found'), 1000);
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
      // If it's a reply
      if (replyingTo) {
          setComments(prevComments => {
              const addReply = (commentsList: Comment[]): Comment[] => {
                  return commentsList.map(c => {
                      if (c.id === replyingTo) {
                          return { ...c, replies: [...(c.replies || []), newComment] };
                      }
                      if (c.replies && c.replies.length > 0) {
                          return { ...c, replies: addReply(c.replies) };
                      }
                      return c;
                  });
              };
              return addReply(prevComments);
          });
          setReplyingTo(null); // Clear replying state
      } else {
          // If it's a top-level comment
         setComments(prevComments => [newComment, ...prevComments]);
      }
       // Update comment count display optimistically
        setPost(prevPost => prevPost ? {...prevPost, commentCount: (prevPost.commentCount || 0) + 1} : null);
  };

  const handleStartReply = (commentId: string) => {
        setReplyingTo(commentId);
        const commentFormElement = document.getElementById('comment-section');
        commentFormElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

   const handleRatePost = async (rating: number) => {
        if (!post) return;
        console.log(`Rating post ${post.id} with ${rating} stars`);
        // TODO: API call to submit rating PUT /api/posts/{slug}/rate
        toast({
          title: "Rating Submitted",
          description: `You rated this post ${rating} stars. (Feature WIP)`,
        });
         setPost(prevPost => {
            if (!prevPost) return null;
            const currentRating = prevPost.rating ?? 0;
             const currentVotes = prevPost.views ?? 1; // Use views as proxy for votes count
             const newTotalRating = (currentRating * (currentVotes -1) ) + rating;
             const newAvgRating = newTotalRating / currentVotes;
             // Simplistic update for demo
            // const newAvgRating = (currentRating + rating) / 2; // Simple avg for mock
            return {...prevPost, rating: parseFloat(newAvgRating.toFixed(1))}
         });
    };

    // --- Edit and Delete Handlers ---
    const handleEdit = () => {
         if (!canEditOrDelete || !post) return;
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
             // Pass necessary headers (like Auth if using JWT, or rely on cookies)
              // For mock auth, include the user ID in a header if needed by getUserFromRequest
              const headers: HeadersInit = {
                  'Content-Type': 'application/json', // Not strictly needed for DELETE but good practice
              };
              if (currentUser) {
                  headers['X-Mock-User-ID'] = currentUser.id; // Send mock user ID
              }

             const response = await fetch(`/api/posts/${post.slug}`, {
                 method: 'DELETE',
                 headers: headers,
             });

             if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ error: `Server returned ${response.status}` })); // Handle non-JSON errors
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
     // Show a user-friendly message if the post wasn't found after loading
     return (
        <div className="container mx-auto py-16 text-center">
           <h1 className="text-2xl font-semibold mb-4">Post Not Found</h1>
           <p className="text-muted-foreground mb-6">
              Sorry, we couldn't find the blog post you were looking for.
            </p>
           <Button asChild>
              <Link href="/blogs">
                 <CornerUpLeft className="mr-2 h-4 w-4" /> Back to Blogs
              </Link>
           </Button>
        </div>
      );
  }

   const publishedDate = post.publishedAt instanceof Date ? post.publishedAt : new Date(post.publishedAt);
   const postAuthor = post.author || {}; // Handle potentially missing author


  return (
    <div className="container mx-auto py-8">
       <article className="max-w-4xl mx-auto">
         <header className="mb-8 relative"> {/* Added relative positioning */}
           <Badge variant="secondary" className="mb-2">{post.category}</Badge>
           <h1 className="text-4xl font-bold tracking-tight mb-4">{post.title}</h1>
           <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
             {/* Author Link */}
              {postAuthor.id && (
                 <Link href={`/authors/${postAuthor.slug || postAuthor.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={postAuthor.avatarUrl || undefined} alt={postAuthor.name || 'Author'} />
                     <AvatarFallback>{postAuthor.name?.charAt(0)?.toUpperCase() || 'A'}</AvatarFallback>
                   </Avatar>
                   <span>By {postAuthor.name || 'Unknown Author'}</span>
                 </Link>
              )}
             {/* Meta Info */}
             {isValid(publishedDate) && (
                <div className="flex items-center gap-1"> <Calendar className="h-4 w-4" /> <time dateTime={publishedDate.toISOString()}>{format(publishedDate, 'MMMM d, yyyy')}</time> </div>
             )}
             <div className="flex items-center gap-1"> <MessageSquare className="h-4 w-4" /> <span>{post.commentCount} Comments</span> </div>
             {post.rating != null && <div className="flex items-center gap-1"> <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> <span>{post.rating.toFixed(1)}</span> </div> }
             {post.views != null && <div className="flex items-center gap-1"> <Eye className="h-4 w-4" /> <span>{post.views.toLocaleString()} Views</span> </div> }
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
               priority // Prioritize loading main image
               sizes="(max-width: 768px) 100vw, 896px"
               className="object-cover"
             />
         </div>

          <div
             className="prose prose-quoteless prose-neutral dark:prose-invert max-w-none"
             dangerouslySetInnerHTML={{ __html: post.content }} // Ensure content is properly sanitized on the backend or when fetched
           />

            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                 <span className="font-semibold mr-2">Tags:</span>
                 {post.tags.map(tag => (
                     <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-accent">
                       {/* TODO: Link to tag archive page if implemented */}
                       {/* <Link href={`/tags/${tag}`}> */}
                       {tag}
                       {/* </Link> */}
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
          {postAuthor.id && (
               <Card className="mt-12 mb-8 bg-secondary/50">
                 <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                    <Link href={`/authors/${postAuthor.slug || postAuthor.id}`}>
                     <Avatar className="h-20 w-20">
                       <AvatarImage src={postAuthor.avatarUrl || undefined} alt={postAuthor.name || 'Author'} />
                       <AvatarFallback>{postAuthor.name?.substring(0, 2)?.toUpperCase() || 'AU'}</AvatarFallback>
                     </Avatar>
                   </Link>
                   <div className="text-center sm:text-left">
                     <Link href={`/authors/${postAuthor.slug || postAuthor.id}`}>
                       <h4 className="text-lg font-semibold hover:text-primary transition-colors">{postAuthor.name}</h4>
                     </Link>
                     <p className="text-sm text-muted-foreground mt-1 mb-2">{postAuthor.bio || 'Author bio not available.'}</p>
                     {/* TODO: Conditionally render social links if available */}
                     {/* {postAuthor.socialLinks && ( ... )} */}
                   </div>
                 </CardContent>
               </Card>
            )}

           <div className="mt-8 mb-12 p-6 rounded-lg bg-card border text-center">
               <h3 className="text-xl font-semibold mb-3">Enjoyed this post?</h3>
               <p className="text-muted-foreground mb-4">Share it with your friends or subscribe for more content!</p>
               <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                 {/* TODO: Implement Newsletter Subscription */}
                 <Button>Subscribe to Newsletter</Button>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="outline">
                            <Share2 className="mr-2 h-4 w-4" /> Share Post
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                         <DropdownMenuItem onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')} className="cursor-pointer"> <Facebook className="mr-2 h-4 w-4" /> Facebook </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, '_blank')} className="cursor-pointer"> <Twitter className="mr-2 h-4 w-4" /> Twitter </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(post.title)}`, '_blank')} className="cursor-pointer"> <Linkedin className="mr-2 h-4 w-4" /> LinkedIn </DropdownMenuItem>
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
         <h2 className="text-2xl font-bold mb-6">{post.commentCount} Comments</h2>
         <CommentForm postId={post.id} onCommentSubmit={handleCommentSubmit} replyTo={replyingTo}/>
          {replyingTo && (
                <div className="mb-4 p-2 bg-accent/50 rounded-md text-sm flex justify-between items-center">
                    <span>Replying to comment...</span> {/* Simplified message */}
                     <Button variant="ghost" size="sm" className="h-auto p-1" onClick={() => setReplyingTo(null)}>Cancel Reply</Button>
                </div>
           )}
         <Separator className="my-6" />
         <div className="space-y-4">
           {comments.length > 0 ? (
              comments.map(comment => (
                 <React.Fragment key={comment.id}>
                    <CommentItem comment={comment} postId={post.id} onReply={handleStartReply} />
                    {/* Avoid rendering separator after the last comment */}
                    {comment !== comments[comments.length - 1] && <Separator />}
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

    