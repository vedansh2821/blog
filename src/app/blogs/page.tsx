
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import BlogPostCard from '@/components/blog-post-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";


// Mock categories
const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'technology', label: 'Technology' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'health', label: 'Health' },
  { value: 'travel', label: 'Travel' },
];

// Mock data fetching function (adapt for filtering and pagination)
const fetchFilteredPosts = async (page: number, limit: number = 9, category: string = 'all', usePagination: boolean = false) => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

  const allPosts = Array.from({ length: 50 }).map((_, index) => ({ // Generate more posts for filtering/pagination
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

  const filteredPosts = category === 'all'
    ? allPosts
    : allPosts.filter(post => post.category.toLowerCase() === category);

  const totalPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalPosts / limit);
  const startIndex = page * limit;
  const endIndex = startIndex + limit;
  const posts = filteredPosts.slice(startIndex, endIndex);

  const hasMore = usePagination ? page < totalPages - 1 : endIndex < totalPosts;

  return { posts, hasMore, totalPages, currentPage: page };
};


export default function BlogsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(0); // Page index (0-based)
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [usePagination, setUsePagination] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const observer = useRef<IntersectionObserver>();
  const isInitialMount = useRef(true);

  const loadPosts = useCallback(async (pageNum: number, category: string, pagination: boolean, append: boolean = false) => {
    setLoading(true);
    const { posts: newPosts, hasMore: newHasMore, totalPages: newTotalPages } = await fetchFilteredPosts(pageNum, 9, category, pagination);

    if (append && !pagination) {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
    } else {
        setPosts(newPosts);
    }

    setPage(pageNum);
    setHasMore(newHasMore);
    setTotalPages(newTotalPages);
    setLoading(false);
  }, []);

  // Initial load and category/pagination mode change
  useEffect(() => {
    // Prevent initial double load on strict mode
    if (isInitialMount.current) {
        isInitialMount.current = false;
         loadPosts(0, selectedCategory, usePagination, false);
        return;
    }
     loadPosts(0, selectedCategory, usePagination, false);
  }, [selectedCategory, usePagination, loadPosts]);


  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    // Reset page to 0 when category changes
    setPage(0);
  };

  const handlePaginationChange = (newPage: number) => {
     if (newPage >= 0 && newPage < totalPages) {
       loadPosts(newPage, selectedCategory, usePagination, false);
     }
   };

  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || usePagination) return; // Don't observe if loading or using pagination
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        // Load next page by appending
        loadPosts(page + 1, selectedCategory, usePagination, true);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, usePagination, page, selectedCategory, loadPosts]);

  const renderPagination = () => {
      if (!usePagination || totalPages <= 1) return null;

      const pages = [];
      const maxVisiblePages = 5; // Example: Show 5 page links max (1 ... 3 4 5 ... 10)

      // Previous Button
      pages.push(
        <PaginationItem key="prev">
          <PaginationPrevious
            href="#"
            onClick={(e) => { e.preventDefault(); handlePaginationChange(page - 1); }}
            className={page === 0 ? "pointer-events-none opacity-50" : ""}
            aria-disabled={page === 0}
          />
        </PaginationItem>
      );

      // Page Links
      if (totalPages <= maxVisiblePages) {
          for (let i = 0; i < totalPages; i++) {
              pages.push(
                  <PaginationItem key={i}>
                      <PaginationLink
                          href="#"
                          onClick={(e) => { e.preventDefault(); handlePaginationChange(i); }}
                          isActive={page === i}
                          aria-current={page === i ? 'page' : undefined}
                      >
                          {i + 1}
                      </PaginationLink>
                  </PaginationItem>
              );
          }
      } else {
          // Logic for ellipsis (...)
          pages.push( // First page
              <PaginationItem key={0}>
                  <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePaginationChange(0); }} isActive={page === 0}>1</PaginationLink>
              </PaginationItem>
          );

          let startPage = Math.max(1, page - 1);
          let endPage = Math.min(totalPages - 2, page + 1);

          if (page < 3) { // Near the beginning
              startPage = 1;
              endPage = 3;
          } else if (page > totalPages - 4) { // Near the end
              startPage = totalPages - 4;
              endPage = totalPages - 2;
          }

          if (startPage > 1) {
              pages.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
          }

          for (let i = startPage; i <= endPage; i++) {
              pages.push(
                  <PaginationItem key={i}>
                      <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePaginationChange(i); }} isActive={page === i}>
                          {i + 1}
                      </PaginationLink>
                  </PaginationItem>
              );
          }

          if (endPage < totalPages - 2) {
              pages.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
          }

           pages.push( // Last page
                <PaginationItem key={totalPages - 1}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePaginationChange(totalPages - 1); }} isActive={page === totalPages - 1}>{totalPages}</PaginationLink>
                </PaginationItem>
            );

      }


      // Next Button
      pages.push(
        <PaginationItem key="next">
          <PaginationNext
            href="#"
            onClick={(e) => { e.preventDefault(); handlePaginationChange(page + 1); }}
            className={page === totalPages - 1 ? "pointer-events-none opacity-50" : ""}
            aria-disabled={page === totalPages - 1}
          />
        </PaginationItem>
      );

      return (
        <Pagination className="mt-8">
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
              onCheckedChange={setUsePagination}
            />
            <Label htmlFor="pagination-mode" className="text-sm">Use Pagination</Label>
          </div>
        </div>
      </div>

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
        {loading && Array.from({ length: 6 }).map((_, i) => (
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

       {/* Infinite Scroll Loading/End Message */}
       {!usePagination && loading && posts.length > 0 && (
         <p className="text-center text-muted-foreground mt-8">Loading more posts...</p>
       )}
       {!usePagination && !loading && !hasMore && posts.length > 0 && (
         <p className="text-center text-muted-foreground mt-8">You've reached the end!</p>
       )}

      {/* Pagination */}
      {renderPagination()}


      {!loading && posts.length === 0 && (
        <p className="text-center text-muted-foreground mt-8 col-span-1 sm:col-span-2 lg:col-span-3">
          No posts found matching your criteria.
        </p>
      )}
    </div>
  );
}
