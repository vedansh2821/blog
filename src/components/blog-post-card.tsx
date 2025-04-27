import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MessageSquare, Share2, Facebook, Twitter, Linkedin, Award } from 'lucide-react'; // Added Award icon
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Post } from '@/types/blog'; // Import the Post type
import { cn } from '@/lib/utils'; // Import cn


interface BlogPostCardProps {
  post: Post; // Use the imported Post type
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/blogs/${post.slug}` : `/blogs/${post.slug}`;
  const shareTitle = post.title;

  // Ensure publishedAt is a Date object for formatting
   const publishedDate = post.publishedAt instanceof Date ? post.publishedAt : new Date(post.publishedAt);

   // Determine if the author is an admin to display the badge
   const isAdminAuthor = post.author?.role === 'admin';

  return (
    <Card className="group overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full overflow-hidden">
          <Link href={`/blogs/${post.slug}`} className="block h-full w-full">
             <Image
                src={post.imageUrl || `https://picsum.photos/seed/${post.id}/600/400`} // Provide fallback image
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={false}
                loading="lazy"
              />
          </Link>
           <Badge variant="secondary" className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm pointer-events-none">
             {post.category}
           </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-2 leading-tight">
          <Link href={`/blogs/${post.slug}`} className="hover:text-primary transition-colors">
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {post.excerpt}
        </CardDescription>
         <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
           {/* Author Link with Badge */}
           {post.author && (
             <div className="flex items-center gap-1">
               <Link href={`/authors/${post.author.slug}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                    <AvatarFallback>{post.author.name?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                  <span className={cn(isAdminAuthor && "font-medium")}>{post.author.name || 'Unknown'}</span>
                   {/* Admin Author Badge */}
                   {isAdminAuthor && (
                       <Award className="h-3 w-3 text-destructive" title="Admin Author" />
                   )}
                </Link>
             </div>
           )}
           {/* Date */}
           <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <time dateTime={publishedDate.toISOString()}>
                 {/* Check if publishedDate is valid before formatting */}
                {isValid(publishedDate) ? format(publishedDate, 'MMM d, yyyy') : 'Invalid Date'}
              </time>
            </div>
           {/* Comment Count */}
           <div className="flex items-center gap-1">
             <MessageSquare className="h-3 w-3" />
             <span>{post.commentCount ?? 0}</span> {/* Use nullish coalescing for default */}
           </div>
         </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Button asChild variant="link" size="sm" className="p-0 h-auto text-primary hover:underline">
          <Link href={`/blogs/${post.slug}`}>
            Read More
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-4 w-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share post</span>
              </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')} className="cursor-pointer"> <Facebook className="mr-2 h-4 w-4" /> <span>Facebook</span> </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank')} className="cursor-pointer"> <Twitter className="mr-2 h-4 w-4" /> <span>Twitter</span> </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`, '_blank')} className="cursor-pointer"> <Linkedin className="mr-2 h-4 w-4" /> <span>LinkedIn</span> </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </CardFooter>
    </Card>
  );
}

// Helper function to check if a date is valid
function isValid(date: Date) {
  return date instanceof Date && !isNaN(date.getTime());
}

