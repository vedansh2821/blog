import { NextResponse } from 'next/server';

// Placeholder API route for comments

// --- MOCK DATA STORE (Replace with DB) ---
let mockComments: Record<string, any[]> = {}; // Store comments per postId
// ---

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 });
  }

  console.log(`API called: fetching comments for postId=${postId}`);
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate delay

  const commentsForPost = mockComments[postId] || [];

  // Generate some mock comments if none exist for the postId
  if (commentsForPost.length === 0 && postId.startsWith('post-')) {
      const numComments = Math.floor(Math.random() * 5) + 1;
      mockComments[postId] = Array.from({length: numComments}).map((_, i) => ({
          id: `comment-${postId}-${i}-${Date.now()}`, // Ensure unique IDs
          author: { name: `Mock User ${i+1}`, avatarUrl: `https://i.pravatar.cc/40?u=mock${i}`},
          timestamp: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
          content: `This is mock comment ${i+1} for post ${postId}.`,
          replies: [],
          likes: Math.floor(Math.random() * 15),
      })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      console.log(`Generated ${numComments} mock comments for ${postId}`);
  }


  return NextResponse.json(mockComments[postId] || []);
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, content, replyTo, author } = body; // Assume author info is passed (or get from session)

    if (!postId || !content || !author || !author.name) {
      return NextResponse.json({ error: 'Missing required fields (postId, content, author.name)' }, { status: 400 });
    }

    console.log(`API called: posting comment for postId=${postId}, replyTo=${replyTo}`);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay

    const newComment = {
      id: `comment-${postId}-${Date.now()}`,
      author: {
          name: author.name,
          avatarUrl: author.avatarUrl || `https://i.pravatar.cc/40?u=${author.name.replace(/\s+/g, '')}` // Default avatar
      },
      timestamp: new Date(),
      content: content,
      replies: [],
      likes: 0,
    };

    if (!mockComments[postId]) {
        mockComments[postId] = [];
    }

    // Add as reply or top-level comment
    if (replyTo) {
        const findAndAddReply = (commentsList: any[]): boolean => {
             for (let comment of commentsList) {
                 if (comment.id === replyTo) {
                     comment.replies = [...(comment.replies || []), newComment];
                     return true;
                 }
                 if (comment.replies && comment.replies.length > 0) {
                     if (findAndAddReply(comment.replies)) {
                         return true;
                     }
                 }
             }
             return false;
         };
         if (!findAndAddReply(mockComments[postId])) {
              console.warn(`Could not find comment ${replyTo} to reply to. Adding as top-level.`);
              mockComments[postId].unshift(newComment); // Add to top if parent not found
         }
    } else {
        mockComments[postId].unshift(newComment); // Add new top-level comments to the beginning
    }

    // Return the newly created comment (or just success)
    return NextResponse.json(newComment, { status: 201 });

  } catch (error) {
    console.error("Error processing comment POST:", error);
    return NextResponse.json({ error: 'Failed to process comment' }, { status: 500 });
  }
}


// Add PUT (for likes/editing), DELETE handlers as needed
