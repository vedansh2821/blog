

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
import { Calendar, User, MessageSquare, Send, CornerUpLeft, Star, ThumbsUp, Share2, Facebook, Twitter, Linkedin, Eye, Edit, Trash2, Loader2 } from 'lucide-react'; // Added Edit, Trash2, Loader2 icons
import { format, isValid } from 'date-fns'; // Import isValid
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label'; // Correct import for Label
import { useAuth } from '@/lib/auth/authContext'; // Import useAuth
import type { Author, Comment, Post, RelatedPost } from '@/types/blog'; // Import types


// Helper function to fetch post details from the API
const fetchPostDetailsFromApi = async (slug: string): Promise<Post | null> => {
  if (!slug) {
     console.error("[fetchPostDetails] Attempted to fetch with empty or invalid slug.");
     return null;
  }
  console.log(`[fetchPostDetails] Fetching post with slug: "${slug}" from API`);
  try {
      const response = await fetch(`/api/posts/${slug}`);
      if (!response.ok) {
          const errorText = await response.text().catch(() => 'Could not read error response body');
          console.error(`[fetchPostDetails] API Error ${response.status} for slug "${slug}": ${errorText}`);
          if (response.status === 404) {
              console.log(`[fetchPostDetails] Post explicitly not found (404) for slug: ${slug}. Check if slug generation/matching is correct.`);
              // Log available slugs from mock DB for debugging
              try {
                  // This is a temporary solution for debugging the mock DB state.
                  // In a real DB, you wouldn't do this.
                  const allPostsResponse = await fetch('/api/posts?limit=1000'); // Fetch all posts (or a large number)
                  const allPostsData = await allPostsResponse.json();
                  const availableSlugs = allPostsData.posts.map((p: any) => p.slug).join(', ');
                  console.log(`[fetchPostDetails] Available slugs in mock DB state: ${availableSlugs}`);
              } catch (logError) {
                  console.error("[fetchPostDetails] Could not fetch all slugs for debugging.", logError);
              }
              return null; // Return null for 404 as intended
          }
          // For other errors, throw to be caught below
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data: any = await response.json(); // Use any initially
       // Convert date strings to Date objects BEFORE returning
       const post: Post = {
           ...data,
           publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(), // Provide default if missing
           updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
           // Ensure nested author has date object if present
           author: data.author ? {
               ...data.author,
               joinedAt: data.author?.joinedAt ? new Date(data.author.joinedAt) : new Date(), // Provide default
           } : createAuthorObject(null), // Add default author if missing
           // Ensure other optional fields have defaults if needed by UI
           commentCount: data.commentCount ?? 0,
           views: data.views ?? 0,
           rating: data.rating ?? 0,
           ratingCount: data.ratingCount ?? 0,
           // Add defaults for new structured content fields if missing from old posts
           heading: data.heading || data.title || 'Untitled Post', // Use title as fallback for heading
           subheadings: data.subheadings || [],
           paragraphs: data.paragraphs || [],
           content: data.content || '', // Ensure content is present
           excerpt: data.excerpt || '', // Ensure excerpt is present
           imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.id || 'default'}/1200/600`, // Default image
           tags: data.tags || [], // Ensure tags is an array
       };
      console.log(`[fetchPostDetails] Post data received for slug: ${slug}`, post);
      return post;
  } catch (error) {
      console.error(`[fetchPostDetails] Catch block error fetching post ${slug}:`, error);
      return null; // Return null on error
  }
};

// --- Helper to create a default Author object ---
const createAuthorObject = (user: any): Author => {
    return {
        id: user?.id || 'unknown',
        name: user?.name || 'Unknown Author',
        slug: user?.id || 'unknown',
        avatarUrl: user?.photoURL || `https://i.pravatar.cc/40?u=unknown`,
        bio: user?.bio || 'Author information not available.',
        joinedAt: user?.joinedAt ? new Date(user.joinedAt) : new Date(0), // Default date
    };
};


// Helper to fetch comments
const fetchCommentsFromApi = async (postId: string): Promise<Comment[]> => {
    if (!postId) return []; // Return empty if postId is invalid
    console.log(`[fetchComments] Fetching comments for postId=${postId}`);
    try {
        const response = await fetch(`/api/comments?postId=${postId}`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        const commentsData = await response.json();

        const parseComments = (commentList: any[]): Comment[] => {
            return (commentList || []).map(c => ({
                ...c,
                timestamp: c.timestamp ? new Date(c.timestamp) : new Date(), // Default timestamp
                replies: c.replies ? parseComments(c.replies) : [],
                 author: { // Ensure author structure
                    id: c.author?.id || 'unknown',
                    name: c.author?.name || 'Anonymous',
                    avatarUrl: c.author?.avatarUrl || `https://i.pravatar.cc/40?u=${c.author?.id || 'anonymous'}`,
                    slug: c.author?.slug || c.author?.id || 'unknown'
                 }
            }));
        };
        console.log(`[fetchComments] Comments received for postId=${postId}`, commentsData);
        return parseComments(commentsData);
    } catch (error) {
        console.error("[fetchComments] Error fetching comments:", error);
        return []; // Return empty array on error
    }
};

// Helper to post a comment
const postCommentToApi = async (postId: string, content: string, author: { id: string; name: string; avatarUrl?: string }, replyTo?: string): Promise<Comment | null> => {
    if (!postId) return null; // Don't attempt if postId is invalid
    console.log(`[postComment] Posting comment for postId=${postId}, replyTo=${replyTo}`);
    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, content, author, replyTo }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            throw new Error(errorData.error || 'Failed to post comment');
        }
        const newCommentData = await response.json();
        console.log(`[postComment] Comment posted successfully:`, newCommentData);
        // Convert timestamp before returning
        return { ...newCommentData, timestamp: newCommentData.timestamp ? new Date(newCommentData.timestamp) : new Date() };
    } catch (error) {
        console.error("[postComment] Error posting comment:", error);
        return null;
    }
};

// Helper to fetch related posts
const fetchRelatedPostsFromApi = async (category: string, currentPostId: string): Promise<RelatedPost[]> => {
   if (!category || !currentPostId) return []; // Guard against invalid inputs
  console.log(`[Related] Fetching related posts for category: ${category}, excluding: ${currentPostId}`);
  try {
      // Fetch more initially to increase chance of getting 3 *different* posts
      const response = await fetch(`/api/posts?category=${encodeURIComponent(category)}&limit=5`);
      if (!response.ok) {
           const errorText = await response.text();
           console.error(`[Related] API Error ${response.status}: ${errorText}`);
           throw new Error('Failed to fetch related posts');
      }
      const data = await response.json();

      // Filter out the current post and ensure correct structure
       const posts: RelatedPost[] = (data.posts || [])
        .filter((post: any) => post.id !== currentPostId) // Filter out the current post
        .slice(0, 3) // THEN Limit to 3 related posts
        .map((post: any) => ({
            ...post,
            publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),
            author: { // Ensure author structure
                id: post.author?.id || 'unknown',
                name: post.author?.name || 'Unknown Author',
                avatarUrl: post.author?.avatarUrl || `https://i.pravatar.cc/40?u=${post.author?.id || 'unknown'}`,
                slug: post.author?.slug || post.author?.id || 'unknown'
            },
             commentCount: post.commentCount ?? 0,
             excerpt: post.excerpt || post.title || 'No excerpt available',
             imageUrl: post.imageUrl || `https://picsum.photos/seed/${post.id}/600/400`,
             category: post.category || 'Uncategorized',
             // Optional structured content fields
             heading: post.heading,
             subheadings: post.subheadings || [],
             paragraphs: post.paragraphs || [],
             tags: post.tags || [], // Ensure tags is an array
        }));


      console.log("[Related] Related posts fetched:", posts);
      return posts;
  } catch (error) {
      console.error("[Related] Error fetching related posts:", error);
      return []; // Return empty on error
  }
}

// --- Components ---

const PostSkeleton: React.FC = () => (
  <div className="container mx-auto py-8 max-w-4xl">
    <Skeleton className="h-6 w-24 mb-2" /> {/* Badge */}
    <Skeleton className="h-10 w-3/4 mb-4" /> {/* Title */}
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 text-sm text-muted-foreground">
      <div className="flex items-center gap-2"> <Skeleton className="h-8 w-8 rounded-full" /> <Skeleton className="h-5 w-24" /> </div> {/* Author */}
      <Skeleton className="h-5 w-24" /> {/* Date */}
      <Skeleton className="h-5 w-20" /> {/* Comments */}
      <Skeleton className="h-5 w-16" /> {/* Rating */}
      <Skeleton className="h-5 w-16" /> {/* Views */}
    </div>
    <Skeleton className="h-96 w-full mb-8 rounded-lg" /> {/* Image */}
    <div className="prose dark:prose-invert max-w-none space-y-4">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
      <Skeleton className="h-6 w-full mt-6" />
       <Skeleton className="h-6 w-full" />
       <Skeleton className="h-6 w-3/4" />
    </div>
     {/* Tags Skeleton */}
     <div className="mt-8 flex flex-wrap gap-2">
       <Skeleton className="h-5 w-12" />
       <Skeleton className="h-6 w-20 rounded-full" />
       <Skeleton className="h-6 w-24 rounded-full" />
       <Skeleton className="h-6 w-16 rounded-full" />
     </div>
     {/* Rating Bar Skeleton */}
     <div className="mt-8 py-4 border-t border-b flex flex-col sm:flex-row items-center justify-center gap-4">
         <Skeleton className="h-5 w-24" />
         <div className="flex gap-1">
             <Skeleton className="h-8 w-8" />
             <Skeleton className="h-8 w-8" />
             <Skeleton className="h-8 w-8" />
             <Skeleton className="h-8 w-8" />
             <Skeleton className="h-8 w-8" />
         </div>
     </div>
      {/* Author Box Skeleton */}
     <Card className="mt-12 mb-8 bg-secondary/50">
       <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
         <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
         <div className="flex-1 space-y-2 text-center sm:text-left">
           <Skeleton className="h-6 w-32" />
           <Skeleton className="h-4 w-full max-w-sm" />
           <Skeleton className="h-4 w-4/5 max-w-xs" />
         </div>
       </CardContent>
     </Card>
     {/* CTA Skeleton */}
      <div className="mt-8 mb-12 p-6 rounded-lg bg-card border text-center">
         <Skeleton className="h-6 w-40 mx-auto mb-3" />
         <Skeleton className="h-4 w-64 mx-auto mb-4" />
         <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
         </div>
      </div>
      {/* Related Posts Skeleton */}
       <section className="mt-16">
          <Skeleton className="h-8 w-48 mx-auto mb-6" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`skel-related-${i}`} className="space-y-3">
                      <Skeleton className="h-48 w-full" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                       <div className="flex justify-between items-center pt-2">
                           <Skeleton className="h-8 w-24" />
                           <Skeleton className="h-8 w-8 rounded-full" />
                       </div>
                   </div>
               ))}
           </div>
       </section>
       {/* Comments Skeleton */}
       <section className="mt-16 max-w-3xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
           {/* Comment Form Skeleton */}
           <div className="space-y-2 mb-8">
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-10 w-32" />
           </div>
           <Separator className="my-6" />
            {/* Comment Item Skeletons */}
           <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={`skel-comment-${i}`} className="flex gap-4 py-4">
                        <Skeleton className="h-10 w-10 rounded-full mt-1 flex-shrink-0" />
                         <div className="flex-1 space-y-2">
                            <div className="flex justify-between"> <Skeleton className="h-4 w-24" /> <Skeleton className="h-3 w-16" /> </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                             <div className="flex gap-4"> <Skeleton className="h-5 w-12" /> <Skeleton className="h-5 w-12" /> </div>
                        </div>
                    </div>
                ))}
            </div>
       </section>
  </div>
);

const CommentForm: React.FC<{ postId: string, onCommentSubmit: (comment: Comment) => void, replyTo?: string }> = ({ postId, onCommentSubmit, replyTo }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth(); // Get current user

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !currentUser || !content.trim()) { // Check postId too
         if (!currentUser) {
            toast({ title: "Authentication Required", description: "Please log in to comment.", variant: "destructive" });
        } else if (!content.trim()) {
             toast({ title: "Empty Comment", description: "Please write something.", variant: "destructive" });
        } else if (!postId) {
             toast({ title: "Error", description: "Cannot post comment: Post ID is missing.", variant: "destructive" });
        }
        return;
     }

    setIsSubmitting(true);

    const authorInfo = {
        id: currentUser.id,
        name: currentUser.name || currentUser.email || 'Anonymous',
        avatarUrl: currentUser.photoURL || undefined,
    };

    const newCommentData = await postCommentToApi(postId, content, authorInfo, replyTo);

    if (newCommentData) {
        onCommentSubmit(newCommentData); // Update UI optimistically or after API success
        setContent('');
        toast({
            title: replyTo ? "Reply posted!" : "Comment posted!",
            description: "Your thoughts have been added.",
        });
    } else {
         toast({
            title: "Error Posting Comment",
            description: "Could not submit your comment. Please try again.",
            variant: "destructive",
        });
    }

    setIsSubmitting(false);
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
        placeholder={currentUser ? (replyTo ? "Write your reply..." : "Add your comment...") : "Log in to leave a comment..."}
        className="mb-2"
        rows={3}
        required={!!currentUser} // Only required if logged in
        disabled={isSubmitting || !currentUser || !postId} // Disable if not logged in or no postId
      />
      <Button type="submit" disabled={isSubmitting || !content.trim() || !currentUser || !postId}>
         {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        {isSubmitting ? 'Posting...' : (replyTo ? 'Post Reply' : 'Post Comment')}
      </Button>
       {!currentUser && <p className="text-xs text-muted-foreground mt-2">You must be <Link href="/login" className="text-primary hover:underline">logged in</Link> to comment.</p>}
    </form>
  );
};

const CommentItem: React.FC<{ comment: Comment, postId: string, onReply: (commentId: string) => void }> = ({ comment, postId, onReply }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [likes, setLikes] = useState(comment.likes || 0);
    const { currentUser } = useAuth();
    const { toast } = useToast(); // Need toast here too

    const handleLike = () => {
        if(!currentUser) {
             toast({ title: "Authentication Required", description: "Please log in to like comments.", variant: "destructive" });
             return;
         }
        // TODO: Implement API call to like/unlike comment
        console.log(`Liking comment ${comment.id}`);
        setLikes(prev => prev + 1); // Optimistic update
        toast({ title: "Comment Liked!", description: "Thanks for the feedback!" });
    }

     // Fallback for potentially missing author data
     const authorName = comment.author?.name || 'Anonymous';
     const authorAvatar = comment.author?.avatarUrl || `https://i.pravatar.cc/40?u=${comment.author?.id || 'anonymous'}`;
     const authorFallback = authorName?.charAt(0)?.toUpperCase() || 'A'; // Safer fallback
     const authorProfileLink = `/authors/${comment.author?.slug || comment.author?.id || '#'}`; // Link to author page


    return (
    <div className="flex gap-4 py-4">
       {/* Link author avatar and name */}
       <Link href={authorProfileLink} className="mt-1 flex-shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={authorAvatar} alt={authorName} />
            <AvatarFallback>{authorFallback}</AvatarFallback>
          </Avatar>
       </Link>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
           <Link href={authorProfileLink} className="font-semibold text-sm hover:text-primary transition-colors">
            {authorName}
           </Link>
           {isValid(new Date(comment.timestamp)) ? (
               <time className="text-xs text-muted-foreground" dateTime={new Date(comment.timestamp).toISOString()}>
                 {format(new Date(comment.timestamp), 'MMM d, yyyy HH:mm')}
               </time>
           ) : (
               <span className="text-xs text-muted-foreground">Invalid Date</span>
           )}
        </div>
        <p className="text-sm mb-2">{comment.content}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
           <Button variant="ghost" size="sm" className="h-auto p-0 text-xs hover:text-primary" onClick={handleLike}>
                <ThumbsUp className="mr-1 h-3 w-3" /> {likes > 0 ? likes : ''} Like
           </Button>
           {currentUser && ( // Only show reply button if logged in
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs hover:text-primary" onClick={() => onReply(comment.id)}>
                    <CornerUpLeft className="mr-1 h-3 w-3" /> Reply
               </Button>
           )}
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
  const [post, setPost] = useState<Post | null | undefined>(undefined); // undefined initially, null if not found
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // State for delete operation
  const { toast } = useToast();
  const { currentUser } = useAuth(); // Get current user from context

  useEffect(() => {
    if (!slug) {
         console.warn("[BlogPostPage] Slug is missing, cannot load data.");
         setLoading(false);
         setPost(null); // Set post to null if slug is missing
         return;
    }

    let isMounted = true; // Flag to prevent state updates after unmount

    const loadData = async () => {
      console.log(`[BlogPostPage] Loading data for slug: ${slug}`);
      setLoading(true);
      // Reset states
      setPost(undefined);
      setComments([]);
      setRelatedPosts([]);

      try {
        // Fetch post details first
        const postData = await fetchPostDetailsFromApi(slug);

        if (!isMounted) return; // Exit if component unmounted

        if (postData) {
           console.log("[BlogPostPage] Post data fetched:", postData);
           setPost(postData);

           // Fetch comments and related posts in parallel only if post exists
           if (postData.id && postData.category) { // Ensure ID and category are present
               const [commentsData, relatedPostsData] = await Promise.all([
                 fetchCommentsFromApi(postData.id),
                 fetchRelatedPostsFromApi(postData.category, postData.id)
               ]);

               if (!isMounted) return; // Exit if component unmounted

               console.log("[BlogPostPage] Comments fetched:", commentsData);
               console.log("[BlogPostPage] Related posts fetched:", relatedPostsData);
               setComments(commentsData);
               setRelatedPosts(relatedPostsData);
           } else {
               console.warn("[BlogPostPage] Post data loaded but missing ID or category, cannot fetch comments/related posts.");
           }

        } else {
           console.error(`Post not found for slug: ${slug}`);
           setPost(null); // Explicitly set to null when not found
           toast({
               title: "Post Not Found",
               description: "The requested blog post could not be found.",
               variant: "destructive",
           });
           // Optional: Redirect after a delay
           // setTimeout(() => { if (isMounted) router.push('/404'); }, 2000);
        }
      } catch (error) {
         if (!isMounted) return; // Exit if component unmounted
         console.error("Failed to load post data:", error);
         setPost(null); // Set to null on error
         toast({
            title: "Error Loading Post",
            description: error instanceof Error ? error.message : "Could not load post details.",
            variant: "destructive",
        });
      } finally {
         if (isMounted) {
             setLoading(false);
             console.log(`[BlogPostPage] Finished loading data for slug: ${slug}`);
         }
      }
    };

    loadData();

    // Cleanup function
    return () => {
        isMounted = false;
        console.log(`[BlogPostPage] Unmounting or slug changed for: ${slug}`);
    };
  }, [slug, toast, router]); // Re-run effect when slug changes


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
        if (!post || !currentUser) {
             toast({ title: "Login Required", description: "Please log in to rate posts.", variant:"destructive"});
             return;
         }
        // TODO: Implement API call to submit rating
        console.log(`Rating post ${post.id} with ${rating} stars by user ${currentUser.id}`);
        toast({
          title: "Rating Submitted",
          description: `You rated this post ${rating} stars.`,
        });
         // Optimistic update (simple average for mock)
         setPost(prevPost => {
             if (!prevPost) return null;
             const currentTotalRating = (prevPost.rating ?? 0) * (prevPost.ratingCount ?? 0); // Assuming ratingCount exists
             const newRatingCount = (prevPost.ratingCount ?? 0) + 1;
             const newAvgRating = (currentTotalRating + rating) / newRatingCount;
             return {...prevPost, rating: parseFloat(newAvgRating.toFixed(1)), ratingCount: newRatingCount }
          });
    };

    // --- Edit and Delete Handlers ---
    const handleEdit = () => {
         // Ensure post exists and user can edit
         if (!post || !canEditOrDelete) return;
         console.log("Edit button clicked for post:", post?.slug);
         router.push(`/blogs/${post.slug}/edit`); // Navigate to the edit page
     };

     const handleDelete = async () => {
         if (!post || !currentUser || !canEditOrDelete) return;
         setIsDeleting(true);
         console.log("Attempting to delete post:", post.slug, "by user:", currentUser.id);

         try {
             // Make API Call to DELETE endpoint
             const response = await fetch(`/api/posts/${post.slug}`, {
                 method: 'DELETE',
                 headers: {
                     // Send user ID via a custom header for the mock backend authorization
                     'X-Requesting-User-ID': currentUser.id,
                 },
             });

             if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
                 console.error(`[handleDelete] API Error ${response.status}:`, errorData);
                 throw new Error(errorData.error || `Failed to delete post: ${response.statusText}`);
             }

             toast({
                 title: "Post Deleted",
                 description: "The blog post has been successfully deleted.",
             });
             router.push('/blogs'); // Redirect to blogs list after successful deletion

         } catch (error) {
             console.error("[handleDelete] Failed to delete post:", error);
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

   // Determine if the current user can edit/delete this post
   const canEditOrDelete = !!currentUser && !!post && (currentUser.role === 'admin' || currentUser.id === post.author?.id);


  if (loading || post === undefined) { // Show skeleton while loading or initial state
    return <PostSkeleton />;
  }

  if (post === null) { // Show message if post is explicitly not found (null state)
     return (
         <div className="container mx-auto py-16 text-center">
             <h1 className="text-2xl font-semibold text-destructive mb-4">Post Not Found</h1>
             <p className="text-muted-foreground mb-6">Sorry, the post you are looking for does not exist or could not be loaded.</p>
             <Button asChild>
                 <Link href="/blogs">Back to Blogs</Link>
             </Button>
         </div>
      );
  }

   // Ensure dates and optional data are valid before formatting/using
  const publishedDate = post.publishedAt instanceof Date ? post.publishedAt : new Date(post.publishedAt || Date.now());
  const isValidDate = isValid(publishedDate);
  const commentCount = post.commentCount ?? 0;
  const rating = post.rating ?? 0;
  const views = post.views ?? 0;
  const tags = post.tags || [];

  // Fallback for author data
  const authorName = post.author?.name || 'Unknown Author';
  const authorAvatar = post.author?.avatarUrl || `https://i.pravatar.cc/40?u=${post.author?.id || 'unknown'}`;
  const authorFallback = authorName?.charAt(0)?.toUpperCase() || 'U';
  const authorSlug = post.author?.slug || post.author?.id || '#';
  const authorBio = post.author?.bio || 'Author bio not available.';

  // Share URL - ensure it works on server and client
  const shareUrl = typeof window !== 'undefined' ? window.location.href : (post.slug ? `/blogs/${post.slug}` : '');
  const shareTitle = post.title;


  return (
    <div className="container mx-auto py-8">
       <article className="max-w-4xl mx-auto">
         <header className="mb-8 relative"> {/* Added relative positioning */}
           <Badge variant="secondary" className="mb-2">{post.category}</Badge>
           <h1 className="text-4xl font-bold tracking-tight mb-4">{post.title}</h1>
           <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
             {/* Author Link */}
             {post.author && post.author.id !== 'unknown' && ( // Check if author is known
               <Link href={authorSlug !== '#' ? `/authors/${authorSlug}` : '#'} className="flex items-center gap-2 hover:text-primary transition-colors">
                 <Avatar className="h-8 w-8">
                   <AvatarImage src={authorAvatar} alt={authorName} />
                   <AvatarFallback>{authorFallback}</AvatarFallback>
                 </Avatar>
                 <span>By {authorName}</span>
               </Link>
             )}
              {post.author?.id === 'unknown' && ( // Display placeholder if author unknown
                  <div className="flex items-center gap-2">
                     <Avatar className="h-8 w-8">
                       <AvatarImage src={authorAvatar} alt={authorName} />
                       <AvatarFallback>U</AvatarFallback>
                     </Avatar>
                     <span>By {authorName}</span>
                  </div>
              )}
             {/* Meta Info */}
             <div className="flex items-center gap-1"> <Calendar className="h-4 w-4" /> <time dateTime={isValidDate ? publishedDate.toISOString() : undefined}>{isValidDate ? format(publishedDate, 'MMMM d, yyyy') : 'Invalid Date'}</time> </div>
             <div className="flex items-center gap-1"> <MessageSquare className="h-4 w-4" /> <span>{commentCount} Comments</span> </div>
             {rating > 0 && <div className="flex items-center gap-1"> <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> <span>{rating.toFixed(1)}</span> </div> }
             {views > 0 && <div className="flex items-center gap-1"> <Eye className="h-4 w-4" /> <span>{views.toLocaleString()} Views</span> </div> }
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
                                   {isDeleting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                                   {isDeleting ? 'Deleting...' : 'Delete'}
                               </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                   <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the post
                                      &quot;{post.title}&quot;.
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
               src={post.imageUrl || `https://picsum.photos/seed/${post.id}/1200/600`} // Fallback image
               alt={post.title}
               fill
               priority // Prioritize loading the main post image
               sizes="(max-width: 768px) 100vw, 896px"
               className="object-cover"
             />
         </div>

          {/* Use prose-lg for better readability */}
          <div
             className="prose prose-lg dark:prose-invert max-w-none"
             // Render content safely based on structured data if available, otherwise use raw content
             // Prefer structured data for rendering if it exists
             dangerouslySetInnerHTML={
                 { __html: (post.heading || (post.subheadings && post.subheadings.length > 0) || (post.paragraphs && post.paragraphs.length > 0))
                     ? `
                         ${post.heading ? `<h1 class="text-2xl font-bold mb-4">${post.heading}</h1>` : ''}
                         ${post.subheadings && post.subheadings.length > 0 ? `<h2 class="text-xl font-semibold mt-6 mb-3">Subheadings</h2><ul>${post.subheadings.map(sub => `<li class="mb-2"><h3 class="text-lg font-medium">${sub.trim()}</h3></li>`).join('')}</ul>` : ''}
                         ${post.paragraphs && post.paragraphs.length > 0 ? `<div class="prose-p:my-4">${post.paragraphs.filter(p=>p && p.trim()).map(p => `<p>${p.trim()}</p>`).join('')}</div>` : ''}
                     `
                     : (typeof post.content === 'string' ? post.content : '') // Fallback to raw content
                 }
             }
           />

            {tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                 <span className="font-semibold mr-2">Tags:</span>
                 {tags.map(tag => (
                     <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-accent">
                        {/* TODO: Implement tag page links if needed */}
                       {/* <Link href={`/tags/${tag.toLowerCase().replace(/\s+/g, '-')}`}>{tag}</Link> */}
                       {tag}
                      </Badge>
                   ))}
              </div>
             )}

           <div className="mt-8 py-4 border-t border-b flex flex-col sm:flex-row items-center justify-center gap-4">
                <span className="text-sm font-medium">Rate this post:</span>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <Button key={star} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-yellow-500 disabled:opacity-50" onClick={() => handleRatePost(star)} disabled={!currentUser} title={!currentUser ? "Log in to rate" : `Rate ${star} stars`}>
                            <Star className={`h-5 w-5 ${ (rating > 0 && star <= Math.round(rating)) ? 'fill-yellow-500 text-yellow-500' : '' }`} />
                        </Button>
                    ))}
                 </div>
           </div>

          {/* Author Box */}
           {post.author && post.author.id !== 'unknown' && ( // Only show if author is known
               <Card className="mt-12 mb-8 bg-secondary/50">
                 <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                   <Link href={authorSlug !== '#' ? `/authors/${authorSlug}` : '#'}>
                     <Avatar className="h-20 w-20">
                       <AvatarImage src={authorAvatar} alt={authorName} />
                       <AvatarFallback>{authorFallback}</AvatarFallback>
                     </Avatar>
                   </Link>
                   <div className="text-center sm:text-left">
                     <Link href={authorSlug !== '#' ? `/authors/${authorSlug}` : '#'}>
                       <h4 className="text-lg font-semibold hover:text-primary transition-colors">{authorName}</h4>
                     </Link>
                     <p className="text-sm text-muted-foreground mt-1 mb-2">{authorBio}</p>
                     {/* TODO: Render author social links if available */}
                     {/* {post.author.socialLinks && ( ... )} */}
                   </div>
                 </CardContent>
               </Card>
           )}

           {/* Call to Action / Share Section */}
           <div className="mt-8 mb-12 p-6 rounded-lg bg-card border text-center">
               <h3 className="text-xl font-semibold mb-3">Enjoyed this post?</h3>
               <p className="text-muted-foreground mb-4">Share it with your friends or subscribe for more content!</p>
               <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                 {/* TODO: Implement Newsletter Subscription */}
                 <Button disabled>Subscribe to Newsletter</Button>
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

         {/* Related Posts Section */}
         {relatedPosts.length > 0 && (
            <section className="mt-16">
               <h2 className="text-2xl font-bold mb-6 text-center">Related Posts</h2>
               <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((relatedPost) => (
                      // Ensure relatedPost is treated as Post type for the card
                      <BlogPostCard key={relatedPost.id} post={relatedPost as Post} />
                    ))}
                </div>
             </section>
         )}

       {/* Comments Section */}
       <section id="comment-section" className="mt-16 max-w-3xl mx-auto">
         <h2 className="text-2xl font-bold mb-6">{commentCount} Comments</h2>
         {/* Ensure post.id exists before rendering comment form */}
         {post.id && <CommentForm postId={post.id} onCommentSubmit={handleCommentSubmit} replyTo={replyingTo || undefined}/> }
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
                    {/* Ensure post.id exists before passing to CommentItem */}
                    {post.id && <CommentItem comment={comment} postId={post.id} onReply={handleStartReply} />}
                    {/* Add separator between top-level comments only */}
                    {!comment.replies || comment.replies.length === 0 && <Separator className="last:hidden" />}
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
