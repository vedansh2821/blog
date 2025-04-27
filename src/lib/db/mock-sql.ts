// IMPORTANT: This is an IN-MEMORY MOCK simulating a SQL database.
// DO NOT USE THIS IN PRODUCTION. Replace with a real database and ORM (like Prisma).

import type { AuthUser } from '@/lib/auth/authContext';
import type { Post, Author } from '@/types/blog'; // Assuming types exist
import bcrypt from 'bcrypt'; // Import bcrypt

interface MockUser extends AuthUser {
    hashedPassword?: string; // Store hashed password here
    dob?: string | null; // Added Date of Birth (YYYY-MM-DD)
    phone?: string | null; // Added Phone Number
    joinedAt: Date; // Added Join Date (non-optional)
}

// --- In-Memory Stores ---
const users: MockUser[] = [];
const posts: Post[] = [];
let postIdCounter = 1;
let userIdCounter = 1;

// --- User Functions ---

export const findUserByEmail = async (email: string): Promise<MockUser | null> => {
    console.log(`[Mock DB] Finding user by email: ${email}`);
    const user = users.find(u => u.email === email);
    // Ensure joinedAt is returned as a Date object
    return user ? { ...user, joinedAt: new Date(user.joinedAt) } : null; // Return a copy
};

export const findUserById = async (id: string): Promise<MockUser | null> => {
    console.log(`[Mock DB] Finding user by ID: ${id}`);
    const user = users.find(u => u.id === id);
     // Ensure joinedAt is returned as a Date object
    return user ? { ...user, joinedAt: new Date(user.joinedAt) } : null;
};

export const createUser = async (userData: Omit<MockUser, 'id' | 'joinedAt'>): Promise<MockUser> => {
    const newUser: MockUser = {
        ...userData,
        id: `user-${userIdCounter++}`, // Use a simple counter for predictable IDs during seeding/dev
        joinedAt: new Date(), // Set join date on creation
        dob: userData.dob || null, // Ensure dob and phone are handled
        phone: userData.phone || null,
    };
    console.log(`[Mock DB] Creating user: ${newUser.email}, Role: ${newUser.role}, ID: ${newUser.id}`);
    users.push(newUser);
    // Don't return password hash in the response object sent back typically
    const { hashedPassword, ...userResponse } = newUser;
    return { ...userResponse, joinedAt: new Date(userResponse.joinedAt) } as MockUser; // Return copy without hash, ensure date object
};

// Function to update user profile information (name, dob, phone)
export const updateUser = async (userId: string, updates: { name?: string; dob?: string | null; phone?: string | null }): Promise<MockUser | null> => {
    console.log(`[Mock DB] Updating user ID: ${userId}`, updates);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        console.log(`[Mock DB] User not found for update: ${userId}`);
        return null;
    }

    // Create updated user object, filtering out undefined fields from updates
    const updatedUser: MockUser = {
        ...users[userIndex],
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.dob !== undefined && { dob: updates.dob }),
        ...(updates.phone !== undefined && { phone: updates.phone }),
    };

    users[userIndex] = updatedUser;
    console.log(`[Mock DB] User updated: ${updatedUser.email}`);

    // Return updated user without password hash
    const { hashedPassword, ...userResponse } = updatedUser;
     return { ...userResponse, joinedAt: new Date(userResponse.joinedAt) } as MockUser; // Ensure date object
}

// Function to update user password
export const updatePassword = async (userId: string, newPasswordHash: string): Promise<boolean> => {
    console.log(`[Mock DB] Updating password for user ID: ${userId}`);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        console.log(`[Mock DB] User not found for password update: ${userId}`);
        return false;
    }

    users[userIndex].hashedPassword = newPasswordHash;
    console.log(`[Mock DB] Password updated for: ${users[userIndex].email}`);
    return true;
}


// --- Post Functions ---

const createAuthorObject = (user: MockUser | null): Author => {
    if (!user) {
        return {
            id: 'unknown',
            name: 'Unknown Author',
            slug: 'unknown',
            avatarUrl: `https://i.pravatar.cc/40?u=unknown`,
            bio: 'Author information not available.',
            joinedAt: new Date(0), // Default date for unknown
        };
    }
    return {
        id: user.id,
        name: user.name || user.email || 'Unnamed Author',
        slug: user.id, // Use user ID as author slug for simplicity
        avatarUrl: user.photoURL || `https://i.pravatar.cc/40?u=${user.id}`,
        bio: `Bio for ${user.name || user.email}`, // Simple bio
        joinedAt: new Date(user.joinedAt), // Include joinedAt
    };
};

// Modify generateSlug to create deterministic slugs by default
// Add a suffix only if addUniqueSuffix is true OR if the base slug already exists
const generateSlug = (title: string, addUniqueSuffix: boolean = false): string => {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens

    // Handle potential empty slug after sanitization
    if (!baseSlug) {
        baseSlug = `post-${Date.now()}`;
    }


    let finalSlug = baseSlug;
    let counter = 1;
    let needsSuffix = addUniqueSuffix;

    // Check for existing slug even if suffix wasn't explicitly requested
    while (posts.some(p => p.slug === finalSlug)) {
        needsSuffix = true; // Force suffix if collision detected
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
    }

    return finalSlug;
};


// Modify createPost to accept the addUniqueSuffix parameter
export const createPost = async (
    postData: Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views' | 'rating' | 'ratingCount'> & { authorId: string },
    addUniqueSuffix: boolean = false // Default to false (for seeding)
): Promise<Post> => {
    const author = await findUserById(postData.authorId);
    if (!author) {
        throw new Error(`[Mock DB] Author not found for ID: ${postData.authorId}`);
    }

    const newPost: Post = {
        id: `post-${postIdCounter++}`,
        // Use the new parameter here when calling generateSlug
        slug: generateSlug(postData.title, addUniqueSuffix),
        title: postData.title,
        content: postData.content,
        imageUrl: postData.imageUrl || `https://picsum.photos/seed/post${postIdCounter}/1200/600`,
        category: postData.category,
        author: createAuthorObject(author),
        publishedAt: new Date(),
        updatedAt: new Date(),
        commentCount: 0,
        views: Math.floor(Math.random() * 1000), // Add random views
        excerpt: postData.excerpt || postData.content.substring(0, 150) + '...',
        tags: postData.tags || [],
        rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Random rating 3.0-5.0
        ratingCount: Math.floor(Math.random() * 50) + 5, // Add rating count
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
    authorId?: string; // Use authorId for filtering
    query?: string;
}): Promise<{ posts: Post[], hasMore: boolean, totalPages: number, currentPage: number, totalResults: number }> => {
    const { page = 0, limit = 9, category, authorId, query } = options;
    console.log(`[Mock DB] Finding posts:`, options);

    let filtered = [...posts]; // Start with a copy

    if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (authorId) {
        // Filter by the author's ID directly
        filtered = filtered.filter(p => p.author.id === authorId);
    }
    if (query) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.excerpt.toLowerCase().includes(lowerQuery) ||
            p.content.toLowerCase().includes(lowerQuery) ||
            p.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
             p.author.name.toLowerCase().includes(lowerQuery)
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
        // Ensure dates are Date objects
        const pubDate = new Date(post.publishedAt);
        const updDate = post.updatedAt ? new Date(post.updatedAt) : undefined;
        const author = await findUserById(post.author.id);
        return { ...post, publishedAt: pubDate, updatedAt: updDate, author: createAuthorObject(author) };
    }));

    return {
        posts: postsWithAuthors,
        hasMore,
        totalPages,
        currentPage: page,
        totalResults,
    };
};


export const updatePost = async (slug: string, updateData: Partial<Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views' | 'rating' | 'ratingCount'>> & { requestingUserId: string }): Promise<Post | null> => {
    console.log(`[Mock DB] Updating post with slug: ${slug}`);
    const postIndex = posts.findIndex(p => p.slug === slug);
    if (postIndex === -1) {
        console.log(`[Mock DB] Post not found for update: ${slug}`);
        return null;
    }

     // **Authorization Check**: Get requesting user and check role/ownership
     const requestingUser = await findUserById(updateData.requestingUserId);
     if (!requestingUser) {
         console.error(`[Mock DB] Authorization failed: Requesting user ${updateData.requestingUserId} not found.`);
         throw new Error("Unauthorized");
     }
     const postOwnerId = posts[postIndex].author.id;
     if (postOwnerId !== requestingUser.id && requestingUser.role !== 'admin') {
          console.error(`[Mock DB] Authorization failed: User ${requestingUser.id} (Role: ${requestingUser.role}) cannot update post owned by ${postOwnerId}`);
          throw new Error("Unauthorized");
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

export const deletePost = async (slug: string, requestingUserId: string): Promise<boolean> => {
    console.log(`[Mock DB] Deleting post with slug: ${slug} by user: ${requestingUserId}`);
    const postIndex = posts.findIndex(p => p.slug === slug);
    if (postIndex === -1) {
        console.log(`[Mock DB] Post not found for delete: ${slug}`);
        return false;
    }

    // **Authorization Check**: Ensure the requestingUserId matches the post's author OR user is admin
    const user = await findUserById(requestingUserId);
    const postAuthorId = posts[postIndex].author.id;

    if (!user) {
         console.error(`[Mock DB] Authorization failed: Requesting user ${requestingUserId} not found.`);
         throw new Error("Unauthorized"); // Or return false/error response in API
     }

    if (postAuthorId !== requestingUserId && user.role !== 'admin') {
        console.error(`[Mock DB] Authorization failed: User ${requestingUserId} (Role: ${user.role}) cannot delete post owned by ${postAuthorId}`);
        throw new Error("Unauthorized"); // Or return false/error response in API
    }

    posts.splice(postIndex, 1);
    console.log(`[Mock DB] Post deleted: ${slug}`);
    return true;
};


// --- Seed Data (Optional) ---
const seedData = async () => {
     if (users.length > 0 || posts.length > 0) {
       console.log("[Mock DB] Database already contains data. Skipping seed.");
       return;
     }
     console.log("[Mock DB] Seeding initial data...");

     try {
       // Create admin user
       const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
       const adminUser = await createUser({
           email: 'vedansh2821@gmail.com',
           name: 'Vedansh V.',
           role: 'admin',
           hashedPassword: adminPasswordHash,
           photoURL: 'https://i.pravatar.cc/150?u=vedansh2821',
           dob: '1990-01-01',
           phone: '123-456-7890',
       });

       // Create regular users
       const bobPasswordHash = await bcrypt.hash('password123', 10);
       const user1 = await createUser({
           email: 'bob@example.com',
           name: 'Bob The Blogger',
           role: 'user',
           hashedPassword: bobPasswordHash,
           photoURL: 'https://i.pravatar.cc/150?u=bob',
           dob: '1995-05-15',
           phone: null,
       });

       const alicePasswordHash = await bcrypt.hash('password456', 10);
       const user2 = await createUser({
           email: 'alice@example.com',
           name: 'Alice Writes',
           role: 'user',
           hashedPassword: alicePasswordHash,
           photoURL: 'https://i.pravatar.cc/150?u=alice',
           dob: null,
           phone: '987-654-3210',
       });

        // Create posts (use addUniqueSuffix: false for seeding to get predictable slugs)
        await createPost({
            title: "First Post by Bob",
            content: "<p>This is Bob's <strong>first</strong> blog post content. Exploring the world of tech!</p><ul><li>React</li><li>Next.js</li></ul>",
            category: "Technology",
            authorId: user1.id,
            tags: ["getting started", "tech"],
            excerpt: "Bob's first foray into the tech blogging world."
        }, false);

        await createPost({
             title: "Alice's Thoughts on Lifestyle",
             content: "<p>Exploring minimalism and intentional living. How decluttering your space can declutter your mind.</p><p>Source: <a href='#'>Minimalism Documentary</a></p>",
             category: "Lifestyle",
             authorId: user2.id,
             tags: ["minimalism", "wellbeing"],
             excerpt: "Alice shares her journey into minimalism and intentional living."
         }, false);

          await createPost({
              title: "Another Tech Update by Bob",
              content: "<p>More content about technology trends. Let's talk about WebAssembly.</p><pre><code class='language-javascript'>console.log('Hello Wasm!');</code></pre>",
              category: "Technology",
              authorId: user1.id,
              tags: ["webassembly", "performance"],
              excerpt: "Bob discusses the latest advancements in WebAssembly."
          }, false);

         await createPost({
           title: "Healthy Habits for Developers",
           content: "<p>Staying healthy while coding long hours. Tips for posture, exercise, and diet.</p>",
           category: "Health",
           authorId: adminUser.id, // Admin posts too
           tags: ["health", "developer", "wellness"],
           excerpt: "Essential health tips tailored for software developers."
         }, false);

          await createPost({
             title: "Travel Guide: Hidden Gems",
             content: "<p>Discovering lesser-known travel destinations for your next adventure.</p><img src='https://picsum.photos/seed/travelguide/800/400' alt='Travel destination' />",
             category: "Travel",
             authorId: user2.id,
             tags: ["travel", "adventure", "explore"],
             excerpt: "Alice uncovers some hidden gems for intrepid travelers."
          }, false);

        console.log("[Mock DB] Seed data creation finished.");
        console.log("[Mock DB] Users:", users.map(u => ({id: u.id, email: u.email, role: u.role, joinedAt: u.joinedAt})));
        console.log("[Mock DB] Posts:", posts.map(p => ({id: p.id, slug: p.slug, title: p.title})));


      } catch (error) {
         console.error("[Mock DB] Error seeding data:", error);
      }
 };

 // Initialize seed data in development if DB is empty
 if (process.env.NODE_ENV !== 'production' && users.length === 0) {
     seedData();
 }
