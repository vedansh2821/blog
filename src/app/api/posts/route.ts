
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
    const { requestingUserId, title, content, category, excerpt, imageUrl, tags } = body;

    // --- Basic Validation ---
    if (!requestingUserId) {
      console.error(`[API POST /api/posts] Error: Missing requestingUserId in request body.`);
      return NextResponse.json({ error: 'Unauthorized: Missing user identification.' }, { status: 401 });
    }
    if (!title || !content || !category) {
        console.error(`[API POST /api/posts] Error: Missing required fields (title, content, category).`);
      return NextResponse.json({ error: 'Missing required fields (title, content, category)' }, { status: 400 });
    }

    // Prepare data for mock DB function, using requestingUserId as the authorId
    const newPostData = {
        title,
        content,
        category,
        authorId: requestingUserId, // Use the authenticated user's ID
        excerpt: excerpt || content.substring(0, 150) + '...', // Auto-generate excerpt
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/1200/600`, // Default image
        tags: tags || [],
    };

    // --- Create post using mock DB function ---
    // Pass true to generateSlug to add a unique suffix (e.g., timestamp or counter)
    // to avoid slug collisions for posts created via the API
    const createdPost = await createPost(newPostData, true);

    console.log(`[API POST /api/posts] New post created: ${createdPost.id} by user ${requestingUserId}`);

     // Ensure dates are ISO strings for JSON compatibility
     const responseData = {
         ...createdPost,
         publishedAt: new Date(createdPost.publishedAt).toISOString(),
         updatedAt: createdPost.updatedAt ? new Date(createdPost.updatedAt).toISOString() : undefined,
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
```