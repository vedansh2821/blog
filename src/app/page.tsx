'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import BlogPostCard from '@/components/blog-post-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/types/blog';

// Updated API fetching function
const fetchPostsFromApi = async (page: number, limit: number = 6): Promise<{ posts: Post[], hasMore: boolean }> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    console.log(`[Homepage] Fetching posts from API: page=${page}, limit=${limit}`);
    try {
        const response = await fetch(`/api/posts?${params.toString()}`);
        if (!response.ok) {
            // Throw an error object with more details
            const errorData = await response.text(); // Get text for better debugging
            throw new Error(`API Error: ${response.status} ${response.statusText}. Details: ${errorData}`);
        }
        const data = await response.json();
        console.log("[Homepage] API Response:", data);

        // Ensure posts array exists and convert date strings
        const posts = (data.posts || []).map((post: any) => ({
             ...post,
             publishedAt: new Date(post.publishedAt),
             updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
         }));


        return { posts, hasMore: data.hasMore ?? false };
    } catch (error) {
        console.error("[Homepage] Error fetching posts:", error);
        // Re-throw the error to be caught by the caller
        throw error;
    }
};


export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // Separate state for loading more
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver>();
  const isInitialMount = useRef(true); // To prevent double initial load in StrictMode
  const { toast } = useToast();


  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loadingMore) return; // Prevent multiple simultaneous loads
    console.log("[Homepage] Loading more posts...");
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
        const { posts: newPosts, hasMore: newHasMore } = await fetchPostsFromApi(nextPage);
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
        setPage(nextPage);
        setHasMore(newHasMore);
    } catch (error) {
         console.error("[Homepage] Failed to load more posts:", error);
         toast({
            title: "Error Loading More Posts",
            description: error instanceof Error ? error.message : "Could not load more posts.",
            variant: "destructive",
         });
         setHasMore(false); // Stop trying to load more if an error occurs
     } finally {
        setLoadingMore(false);
        console.log("[Homepage] Finished loading more posts.");
     }
  }, [page, hasMore, loadingMore, toast]);

    // Initial load
   useEffect(() => {
        // Prevent double load in React StrictMode
        if (!isInitialMount.current) return;
        isInitialMount.current = false;

     const initialLoad = async () => {
       console.log("[Homepage] Initial load starting...");
       setLoading(true);
       setPosts([]); // Clear previous posts
       setPage(0);   // Reset page number
       setHasMore(true); // Assume there's more initially
       try {
           const { posts: initialPosts, hasMore: initialHasMore } = await fetchPostsFromApi(0);
           setPosts(initialPosts);
           setHasMore(initialHasMore);
            console.log("[Homepage] Initial load successful.");
       } catch (error) {
           console.error("[Homepage] Failed initial posts load:", error);
           toast({
               title: "Error Loading Posts",
               description: error instanceof Error ? error.message : "Could not fetch initial posts.",
               variant: "destructive",
           });
           setHasMore(false); // Prevent infinite scroll trigger if initial load fails
       } finally {
           setLoading(false);
           console.log("[Homepage] Initial load finished.");
       }
     };
     initialLoad();
   }, [toast]); // Added toast to dependency array


  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return; // Don't observe if initial load or load more is happening
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        console.log("[Homepage] Intersection Observer triggered loadMorePosts");
        loadMorePosts();
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMorePosts]);


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Latest Blog Posts</h1>
      {loading ? (
           // Initial Loading Skeletons
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
               {Array.from({ length: 6 }).map((_, i) => (
                  <div key={`skeleton-initial-${i}`} className="space-y-3">
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
      ) : posts.length > 0 ? (
           // Display Posts
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
               {posts.map((post, index) => {
                  // Attach ref to the last element for infinite scroll trigger
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
               {/* Loading More Skeletons (optional, shown while loading more) */}
                {loadingMore && Array.from({ length: 3 }).map((_, i) => (
                  <div key={`skeleton-loading-${i}`} className="space-y-3">
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
            // No Posts Found Message
           <p className="text-center text-muted-foreground mt-8 col-span-full">
               No posts found. Check back later!
           </p>
      )}

        {/* End of posts message */}
       {!loading && !loadingMore && !hasMore && posts.length > 0 && (
          <p className="text-center text-muted-foreground mt-8 col-span-full">You've reached the end!</p>
        )}

    </div>
  );
}
