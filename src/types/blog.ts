// src/types/blog.ts

export interface Author {
    id: string;
    name: string;
    slug: string; // Usually derived from name or a unique ID
    avatarUrl: string;
    bio?: string; // Optional bio
    socialLinks?: { platform: string; url: string }[]; // Optional social links
    website?: string; // Optional website
    joinedAt: Date | string; // Date the user joined
    role?: 'user' | 'admin'; // Add role to Author type (optional)
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
    content: string; // HTML content, potentially constructed
    imageUrl: string;
    category: string;
    author: Author; // Embed full author details
    publishedAt: Date | string; // Can be Date object or ISO string
    updatedAt?: Date | string; // Optional last updated date
    commentCount: number;
    tags: string[]; // Ensure tags is always an array
    rating?: number; // Optional average rating
    views?: number; // Optional view count
    excerpt: string; // Ensure excerpt is always present
    heading: string; // Always present (can fallback to title)
    subheadings: string[]; // Always present (can be empty array)
    paragraphs: string[]; // Always present (can be empty array)
}

// RelatedPost type omits full content and some details for brevity in listings
export interface RelatedPost extends Omit<Post, 'content' | 'updatedAt' | 'author' | 'heading' | 'subheadings' | 'paragraphs'> {
    author: Pick<Author, 'id' | 'name' | 'avatarUrl' | 'slug'>; // Only basic author info
}
