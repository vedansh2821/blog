
import { NextResponse } from 'next/server';
import { createPost, findPosts } from '@/lib/db/mock-sql'; // Use mock SQL DB functions
import { getUserFromRequest } from '@/lib/auth/server'; // Helper to get user from request (needs implementation)

// GET function remains largely the same but uses findPosts from mock-sql
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const requestedLimit = parseInt(searchParams.get('limit') || '9');
  const category = searchParams.get('category') || undefined; // Pass undefined if null/empty
  const authorSlug = searchParams.get('author') || undefined; // Pass undefined if null/empty
  const searchQuery = searchParams.get('q') || undefined; // Pass undefined if null/empty

  console.log(`API GET /api/posts: page=${page}, limit=${requestedLimit}, category=${category}, author=${authorSlug}, q=${searchQuery}`);

  try {
    const results = await findPosts({
      page,
      limit: requestedLimit,
      category,
      authorId: authorSlug, // Assuming author slug is author ID
      query: searchQuery,
    });

    return NextResponse.json(results);

  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: 'Failed to fetch posts', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// POST function updated for mock SQL DB and authentication
export async function POST(request: Request) {
  // --- Get Current User (Replace with your actual session/token handling) ---
  const currentUser = await getUserFromRequest(request); // Needs implementation

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized: Login required to create posts' }, { status: 401 });
  }
  // --- End Get Current User ---

  try {
    const body = await request.json();
    const { title, content, category, excerpt, imageUrl, tags } = body;

    // Basic Validation
    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Missing required fields (title, content, category)' }, { status: 400 });
    }

    // Prepare data for mock DB function
    const newPostData = {
        title,
        content,
        category,
        authorId: currentUser.id, // Use the authenticated user's ID
        excerpt: excerpt || content.substring(0, 150) + '...', // Auto-generate excerpt
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/1200/600`, // Default image
        tags: tags || [],
    };

    // Create post using mock DB function
    const createdPost = await createPost(newPostData);

    console.log(`[API] New post created: ${createdPost.id} by user ${currentUser.id}`);

    return NextResponse.json(createdPost, { status: 201 });

  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: 'Failed to create post', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
