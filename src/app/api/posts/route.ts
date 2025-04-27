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
        // Expect the body to contain post data AND the ID of the user making the request
        const body = await request.json();
        const { requestingUserId, title, category, excerpt, imageUrl, tags, heading, subheadings, paragraphs } = body; // Removed 'content' from here

        // --- Basic Validation ---
        if (!requestingUserId) {
            console.error(`[API POST /api/posts] Error: Missing requestingUserId in request body.`);
            return NextResponse.json({ error: 'Unauthorized: Missing user identification.' }, { status: 401 });
        }
        if (!title || !category) {
            console.error(`[API POST /api/posts] Error: Missing required fields (title, category).`);
             return NextResponse.json({ error: 'Missing required fields (title, category)' }, { status: 400 });
        }
         // Validate structured content presence if needed - e.g., at least paragraphs or a heading
         if (!heading && (!paragraphs || paragraphs.length === 0)) {
             console.error(`[API POST /api/posts] Error: Missing required content structure (heading or paragraphs).`);
             return NextResponse.json({ error: 'Post must contain at least a main heading or paragraphs.' }, { status: 400 });
         }


        // Prepare data for mock DB function, using requestingUserId as the authorId
        // Pass the structured data directly; createPost will handle content construction.
        const newPostData = {
            title,
            category,
            authorId: requestingUserId, // Use the authenticated user's ID
            excerpt, // Pass excerpt if provided
            imageUrl, // Pass imageUrl if provided
            tags, // Pass tags if provided
            heading, // Pass raw heading
            subheadings, // Pass raw subheadings array
            paragraphs, // Pass raw paragraphs array
             // content: constructedContent, // Let createPost handle this based on structure
        };

        // --- Create post using mock DB function ---
         // Set addUniqueSuffix to false for now to match seeded data slugs if title is the same
        const createdPost = await createPost(newPostData); // Ensure createPost is awaited

        console.log(`[API POST /api/posts] New post created: ${createdPost.id} (Slug: ${createdPost.slug}) by user ${requestingUserId}`);

        // Ensure dates are ISO strings for JSON compatibility
        const responseData = {
            ...createdPost,
            publishedAt: new Date(createdPost.publishedAt).toISOString(),
            updatedAt: createdPost.updatedAt ? new Date(createdPost.updatedAt).toISOString() : undefined,
             // Ensure author dates are handled
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
