'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, User, MessageSquare, Send, CornerUpLeft, Star, ThumbsUp, ThumbsDown, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { format } from 'date-fns';
import BlogPostCard from '@/components/blog-post-card'; // Re-use for related posts
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";


// Mock Data - Replace with actual data fetching
interface Author {
  name: string;
  slug: string;
  avatarUrl: string;
  bio: string;
  socialLinks?: { platform: string; url: string }[];
}

interface Comment {
  id: string;
  author: { name: string; avatarUrl: string };
  timestamp: Date;
  content: string;
  replies: Comment[];
  likes: number;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string; // Assuming HTML content
  imageUrl: string;
  category: string;
  author: Author;
  publishedAt: Date;
  commentCount: number;
  tags?: string[];
  rating?: number; // Average rating
  views?: number;
}

interface RelatedPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    imageUrl: string;
    category: string;
    author: { name: string; avatarUrl: string };
    publishedAt: Date;
    commentCount: number;
}

const fetchPostDetails = async (slug: string): Promise<Post | null> => {
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay

  // Find post based on slug (in real app, fetch from API: /api/posts/${slug})
  const postId = parseInt(slug.split('-').pop() || '1'); // Extract ID from slug for mock
  if (isNaN(postId) || postId < 1) return null;

  const author: Author = {
    name: ['Alice', 'Bob', 'Charlie'][postId % 3],
    slug: ['alice', 'bob', 'charlie'][postId % 3],
    avatarUrl: `https://i.pravatar.cc/80?u=author${postId % 3}`,
    bio: `This is a short bio for ${['Alice', 'Bob', 'Charlie'][postId % 3]}. They write about various interesting topics.`,
    socialLinks: [
        {platform: 'twitter', url: '#'},
        {platform: 'linkedin', url: '#'},
    ]
  };

  return {
    id: `post-${postId}`,
    title: `Blog Post Title ${postId}`,
    slug: slug,
    content: `<p>This is the main content for <strong>Blog Post ${postId}</strong>. It discusses various aspects related to the topic, providing insights and information.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><h2>A Subheading</h2><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><figure class="my-6"><img src="https://picsum.photos/seed/${postId+10}/800/400" alt="Related image" class="rounded-lg mx-auto" /><figcaption class="text-center text-sm text-muted-foreground mt-2">A caption for the image.</figcaption></figure><h3>Another Level</h3><p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>`,
    imageUrl: `https://picsum.photos/seed/${postId}/1200/600`,
    category: ['Technology', 'Lifestyle', 'Health', 'Travel'][postId % 4],
    author: author,
    publishedAt: new Date(Date.now() - postId * 24 * 60 * 60 * 1000),
    commentCount: Math.floor(Math.random() * 50),
    tags: ['tag1', 'tag2', `topic${postId % 3}`],
    rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0 and 5.0
    views: Math.floor(Math.random() * 10000) + 500,
  };
};

const fetchComments = async (postId: string): Promise<Comment[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const numComments = Math.floor(Math.random() * 5) + 1;
    return Array.from({length: numComments}).map((_, i) => ({
        id: `comment-${postId}-${i}`,
        author: { name: `User ${i+1}`, avatarUrl: `https://i.pravatar.cc/40?u=commenter${i}`},
        timestamp: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
        content: `This is comment number ${i+1}. I ${Math.random() > 0.5 ? 'agree' : 'disagree'} with the points made.`,
        replies: i % 2 === 0 ? Array.from({length: Math.floor(Math.random()*2)+1}).map((_, j) => ({
             id: `reply-${postId}-${i}-${j}`,
             author: { name: `Replier ${j+1}`, avatarUrl: `https://i.pravatar.cc/40?u=replier${j}`},
             timestamp: new Date(Date.now() - Math.random() * 1 * 24 * 60 * 60 * 1000),
             content: `Replying to comment ${i+1}. My thoughts are...`,
             replies: [],
             likes: Math.floor(Math.random() * 5),
        })) : [],
        likes: Math.floor(Math.random() * 20),
    })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const fetchRelatedPosts = async (category: string, currentPostId: string): Promise<RelatedPost[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    // Fetch posts, filter by category, exclude current post, limit to 3
     const allPosts = Array.from({ length: 10 }).map((_, index) => ({ // Simulate some posts
        id: `post-${index+50}`, // Different IDs from main posts
        title: `Related Post ${index + 1} on ${category}`,
        slug: `related-post-${index + 1}-${category.toLowerCase()}`,
        excerpt: `An excerpt for a related post about ${category}.`,
        imageUrl: `https://picsum.photos/seed/related${index + 1}/600/400`,
        category: category,
        author: { name: 'Related Author', avatarUrl: 'https://i.pravatar.cc/40?u=related' },
        publishedAt: new Date(Date.now() - (index+50) * 24 * 60 * 60 * 1000),
        commentCount: Math.floor(Math.random() * 10),
      }));

     return allPosts
        .filter(p => p.category === category && p.id !== currentPostId)
        .slice(0, 3);
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

const CommentForm: React.FC<{ postId: string, onCommentSubmit: (comment: Comment) => void, replyTo?: string }> = ({ postId, onCommentSubmit, replyTo }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const newComment: Comment = {
      id: `new-${Date.now()}`,
      author: { name: 'You', avatarUrl: 'https://i.pravatar.cc/40?u=currentuser' }, // Replace with actual user
      timestamp: new Date(),
      content: content,
      replies: [],
      likes: 0,
    };

    // In a real app, send to API: await postComment(postId, content, replyTo);
    onCommentSubmit(newComment); // Update UI optimistically or after API success
    setContent('');
    setIsSubmitting(false);
    toast({
        title: replyTo ? "Reply posted!" : "Comment posted!",
        description: "Your thoughts have been added.",
    });
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
        disabled={isSubmitting}
      />
      <Button type="submit" disabled={isSubmitting || !content.trim()}>
        <Send className="mr-2 h-4 w-4" />
        {isSubmitting ? 'Posting...' : (replyTo ? 'Post Reply' : 'Post Comment')}
      </Button>
    </form>
  );
};

const CommentItem: React.FC<{ comment: Comment, postId: string, onReply: (commentId: string) => void }> = ({ comment, postId, onReply }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [likes, setLikes] = useState(comment.likes);

    const handleLike = () => {
        // In real app, send like update to API
        setLikes(prev => prev + 1); // Optimistic update
    }

    return (
    <div className="flex gap-4 py-4">
      <Avatar className="h-10 w-10 mt-1">
        <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
        <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm">{comment.author.name}</span>
          <time className="text-xs text-muted-foreground">{format(comment.timestamp, 'MMM d, yyyy HH:mm')}</time>
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
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // ID of comment being replied to
  const { toast } = useToast();

  useEffect(() => {
    if (!slug) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const postData = await fetchPostDetails(slug);
        setPost(postData);

        if (postData) {
          const [commentsData, relatedPostsData] = await Promise.all([
            fetchComments(postData.id),
            fetchRelatedPosts(postData.category, postData.id)
          ]);
          setComments(commentsData);
          setRelatedPosts(relatedPostsData);
        } else {
          // Handle post not found (redirect or show 404 component)
          console.error("Post not found");
        }
      } catch (error) {
        console.error("Failed to load post data:", error);
        toast({
            title: "Error",
            description: "Could not load post details.",
            variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug, toast]);

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
        // Optionally scroll to the comment form or highlight it
        const commentFormElement = document.getElementById('comment-section');
        commentFormElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

   const handleRatePost = async (rating: number) => {
        if (!post) return;
        // Simulate API call
        console.log(`Rating post ${post.id} with ${rating} stars`);
        toast({
          title: "Rating Submitted",
          description: `You rated this post ${rating} stars.`,
        });
        // Update UI optimistically if needed
         setPost(prevPost => prevPost ? {...prevPost, rating: ((prevPost.rating || 0) + rating) / 2} : null); // simplistic average update
    };

  if (loading) {
    return <PostSkeleton />;
  }

  if (!post) {
    // TODO: Render a proper 404 component or redirect
    return <div className="container mx-auto py-8 text-center">Post not found.</div>;
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post.title;


  return (
    <div className="container mx-auto py-8">
       <article className="max-w-4xl mx-auto">
         <header className="mb-8">
           <Badge variant="secondary" className="mb-2">{post.category}</Badge>
           <h1 className="text-4xl font-bold tracking-tight mb-4">{post.title}</h1>
           <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
             <Link href={`/authors/${post.author.slug}`} className="flex items-center gap-2 hover:text-primary transition-colors">
               <Avatar className="h-8 w-8">
                 <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                 <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
               </Avatar>
               <span>By {post.author.name}</span>
             </Link>
             <div className="flex items-center gap-1">
               <Calendar className="h-4 w-4" />
               <time dateTime={post.publishedAt.toISOString()}>{format(post.publishedAt, 'MMMM d, yyyy')}</time>
             </div>
              <div className="flex items-center gap-1">
                 <MessageSquare className="h-4 w-4" />
                 <span>{post.commentCount} Comments</span>
               </div>
              {post.rating && (
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span>{post.rating}</span>
                </div>
                )}
              {post.views && (
                   <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span>{post.views} Views</span>
                    </div>
                )}
           </div>
         </header>

         <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
             <Image
               src={post.imageUrl}
               alt={post.title}
               fill
               priority // Prioritize loading the main post image
               sizes="(max-width: 768px) 100vw, 896px" // Adjust sizes based on max-w-4xl
               className="object-cover"
             />
         </div>

         {/* Post Content */}
          <div
             className="prose prose-quoteless prose-neutral dark:prose-invert max-w-none"
             dangerouslySetInnerHTML={{ __html: post.content }}
           />


           {/* Tags */}
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

           {/* Rating */}
           <div className="mt-8 py-4 border-t border-b flex flex-col sm:flex-row items-center justify-center gap-4">
                <span className="text-sm font-medium">Rate this post:</span>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <Button key={star} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-yellow-500" onClick={() => handleRatePost(star)}>
                            <Star className={`h-5 w-5 ${ (post.rating && star <= Math.round(post.rating)) ? 'fill-yellow-500 text-yellow-500' : '' }`} />
                        </Button>
                    ))}
                 </div>
           </div>

           {/* Author Box */}
          <Card className="mt-12 mb-8 bg-secondary/50">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
               <Link href={`/authors/${post.author.slug}`}>
                 <Avatar className="h-20 w-20">
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                    <AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
               </Link>
                <div className="text-center sm:text-left">
                  <Link href={`/authors/${post.author.slug}`}>
                     <h4 className="text-lg font-semibold hover:text-primary transition-colors">{post.author.name}</h4>
                   </Link>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">{post.author.bio}</p>
                     {post.author.socialLinks && (
                       <div className="flex gap-2 justify-center sm:justify-start">
                           {post.author.socialLinks.map(link => (
                               <Button key={link.platform} variant="ghost" size="icon" className="h-7 w-7" asChild>
                                   <Link href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${post.author.name}'s ${link.platform}`}>
                                        {link.platform === 'twitter' && <Twitter className="h-4 w-4" />}
                                        {link.platform === 'linkedin' && <Linkedin className="h-4 w-4" />}
                                        {/* Add other icons */}
                                   </Link>
                                </Button>
                            ))}
                       </div>
                   )}
               </div>
            </CardContent>
          </Card>


           {/* Call to Action / Share */}
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
                         <DropdownMenuItem onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')} className="cursor-pointer">
                           <Facebook className="mr-2 h-4 w-4" /> Facebook
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank')} className="cursor-pointer">
                           <Twitter className="mr-2 h-4 w-4" /> Twitter
                         </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`, '_blank')} className="cursor-pointer">
                           <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
                         </DropdownMenuItem>
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
                      <BlogPostCard key={relatedPost.id} post={relatedPost} />
                    ))}
                </div>
             </section>
         )}

       {/* Comments Section */}
       <section id="comment-section" className="mt-16 max-w-3xl mx-auto">
         <h2 className="text-2xl font-bold mb-6">{post.commentCount} Comments</h2>
         <CommentForm postId={post.id} onCommentSubmit={handleCommentSubmit} replyTo={replyingTo || undefined}/>
          {replyingTo && (
                <div className="mb-4 p-2 bg-accent/50 rounded-md text-sm flex justify-between items-center">
                    <span>Replying to comment ID: {replyingTo}</span>
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
