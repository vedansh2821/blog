// IMPORTANT: This is an IN-MEMORY MOCK simulating a SQL database.
// DO NOT USE THIS IN PRODUCTION. Replace with a real database and ORM (like Prisma).

import type { AuthUser } from '@/lib/auth/authContext';
import type { Post, Author } from '@/types/blog'; // Assuming types exist

interface MockUser extends AuthUser {
    hashedPassword?: string; // Store hashed password here
}

// --- In-Memory Stores ---
const users: MockUser[] = [];
const posts: Post[] = [];
let postIdCounter = 1;

// --- User Functions ---

export const findUserByEmail = async (email: string): Promise<MockUser | null> => {
    console.log(`[Mock DB] Finding user by email: ${email}`);
    const user = users.find(u => u.email === email);
    return user ? { ...user } : null; // Return a copy
};

export const findUserById = async (id: string): Promise<MockUser | null> => {
    console.log(`[Mock DB] Finding user by ID: ${id}`);
    const user = users.find(u => u.id === id);
    return user ? { ...user } : null;
};

export const createUser = async (userData: Omit<MockUser, 'id'>): Promise<MockUser> => {
    const newUser: MockUser = {
        ...userData,
        id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    };
    console.log(`[Mock DB] Creating user: ${newUser.email}, Role: ${newUser.role}`);
    users.push(newUser);
    return { ...newUser }; // Return a copy without the password hash ideally
};

// --- Post Functions ---

const createAuthorObject = (user: MockUser | null): Author => {
    if (!user) {
        return {
            id: 'unknown',
            name: 'Unknown Author',
            slug: 'unknown',
            avatarUrl: `https://i.pravatar.cc/40?u=unknown`,
            bio: 'Author information not available.',
        };
    }
    return {
        id: user.id,
        name: user.name || user.email || 'Unnamed Author',
        slug: user.id, // Use ID as slug for now
        avatarUrl: user.photoURL || `https://i.pravatar.cc/40?u=${user.id}`,
        bio: `Bio for ${user.name || user.email}`, // Simple bio
    };
};

const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
      + `-${Date.now() % 1000}`; // Add timestamp suffix for uniqueness
  };


export const createPost = async (postData: Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views'> & { authorId: string }): Promise<Post> => {
    const author = await findUserById(postData.authorId);
    if (!author) {
        throw new Error(`[Mock DB] Author not found for ID: ${postData.authorId}`);
    }

    const newPost: Post = {
        id: `post-${postIdCounter++}`,
        slug: generateSlug(postData.title),
        title: postData.title,
        content: postData.content,
        imageUrl: postData.imageUrl || `https://picsum.photos/seed/post${postIdCounter}/1200/600`,
        category: postData.category,
        author: createAuthorObject(author),
        publishedAt: new Date(),
        updatedAt: new Date(),
        commentCount: 0,
        views: 0,
        excerpt: postData.excerpt || postData.content.substring(0, 150) + '...',
        tags: postData.tags || [],
        // rating: 0, // Add if needed
    };
    console.log(`[Mock DB] Creating post: ${newPost.title} by ${newPost.author.name}`);
    posts.push(newPost);
    return { ...newPost }; // Return a copy
};

export const findPostBySlug = async (slug: string): Promise<Post | null> => {
    console.log(`[Mock DB] Finding post by slug: ${slug}`);
    const post = posts.find(p => p.slug === slug);
    if (!post) return null;

    // Simulate fetching author details again (or ensure they are always embedded)
    const author = await findUserById(post.author.id);
    return { ...post, author: createAuthorObject(author) }; // Return copy with fresh author
};

export const findPosts = async (options: {
    page?: number;
    limit?: number;
    category?: string;
    authorId?: string;
    query?: string;
}): Promise<{ posts: Post[], hasMore: boolean, totalPages: number, currentPage: number, totalResults: number }> => {
    const { page = 0, limit = 9, category, authorId, query } = options;
    console.log(`[Mock DB] Finding posts:`, options);

    let filtered = [...posts]; // Start with a copy

    if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (authorId) {
        filtered = filtered.filter(p => p.author.id === authorId);
    }
    if (query) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.excerpt.toLowerCase().includes(lowerQuery) ||
            p.content.toLowerCase().includes(lowerQuery)
        );
    }

    // Sort by date descending
    filtered.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    const totalResults = filtered.length;
    const totalPages = Math.ceil(totalResults / limit);
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const postsForPage = filtered.slice(startIndex, endIndex);
    const hasMore = endIndex < totalResults;

    // Ensure author details are up-to-date for the returned page
    const postsWithAuthors = await Promise.all(postsForPage.map(async (post) => {
        const author = await findUserById(post.author.id);
        return { ...post, author: createAuthorObject(author) };
    }));

    return {
        posts: postsWithAuthors,
        hasMore,
        totalPages,
        currentPage: page,
        totalResults,
    };
};

export const updatePost = async (slug: string, updateData: Partial<Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views'>> & { authorId: string }): Promise<Post | null> => {
    console.log(`[Mock DB] Updating post with slug: ${slug}`);
    const postIndex = posts.findIndex(p => p.slug === slug);
    if (postIndex === -1) {
        console.log(`[Mock DB] Post not found for update: ${slug}`);
        return null;
    }

    // **Authorization Check**: Ensure the authorId matches the post's author
    if (posts[postIndex].author.id !== updateData.authorId) {
         console.error(`[Mock DB] Authorization failed: User ${updateData.authorId} cannot update post owned by ${posts[postIndex].author.id}`);
         throw new Error("Unauthorized"); // Or return null/error response in API
    }

    const updatedPost = {
        ...posts[postIndex],
        ...updateData,
        updatedAt: new Date(),
        // Re-generate excerpt if content changed and no explicit excerpt provided
        excerpt: updateData.content && !updateData.excerpt ? updateData.content.substring(0, 150) + '...' : updateData.excerpt ?? posts[postIndex].excerpt,
    };

    // Keep original author, only update fields
    updatedPost.author = posts[postIndex].author; // Ensure author object remains consistent

    posts[postIndex] = updatedPost;
    console.log(`[Mock DB] Post updated: ${updatedPost.title}`);

    // Fetch potentially updated author details (name might change etc)
    const author = await findUserById(updatedPost.author.id);
    return { ...updatedPost, author: createAuthorObject(author) };
};

export const deletePost = async (slug: string, authorId: string): Promise<boolean> => {
    console.log(`[Mock DB] Deleting post with slug: ${slug} by user: ${authorId}`);
    const postIndex = posts.findIndex(p => p.slug === slug);
    if (postIndex === -1) {
        console.log(`[Mock DB] Post not found for delete: ${slug}`);
        return false;
    }

    // **Authorization Check**: Ensure the authorId matches the post's author OR user is admin
    const user = await findUserById(authorId);
    const postAuthorId = posts[postIndex].author.id;

    if (postAuthorId !== authorId && user?.role !== 'admin') {
        console.error(`[Mock DB] Authorization failed: User ${authorId} (Role: ${user?.role}) cannot delete post owned by ${postAuthorId}`);
        throw new Error("Unauthorized"); // Or return false/error response in API
    }

    posts.splice(postIndex, 1);
    console.log(`[Mock DB] Post deleted: ${slug}`);
    return true;
};


// --- Seed Data (Optional) ---
const seedData = async () => {
     // Create admin user
     await createUser({
         email: 'vedansh2821@gmail.com',
         name: 'Admin User',
         role: 'admin',
         hashedPassword: await require('bcrypt').hash('adminpassword', 10), // Use a secure password
         photoURL: 'https://i.pravatar.cc/150?u=admin',
     });
     // Create regular users
    const user1 = await createUser({
        email: 'bob@example.com',
        name: 'Bob',
        role: 'user',
        hashedPassword: await require('bcrypt').hash('password123', 10),
        photoURL: 'https://i.pravatar.cc/150?u=bob',
    });
     const user2 = await createUser({
        email: 'alice@example.com',
        name: 'Alice',
        role: 'user',
        hashedPassword: await require('bcrypt').hash('password456', 10),
        photoURL: 'https://i.pravatar.cc/150?u=alice',
    });

     // Create posts
     await createPost({
         title: "First Post by Bob",
         content: "<p>This is Bob's first blog post content.</p>",
         category: "Technology",
         authorId: user1.id,
     });
     await createPost({
          title: "Alice's Thoughts on Lifestyle",
          content: "<p>Exploring minimalism and intentional living.</p>",
          category: "Lifestyle",
          authorId: user2.id,
      });
       await createPost({
           title: "Another Tech Update by Bob",
           content: "<p>More content about technology trends.</p>",
           category: "Technology",
           authorId: user1.id,
       });
     console.log("[Mock DB] Seed data created.");
 };

 if (process.env.NODE_ENV !== 'production' && users.length === 0) {
     seedData(); // Only seed in development if DB is empty
 }
