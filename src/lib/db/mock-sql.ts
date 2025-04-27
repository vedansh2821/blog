// IMPORTANT: This is an IN-MEMORY MOCK simulating a SQL database.
// DO NOT USE THIS IN PRODUCTION. Replace with a real database and ORM (like Prisma).

import type { AuthUser } from '@/lib/auth/authContext';
import type { Post, Author } from '@/types/blog'; // Assuming types exist
import bcrypt from 'bcrypt'; // Import bcrypt

interface MockUser extends AuthUser {
    hashedPassword?: string; // Store hashed password here
}

// --- In-Memory Stores ---
const users: MockUser[] = [];
const posts: Post[] = [];
let postIdCounter = 1;
let userIdCounter = 1; // For unique user IDs

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
        id: `user-${userIdCounter++}`, // Use a simple counter for mock IDs
    };
    console.log(`[Mock DB] Creating user: ${newUser.email}, Role: ${newUser.role}`);
    users.push(newUser);
    return { ...newUser }; // Return a copy
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
        slug: user.id, // Use ID as slug for author page link consistency
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
      .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
     // Removed timestamp suffix for simplicity and consistency in mock
};


export const createPost = async (postData: Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views' | 'updatedAt' | 'excerpt'> & { authorId: string }): Promise<Post> => {
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
    console.log(`[Mock DB] Creating post: ${newPost.title} (Slug: ${newPost.slug}) by ${newPost.author.name}`);
    posts.push(newPost);
    return { ...newPost }; // Return a copy
};

export const findPostBySlug = async (slug: string): Promise<Post | null> => {
    console.log(`[Mock DB] Finding post by slug: ${slug}`);
    const post = posts.find(p => p.slug === slug);
    if (!post) {
        console.warn(`[Mock DB] Post with slug "${slug}" not found.`);
        console.log("[Mock DB] Available slugs:", posts.map(p => p.slug));
        return null;
    }

    // Simulate fetching author details again (or ensure they are always embedded)
    const author = await findUserById(post.author.id);
    return { ...post, author: createAuthorObject(author) }; // Return copy with fresh author
};

export const findPosts = async (options: {
    page?: number;
    limit?: number;
    category?: string;
    authorId?: string; // Accepts author ID now
    query?: string;
}): Promise<{ posts: Post[], hasMore: boolean, totalPages: number, currentPage: number, totalResults: number }> => {
    const { page = 0, limit = 9, category, authorId, query } = options;
    console.log(`[Mock DB] Finding posts:`, options);

    let filtered = [...posts]; // Start with a copy

    if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    // Filter by author ID if provided
    if (authorId) {
        filtered = filtered.filter(p => p.author.id === authorId);
    }
    if (query) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.excerpt.toLowerCase().includes(lowerQuery) ||
            p.content.toLowerCase().includes(lowerQuery) ||
            p.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) || // Search tags
            p.category.toLowerCase().includes(lowerQuery) // Search category
        );
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

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

export const updatePost = async (slug: string, updateData: Partial<Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views' | 'updatedAt'>> & { authorId: string }): Promise<Post | null> => {
    console.log(`[Mock DB] Attempting to update post with slug: ${slug}`);
    const postIndex = posts.findIndex(p => p.slug === slug);
    if (postIndex === -1) {
        console.log(`[Mock DB] Post not found for update: ${slug}`);
        return null;
    }

    const postToUpdate = posts[postIndex];

    // **Authorization Check**: Ensure the authorId matches the post's author
    if (postToUpdate.author.id !== updateData.authorId) {
         console.error(`[Mock DB] Authorization failed: User ${updateData.authorId} cannot update post owned by ${postToUpdate.author.id}`);
         throw new Error("Unauthorized"); // Or return null/error response in API
    }

    // Preserve original fields not being updated
    const updatedPost: Post = {
        ...postToUpdate, // Start with existing post data
        ...updateData,   // Apply updates from updateData
        updatedAt: new Date(), // Always update the updatedAt field
        // Re-generate excerpt if content changed and no explicit excerpt provided
        excerpt: (updateData.content && !updateData.excerpt)
                   ? updateData.content.substring(0, 150) + '...'
                   : updateData.excerpt ?? postToUpdate.excerpt,
    };

    posts[postIndex] = updatedPost; // Replace the old post with the updated one
    console.log(`[Mock DB] Post updated: ${updatedPost.title} (Slug: ${slug})`);

    // Fetch potentially updated author details (name might change etc) - Although author doesn't change on post update typically
    const author = await findUserById(updatedPost.author.id);
    return { ...updatedPost, author: createAuthorObject(author) };
};


export const deletePost = async (slug: string, authorId: string): Promise<boolean> => {
    console.log(`[Mock DB] Attempting to delete post with slug: ${slug} by user: ${authorId}`);
    const postIndex = posts.findIndex(p => p.slug === slug);
    if (postIndex === -1) {
        console.log(`[Mock DB] Post not found for delete: ${slug}`);
        return false; // Indicate post not found
    }

    // **Authorization Check**: Ensure the authorId matches the post's author OR user is admin
    const user = await findUserById(authorId);
    const postAuthorId = posts[postIndex].author.id;

    if (postAuthorId !== authorId && user?.role !== 'admin') {
        console.error(`[Mock DB] Authorization failed: User ${authorId} (Role: ${user?.role}) cannot delete post owned by ${postAuthorId}`);
        throw new Error("Unauthorized"); // Throw error for unauthorized access
    }

    posts.splice(postIndex, 1); // Remove the post from the array
    console.log(`[Mock DB] Post deleted: ${slug}`);
    return true; // Indicate successful deletion
};


// --- Seed Data (Ensure bcrypt is available) ---
const seedData = async () => {
     console.log("[Mock DB] Seeding data...");
     try {
         // Use static IDs for predictability in mock
         const adminId = 'admin-user-001';
         const bobId = 'user-bob-002';
         const aliceId = 'user-alice-003';

         // Hash passwords securely
         const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
         const bobPasswordHash = await bcrypt.hash('password123', 10);
         const alicePasswordHash = await bcrypt.hash('password456', 10);


         // Create admin user
         await createUser({
             id: adminId, // Assign static ID
             email: 'vedansh2821@gmail.com',
             name: 'Admin User',
             role: 'admin',
             hashedPassword: adminPasswordHash,
             photoURL: 'https://i.pravatar.cc/150?u=admin',
         });
         console.log("[Mock DB] Admin user created.");

         // Create regular users
         const user1 = await createUser({
             id: bobId, // Assign static ID
             email: 'bob@example.com',
             name: 'Bob',
             role: 'user',
             hashedPassword: bobPasswordHash,
             photoURL: 'https://i.pravatar.cc/150?u=bob',
         });
         console.log("[Mock DB] Bob user created.");

         const user2 = await createUser({
             id: aliceId, // Assign static ID
             email: 'alice@example.com',
             name: 'Alice',
             role: 'user',
             hashedPassword: alicePasswordHash,
             photoURL: 'https://i.pravatar.cc/150?u=alice',
         });
          console.log("[Mock DB] Alice user created.");

         // Create posts with predictable slugs
         await createPost({
             title: "First Post by Bob",
             content: "<p>This is Bob's <strong>first</strong> blog post content. It talks about technology.</p> <ul><li>Item 1</li><li>Item 2</li></ul> <p>Some more text here.</p>",
             category: "Technology",
             authorId: user1.id, // Use Bob's ID
             imageUrl: `https://picsum.photos/seed/firstpostbob/1200/600`,
             tags: ["getting started", "tech"],
             excerpt: "Bob's first post dives into technology topics...", // Manually set excerpt
         });
         await createPost({
              title: "Alice's Thoughts on Lifestyle",
              content: "<p>Exploring minimalism and <em>intentional living</em>.</p><blockquote>\"Less is more.\"</blockquote><p>A journey towards simplicity.</p>",
              category: "Lifestyle",
              authorId: user2.id, // Use Alice's ID
              imageUrl: `https://picsum.photos/seed/alicelifestyle/1200/600`,
              tags: ["minimalism", "philosophy"],
              excerpt: "Alice shares her perspective on lifestyle design...",
          });
          await createPost({
               title: "Another Tech Update by Bob",
               content: "<p>More content about technology trends. Let's discuss <code>React</code> and <code>Next.js</code>.</p><p>Keeping up with the pace of innovation.</p>",
               category: "Technology",
               authorId: user1.id, // Use Bob's ID
               imageUrl: `https://picsum.photos/seed/bobtechupdate/1200/600`,
               tags: ["react", "web development", "trends"],
               excerpt: "Bob provides another update on the latest in tech...",
           });
            await createPost({
                title: "Healthy Habits for Developers",
                content: "<p>Sitting all day? Here are some tips:</p><ol><li>Stretch regularly.</li><li>Take breaks.</li><li>Stay hydrated.</li></ol>",
                category: "Health",
                authorId: user2.id, // Alice's ID
                imageUrl: `https://picsum.photos/seed/devhealth/1200/600`,
                tags: ["health", "developer life", "wellness"],
                excerpt: "Alice discusses essential healthy habits for developers...",
            });
         console.log("[Mock DB] Seed posts created.");
         console.log("[Mock DB] Seed data creation complete.");

     } catch (error) {
         console.error("[Mock DB] Error seeding data:", error);
     }
 };

 // Initialize seed data only if the users array is empty (ensures it runs only once)
 if (users.length === 0) {
     seedData();
 }
