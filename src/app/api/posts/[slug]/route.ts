
import { NextResponse } from 'next/server';
import { findPostBySlug, updatePost, deletePost } from '@/lib/db/mock-sql'; // Use mock SQL DB functions
import { getUserFromRequest } from '@/lib/auth/server'; // Helper to get user from request (needs implementation)

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  console.log(`[API /api/posts/[slug]] Received request for slug: "${slug}"`);

  try {
    console.log(`[API /api/posts/[slug]] Calling findPostBySlug("${slug}")`);
    const postData = await findPostBySlug(slug);

    if (!postData) {
      console.log(`[API /api/posts/[slug]] findPostBySlug returned null for "${slug}"`);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    console.log(`[API /api/posts/[slug]] findPostBySlug returned data for "${slug}"`);
    return NextResponse.json(postData);
  } catch (error) {
    console.error(`[API /api/posts/[slug]] Error processing slug "${slug}":`, error);
    return NextResponse.json({ error: 'Failed to fetch post', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  console.log(`[API /api/posts/[slug]] Received PUT request for slug: "${slug}"`);

  // --- Get Current User (Replace with your actual session/token handling) ---
  const currentUser = await getUserFromRequest(request); // Needs implementation

  if (!currentUser) {
    console.log(`[API /api/posts/[slug]] PUT failed: Unauthorized (no user)`);
    return NextResponse.json({ error: 'Unauthorized: Login required' }, { status: 401 });
  }
  console.log(`[API /api/posts/[slug]] PUT request authorized for user: ${currentUser.email}`);
  // --- End Get Current User ---

  try {
    const body = await request.json();
    const { title, content, category, excerpt, imageUrl, tags } = body;

    // Basic Validation
    if (!title || !content || !category) {
       console.log(`[API /api/posts/[slug]] PUT failed: Missing required fields`);
      return NextResponse.json({ error: 'Missing required fields (title, content, category)' }, { status: 400 });
    }

    // Call updatePost from mock DB, passing the current user's ID for authorization check
     console.log(`[API /api/posts/[slug]] Calling updatePost for slug "${slug}" by user ${currentUser.id}`);
    const updatedPost = await updatePost(slug, {
        title,
        content,
        category,
        excerpt: excerpt || content.substring(0, 150) + '...',
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/1200/600`,
        tags: tags || [],
        authorId: currentUser.id, // Pass authorId for authorization check
    });

    if (!updatedPost) {
       // updatePost returns null if not found, or throws an error if unauthorized
       console.log(`[API /api/posts/[slug]] updatePost returned null or failed for slug "${slug}"`);
       return NextResponse.json({ error: 'Post not found or update failed' }, { status: 404 });
    }

     console.log(`[API /api/posts/[slug]] Post updated successfully for slug "${slug}"`);
    return NextResponse.json({ message: 'Post updated successfully', post: updatedPost });

  } catch (error) {
    console.error(`[API /api/posts/[slug]] Error updating post ${slug}:`, error);
    if (error instanceof Error && error.message === 'Unauthorized') {
         console.log(`[API /api/posts/[slug]] PUT failed: Unauthorized (permission denied) for slug "${slug}"`);
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
   console.log(`[API /api/posts/[slug]] Received DELETE request for slug: "${slug}"`);

  // --- Get Current User ---
  const currentUser = await getUserFromRequest(request); // Needs implementation

  if (!currentUser) {
      console.log(`[API /api/posts/[slug]] DELETE failed: Unauthorized (no user)`);
     return NextResponse.json({ error: 'Unauthorized: Login required' }, { status: 401 });
   }
   console.log(`[API /api/posts/[slug]] DELETE request authorized for user: ${currentUser.email}`);
   // --- End Get Current User ---

  try {
    // Call deletePost from mock DB, passing the current user's ID for authorization check
     console.log(`[API /api/posts/[slug]] Calling deletePost for slug "${slug}" by user ${currentUser.id}`);
    const deleted = await deletePost(slug, currentUser.id);

    if (!deleted) {
         // deletePost returns false if not found, or throws error if unauthorized
         console.log(`[API /api/posts/[slug]] deletePost returned false for slug "${slug}"`);
         return NextResponse.json({ error: 'Post not found' }, { status: 404 });
     }

     console.log(`[API /api/posts/[slug]] Post deleted successfully for slug "${slug}"`);
    return NextResponse.json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error(`[API /api/posts/[slug]] Error deleting post ${slug}:`, error);
    if (error instanceof Error && error.message === 'Unauthorized') {
         console.log(`[API /api/posts/[slug]] DELETE failed: Unauthorized (permission denied) for slug "${slug}"`);
        return NextResponse.json({ error: 'Unauthorized: You do not have permission to delete this post.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to delete post', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
