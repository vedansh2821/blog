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
        // The body should now include the update data AND the ID of the user making the request
        const body = await request.json();
        const { requestingUserId, ...updateData } = body; // Separate user ID from post data
        const { title, content, category, excerpt, imageUrl, tags, heading, subheadings, paragraphs } = updateData;

        // --- Basic Validation ---
        if (!requestingUserId) {
            console.error(`[API PUT /api/posts/${slug}] Error: Missing requestingUserId in request body.`);
            return NextResponse.json({ error: 'Unauthorized: Missing user identification.' }, { status: 401 });
        }
        if (!title || !category) {
            console.error(`[API PUT /api/posts/${slug}] Error: Missing required fields (title, category).`); // Removed content requirement here
            return NextResponse.json({ error: 'Missing required fields (title, category)' }, { status: 400 });
        }


        // --- Construct Content from Structured Data ---
         // Ensure data exists and is in the correct format before constructing content
         let constructedContent = '';
         if (heading && typeof heading === 'string') {
             constructedContent += `<h1 class="text-2xl font-bold mb-4">${heading}</h1>`;
         }
         if (subheadings && Array.isArray(subheadings) && subheadings.length > 0) {
             constructedContent += `<h2 class="text-xl font-semibold mt-6 mb-3">Subheadings</h2><ul>`; // Added title for subheadings section
             subheadings.forEach(subheading => {
                if (typeof subheading === 'string' && subheading.trim()) {
                    constructedContent += `<li class="mb-2"><h3 class="text-lg font-medium">${subheading.trim()}</h3></li>`; // Added styling
                }
             });
             constructedContent += `</ul>`;
         }
         if (paragraphs && Array.isArray(paragraphs) && paragraphs.length > 0) {
             const validParagraphs = paragraphs.filter(p => typeof p === 'string' && p.trim());
             if (validParagraphs.length > 0) {
                 constructedContent += `<div class="prose-p:my-4">${validParagraphs.map(p => `<p>${p.trim()}</p>`).join('')}</div>`; // Wrap paragraphs
             }
         }

         if (!constructedContent && content) { // Fallback to existing content if structured data is empty
             constructedContent = content;
         }


        // Prepare data for mock DB function, using requestingUserId as the authorId
        const updatePayload = {
            title,
            category,
            heading, // Send raw heading
            subheadings, // Send raw subheadings array
            paragraphs, // Send raw paragraphs array
            content: constructedContent, // Send the constructed or original content
            excerpt,
            imageUrl,
            tags,
            requestingUserId // For authorization check
        };

        // --- Call DB Update with Authorization ---
        // Pass the requesting user's ID for the authorization check within updatePost
        const updatedPost = await updatePost(slug, updatePayload); // Send the correct payload

        if (!updatedPost) {
            // updatePost returns null if not found (after authorization check)
            console.warn(`[API PUT /api/posts/${slug}] Update failed: Post not found or authorization failed for user ${requestingUserId}.`);
            // Return 404 for not found, but authorization error is handled inside updatePost
             return NextResponse.json({ error: 'Post not found or you are not authorized to edit it.' }, { status: 404 });
        }

        // Ensure dates are ISO strings for JSON compatibility
        const responseData = {
            ...updatedPost,
            publishedAt: new Date(updatedPost.publishedAt).toISOString(),
            updatedAt: updatedPost.updatedAt ? new Date(updatedPost.updatedAt).toISOString() : undefined,
            // Ensure author dates are also handled if necessary
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
        // Ideally from a verified session/token on the server.
        // For now, we'll expect it in the request body or headers (less secure for DELETE).
        // Let's assume it's passed as a header `X-Requesting-User-ID` for this mock scenario.
        // **Important**: For production, verify a secure session token/cookie instead.
        const requestingUserId = request.headers.get('X-Requesting-User-ID');

        if (!requestingUserId) {
            console.error(`[API DELETE /api/posts/${slug}] Error: Missing X-Requesting-User-ID header.`);
            return NextResponse.json({ error: 'Unauthorized: Missing user identification.' }, { status: 401 });
        }

        console.log(`[API DELETE /api/posts/${slug}] Attempting delete by user: ${requestingUserId}`);

        // --- Call DB Delete with Authorization ---
        // Pass the requesting user's ID for the authorization check within deletePost
        const deleted = await deletePost(slug, requestingUserId);

        if (!deleted) {
            // deletePost returns false if not found (after authorization check)
            console.warn(`[API DELETE /api/posts/${slug}] Delete failed: Post not found or authorization failed for user ${requestingUserId}.`);
            // Return 404 for not found, but authorization error is handled inside deletePost
             return NextResponse.json({ error: 'Post not found or you are not authorized to delete it.' }, { status: 404 });
        }

        console.log(`[API DELETE /api/posts/${slug}] Post deleted successfully by user ${requestingUserId}.`);
        return NextResponse.json({ message: 'Post deleted successfully' });

    } catch (error) {
        console.error(`[API DELETE /api/posts/${slug}] Error deleting post:`, error);
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized: You do not have permission to delete this post.' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to delete post', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
