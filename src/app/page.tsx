'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import BlogPostCard from '@/components/blog-post-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post } from '@/types/blog'; // Import Post type

// Renamed function to avoid conflicts and clarify purpose
const fetchPostsFromApi = async (page: number, limit: number = 6): Promise<{ posts: Post[], hasMore: boolean }> => {
  console.log(`[Homepage] Fetching posts from API - Page: ${page}, Limit: ${limit}`);
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(`/api/posts?${params.toString()}`);
    if (!response.ok) {
        // Log the error response for debugging
        const errorText = await response.text();
        console.error(`[Homepage] API Error Response (${response.status}):`, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log("[Homepage] API Response:", data);

    // Ensure the response structure matches expectations
    if (!data || !Array.isArray(data.posts)) {
      console.error("[Homepage] Invalid API response structure:", data);
      throw new Error("Invalid API response structure");
    }

    // Convert date strings to Date objects
    const postsWithDates: Post[] = data.posts.map((post: any) => ({
        ...post,
        publishedAt: new Date(post.publishedAt),
        // Ensure author object exists and has necessary fields, provide fallbacks
         author: post.author ? {
            id: post.author.id ?? 'unknown',
            name: post.author.name ?? 'Unknown Author',
            slug: post.author.slug ?? 'unknown',
            avatarUrl: post.author.avatarUrl ?? 'https://i.pravatar.cc/40?u=unknown',
            bio: post.author.bio ?? '',
          } : {
            id: 'unknown',
            name: 'Unknown Author',
            slug: 'unknown',
            avatarUrl: 'https://i.pravatar.cc/40?u=unknown',
            bio: '',
          },
    }));


    return { posts: postsWithDates, hasMore: data.hasMore ?? false };

  } catch (error) {
    console.error("[Homepage] Failed to fetch posts from API:", error);
    // Return empty state on error to prevent breaking the UI
    return { posts: [], hasMore: false };
  }
};


export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]); // Use Post type
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver>();
  const isInitialMount = useRef(true); // Ref to track initial mount

  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loading) return;
    console.log("[Homepage] Loading more posts...");
    setLoading(true);
    const nextPage = page + 1;
    const { posts: newPosts, hasMore: newHasMore } = await fetchPostsFromApi(nextPage); // Use renamed function
    setPosts(prevPosts => [...prevPosts, ...newPosts]);
    setPage(nextPage);
    setHasMore(newHasMore);
    setLoading(false);
    console.log("[Homepage] Finished loading more posts. Has More:", newHasMore);
  }, [page, hasMore, loading]);

    // Initial load
   useEffect(() => {
     // Only run initial load once
     if (!isInitialMount.current) return;
     isInitialMount.current = false; // Mark initial mount as done

     const initialLoad = async () => {
       console.log("[Homepage] Performing initial load...");
       setLoading(true);
       setPosts([]); // Clear posts before initial load
       setPage(0); // Reset page to 0
       const { posts: initialPosts, hasMore: initialHasMore } = await fetchPostsFromApi(0); // Use renamed function
       setPosts(initialPosts);
       setHasMore(initialHasMore);
       setLoading(false);
       console.log("[Homepage] Initial load complete. Has More:", initialHasMore);
     };
     initialLoad();
   }, []); // Empty dependency array ensures this runs only once on mount


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
         {/* Display posts */}
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

         {/* Display skeletons while loading */}
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

       {/* Message when no more posts or no posts found */}
       {!loading && !hasMore && posts.length > 0 && (
          <p className="text-center text-muted-foreground mt-8">You've reached the end!</p>
        )}
        {!loading && posts.length === 0 && !hasMore && ( // Show only if not loading and no posts ever loaded
           <p className="text-center text-muted-foreground mt-8">No posts found.</p>
        )}
    </div>
  );
}
