
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BlogPostCard from '@/components/blog-post-card';
import { Twitter, Linkedin, Globe, CalendarDays } from 'lucide-react'; // Added CalendarDays
import { useToast } from "@/hooks/use-toast";
import type { AuthUser } from '@/lib/auth/authContext'; // Import AuthUser for profile type
import type { Post } from '@/types/blog'; // Import Post type
import { format, isValid } from 'date-fns'; // Import isValid

interface AuthorPageData {
  profile: Partial<AuthUser> & { joinedAt?: Date | string }; // Use partial AuthUser + joinedAt
  posts: Post[];
}

// Fetch author details and posts from the new public profile API
const fetchAuthorPageData = async (authorId: string): Promise<AuthorPageData | null> => {
    console.log(`[Author Page] Fetching data for authorId: ${authorId}`);
    try {
        const response = await fetch(`/api/profile/${authorId}`);
        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`[Author Page] Author not found (404) for ID: ${authorId}`);
                return null;
            }
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        const data: any = await response.json();

        // Convert date strings to Date objects AFTER fetching
        const profile = {
            ...data.profile,
            joinedAt: data.profile?.joinedAt ? new Date(data.profile.joinedAt) : undefined,
            // Note: dob and phone should only be present if the requester is admin,
            // but we don't need them for the public author page display.
        };

        const posts = (data.posts || []).map((post: any) => ({
            ...post,
            publishedAt: new Date(post.publishedAt),
            updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
            // Ensure the nested author object also has joinedAt as Date if present
            author: {
                ...post.author,
                joinedAt: post.author?.joinedAt ? new Date(post.author.joinedAt) : undefined,
            },
             views: post.views ?? 0, // Ensure views exists
             reactions: post.reactions || {}, // Ensure reactions exists
        }));


        console.log(`[Author Page] Data fetched successfully for authorId: ${authorId}`);
        return { profile, posts };
    } catch (error) {
        console.error(`[Author Page] Error fetching data for authorId ${authorId}:`, error);
        return null;
    }
};


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
  // Assume the slug is the author's ID for this mock setup
  const authorId = params.slug as string;
  const router = useRouter();
  const [authorData, setAuthorData] = useState<AuthorPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch Author Details and Posts
  useEffect(() => {
    if (!authorId) return;
    setLoading(true);
    fetchAuthorPageData(authorId)
      .then(data => {
        setAuthorData(data);
        if (!data) {
            toast({ title: "Error", description: "Author not found.", variant: "destructive" });
             // Redirect to a 404 page or author list
             // router.push('/404');
        }
      })
      .catch(err => {
          console.error("Failed to load author page data:", err);
          toast({ title: "Error", description: "Could not load author details and posts.", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [authorId, toast, router]);


  if (loading) {
    return <AuthorSkeleton />;
  }

  if (!authorData || !authorData.profile) {
    // Already handled by toast in useEffect, but keep fallback UI
    return <div className="container mx-auto py-8 text-center">Author not found or failed to load.</div>;
  }

  const { profile, posts } = authorData;

  // Use optional chaining and provide defaults
  const authorName = profile.name || 'Unnamed Author';
  const authorAvatar = profile.photoURL || `https://i.pravatar.cc/150?u=${profile.id || 'unknown'}`;
  // const authorBio = profile.bio || 'No biography provided.'; // Assuming bio isn't in AuthUser yet
  const authorBio = `Read posts by ${authorName}.`; // Placeholder bio
  const joinedDate = profile.joinedAt instanceof Date ? profile.joinedAt : new Date(profile.joinedAt || Date.now());


  return (
    <div className="container mx-auto py-12">
       {/* Author Header */}
      <Card className="mb-12 overflow-hidden bg-gradient-to-br from-card to-card/80">
        <CardContent className="p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary flex-shrink-0">
              <AvatarImage src={authorAvatar} alt={authorName} />
              <AvatarFallback>{authorName.substring(0, 2)}</AvatarFallback>
            </Avatar>
           <div className="text-center md:text-left">
               <h1 className="text-3xl md:text-4xl font-bold mb-2">{authorName}</h1>
               <p className="text-muted-foreground mb-1">{authorBio}</p>
                <p className="text-xs text-muted-foreground mb-4 flex items-center justify-center md:justify-start gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Joined {isValid(joinedDate) ? format(joinedDate, 'MMMM yyyy') : 'Unknown'}
                </p>
               {/* TODO: Add social links back if they become part of AuthUser or fetched separately */}
               {/* <div className="flex justify-center md:justify-start items-center gap-3">
                   {author.socialLinks.map(link => ( ... ))}
                    {author.website && ( ... )}
               </div> */}
           </div>
        </CardContent>
      </Card>

      {/* Author Posts */}
      <h2 className="text-2xl font-bold mb-8 text-center md:text-left">Posts by {authorName}</h2>
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
           ))}
        </div>
        ) : (
             <p className="text-center text-muted-foreground mt-8">No posts found for this author yet.</p>
        )}
    </div>
  );
}
