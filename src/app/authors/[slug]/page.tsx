'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BlogPostCard from '@/components/blog-post-card'; // Reuse for displaying posts
import { Twitter, Linkedin, Globe } from 'lucide-react'; // Assuming Globe for website
import { useToast } from "@/hooks/use-toast";

// Mock Data - Replace with actual data fetching
interface AuthorDetails {
  name: string;
  slug: string;
  avatarUrl: string;
  bio: string;
  socialLinks: { platform: string; url: string }[];
  website?: string;
}

interface AuthorPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    imageUrl: string;
    category: string;
    author: { // Simplified for card, main author info is already known
        name: string;
        avatarUrl: string;
    };
    publishedAt: Date;
    commentCount: number;
}

const fetchAuthorDetails = async (slug: string): Promise<AuthorDetails | null> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

    // Find author based on slug (in real app, fetch from API: /api/authors/${slug})
    const mockAuthors: Record<string, AuthorDetails> = {
        alice: {
            name: 'Alice',
            slug: 'alice',
            avatarUrl: 'https://i.pravatar.cc/150?u=author0',
            bio: 'Alice is a tech enthusiast and writer, focusing on AI, software development, and future trends. She loves breaking down complex topics into understandable articles.',
            socialLinks: [
                { platform: 'twitter', url: 'https://twitter.com/alice' },
                { platform: 'linkedin', url: 'https://linkedin.com/in/alice' },
            ],
            website: 'https://aliceblogs.com'
        },
        bob: {
            name: 'Bob',
            slug: 'bob',
            avatarUrl: 'https://i.pravatar.cc/150?u=author1',
            bio: 'Bob writes about lifestyle design, productivity, and travel. He aims to inspire readers to live more intentionally and explore the world.',
            socialLinks: [
                 { platform: 'twitter', url: 'https://twitter.com/bob' },
            ],
        },
         charlie: {
            name: 'Charlie',
            slug: 'charlie',
            avatarUrl: 'https://i.pravatar.cc/150?u=author2',
            bio: 'Charlie covers health, wellness, and mental fitness. With a background in nutrition, they provide practical advice for a healthier life.',
            socialLinks: [
                 { platform: 'linkedin', url: 'https://linkedin.com/in/charlie' },
            ],
             website: 'https://charliewellness.co'
        },
    };

    return mockAuthors[slug] || null;
};

const fetchPostsByAuthor = async (authorSlug: string, page: number, limit: number = 6): Promise<{ posts: AuthorPost[], hasMore: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate API delay

     // In a real app, fetch from `/api/posts?author=${authorSlug}&page=${page}&limit=${limit}`
     const authorIndex = ['alice', 'bob', 'charlie'].indexOf(authorSlug);
     if (authorIndex === -1) return { posts: [], hasMore: false };

     const authorName = ['Alice', 'Bob', 'Charlie'][authorIndex];
     const authorAvatar = `https://i.pravatar.cc/40?u=author${authorIndex}`; // Card avatar

     const posts = Array.from({ length: limit }).map((_, index) => {
        const postId = (page * limit + index) * 3 + authorIndex; // Ensure unique post IDs per author page
         return {
             id: `post-${postId}`,
             title: `Post by ${authorName} #${page * limit + index + 1}`,
             slug: `post-by-${authorSlug}-${page * limit + index + 1}`,
             excerpt: `An excerpt for post number ${page * limit + index + 1} written by ${authorName}.`,
             imageUrl: `https://picsum.photos/seed/${postId}/600/400`,
             category: ['Technology', 'Lifestyle', 'Health', 'Travel'][postId % 4],
             author: { name: authorName, avatarUrl: authorAvatar },
             publishedAt: new Date(Date.now() - postId * 24 * 60 * 60 * 1000),
             commentCount: Math.floor(Math.random() * 30),
        };
     });

     const hasMore = page < 2; // Assume 3 pages of posts per author for mock

    return { posts, hasMore };
}

const AuthorSkeleton: React.FC = () => (
     <div className="container mx-auto py-12">
        <div className="flex flex-col items-center text-center mb-12">
           <Skeleton className="h-32 w-32 rounded-full mb-4" />
           <Skeleton className="h-8 w-48 mb-2" />
           <Skeleton className="h-4 w-24 mb-4" />
           <Skeleton className="h-5 w-full max-w-lg mb-4" />
            <Skeleton className="h-5 w-4/5 max-w-md mb-4" />
            <div className="flex gap-4 mt-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
        </div>
        <Skeleton className="h-8 w-64 mb-8 mx-auto" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`skel-post-${i}`} className="space-y-3">
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
);

export default function AuthorPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [author, setAuthor] = useState<AuthorDetails | null>(null);
  const [posts, setPosts] = useState<AuthorPost[]>([]);
  const [page, setPage] = useState(0);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false); // Separate loading for posts
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver>();
  const { toast } = useToast();

  // Fetch Author Details
  useEffect(() => {
    if (!slug) return;
    setLoadingAuthor(true);
    fetchAuthorDetails(slug)
      .then(data => {
        setAuthor(data);
        if (!data) {
            toast({ title: "Error", description: "Author not found.", variant: "destructive" });
        }
      })
      .catch(err => {
          console.error("Failed to load author details:", err);
          toast({ title: "Error", description: "Could not load author details.", variant: "destructive" });
      })
      .finally(() => setLoadingAuthor(false));
  }, [slug, toast]);

  // Fetch Initial Posts
  useEffect(() => {
      if (!author) return;
       setLoadingPosts(true);
       setPosts([]); // Clear previous posts if author changes
       setPage(0);
       setHasMore(true);
       fetchPostsByAuthor(author.slug, 0)
          .then(data => {
              setPosts(data.posts);
              setHasMore(data.hasMore);
          })
          .catch(err => {
              console.error("Failed to load initial posts:", err);
              toast({ title: "Error", description: "Could not load posts.", variant: "destructive" });
          })
          .finally(() => setLoadingPosts(false));
  }, [author, toast]); // Re-run when author data is loaded


   const loadMorePosts = useCallback(async () => {
        if (!author || loadingPosts || !hasMore) return;
        setLoadingPosts(true);
        const nextPage = page + 1;
        fetchPostsByAuthor(author.slug, nextPage)
            .then(data => {
                setPosts(prevPosts => [...prevPosts, ...data.posts]);
                setPage(nextPage);
                setHasMore(data.hasMore);
            })
            .catch(err => {
                console.error("Failed to load more posts:", err);
                toast({ title: "Error", description: "Could not load more posts.", variant: "destructive" });
            })
            .finally(() => setLoadingPosts(false));
    }, [author, page, hasMore, loadingPosts, toast]);


    // Infinite scroll observer
    const lastPostElementRef = useCallback((node: HTMLDivElement) => {
        if (loadingPosts) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMorePosts();
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingPosts, hasMore, loadMorePosts]);


  if (loadingAuthor) {
    return <AuthorSkeleton />;
  }

  if (!author) {
    // TODO: Render a proper 404 component or redirect
    return <div className="container mx-auto py-8 text-center">Author not found.</div>;
  }


  return (
    <div className="container mx-auto py-12">
       {/* Author Header */}
      <Card className="mb-12 overflow-hidden bg-gradient-to-br from-card to-card/80">
        <CardContent className="p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary flex-shrink-0">
              <AvatarImage src={author.avatarUrl} alt={author.name} />
              <AvatarFallback>{author.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
           <div className="text-center md:text-left">
               <h1 className="text-3xl md:text-4xl font-bold mb-2">{author.name}</h1>
               <p className="text-muted-foreground mb-4">{author.bio}</p>
               <div className="flex justify-center md:justify-start items-center gap-3">
                   {author.socialLinks.map(link => (
                      <Button key={link.platform} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                        <Link href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${author.name} on ${link.platform}`}>
                           {link.platform === 'twitter' && <Twitter className="h-5 w-5" />}
                           {link.platform === 'linkedin' && <Linkedin className="h-5 w-5" />}
                           {/* Add other icons */}
                        </Link>
                       </Button>
                    ))}
                    {author.website && (
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                            <Link href={author.website} target="_blank" rel="noopener noreferrer" aria-label={`${author.name}'s website`}>
                                <Globe className="h-5 w-5" />
                             </Link>
                         </Button>
                    )}
               </div>
           </div>
        </CardContent>
      </Card>

      {/* Author Posts */}
      <h2 className="text-2xl font-bold mb-8 text-center md:text-left">Posts by {author.name}</h2>
      {posts.length > 0 || loadingPosts ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => {
             if (posts.length === index + 1) {
                 return (
                    <div ref={lastPostElementRef} key={post.id}>
                        <BlogPostCard post={post} />
                    </div>
                 );
             } else {
                 return <BlogPostCard key={post.id} post={post} />;
             }
           })}
           {/* Loading Skeletons for posts */}
           {loadingPosts && Array.from({ length: 3 }).map((_, i) => (
                <div key={`skel-load-${i}`} className="space-y-3">
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
        ) : (
             <p className="text-center text-muted-foreground mt-8">No posts found for this author yet.</p>
        )}

       {/* End of posts message for infinite scroll */}
       {!loadingPosts && !hasMore && posts.length > 0 && (
          <p className="text-center text-muted-foreground mt-12">No more posts by {author.name}.</p>
        )}
    </div>
  );
}
