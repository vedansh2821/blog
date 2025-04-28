'use server';

import { NextResponse } from 'next/server';
import { findPostBySlug, updatePost, deletePost } from '@/lib/db/mock-sql'; // Use mock SQL DB functions
// Removed getUserFromRequest import as we'll get ID from client for now

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    const slug = params.slug;
    console.log(`[API GET /api/posts/${slug}] Received request for slug: "${slug}"`); // Added quotes for clarity

    try {
        // Use case-insensitive search in the mock DB
        const postData = await findPostBySlug(slug);

        if (!postData) {
            console.warn(`[API GET /api/posts/${slug}]: Post not found for slug "${slug}".`);
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }
        console.log(`[API GET /api/posts/${slug}]: Found post: ID ${postData.id}, Title: ${postData.title}`); // Log success
        // Ensure dates are ISO strings for JSON compatibility
        const responseData = {
            ...postData,
            publishedAt: new Date(postData.publishedAt).toISOString(),
            updatedAt: postData.updatedAt ? new Date(postData.updatedAt).toISOString() : undefined,
             // Ensure author dates are also handled if necessary, though createAuthorObject should return Date
             author: {
                ...postData.author,
                joinedAt: postData.author.joinedAt instanceof Date ? postData.author.joinedAt.toISOString() : postData.author.joinedAt,
             }
        };


        return NextResponse.json(responseData);
    } catch (error) {
        console.error(`[API GET /api/posts/${slug}] Error fetching post:`, error);
        return NextResponse.json({ error: 'Failed to fetch post', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}


export async function PUT(
    request: Request,
    { params }: { params: { slug: string } }
) {
    const slug = params.slug;
    console.log(`[API PUT /api/posts/${slug}] Received request`);

    try {
        // --- Get Request Body ---
        const body = await request.json();
        const { requestingUserId, ...updateData } = body; // Separate user ID from post data
        const { title, category, excerpt, imageUrl, tags, heading, subheadings, paragraphs } = updateData;

        // --- Basic Validation ---
        if (!requestingUserId) {
            console.error(`[API PUT /api/posts/${slug}] Error: Missing requestingUserId in request body.`);
            return NextResponse.json({ error: 'Unauthorized: Missing user identification.' }, { status: 401 });
        }
        if (!title || !category) {
            console.error(`[API PUT /api/posts/${slug}] Error: Missing required fields (title, category).`);
            return NextResponse.json({ error: 'Missing required fields (title, category)' }, { status: 400 });
        }
         // Validate structured content presence if needed
         if (!heading && (!paragraphs || paragraphs.length === 0)) {
             console.error(`[API PUT /api/posts/${slug}] Error: Missing required content structure (heading or paragraphs).`);
             return NextResponse.json({ error: 'Post must contain at least a main heading or paragraphs.' }, { status: 400 });
         }


        // Prepare data for mock DB function
        // The updatePost function in mock-sql will handle content construction based on these fields
        const updatePayload = {
            title,
            category,
            heading, // Send raw heading
            subheadings: Array.isArray(subheadings) ? subheadings : [], // Ensure it's an array
            paragraphs: Array.isArray(paragraphs) ? paragraphs : [],   // Ensure it's an array
            // content is reconstructed in updatePost, no need to send it here unless explicitly needed
            excerpt,
            imageUrl,
            tags: Array.isArray(tags) ? tags : [], // Ensure tags is an array
            requestingUserId // For authorization check
        };

        console.log(`[API PUT /api/posts/${slug}] Payload for updatePost function:`, updatePayload);


        // --- Call DB Update with Authorization ---
        const updatedPost = await updatePost(slug, updatePayload); // Send the correct payload

        if (!updatedPost) {
            // updatePost returns null if not found or unauthorized
            console.warn(`[API PUT /api/posts/${slug}] Update failed: Post not found or authorization failed for user ${requestingUserId}.`);
             return NextResponse.json({ error: 'Post not found or you are not authorized to edit it.' }, { status: 404 });
        }

        // Ensure dates are ISO strings for JSON compatibility
        const responseData = {
            ...updatedPost,
            publishedAt: new Date(updatedPost.publishedAt).toISOString(),
            updatedAt: updatedPost.updatedAt ? new Date(updatedPost.updatedAt).toISOString() : undefined,
            author: {
                ...updatedPost.author,
                joinedAt: updatedPost.author.joinedAt instanceof Date ? updatedPost.author.joinedAt.toISOString() : updatedPost.author.joinedAt,
             }
        };

        console.log(`[API PUT /api/posts/${slug}] Post updated successfully by user ${requestingUserId}. New slug: ${responseData.slug}`);
        return NextResponse.json({ message: 'Post updated successfully', post: responseData });

    } catch (error) {
        console.error(`[API PUT /api/posts/${slug}] Error updating post:`, error);
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized: You do not have permission to edit this post.' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to update post', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { slug: string } }
) {
    const slug = params.slug;
    console.log(`[API DELETE /api/posts/${slug}] Received request`);


    try {
        // --- Get Requesting User ID ---
        // Use secure method (e.g., session/token) in production
        const requestingUserId = request.headers.get('X-Requesting-User-ID');

        if (!requestingUserId) {
            console.error(`[API DELETE /api/posts/${slug}] Error: Missing X-Requesting-User-ID header.`);
            return NextResponse.json({ error: 'Unauthorized: Missing user identification.' }, { status: 401 });
        }

        console.log(`[API DELETE /api/posts/${slug}] Attempting delete by user: ${requestingUserId}`);

        // --- Call DB Delete with Authorization ---
        const deleted = await deletePost(slug, requestingUserId);

        if (!deleted) {
            // deletePost returns false if not found or unauthorized
            console.warn(`[API DELETE /api/posts/${slug}] Delete failed: Post not found or authorization failed for user ${requestingUserId}.`);
             return NextResponse.json({ error: 'Post not found or you are not authorized to delete it.' }, { status: 404 });
        }

        console.log(`[API DELETE /api/posts/${slug}] Post deleted successfully by user ${requestingUserId}.`);
        // Return 204 No Content for successful deletion as per REST best practices
        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error(`[API DELETE /api/posts/${slug}] Error deleting post:`, error);
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized: You do not have permission to delete this post.' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to delete post', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
