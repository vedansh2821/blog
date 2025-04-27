// IMPORTANT: This is an IN-MEMORY MOCK simulating a SQL database.
// DO NOT USE THIS IN PRODUCTION. Replace with a real database and ORM (like Prisma).

import type { AuthUser } from '@/lib/auth/authContext';
import type { Post, Author } from '@/types/blog'; // Assuming types exist
import bcrypt from 'bcrypt'; // Ensure bcrypt is imported

interface MockUser extends AuthUser {
    hashedPassword?: string; // Store hashed password here
}

// --- In-Memory Stores ---
const users: MockUser[] = [];
const posts: Post[] = [];
let userIdCounter = 1;
let postIdCounter = 1;

// --- Helper Functions ---
const generateSlug = (title: string, id: string): string => {
    // Simple slug generation: lowercase title + id suffix
    const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
    return `${baseSlug}-${id}`; // Use actual ID for uniqueness
};

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


// --- User Functions ---

export const findUserByEmail = async (email: string): Promise<MockUser | null> => {
    console.log(`[Mock DB] Finding user by email: ${email}`);
    await new Promise(res => setTimeout(res, 50)); // Simulate delay
    const user = users.find(u => u.email === email);
    return user ? { ...user } : null; // Return a copy
};

export const findUserById = async (id: string): Promise<MockUser | null> => {
    console.log(`[Mock DB] Finding user by ID: ${id}`);
     await new Promise(res => setTimeout(res, 50)); // Simulate delay
    const user = users.find(u => u.id === id);
    return user ? { ...user } : null;
};

export const createUser = async (userData: Omit<MockUser, 'id'> & { hashedPassword?: string }): Promise<MockUser> => {
    const newUser: MockUser = {
        ...userData,
        id: `user-${userIdCounter++}`,
    };
    console.log(`[Mock DB] Creating user: ${newUser.email}, Role: ${newUser.role}`);
    await new Promise(res => setTimeout(res, 100)); // Simulate delay
    users.push(newUser);
    // Don't return hashedPassword in the response object for security
    const { hashedPassword, ...userResponse } = newUser;
    return { ...userResponse };
};

// --- Post Functions ---


export const createPost = async (postData: Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views' | 'updatedAt'> & { authorId: string }): Promise<Post> => {
    const author = await findUserById(postData.authorId);
    if (!author) {
        throw new Error(`[Mock DB] Author not found for ID: ${postData.authorId}`);
    }

    const newPostId = `post-${postIdCounter++}`;
    const newPost: Post = {
        id: newPostId,
        slug: generateSlug(postData.title, newPostId), // Generate slug using ID
        title: postData.title,
        content: postData.content,
        imageUrl: postData.imageUrl || `https://picsum.photos/seed/${newPostId}/1200/600`,
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
     await new Promise(res => setTimeout(res, 150)); // Simulate delay
    posts.push(newPost);
    return { ...newPost }; // Return a copy
};

export const findPostBySlug = async (slug: string): Promise<Post | null> => {
    console.log(`[Mock DB] Finding post by slug: ${slug}`);
     await new Promise(res => setTimeout(res, 80)); // Simulate delay
    const post = posts.find(p => p.slug === slug);
    if (!post) {
        console.log(`[Mock DB] Post with slug ${slug} not found.`);
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
    authorId?: string; // Use author ID directly
    query?: string;
}): Promise<{ posts: Post[], hasMore: boolean, totalPages: number, currentPage: number, totalResults: number }> => {
    const { page = 0, limit = 9, category, authorId, query } = options;
    console.log(`[Mock DB] Finding posts:`, options);
    await new Promise(res => setTimeout(res, 200)); // Simulate delay

    let filtered = [...posts]; // Start with a copy

    if (category && category.toLowerCase() !== 'all') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (authorId) {
        filtered = filtered.filter(p => p.author.id === authorId);
    }
    if (query) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(lowerQuery) ||
            (p.excerpt && p.excerpt.toLowerCase().includes(lowerQuery)) || // Check if excerpt exists
            p.content.toLowerCase().includes(lowerQuery) ||
             (p.author.name && p.author.name.toLowerCase().includes(lowerQuery)) || // Search by author name
             (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) // Search tags
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

    console.log(`[Mock DB] Found ${totalResults} posts, returning page ${page} (${postsWithAuthors.length} posts)`);
    return {
        posts: postsWithAuthors,
        hasMore,
        totalPages,
        currentPage: page,
        totalResults,
    };
};

export const updatePost = async (slug: string, updateData: Partial<Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views' | 'updatedAt'>> & { currentUserId: string }): Promise<Post | null> => {
    console.log(`[Mock DB] Updating post with slug: ${slug}`);
     await new Promise(res => setTimeout(res, 100)); // Simulate delay
    const postIndex = posts.findIndex(p => p.slug === slug);
    if (postIndex === -1) {
        console.log(`[Mock DB] Post not found for update: ${slug}`);
        return null;
    }

    const postToUpdate = posts[postIndex];
    const currentUser = await findUserById(updateData.currentUserId);

    // **Authorization Check**: Ensure the currentUserId matches the post's author OR user is admin
    if (postToUpdate.author.id !== updateData.currentUserId && currentUser?.role !== 'admin') {
         console.error(`[Mock DB] Authorization failed: User ${updateData.currentUserId} cannot update post owned by ${postToUpdate.author.id}`);
         throw new Error("Unauthorized: You don't have permission to edit this post.");
    }

    const { currentUserId, ...restUpdateData } = updateData; // Remove currentUserId before merging

    const updatedPost = {
        ...postToUpdate,
        ...restUpdateData,
        updatedAt: new Date(),
        // Re-generate excerpt if content changed and no explicit excerpt provided
        excerpt: restUpdateData.content && !restUpdateData.excerpt ? restUpdateData.content.substring(0, 150) + '...' : restUpdateData.excerpt ?? postToUpdate.excerpt,
        // Generate new slug ONLY if title changed
        slug: restUpdateData.title && restUpdateData.title !== postToUpdate.title
            ? generateSlug(restUpdateData.title, postToUpdate.id)
            : postToUpdate.slug,
    };

    // Keep original author object unless specifically changed (not typical)
    updatedPost.author = postToUpdate.author;

    posts[postIndex] = updatedPost;
    console.log(`[Mock DB] Post updated: ${updatedPost.title} (New Slug: ${updatedPost.slug})`);

    // Fetch potentially updated author details (name might change etc)
    const author = await findUserById(updatedPost.author.id);
    return { ...updatedPost, author: createAuthorObject(author) };
};

export const deletePost = async (slug: string, currentUserId: string): Promise<boolean> => {
    console.log(`[Mock DB] Deleting post with slug: ${slug} by user: ${currentUserId}`);
    await new Promise(res => setTimeout(res, 100)); // Simulate delay
    const postIndex = posts.findIndex(p => p.slug === slug);
    if (postIndex === -1) {
        console.log(`[Mock DB] Post not found for delete: ${slug}`);
        return false;
    }

    // **Authorization Check**: Ensure the currentUserId matches the post's author OR user is admin
    const currentUser = await findUserById(currentUserId);
    const postAuthorId = posts[postIndex].author.id;

    if (postAuthorId !== currentUserId && currentUser?.role !== 'admin') {
        console.error(`[Mock DB] Authorization failed: User ${currentUserId} (Role: ${currentUser?.role}) cannot delete post owned by ${postAuthorId}`);
        throw new Error("Unauthorized: You don't have permission to delete this post.");
    }

    posts.splice(postIndex, 1);
    console.log(`[Mock DB] Post deleted: ${slug}`);
    return true;
};


// --- Seed Data (Optional) ---
const seedData = async () => {
    // Check if admin already exists
    const existingAdmin = await findUserByEmail('vedansh2821@gmail.com');
    if (existingAdmin) {
        console.log("[Mock DB] Admin user already exists, skipping seeding.");
        return; // Don't re-seed if admin exists
    }

    console.log("[Mock DB] Seeding initial data...");

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
    const bobPasswordHash = await bcrypt.hash('password123', 10);
    const alicePasswordHash = await bcrypt.hash('password456', 10);

    // Create admin user
    const adminUser = await createUser({
        email: 'vedansh2821@gmail.com',
        name: 'Vedansh',
        role: 'admin',
        hashedPassword: adminPasswordHash,
        photoURL: 'https://i.pravatar.cc/150?u=vedansh',
    });
    // Create regular users
    const user1 = await createUser({
        email: 'bob@example.com',
        name: 'Bob The Builder',
        role: 'user',
        hashedPassword: bobPasswordHash,
        photoURL: 'https://i.pravatar.cc/150?u=bob',
    });
    const user2 = await createUser({
        email: 'alice@example.com',
        name: 'Alice Wonderland',
        role: 'user',
        hashedPassword: alicePasswordHash,
        photoURL: 'https://i.pravatar.cc/150?u=alice',
    });

    // Create posts
    await createPost({
        title: "The Future of AI",
        content: "<p>Artificial intelligence is rapidly evolving. In this post, we explore the potential breakthroughs and ethical considerations surrounding AI development.</p> <p>From machine learning advancements to the quest for artificial general intelligence (AGI), the landscape is constantly shifting.</p> <h2>Key Areas</h2> <ul><li>Natural Language Processing</li><li>Computer Vision</li><li>Reinforcement Learning</li></ul>",
        category: "Technology",
        authorId: adminUser.id, // Admin post
        imageUrl: 'https://picsum.photos/seed/ai-future/1200/600',
        tags: ['AI', 'Machine Learning', 'Future Tech'],
        excerpt: "Exploring the potential breakthroughs and ethical considerations surrounding AI development..."
    });
    await createPost({
        title: "Minimalist Living Guide",
        content: "<p>Discover the benefits of minimalism and how decluttering your life can lead to greater focus and happiness.</p><p>We'll cover practical steps to start your minimalist journey, from your wardrobe to your digital life.</p>",
        category: "Lifestyle",
        authorId: user2.id, // Alice's post
         imageUrl: 'https://picsum.photos/seed/minimalism/1200/600',
         tags: ['Minimalism', 'Simple Living', 'Wellbeing'],
         excerpt: "Discover the benefits of minimalism and how decluttering your life can lead to greater focus..."
    });
    await createPost({
        title: "10 Healthy Habits for a Better Life",
        content: "<p>Incorporating small, consistent healthy habits can make a big difference. Learn 10 actionable tips you can start today.</p>",
        category: "Health",
        authorId: user1.id, // Bob's post
         imageUrl: 'https://picsum.photos/seed/healthyhabits/1200/600',
         tags: ['Health', 'Wellness', 'Habits'],
         excerpt: "Learn 10 actionable healthy habits you can start implementing today for a better life..."
    });
     await createPost({
        title: "Exploring the Swiss Alps",
        content: "<p>A breathtaking journey through the mountains, lakes, and charming villages of Switzerland.</p>",
        category: "Travel",
        authorId: user2.id, // Alice's post
         imageUrl: 'https://picsum.photos/seed/switzerland/1200/600',
         tags: ['Travel', 'Switzerland', 'Mountains', 'Europe'],
         excerpt: "A breathtaking journey through the mountains, lakes, and charming villages of Switzerland..."
    });
      await createPost({
        title: "Introduction to React Server Components",
        content: "<p>Understanding the new paradigm shift in React development with Server Components.</p>",
        category: "Technology",
        authorId: adminUser.id, // Admin post
         imageUrl: 'https://picsum.photos/seed/react-rsc/1200/600',
         tags: ['React', 'Web Development', 'Server Components', 'Next.js'],
         excerpt: "Understanding the new paradigm shift in React development with Server Components..."
    });
    // Add more posts as needed...

    console.log("[Mock DB] Seed data creation complete.");
};

// --- Initialize Seed Data ---
// Check if users array is empty before seeding
if (users.length === 0 && process.env.NODE_ENV !== 'production') {
    seedData().catch(error => console.error("[Mock DB] Error seeding data:", error));
}
