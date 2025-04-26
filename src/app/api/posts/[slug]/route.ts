import { NextResponse } from 'next/server';

// This is a placeholder API route for fetching a single post.
// In a real application, fetch data from a database based on the slug.

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;

  console.log(`API called: fetching post with slug=${slug}`);

  // Simulate data fetching
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate delay

  // --- MOCK DATA GENERATION (Replace with actual DB query) ---
   const postId = parseInt(slug.split('-').pop() || '1'); // Extract ID from slug for mock
   if (isNaN(postId) || postId < 1 || postId > 50) { // Assuming max 50 mock posts
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

   const authorIdx = postId % 3;
   const author = {
        name: ['Alice', 'Bob', 'Charlie'][authorIdx],
        slug: ['alice', 'bob', 'charlie'][authorIdx],
        avatarUrl: `https://i.pravatar.cc/80?u=author${authorIdx}`,
        bio: `This is a short bio for ${['Alice', 'Bob', 'Charlie'][authorIdx]}.`,
        socialLinks: [{platform: 'twitter', url: '#'}],
        website: '#',
   };

   const postData = {
        id: `post-${postId}`,
        title: `API Blog Post Title ${postId}`,
        slug: slug,
        content: `<p>This is the <strong>API-generated content</strong> for Blog Post ${postId}.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p><h2>API Subheading</h2><p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p><img src="https://picsum.photos/seed/api${postId+10}/800/400" alt="Related image" />`,
        imageUrl: `https://picsum.photos/seed/api${postId}/1200/600`,
        category: ['Technology', 'Lifestyle', 'Health', 'Travel'][postId % 4],
        author: author,
        publishedAt: new Date(Date.now() - postId * 2 * 24 * 60 * 60 * 1000),
        commentCount: Math.floor(Math.random() * 50),
        tags: [`api-tag`, `topic${postId % 4}`],
        rating: (Math.random() * 2 + 3).toFixed(1),
        views: Math.floor(Math.random() * 5000) + 200,
   };
    // --- END MOCK DATA ---

  return NextResponse.json(postData);
}

// Add PUT, DELETE handlers as needed for managing posts
