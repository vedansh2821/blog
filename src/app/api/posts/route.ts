import { NextResponse } from 'next/server';

// This is a placeholder API route.
// In a real application, you would fetch data from a database (like Firestore)
// based on query parameters (page, limit, category, authorSlug, etc.).

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '6');
  const category = searchParams.get('category');
  const authorSlug = searchParams.get('author');

  console.log(`API called: page=${page}, limit=${limit}, category=${category}, author=${authorSlug}`);

  // Simulate data fetching based on parameters
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay

  // --- MOCK DATA GENERATION (Replace with actual DB query) ---
  const totalMockPosts = 50;
  let allPosts = Array.from({ length: totalMockPosts }).map((_, index) => {
    const authorIdx = index % 3;
    const authorName = ['Alice', 'Bob', 'Charlie'][authorIdx];
    const authorSlugMock = ['alice', 'bob', 'charlie'][authorIdx];
    return {
      id: `post-${index}`,
      title: `API Blog Post ${index + 1}`,
      slug: `api-blog-post-${index + 1}`,
      excerpt: `Excerpt for API post ${index + 1}.`,
      imageUrl: `https://picsum.photos/seed/api${index + 1}/600/400`,
      category: ['Technology', 'Lifestyle', 'Health', 'Travel'][index % 4],
      author: {
        name: authorName,
        slug: authorSlugMock,
        avatarUrl: `https://i.pravatar.cc/40?u=author${authorIdx}`,
      },
      publishedAt: new Date(Date.now() - index * 2 * 24 * 60 * 60 * 1000), // Simulate different publish dates
      commentCount: Math.floor(Math.random() * 40),
    };
  });

  // Filter by category if provided
  if (category && category !== 'all') {
    allPosts = allPosts.filter(post => post.category.toLowerCase() === category.toLowerCase());
  }

  // Filter by author if provided
  if (authorSlug) {
    allPosts = allPosts.filter(post => post.author.slug === authorSlug);
  }

  const totalFilteredPosts = allPosts.length;
  const startIndex = page * limit;
  const endIndex = startIndex + limit;
  const posts = allPosts.slice(startIndex, endIndex);
  const hasMore = endIndex < totalFilteredPosts;
  const totalPages = Math.ceil(totalFilteredPosts / limit);
  // --- END MOCK DATA ---


  return NextResponse.json({
    posts,
    hasMore,
    totalPages,
    currentPage: page,
  });
}

// Add POST, PUT, DELETE handlers as needed for a full CMS
