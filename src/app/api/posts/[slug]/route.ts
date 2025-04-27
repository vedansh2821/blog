import { NextResponse } from 'next/server';
import { findPostBySlug, updatePost, deletePost } from '@/lib/db/mock-sql'; // Use mock SQL DB functions
import { getUserFromRequest } from '@/lib/auth/server'; // Helper to get user from request (needs implementation)

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  console.log(`API called: fetching post with slug=${slug}`);

  try {
    const postData = await findPostBySlug(slug);

    if (!postData) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(postData);
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

  // --- Get Current User (Replace with your actual session/token handling) ---
  // This is a placeholder. Implement getUserFromRequest based on your auth setup (e.g., cookies, headers).
  const currentUser = await getUserFromRequest(request); // Needs implementation

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized: Login required' }, { status: 401 });
  }
  // --- End Get Current User ---

  try {
    const body = await request.json();
    const { title, content, category, excerpt, imageUrl, tags } = body;

    // Basic Validation
    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Missing required fields (title, content, category)' }, { status: 400 });
    }

    // Call updatePost from mock DB, passing the current user's ID for authorization check
    const updatedPost = await updatePost(slug, {
        title,
        content,
        category,
        excerpt: excerpt || content.substring(0, 150),
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/1200/600`,
        tags: tags || [],
        authorId: currentUser.id, // Pass authorId for authorization check
    });

    if (!updatedPost) {
       // updatePost returns null if not found, or throws an error if unauthorized
       return NextResponse.json({ error: 'Post not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Post updated successfully', post: updatedPost });

  } catch (error) {
    console.error(`Error updating post ${slug}:`, error);
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

  // --- Get Current User ---
  const currentUser = await getUserFromRequest(request); // Needs implementation

  if (!currentUser) {
     return NextResponse.json({ error: 'Unauthorized: Login required' }, { status: 401 });
   }
   // --- End Get Current User ---

  try {
    // Call deletePost from mock DB, passing the current user's ID for authorization check
    const deleted = await deletePost(slug, currentUser.id);

    if (!deleted) {
         // deletePost returns false if not found, or throws error if unauthorized
         return NextResponse.json({ error: 'Post not found' }, { status: 404 });
     }

    return NextResponse.json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error(`Error deleting post ${slug}:`, error);
    if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized: You do not have permission to delete this post.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to delete post', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
