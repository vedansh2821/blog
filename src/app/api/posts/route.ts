'use server';

import { NextResponse } from 'next/server';
import { createPost, findPosts } from '@/lib/db/mock-sql'; // Use mock SQL DB functions
// Removed getUserFromRequest import as we'll get ID from client for now

// GET function remains largely the same but uses findPosts from mock-sql
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const requestedLimit = parseInt(searchParams.get('limit') || '9');
    const category = searchParams.get('category') || undefined; // Pass undefined if null/empty
    const authorId = searchParams.get('author') || undefined; // Changed from authorSlug to authorId
    const searchQuery = searchParams.get('q') || undefined; // Pass undefined if null/empty

    console.log(`[API GET /api/posts]: page=${page}, limit=${requestedLimit}, category=${category}, authorId=${authorId}, q=${searchQuery}`);

    try {
        // Ensure findPosts uses authorId for filtering
        const results = await findPosts({
            page,
            limit: requestedLimit,
            category,
            authorId: authorId, // Pass authorId directly
            query: searchQuery,
        });

        // Ensure dates are ISO strings for JSON compatibility
        const responseData = {
            ...results,
            posts: results.posts.map(post => ({
                ...post,
                publishedAt: new Date(post.publishedAt).toISOString(),
                updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
                 // Ensure author dates are handled
                 author: {
                    ...post.author,
                    joinedAt: post.author.joinedAt instanceof Date ? post.author.joinedAt.toISOString() : post.author.joinedAt,
                 }
            }))
        };


        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json({ error: 'Failed to fetch posts', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

// POST function updated for mock SQL DB and authentication
export async function POST(request: Request) {
    console.log(`[API POST /api/posts] Received request`);
    try {
        // --- Get Request Body ---
        const body = await request.json();
        // Extract all relevant fields including structured content
        const { requestingUserId, title, category, excerpt, imageUrl, tags, heading, subheadings, paragraphs } = body;

        // --- Basic Validation ---
        if (!requestingUserId) {
            console.error(`[API POST /api/posts] Error: Missing requestingUserId in request body.`);
            return NextResponse.json({ error: 'Unauthorized: Missing user identification.' }, { status: 401 });
        }
        if (!title || !category) {
            console.error(`[API POST /api/posts] Error: Missing required fields (title, category).`);
             return NextResponse.json({ error: 'Missing required fields (title, category)' }, { status: 400 });
        }
         // Validate structured content presence: require heading OR paragraphs
         if (!heading && (!paragraphs || !Array.isArray(paragraphs) || paragraphs.length === 0)) {
             console.error(`[API POST /api/posts] Error: Missing required content structure (heading or paragraphs).`);
             return NextResponse.json({ error: 'Post must contain at least a main heading or paragraphs.' }, { status: 400 });
         }


        // Prepare data for mock DB function, including structured fields
        const newPostData = {
            title,
            category,
            authorId: requestingUserId, // Use the authenticated user's ID
            excerpt, // Pass excerpt if provided
            imageUrl, // Pass imageUrl if provided
            tags: Array.isArray(tags) ? tags : [], // Ensure tags is an array
            heading: heading || title, // Use title as fallback heading if needed
            subheadings: Array.isArray(subheadings) ? subheadings : [], // Ensure subheadings is an array
            paragraphs: Array.isArray(paragraphs) ? paragraphs : [], // Ensure paragraphs is an array
             // `content` will be constructed within the `createPost` function from these fields
        };

        // --- Create post using mock DB function ---
        const createdPost = await createPost(newPostData); // Ensure createPost is awaited

        console.log(`[API POST /api/posts] New post created: ${createdPost.id} (Slug: ${createdPost.slug}) by user ${requestingUserId}`);

        // Ensure dates are ISO strings for JSON compatibility
        const responseData = {
            ...createdPost,
            publishedAt: new Date(createdPost.publishedAt).toISOString(),
            updatedAt: createdPost.updatedAt ? new Date(createdPost.updatedAt).toISOString() : undefined,
             author: {
                ...createdPost.author,
                joinedAt: createdPost.author.joinedAt instanceof Date ? createdPost.author.joinedAt.toISOString() : createdPost.author.joinedAt,
             }
        };

        return NextResponse.json(responseData, { status: 201 });

    } catch (error) {
        console.error("[API POST /api/posts] Error creating post:", error);
        // Handle specific errors like author not found if createPost throws them
        if (error instanceof Error && error.message.includes('Author not found')) {
            return NextResponse.json({ error: 'Invalid author specified.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create post', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
