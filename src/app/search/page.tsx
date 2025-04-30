
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BlogPostCard from '@/components/blog-post-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import type { Post } from '@/types/blog'; // Import Post type

// API fetching function for search results
const fetchSearchResultsFromApi = async (
    query: string,
    page: number = 0,
    limit: number = 9
): Promise<{ posts: Post[], hasMore: boolean, totalResults: number }> => {
    const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString(),
    });

    console.log(`[SearchPage] Fetching search results from API: /api/posts?${params.toString()}`);
    try {
        const response = await fetch(`/api/posts?${params.toString()}`);
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText}. Details: ${errorData}`);
        }
        const data = await response.json();
        console.log("[SearchPage] API Response:", data);

        // Ensure posts array exists and convert date strings, include views
        const posts = (data.posts || []).map((post: any) => ({
             ...post,
             publishedAt: new Date(post.publishedAt),
             updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
             author: {
                 ...post.author,
                 joinedAt: post.author?.joinedAt ? new Date(post.author.joinedAt) : undefined,
             },
             views: post.views ?? 0, // Ensure views exists
             reactions: post.reactions || {}, // Ensure reactions exists
         }));

        return {
            posts,
            hasMore: data.hasMore ?? false,
            totalResults: data.totalResults ?? 0,
        };
    } catch (error) {
        console.error("[SearchPage] Error fetching search results:", error);
        throw error; // Re-throw to be caught by the caller
    }
};


function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Post[]>([]); // Use Post type
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  // Add state for pagination/infinite scroll if needed later

  useEffect(() => {
    if (query) {
      setLoading(true);
      fetchSearchResultsFromApi(query) // Use the API fetching function
        .then(data => {
          setResults(data.posts);
          setTotalResults(data.totalResults);
        })
        .catch(error => console.error("Failed to fetch search results:", error))
        .finally(() => setLoading(false));
    } else {
      setResults([]);
      setTotalResults(0);
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Search Results</h1>
      {query ? (
        <p className="text-muted-foreground mb-8">
          Showing results for: <span className="font-semibold text-foreground">"{query}"</span>
          {!loading && ` (${totalResults} found)`}
        </p>
      ) : (
        <p className="text-muted-foreground mb-8">Please enter a search term in the header.</p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(post => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
        // Add pagination or infinite scroll controls here if needed
      ) : (
         query && !loading && (
            <div className="text-center py-16 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4" />
                <p>No posts found matching your search term.</p>
            </div>
         )
      )}
    </div>
  );
}


// Use Suspense to handle the initial render while searchParams are loading
export default function SearchPage() {
    return (
        <Suspense fallback={<SearchPageSkeleton />}>
            <SearchResults />
        </Suspense>
    );
}

const SearchPageSkeleton: React.FC = () => (
    <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-5 w-1/3 mb-8" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
    </div>
);
