
// src/types/blog.ts

export type ReactionType = 'like' | 'love' | 'laugh' | 'frown' | 'angry';

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
    content: string; // Primary field for blog content (e.g., Markdown, HTML)
    imageUrl: string;
    category: string;
    author: Author; // Embed full author details
    publishedAt: Date | string; // Can be Date object or ISO string
    updatedAt?: Date | string; // Optional last updated date
    commentCount: number;
    tags: string[]; // Ensure tags is always an array
    rating?: number; // Optional average rating
    views: number; // Add view count - make it non-optional for simplicity or default to 0
    excerpt: string; // Ensure excerpt is always present
    reactions: Record<ReactionType, number>; // Add reactions count
    // Keep structured fields potentially for rendering or backend processing, but 'content' is primary
    heading?: string; // Optional: Can be derived from content
    subheadings?: string[]; // Optional: Can be derived from content
    paragraphs?: string[]; // Optional: Can be derived from content
}

// RelatedPost type omits full content and some details for brevity in listings
export interface RelatedPost extends Omit<Post, 'content' | 'updatedAt' | 'author' | 'heading' | 'subheadings' | 'paragraphs' | 'reactions'> {
    author: Pick<Author, 'id' | 'name' | 'avatarUrl' | 'slug'>; // Only basic author info
}

// Type for storing individual reactions
export interface UserReaction {
    postId: string;
    userId: string;
    type: ReactionType;
    timestamp: Date;
}

