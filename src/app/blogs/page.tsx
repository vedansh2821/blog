
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link'; // Import Link component
import BlogPostCard from '@/components/blog-post-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import type { Post } from '@/types/blog'; // Import Post type
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { PlusCircle } from 'lucide-react';

// Mock categories (can be fetched from API later if dynamic)
const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'Technology', label: 'Technology' }, // Use actual category names from seeded data
  { value: 'Lifestyle', label: 'Lifestyle' },
  { value: 'Health', label: 'Health' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Love', label: 'Love' },
  { value: 'Others', label: 'Others' }, // Added Others
];

// API fetching function for blogs page
const fetchPostsFromApi = async (
    page: number,
    limit: number = 9,
    category: string = 'all',
    // query?: string // Add query later if search is added here
): Promise<{ posts: Post[], hasMore: boolean, totalPages: number, currentPage: number, totalResults: number }> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (category && category !== 'all') {
        params.set('category', category);
    }
    // if (query) {
    //     params.set('q', query);
    // }

    console.log(`[BlogsPage] Fetching posts from API: /api/posts?${params.toString()}`);
    try {
        const response = await fetch(`/api/posts?${params.toString()}`);
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText}. Details: ${errorData}`);
        }
        const data = await response.json();
        console.log("[BlogsPage] API Response:", data);

        // Ensure posts array exists and convert date strings
        const posts = (data.posts || []).map((post: any) => ({
             ...post,
             publishedAt: new Date(post.publishedAt),
             updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
             // Ensure nested author has date object if present
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
             totalPages: data.totalPages ?? 1,
             currentPage: data.currentPage ?? page,
             totalResults: data.totalResults ?? 0,
         };
    } catch (error) {
        console.error("[BlogsPage] Error fetching posts:", error);
        throw error; // Re-throw to be caught by the caller
    }
};


export default function BlogsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0); // Page index (0-based)
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // State for loading more in infinite scroll
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [usePagination, setUsePagination] = useState(false); // Default to infinite scroll
  const [totalPages, setTotalPages] = useState(1);
  const observer = useRef<IntersectionObserver>();
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useAuth();

  const loadPosts = useCallback(async (pageNum: number, category: string, pagination: boolean, append: boolean = false) => {
     if (!append) {
        setLoading(true); // Show main loading skeleton only when not appending
     } else {
        setLoadingMore(true); // Show loading indicator for infinite scroll
     }

     try {
        const { posts: newPosts, hasMore: newHasMore, totalPages: newTotalPages } = await fetchPostsFromApi(pageNum, 9, category /* Add query here if needed */);

        if (append && !pagination) {
            setPosts(prevPosts => [...prevPosts, ...newPosts]);
        } else {
            setPosts(newPosts); // Replace posts for new page/category/pagination mode
        }

        setPage(pageNum); // Update current page index
        setHasMore(newHasMore);
        setTotalPages(newTotalPages);

     } catch (error) {
          console.error("[BlogsPage] Failed to load posts:", error);
          toast({
             title: "Error Loading Posts",
             description: error instanceof Error ? error.message : "Could not fetch posts.",
             variant: "destructive",
          });
          // Decide how to handle errors - stop loading more? clear posts?
          if (!append) setPosts([]); // Clear posts on initial load error
          setHasMore(false); // Stop further loading attempts on error
     } finally {
         setLoading(false);
         setLoadingMore(false);
         console.log(`[BlogsPage] Finished loading: page=${pageNum}, category=${category}, append=${append}`);
     }
  }, [toast]); // Include toast in dependencies

  // Initial load and changes in category/pagination mode
  useEffect(() => {
     console.log(`[BlogsPage] Effect triggered. Category: ${selectedCategory}, Pagination: ${usePagination}`);
     // Reload data from page 0 when component mounts or when category/pagination mode changes
     loadPosts(0, selectedCategory, usePagination, false);
  }, [selectedCategory, usePagination, loadPosts]); // Reload when these dependencies change


  const handleCategoryChange = (value: string) => {
    console.log(`[BlogsPage] Category changed to: ${value}`);
    setSelectedCategory(value);
    // Reset page to 0 and trigger reload via useEffect
    setPage(0);
  };

  const handlePaginationModeChange = (checked: boolean) => {
    console.log(`[BlogsPage] Pagination mode changed to: ${checked ? 'Pagination' : 'Infinite Scroll'}`);
    setUsePagination(checked);
    // Reset page to 0 and trigger reload via useEffect
     setPage(0);
  };

  const handlePageChange = (newPage: number) => {
     if (newPage >= 0 && newPage < totalPages && usePagination) {
        console.log(`[BlogsPage] Pagination: changing to page ${newPage}`);
        // Don't append when using pagination controls
       loadPosts(newPage, selectedCategory, usePagination, false);
     }
   };

  // Intersection observer for infinite scroll
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    // Only run setup if using infinite scroll
    if (usePagination) {
       if (observer.current) observer.current.disconnect(); // Disconnect if switching away from infinite
       return;
    }
    if (loading || loadingMore) return; // Don't observe if loading
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        console.log("[BlogsPage] Infinite scroll trigger: loading next page.");
        // Load next page by appending
        loadPosts(page + 1, selectedCategory, usePagination, true);
      }
    });

    if (node) observer.current.observe(node);

  }, [loading, loadingMore, hasMore, usePagination, page, selectedCategory, loadPosts]);


  const renderPaginationControls = () => {
      if (!usePagination || totalPages <= 1 || loading) return null;

      const pages = [];
      const maxVisiblePages = 5; // Example: Show 5 page links max (1 ... 3 4 5 ... 10)

      // Previous Button
      pages.push(
        <PaginationItem key="prev">
          <PaginationPrevious
            href="#"
            onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }}
            className={page === 0 ? "pointer-events-none opacity-50" : ""}
            aria-disabled={page === 0}
          />
        </PaginationItem>
      );

      // Page Links Logic (simplified example, can be enhanced)
       if (totalPages <= maxVisiblePages) {
         for (let i = 0; i < totalPages; i++) {
           pages.push(
             <PaginationItem key={i}>
               <PaginationLink
                 href="#"
                 onClick={(e) => { e.preventDefault(); handlePageChange(i); }}
                 isActive={page === i}
                 aria-current={page === i ? 'page' : undefined}
               >
                 {i + 1}
               </PaginationLink>
             </PaginationItem>
           );
         }
       } else {
         // Always show first page
         pages.push(
           <PaginationItem key={0}>
             <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(0); }} isActive={page === 0}>1</PaginationLink>
           </PaginationItem>
         );

         // Ellipsis after first page if needed
         if (page > 2) {
           pages.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
         }

         // Central pages
         const startPage = Math.max(1, page - 1);
         const endPage = Math.min(totalPages - 2, page + 1);
         for (let i = startPage; i <= endPage; i++) {
            if (i > 0 && i < totalPages -1) { // Ensure middle pages are not first/last
               pages.push(
                 <PaginationItem key={i}>
                   <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={page === i}>
                     {i + 1}
                   </PaginationLink>
                 </PaginationItem>
               );
            }
         }

          // Ellipsis before last page if needed
          if (page < totalPages - 3) {
              pages.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
          }

          // Always show last page
          pages.push(
              <PaginationItem key={totalPages - 1}>
                  <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages - 1); }} isActive={page === totalPages - 1}>{totalPages}</PaginationLink>
              </PaginationItem>
          );
       }


      // Next Button
      pages.push(
        <PaginationItem key="next">
          <PaginationNext
            href="#"
            onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }}
            className={!hasMore || page === totalPages - 1 ? "pointer-events-none opacity-50" : ""} // Disable based on hasMore
            aria-disabled={!hasMore || page === totalPages - 1}
          />
        </PaginationItem>
      );

      return (
        <Pagination className="mt-12">
          <PaginationContent>
            {pages}
          </PaginationContent>
        </Pagination>
      );
    };


  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">All Blog Posts</h1>
         {currentUser && (
             <Button asChild>
               <Link href="/admin/create-post">
                   <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Post
               </Link>
             </Button>
          )}
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
           <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Switch
              id="pagination-mode"
              checked={usePagination}
              onCheckedChange={handlePaginationModeChange}
            />
            <Label htmlFor="pagination-mode" className="text-sm whitespace-nowrap">Use Pagination</Label>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
           // Loading Skeleton
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
      ) : posts.length > 0 ? (
           // Display Posts Grid
           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {posts.map((post, index) => {
               // Attach ref to the last element only if using infinite scroll
               if (!usePagination && posts.length === index + 1) {
                 return (
                   <div ref={lastPostElementRef} key={post.id}>
                     <BlogPostCard post={post} />
                   </div>
                 );
               } else {
                 return <BlogPostCard key={post.id} post={post} />;
               }
             })}
              {/* Infinite Scroll Loading Skeletons */}
              {!usePagination && loadingMore && Array.from({ length: 3 }).map((_, i) => (
                  <div key={`loading-more-skeleton-${i}`} className="space-y-3">
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
             // No Posts Message
              <p className="text-center text-muted-foreground mt-12 col-span-full">
                No posts found matching your criteria.
              </p>
          )}

       {/* Infinite Scroll End Message */}
       {!usePagination && !loadingMore && !hasMore && posts.length > 0 && (
         <p className="text-center text-muted-foreground mt-12 col-span-full">You've reached the end!</p>
       )}

      {/* Pagination Controls */}
      {renderPaginationControls()}

    </div>
  );
}
