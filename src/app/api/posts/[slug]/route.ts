import { NextResponse } from 'next/server';
import { findPostBySlug, updatePost, deletePost } from '@/lib/db/mock-sql'; // Use mock SQL DB functions
// Removed getUserFromRequest import as we'll get ID from client for now

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  console.log(`API called: fetching post with slug=${slug}`);

  try {
    const postData = await findPostBySlug(slug);

    if (!postData) {
        console.warn(`API GET /api/posts/${slug}: Post not found.`);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
     // Ensure dates are ISO strings for JSON compatibility
     const responseData = {
         ...postData,
         publishedAt: new Date(postData.publishedAt).toISOString(),
         updatedAt: postData.updatedAt ? new Date(postData.updatedAt).toISOString() : undefined,
     };


    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Error fetching post ${slug}:`, error);
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
    const { title, content, category, excerpt, imageUrl, tags } = updateData;

    // --- Basic Validation ---
    if (!requestingUserId) {
        console.error(`[API PUT /api/posts/${slug}] Error: Missing requestingUserId in request body.`);
        return NextResponse.json({ error: 'Unauthorized: Missing user identification.' }, { status: 401 });
    }
     if (!title || !content || !category) {
       console.error(`[API PUT /api/posts/${slug}] Error: Missing required fields (title, content, category).`);
       return NextResponse.json({ error: 'Missing required fields (title, content, category)' }, { status: 400 });
     }


    // --- Call DB Update with Authorization ---
    // Pass the requesting user's ID for the authorization check within updatePost
    const updatedPost = await updatePost(slug, {
        ...updateData, // Pass only the post fields to update
        requestingUserId: requestingUserId, // Pass the user ID for auth check
    });

    if (!updatedPost) {
       // updatePost returns null if not found (after authorization check)
       console.warn(`[API PUT /api/posts/${slug}] Update failed: Post not found or authorization failed for user ${requestingUserId}.`);
       // Return 404 for not found, but authorization error is handled inside updatePost
       return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

     // Ensure dates are ISO strings for JSON compatibility
     const responseData = {
         ...updatedPost,
         publishedAt: new Date(updatedPost.publishedAt).toISOString(),
         updatedAt: updatedPost.updatedAt ? new Date(updatedPost.updatedAt).toISOString() : undefined,
     };

    console.log(`[API PUT /api/posts/${slug}] Post updated successfully by user ${requestingUserId}.`);
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
         return NextResponse.json({ error: 'Post not found' }, { status: 404 });
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
```