
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BlogPostCard from '@/components/blog-post-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

// Mock data fetching function (adapt to use the query parameter)
const fetchSearchResults = async (query: string, page: number = 0, limit: number = 9) => {
    // In a real app, fetch from `/api/posts?q=${query}&page=${page}&limit=${limit}`
    console.log(`Fetching search results for query: "${query}", page: ${page}`);
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate API delay

    const allPosts = Array.from({ length: 50 }).map((_, index) => ({ // Generate mock posts
        id: `post-${index}`,
        title: `Blog Post Title ${index + 1}`,
        slug: `blog-post-title-${index + 1}`,
        excerpt: `This is a short description for blog post ${index + 1}.`,
        imageUrl: `https://picsum.photos/seed/${index + 1}/600/400`,
        category: ['Technology', 'Lifestyle', 'Health', 'Travel'][index % 4],
        author: {
            name: ['Alice', 'Bob', 'Charlie'][index % 3],
            avatarUrl: `https://i.pravatar.cc/40?u=author${index % 3}`,
        },
        publishedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        commentCount: Math.floor(Math.random() * 50),
    }));

    // Simple mock filtering (case-insensitive title/excerpt match)
    const filteredPosts = allPosts.filter(post =>
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(query.toLowerCase())
    );

    const totalResults = filteredPosts.length;
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const posts = filteredPosts.slice(startIndex, endIndex);
    const hasMore = endIndex < totalResults;

    return { posts, hasMore, totalResults };
};

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  // Add state for pagination/infinite scroll if needed later

  useEffect(() => {
    if (query) {
      setLoading(true);
      fetchSearchResults(query)
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
