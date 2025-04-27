
import { NextResponse } from 'next/server';
import { posts as dbPosts, users as dbUsers, Post, User } from '@/lib/firebase/firestore'; // Assuming these exist
import { getDocs, query, where, limit as fbLimit, startAfter, orderBy, collection, getDoc, doc, addDoc, updateDoc, deleteDoc, QueryConstraint } from 'firebase/firestore';


// Helper to safely get user data (replace with your actual user fetching logic if needed)
async function getUserData(userId: string): Promise<User | null> {
    if (!userId) return null;
    try {
        const userDoc = await getDoc(doc(dbUsers, userId));
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() } as User;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
    return null;
}

// Helper to structure post data, including author details
const structurePostData = async (postDoc: any): Promise<any> => {
    const postData = postDoc.data();
    const author = await getUserData(postData.authorId); // Fetch author details
    return {
        id: postDoc.id,
        ...postData,
        author: author ? { // Include author object if found
            name: author.name || 'Unknown Author',
            slug: author.id, // Use ID as slug for now
            avatarUrl: author.photoURL || `https://i.pravatar.cc/40?u=${author.id}`,
        } : { // Fallback author object
            name: 'Unknown Author',
            slug: 'unknown',
            avatarUrl: `https://i.pravatar.cc/40?u=unknown`,
        },
        publishedAt: postData.publishedAt?.toDate ? postData.publishedAt.toDate() : new Date(), // Convert Firestore Timestamp
        // Ensure excerpt and commentCount exist, provide defaults if not
        excerpt: postData.excerpt || postData.content?.substring(0, 100) || '',
        commentCount: postData.commentCount || 0,
    };
};


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const requestedLimit = parseInt(searchParams.get('limit') || '9'); // Default to 9 for grid
  const category = searchParams.get('category');
  const authorSlug = searchParams.get('author');
  const searchQuery = searchParams.get('q'); // Get search query

  console.log(`API called: page=${page}, limit=${requestedLimit}, category=${category}, author=${authorSlug}, q=${searchQuery}`);

  try {
    // Firestore Query Constraints
    const constraints: QueryConstraint[] = [];

    // Filter by category
    if (category && category !== 'all') {
      constraints.push(where('category', '==', category));
    }

    // Filter by author ID (assuming slug is author ID)
    if (authorSlug) {
      constraints.push(where('authorId', '==', authorSlug));
    }

    // Basic Search Filter (on 'title' field - adjust if needed)
    // Firestore doesn't support direct text search like SQL LIKE.
    // For simple cases, you might filter client-side or use >= and <= for prefix matching.
    // For full-text search, consider Algolia, Typesense, or ElasticSearch.
    // This example *won't* filter by search query efficiently on the backend.
    // We will fetch and then filter in memory for this mock example.
    if (searchQuery) {
       console.warn("Firestore backend search not implemented, filtering in memory (inefficient for large datasets).");
        // No Firestore constraint added here for search query
    }


    // Order by publish date (most recent first)
    constraints.push(orderBy('publishedAt', 'desc'));

    // TODO: Implement proper pagination using startAfter for Firestore
    // For simplicity in this mock, we fetch a larger batch and slice.
    // In a real app, you'd track the last visible doc for startAfter.
    const fetchLimit = 100; // Fetch more than needed for in-memory filtering/pagination
    constraints.push(fbLimit(fetchLimit));

    // Build the query
    const postsQuery = query(dbPosts, ...constraints);

    // Execute query
    const querySnapshot = await getDocs(postsQuery);

    // Process results
    let allFetchedPosts = await Promise.all(querySnapshot.docs.map(structurePostData));

    // Apply in-memory search filtering if query exists
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      allFetchedPosts = allFetchedPosts.filter(post =>
          (post.title && post.title.toLowerCase().includes(lowerCaseQuery)) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(lowerCaseQuery)) ||
          (post.content && post.content.toLowerCase().includes(lowerCaseQuery)) // Search content too
      );
    }


    // Apply pagination to the (potentially filtered) results
    const totalFilteredPosts = allFetchedPosts.length;
    const startIndex = page * requestedLimit;
    const endIndex = startIndex + requestedLimit;
    const postsForPage = allFetchedPosts.slice(startIndex, endIndex);
    const hasMore = endIndex < totalFilteredPosts;
    const totalPages = Math.ceil(totalFilteredPosts / requestedLimit);


    return NextResponse.json({
      posts: postsForPage,
      hasMore,
      totalPages,
      currentPage: page,
      totalResults: totalFilteredPosts, // Add total results count
    });

  } catch (error) {
     console.error("Error fetching posts:", error);
     // Check the type of error for more specific responses
     if (error instanceof Error && error.message.includes('permission-denied')) {
         return NextResponse.json({ error: 'Permission denied to access posts.' }, { status: 403 });
     }
     if (error instanceof Error && error.message.includes('unauthenticated')) {
          return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      }
      // Generic internal server error for other issues
      return NextResponse.json({ error: 'Failed to fetch posts', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


export async function POST(request: Request) {
    try {
        // TODO: Add Authentication Check - Ensure user is logged in
        // const userId = await getUserIdFromSession(request); // Example function
        // if (!userId) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const body = await request.json();
        const { title, content, category, excerpt, imageUrl, tags } = body;

        // Basic Validation
        if (!title || !content || !category) {
            return NextResponse.json({ error: 'Missing required fields (title, content, category)' }, { status: 400 });
        }

        // Assume authorId is retrieved from session/auth context
        const authorId = "mockUserId"; // Replace with actual authenticated user ID

        const newPostData = {
            title,
            content,
            category,
            authorId, // Store author ID
            publishedAt: new Date(), // Use server timestamp ideally Firestore.FieldValue.serverTimestamp()
            updatedAt: new Date(),
            excerpt: excerpt || content.substring(0, 150), // Auto-generate excerpt if needed
            imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/1200/600`, // Default image
            tags: tags || [],
            commentCount: 0,
            // Add other fields like views, ratings later if needed
        };

        // Add to Firestore
        const docRef = await addDoc(dbPosts, newPostData);

        console.log("New post created with ID:", docRef.id);

        const createdPost = await structurePostData(await getDoc(docRef)); // Fetch and structure the created post

        return NextResponse.json(createdPost, { status: 201 });

    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: 'Failed to create post', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
