import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, MessageSquare, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BlogPostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    imageUrl: string;
    category: string;
    author: {
      name: string;
      avatarUrl: string;
    };
    publishedAt: Date;
    commentCount: number;
  };
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/blogs/${post.slug}` : `/blogs/${post.slug}`;
  const shareTitle = post.title;

  return (
    <Card className="group overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={false} // Lazy load by default
            loading="lazy" // Explicitly set lazy loading
          />
           <Badge variant="secondary" className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm">
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
           <div className="flex items-center gap-1">
             <Link href={`/authors/${post.author.name.toLowerCase().replace(' ', '-')}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{post.author.name}</span>
              </Link>
           </div>
           <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <time dateTime={post.publishedAt.toISOString()}>
                {format(post.publishedAt, 'MMM d, yyyy')}
              </time>
            </div>
           <div className="flex items-center gap-1">
             <MessageSquare className="h-3 w-3" />
             <span>{post.commentCount}</span>
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
            <DropdownMenuItem
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
              className="cursor-pointer"
            >
              <Facebook className="mr-2 h-4 w-4" />
              <span>Facebook</span>
            </DropdownMenuItem>
            <DropdownMenuItem
               onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank')}
               className="cursor-pointer"
            >
              <Twitter className="mr-2 h-4 w-4" />
              <span>Twitter</span>
            </DropdownMenuItem>
            <DropdownMenuItem
               onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`, '_blank')}
               className="cursor-pointer"
            >
              <Linkedin className="mr-2 h-4 w-4" />
              <span>LinkedIn</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </CardFooter>
    </Card>
  );
}
