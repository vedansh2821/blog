
// IMPORTANT: This is an IN-MEMORY MOCK simulating a SQL database.
// DO NOT USE THIS IN PRODUCTION. Replace with a real database and ORM (like Prisma).

import type { AuthUser } from '@/lib/auth/authContext';
import type { Post, Author } from '@/types/blog'; // Assuming types exist
import bcrypt from 'bcrypt';

interface MockUser extends AuthUser {
    hashedPassword?: string; // Store hashed password here
}

// --- In-Memory Stores ---
const users: MockUser[] = [];
const posts: Post[] = [];
let postIdCounter = 1;
let userIdCounter = 1; // Counter for user IDs

// --- User Functions ---

export const findUserByEmail = async (email: string): Promise<MockUser | null> => {
    console.log(`[Mock DB] Finding user by email: ${email}`);
    const user = users.find(u => u.email === email);
    console.log(`[Mock DB] User found by email "${email}":`, user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null);
    return user ? { ...user } : null; // Return a copy
};

export const findUserById = async (id: string): Promise<MockUser | null> => {
    console.log(`[Mock DB] Finding user by ID: ${id}`);
    const user = users.find(u => u.id === id);
     console.log(`[Mock DB] User found by ID "${id}":`, user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null);
    return user ? { ...user } : null;
};

export const createUser = async (userData: Omit<MockUser, 'id'>): Promise<MockUser> => {
    // Basic check for existing email before hashing etc.
    const existing = users.find(u => u.email === userData.email);
    if (existing) {
        console.error(`[Mock DB] Attempted to create user with existing email: ${userData.email}`);
        throw new Error("Email already in use"); // Prevent duplicates
    }

    const newUser: MockUser = {
        ...userData,
        id: `user-${userIdCounter++}`,
    };
    console.log(`[Mock DB] Creating user: ${newUser.email}, Role: ${newUser.role}`);
    users.push(newUser);
    // Return a copy without the password hash for safety
    const { hashedPassword, ...userResponse } = newUser;
    return userResponse;
};

// --- Post Functions ---

const createAuthorObject = (user: MockUser | null): Author => {
    if (!user) {
        console.warn("[Mock DB] createAuthorObject called with null user. Returning Unknown Author.");
        return {
            id: 'unknown-author-id', // Use a distinct ID
            name: 'Unknown Author',
            slug: 'unknown-author',
            avatarUrl: `https://i.pravatar.cc/40?u=unknown`,
            bio: 'Author information not available.',
        };
    }
    return {
        id: user.id,
        name: user.name || user.email || 'Unnamed Author',
        slug: user.id, // Use ID as slug for now, ensure it's consistent
        avatarUrl: user.photoURL || `https://i.pravatar.cc/40?u=${user.id}`,
        bio: `Bio for ${user.name || user.email}`, // Simple bio
    };
};

const generateSlug = (title: string): string => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens

     // Check for uniqueness, append counter if needed
     let slug = baseSlug;
     let counter = 0;
     while (posts.some(p => p.slug === slug)) {
         counter++;
         slug = `${baseSlug}-${counter}`;
     }
    console.log(`[Mock DB] Generated slug "${slug}" for title "${title}"`);
    return slug;
  };


export const createPost = async (postData: Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views' | 'updatedAt'> & { authorId: string }): Promise<Post> => {
    console.log(`[Mock DB] Attempting to create post by authorId: ${postData.authorId}`);
    const author = await findUserById(postData.authorId);
    if (!author) {
        console.error(`[Mock DB] Author not found for ID: ${postData.authorId} during post creation.`);
        throw new Error(`Author not found`); // More specific error
    }
    console.log(`[Mock DB] Author found: ${author.name} (${author.id})`);

    const slug = generateSlug(postData.title); // Ensure unique slug
    const newPost: Post = {
        id: `post-${postIdCounter++}`,
        slug: slug, // Use generated unique slug
        title: postData.title,
        content: postData.content,
        imageUrl: postData.imageUrl || `https://picsum.photos/seed/${slug}/1200/600`, // Use slug for image seed
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
    console.log(`[Mock DB] Creating post: "${newPost.title}" (ID: ${newPost.id}, Slug: ${newPost.slug}) by ${newPost.author.name}`);
    posts.push(newPost);
    console.log(`[Mock DB] Current posts count: ${posts.length}`);
    return { ...newPost }; // Return a copy
};

export const findPostBySlug = async (slug: string): Promise<Post | null> => {
    console.log(`[Mock DB] Finding post by slug: "${slug}"`);
    const post = posts.find(p => p.slug === slug);

    if (!post) {
         console.log(`[Mock DB] Post with slug "${slug}" NOT FOUND.`);
         console.log('[Mock DB] Available slugs:', posts.map(p => p.slug)); // Log available slugs for debugging
        return null;
    }

    console.log(`[Mock DB] Post FOUND with slug "${slug}": ID ${post.id}, Title: "${post.title}", Author ID: ${post.author.id}`);
    // Simulate fetching author details again (or ensure they are always embedded)
    const author = await findUserById(post.author.id);
    if (!author) {
         console.warn(`[Mock DB] Author ${post.author.id} not found for post ${post.id}, returning post with potentially stale/unknown author info.`);
    }
    const authorObject = createAuthorObject(author); // Use potentially unknown author
    console.log(`[Mock DB] Returning post "${post.title}" with author "${authorObject.name}"`);
    return { ...post, author: authorObject }; // Return copy with potentially updated author
};


export const findPosts = async (options: {
    page?: number;
    limit?: number;
    category?: string;
    authorId?: string; // Changed from authorSlug to authorId for clarity
    query?: string;
}): Promise<{ posts: Post[], hasMore: boolean, totalPages: number, currentPage: number, totalResults: number }> => {
    const { page = 0, limit = 9, category, authorId, query } = options;
    console.log(`[Mock DB] Finding posts with options:`, options);

    let filtered = [...posts]; // Start with a copy

    if (category && category !== 'all') {
        console.log(`[Mock DB] Filtering by category: ${category}`);
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (authorId) {
        console.log(`[Mock DB] Filtering by authorId: ${authorId}`);
        filtered = filtered.filter(p => p.author.id === authorId);
    }
    if (query) {
        console.log(`[Mock DB] Filtering by query: ${query}`);
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

    console.log(`[Mock DB] Found ${totalResults} total posts matching criteria. Returning page ${page} (${postsForPage.length} posts), hasMore=${hasMore}.`);


    // Ensure author details are up-to-date for the returned page
    const postsWithAuthors = await Promise.all(postsForPage.map(async (post) => {
        const author = await findUserById(post.author.id);
         if (!author) {
            console.warn(`[Mock DB] Author ${post.author.id} not found for post ${post.id} in findPosts list.`);
         }
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
    console.log(`[Mock DB] Attempting update for post slug: "${slug}" by authorId: ${updateData.authorId}`);
    const postIndex = posts.findIndex(p => p.slug === slug);
    if (postIndex === -1) {
        console.log(`[Mock DB] Post not found for update: ${slug}`);
        return null;
    }

    const originalPost = posts[postIndex];
    console.log(`[Mock DB] Found post "${originalPost.title}" (ID: ${originalPost.id}) for update.`);

    // **Authorization Check**: Ensure the authorId matches the post's author OR user is admin
    const requestingUser = await findUserById(updateData.authorId);
    if (!requestingUser) {
         console.error(`[Mock DB] Authorization failed: Requesting user ${updateData.authorId} not found.`);
         throw new Error("Unauthorized");
    }

    if (originalPost.author.id !== updateData.authorId && requestingUser.role !== 'admin') {
         console.error(`[Mock DB] Authorization failed: User ${updateData.authorId} (Role: ${requestingUser.role}) cannot update post owned by ${originalPost.author.id}`);
         throw new Error("Unauthorized");
    }
    console.log(`[Mock DB] Authorization successful for user ${requestingUser.email} (Role: ${requestingUser.role}) to update post ${originalPost.id}.`);

    const updatedPost: Post = {
        ...originalPost, // Start with original post
        ...updateData, // Apply updates
        author: originalPost.author, // CRITICAL: Keep original author object reference unless specifically changing author
        updatedAt: new Date(),
        // Re-generate excerpt if content changed and no explicit excerpt provided
        excerpt: (updateData.content && !updateData.excerpt)
                    ? updateData.content.substring(0, 150) + '...'
                    : updateData.excerpt ?? originalPost.excerpt,
    };

    posts[postIndex] = updatedPost;
    console.log(`[Mock DB] Post updated: "${updatedPost.title}" (ID: ${updatedPost.id})`);

    // Fetch potentially updated author details (name might change etc) - though we keep original author ref above
    // const author = await findUserById(updatedPost.author.id);
    return { ...updatedPost /*, author: createAuthorObject(author) */ }; // Return updated copy
};

export const deletePost = async (slug: string, requestingUserId: string): Promise<boolean> => {
    console.log(`[Mock DB] Attempting delete for post slug: "${slug}" by userId: ${requestingUserId}`);
    const postIndex = posts.findIndex(p => p.slug === slug);
    if (postIndex === -1) {
        console.log(`[Mock DB] Post not found for delete: ${slug}`);
        return false;
    }

    const postToDelete = posts[postIndex];
    console.log(`[Mock DB] Found post "${postToDelete.title}" (ID: ${postToDelete.id}, Author: ${postToDelete.author.id}) for deletion.`);

    // **Authorization Check**: Ensure the authorId matches the post's author OR user is admin
    const user = await findUserById(requestingUserId);
    if (!user) {
         console.error(`[Mock DB] Authorization failed: Requesting user ${requestingUserId} not found.`);
         throw new Error("Unauthorized"); // User must exist to delete
     }

    const postAuthorId = postToDelete.author.id;

    if (postAuthorId !== requestingUserId && user.role !== 'admin') {
        console.error(`[Mock DB] Authorization failed: User ${requestingUserId} (Role: ${user.role}) cannot delete post owned by ${postAuthorId}`);
        throw new Error("Unauthorized");
    }
     console.log(`[Mock DB] Authorization successful for user ${user.email} (Role: ${user.role}) to delete post ${postToDelete.id}.`);

    posts.splice(postIndex, 1);
    console.log(`[Mock DB] Post deleted: ${slug}. Remaining posts: ${posts.length}`);
    return true;
};


// --- Seed Data (Optional) ---
const seedData = async () => {
     console.log("[Mock DB] Seeding initial data...");
     if (users.length > 0 || posts.length > 0) {
          console.log("[Mock DB] Database already contains data. Skipping seed.");
          return;
      }
     // Create admin user
     try {
         const adminPasswordHash = await bcrypt.hash('adminpassword', 10); // Use a secure password
         await createUser({
             email: 'vedansh2821@gmail.com',
             name: 'Admin User',
             role: 'admin',
             hashedPassword: adminPasswordHash,
             photoURL: 'https://i.pravatar.cc/150?u=admin',
         });
          console.log("[Mock DB] Admin user created.");

         // Create regular users
         const user1PasswordHash = await bcrypt.hash('password123', 10);
        const user1 = await createUser({
            email: 'bob@example.com',
            name: 'Bob',
            role: 'user',
            hashedPassword: user1PasswordHash,
            photoURL: 'https://i.pravatar.cc/150?u=bob',
        });
         console.log("[Mock DB] User 'Bob' created.");

        const user2PasswordHash = await bcrypt.hash('password456', 10);
         const user2 = await createUser({
            email: 'alice@example.com',
            name: 'Alice',
            role: 'user',
            hashedPassword: user2PasswordHash,
            photoURL: 'https://i.pravatar.cc/150?u=alice',
        });
          console.log("[Mock DB] User 'Alice' created.");

         // Create posts
          console.log("[Mock DB] Creating posts...");
         await createPost({
             title: "First Post by Bob",
             content: "<p>This is <strong>Bob's</strong> first blog post content. It talks about technology.</p><h2>Subtitle</h2><p>More details here.</p>",
             category: "Technology",
             authorId: user1.id,
             excerpt: "This is Bob's first blog post content...",
             tags: ["intro", "tech"],
         });
         await createPost({
              title: "Alice's Thoughts on Lifestyle",
              content: "<p>Exploring minimalism and <em>intentional living</em>. It's about focusing on what matters.</p><ul><li>Declutter</li><li>Prioritize</li></ul>",
              category: "Lifestyle",
              authorId: user2.id,
              excerpt: "Exploring minimalism and intentional living...",
               tags: ["minimalism", "life"],
          });
           await createPost({
               title: "Another Tech Update by Bob",
               content: "<p>More content about technology trends, including AI and Web3.</p>",
               category: "Technology",
               authorId: user1.id,
                excerpt: "More content about technology trends...",
                tags: ["ai", "web3", "tech"],
           });
             await createPost({
                 title: "Healthy Habits for Programmers",
                 content: "<p>Sitting all day? Here are some tips for staying healthy. Remember to take breaks!</p>",
                 category: "Health",
                 authorId: user2.id, // Alice writes about health too
                 excerpt: "Sitting all day? Here are some tips...",
                 tags: ["health", "programming", "wellness"],
             });
         console.log("[Mock DB] Seed data creation complete.");
         console.log("[Mock DB] Initial Posts:", posts.map(p => ({ slug: p.slug, title: p.title })));
     } catch (error) {
          console.error("[Mock DB] Error during seeding:", error);
      }
 };

 // Only seed in development if DB is empty
 if (process.env.NODE_ENV !== 'production' && users.length === 0) {
     seedData();
 }
 else {
     console.log("[Mock DB] Initial Posts (already seeded or production):", posts.map(p => ({ slug: p.slug, title: p.title })));
 }
