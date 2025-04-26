'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import BlogPostCard from '@/components/blog-post-card';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data fetching function
const fetchPosts = async (page: number, limit: number = 6) => {
  // In a real app, fetch from an API:
  // const response = await fetch(`/api/posts?page=${page}&limit=${limit}`);
  // const data = await response.json();
  // return data;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const posts = Array.from({ length: limit }).map((_, index) => {
    const postId = page * limit + index;
    return {
      id: `post-${postId}`,
      title: `Blog Post Title ${postId + 1}`,
      slug: `blog-post-title-${postId + 1}`,
      excerpt: `This is a short description or excerpt for blog post number ${postId + 1}. It gives a glimpse into the content.`,
      imageUrl: `https://picsum.photos/seed/${postId + 1}/600/400`,
      category: ['Technology', 'Lifestyle', 'Health', 'Travel'][postId % 4],
      author: {
        name: ['Alice', 'Bob', 'Charlie'][postId % 3],
        avatarUrl: `https://i.pravatar.cc/40?u=author${postId % 3}`,
      },
      publishedAt: new Date(Date.now() - postId * 24 * 60 * 60 * 1000), // Simulate different publish dates
      commentCount: Math.floor(Math.random() * 50),
    };
  });

  // Simulate reaching the end of posts
  const hasMore = page < 4; // Assume 5 pages total (0-4)

  return { posts, hasMore };
};


export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver>();

  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    const nextPage = page + 1;
    const { posts: newPosts, hasMore: newHasMore } = await fetchPosts(nextPage);
    setPosts(prevPosts => [...prevPosts, ...newPosts]);
    setPage(nextPage);
    setHasMore(newHasMore);
    setLoading(false);
  }, [page, hasMore, loading]);

    // Initial load
   useEffect(() => {
     const initialLoad = async () => {
       setLoading(true);
       const { posts: initialPosts, hasMore: initialHasMore } = await fetchPosts(0);
       setPosts(initialPosts);
       setPage(0);
       setHasMore(initialHasMore);
       setLoading(false);
     };
     initialLoad();
   }, []);


  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMorePosts]);


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Latest Blog Posts</h1>
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
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="space-y-3">
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
       {!loading && !hasMore && posts.length > 0 && (
          <p className="text-center text-muted-foreground mt-8">You've reached the end!</p>
        )}
        {!loading && posts.length === 0 && (
           <p className="text-center text-muted-foreground mt-8">No posts found.</p>
        )}
    </div>
  );
}
