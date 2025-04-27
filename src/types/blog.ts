// src/types/blog.ts

export interface Author {
    id: string;
    name: string;
    slug: string; // Usually derived from name or a unique ID
    avatarUrl: string;
    bio?: string; // Optional bio
    socialLinks?: { platform: string; url: string }[]; // Optional social links
    website?: string; // Optional website
}

export interface Comment {
    id: string;
    postId: string; // Link back to the post
    author: Pick<Author, 'id' | 'name' | 'avatarUrl' | 'slug'>; // Embed basic author info
    timestamp: Date | string; // Can be Date object or ISO string
    content: string;
    replies: Comment[];
    likes?: number; // Optional likes count
}

export interface Post {
    id: string;
    title: string;
    slug: string;
    content: string; // Assuming HTML content
    imageUrl: string;
    category: string;
    author: Author; // Embed full author details
    publishedAt: Date | string; // Can be Date object or ISO string
    updatedAt?: Date | string; // Optional last updated date
    commentCount: number;
    tags?: string[];
    rating?: number; // Optional average rating
    views?: number; // Optional view count
    excerpt: string; // Ensure excerpt is always present
}

// Often similar to Post, but might omit 'content' for brevity
export interface RelatedPost extends Omit<Post, 'content' | 'tags' | 'rating' | 'views' | 'updatedAt' | 'author'> {
   author: Pick<Author, 'id' | 'name' | 'avatarUrl' | 'slug'>; // Only basic author info needed for cards
}
