
// IMPORTANT: This is an IN-MEMORY MOCK simulating a SQL database.
// DO NOT USE THIS IN PRODUCTION. Replace with a real database and ORM (like Prisma).

import type { AuthUser } from '@/lib/auth/authContext';
import type { Post, Author, ReactionType, UserReaction } from '@/types/blog'; // Assuming types exist
import bcrypt from 'bcrypt';

// Extend MockUser to include photoURL potentially being null
interface MockUser extends Omit<AuthUser, 'photoURL'> {
    hashedPassword?: string;
    dob?: string | null;
    phone?: string | null;
    firstSchool?: string | null;
    petName?: string | null;
    joinedAt: Date;
    photoURL?: string | null; // Allow photoURL to be explicitly null
}

// --- In-Memory Stores ---
const users: MockUser[] = [];
const posts: Post[] = [];
const reactions: UserReaction[] = []; // Store individual reactions
let postIdCounter = 1;
let userIdCounter = 1;
let isSeeded = false;

// --- User Functions ---

export const findUserByEmail = async (email: string): Promise<MockUser | null> => {
    console.log(`[Mock DB] Finding user by email: ${email}`);
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (user) {
         console.log(`[Mock DB] User found for ${email}. Stored Hash: ${user.hashedPassword ? user.hashedPassword.substring(0, 10) + '...' : 'NONE'}`);
         return { ...user, joinedAt: new Date(user.joinedAt) };
     } else {
         console.log(`[Mock DB] User not found for email: ${email}`);
         return null;
     }
};

export const findUserById = async (id: string): Promise<MockUser | null> => {
    console.log(`[Mock DB findUserById] Finding user by ID: "${id}"`);
    const availableUserIds = users.map(u => u.id);
    // console.log(`[Mock DB findUserById] Available user IDs: [${availableUserIds.join(', ')}]`); // Reduce noise
    const user = users.find(u => u.id === id);
    if (user) {
        console.log(`[Mock DB findUserById] User found for ID "${id}".`);
        return { ...user, joinedAt: new Date(user.joinedAt) };
    } else {
        console.warn(`[Mock DB findUserById] User NOT found for ID "${id}".`);
        return null;
    }
};

export const getAllUsers = async (requestingUserId: string): Promise<AuthUser[]> => {
    console.log(`[Mock DB getAllUsers] Performing authorization check for requesting user ID: ${requestingUserId}`);
    const requestingUser = await findUserById(requestingUserId);
    if (!requestingUser) {
        console.warn(`[Mock DB getAllUsers] Unauthorized attempt: Requesting user ${requestingUserId} not found.`);
        throw new Error("Unauthorized: Requesting user not found.");
    }

    if (requestingUser.role !== 'admin') {
        console.warn(`[Mock DB getAllUsers] Forbidden: User ${requestingUser.id} (${requestingUser.email}) is not an admin.`);
        throw new Error("Forbidden: Only admins can access the full user list.");
    }

    console.log(`[Mock DB getAllUsers] User ${requestingUser.id} is authorized as admin. Returning ${users.length} users.`);
    // Convert MockUser back to AuthUser for the response, ensuring photoURL is handled
    return users.map(user => {
        const { hashedPassword, ...userWithoutHash } = user;
        return {
            ...userWithoutHash,
            photoURL: userWithoutHash.photoURL ?? null, // Ensure photoURL is null if undefined
            joinedAt: new Date(userWithoutHash.joinedAt),
        } as AuthUser; // Cast to AuthUser
    });
};


export const createUser = async (userData: Omit<MockUser, 'id' | 'joinedAt'>): Promise<MockUser> => {
    const existingUser = users.find(u => u.email?.toLowerCase() === userData.email?.toLowerCase());
    if (existingUser) {
        console.warn(`[Mock DB] Attempted to create user with existing email: ${userData.email}`);
        throw new Error(`User with email ${userData.email} already exists.`);
    }

    const newUser: MockUser = {
        ...userData,
        id: `user-${userIdCounter++}`,
        email: userData.email?.toLowerCase(),
        joinedAt: new Date(),
        dob: userData.dob || null,
        phone: userData.phone || null,
        firstSchool: userData.firstSchool || null,
        petName: userData.petName || null,
        photoURL: userData.photoURL || `https://i.pravatar.cc/150?u=user-${userIdCounter}`, // Default avatar if not provided
    };
    const hashSnippet = newUser.hashedPassword ? newUser.hashedPassword.substring(0, 10) + '...' : 'NONE PROVIDED';
    console.log(`[Mock DB] Creating user: ${newUser.email}, Role: ${newUser.role}, ID: ${newUser.id}, Hash: ${hashSnippet}, First School: ${newUser.firstSchool}, Pet Name: ${newUser.petName}`);
    users.push(newUser);
    const { hashedPassword, ...userResponse } = newUser;
    return { ...userResponse, joinedAt: new Date(userResponse.joinedAt) } as MockUser;
};

// Update updateUser to accept photoURL
export const updateUser = async (
    userId: string,
    updates: { name?: string; dob?: string | null; phone?: string | null; photoURL?: string | null } // Added photoURL
): Promise<MockUser | null> => {
    console.log(`[Mock DB] Updating user ID: ${userId}`, updates);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        console.log(`[Mock DB] User not found for update: ${userId}`);
        return null;
    }

    const updatedUser: MockUser = {
        ...users[userIndex],
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.dob !== undefined && { dob: updates.dob }),
        ...(updates.phone !== undefined && { phone: updates.phone }),
        ...(updates.photoURL !== undefined && { photoURL: updates.photoURL }), // Apply photoURL update
    };

    users[userIndex] = updatedUser;
    console.log(`[Mock DB] User updated: ${updatedUser.email}`);

    const { hashedPassword, ...userResponse } = updatedUser;
     return { ...userResponse, joinedAt: new Date(userResponse.joinedAt) } as MockUser;
}

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

export const verifySecurityQuestions = async (userId: string, firstSchoolAnswer: string, petNameAnswer: string): Promise<boolean> => {
    console.log(`[Mock DB] Verifying security questions for user ID: ${userId}`);
    const user = users.find(u => u.id === userId);
    if (!user) {
        console.log(`[Mock DB] User not found for security question verification: ${userId}`);
        return false;
    }

    const schoolMatch = user.firstSchool?.trim().toLowerCase() === firstSchoolAnswer?.trim().toLowerCase();
    const petMatch = user.petName?.trim().toLowerCase() === petNameAnswer?.trim().toLowerCase();

    if (!schoolMatch) console.log(`[Mock DB] First school mismatch: Expected "${user.firstSchool}", Got "${firstSchoolAnswer}"`);
    if (!petMatch) console.log(`[Mock DB] Pet name mismatch: Expected "${user.petName}", Got "${petNameAnswer}"`);

    const success = schoolMatch && petMatch;
    console.log(`[Mock DB] Security question verification result for ${userId}: ${success}`);
    return success;
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
            joinedAt: new Date(0),
            role: 'user', // Default role
        };
    }
    return {
        id: user.id,
        name: user.name || user.email || 'Unnamed Author',
        slug: user.id,
        avatarUrl: user.photoURL || `https://i.pravatar.cc/40?u=${user.id}`,
        bio: `Posts by ${user.name || user.email}`,
        joinedAt: new Date(user.joinedAt),
        role: user.role, // Include the role
    };
};

const generateSlug = (title: string): string => {
    let baseSlug = title
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (!baseSlug) {
        baseSlug = `post-${Date.now()}`;
    }

    let finalSlug = baseSlug;
    let counter = 1;

    const existingSlugs = posts.map(p => p.slug.toLowerCase());
    while (existingSlugs.includes(finalSlug.toLowerCase())) {
        console.log(`[Mock DB generateSlug] Slug collision detected for "${finalSlug}". Retrying...`);
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
        if (counter > 100) {
            console.warn(`[Mock DB generateSlug] Slug generation limit reached for base: ${baseSlug}`);
            finalSlug = `${baseSlug}-${Date.now()}`;
            break;
        }
    }
    console.log(`[Mock DB generateSlug] Generated unique slug: "${finalSlug}" for title: "${title}"`);
    return finalSlug;
};

const generateExcerpt = (content: string, maxLength: number = 150): string => {
    const textContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (textContent.length <= maxLength) {
        return textContent;
    }
    return textContent.substring(0, maxLength) + '...';
};

const extractHeading = (content: string, fallbackTitle: string): string => {
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
        return h1Match[1].trim();
    }
     const mdH1Match = content.match(/^#\s+(.*)/m);
     if (mdH1Match && mdH1Match[1]) {
         return mdH1Match[1].trim();
     }
    const boldMatch = content.match(/^\s*(?:\*\*|__)(.*?)(?:\*\*|__)\s*$/m) || content.match(/<strong[^>]*>(.*?)<\/strong>/i);
    if (boldMatch && boldMatch[1]) {
        return boldMatch[1].trim();
    }
    return fallbackTitle;
}

export const createPost = async (
     postData: {
         title: string;
         category: string;
         authorId: string;
         content: string;
         excerpt?: string;
         imageUrl?: string;
         tags?: string[];
     }
): Promise<Post> => {
    const author = await findUserById(postData.authorId);
    if (!author) {
        throw new Error(`[Mock DB createPost] Author not found for ID: ${postData.authorId}`);
    }

    const now = new Date();
    const generatedSlug = generateSlug(postData.title);
    const autoExcerpt = generateExcerpt(postData.content);
    const extractedHeading = extractHeading(postData.content, postData.title);

    const newPost: Post = {
        id: `post-${postIdCounter++}`,
        slug: generatedSlug,
        title: postData.title,
        content: postData.content,
        imageUrl: postData.imageUrl || `https://picsum.photos/seed/${generatedSlug}/1200/600`,
        category: postData.category,
        author: createAuthorObject(author),
        publishedAt: now,
        updatedAt: now,
        commentCount: 0,
        views: 0, // Initialize views to 0
        excerpt: postData.excerpt || autoExcerpt,
        tags: postData.tags || [],
        rating: 0, // Initialize rating
        ratingCount: 0, // Initialize rating count
        reactions: { like: 0, love: 0, laugh: 0, frown: 0, angry: 0 }, // Initialize reactions
        heading: extractedHeading,
        subheadings: [],
        paragraphs: [],
    };

    console.log(`[Mock DB createPost] Creating post: Title="${newPost.title}", Slug="${newPost.slug}", ID="${newPost.id}"`);
    posts.push(newPost);
    console.log(`[Mock DB createPost] Post added. Current post count: ${posts.length}`);

    const addedPost = posts.find(p => p.slug === newPost.slug); // Find by unique slug
    if (!addedPost) {
        console.error(`[Mock DB createPost] CRITICAL: Failed to retrieve post with slug ${newPost.slug} after adding!`);
        throw new Error("Failed to save post in mock database.");
    }
     // Recalculate reaction counts after adding (should be 0 initially)
     recalculateReactionCounts(addedPost.id);
     const finalAddedPost = posts.find(p => p.id === addedPost.id)!; // Refetch to get counts
     return { ...finalAddedPost, publishedAt: new Date(finalAddedPost.publishedAt), updatedAt: new Date(finalAddedPost.updatedAt) };
};


export const findPostBySlug = async (slug: string): Promise<Post | null> => {
    const trimmedSlug = slug?.trim().toLowerCase();
    if (!trimmedSlug) {
        console.warn(`[Mock DB findPostBySlug] Called with invalid or empty slug: "${slug}"`);
        return null;
    }
    console.log(`[Mock DB findPostBySlug] Searching for post with slug (case-insensitive): "${trimmedSlug}"`);
    // console.log(`[Mock DB findPostBySlug] Available slugs: ${posts.map(p => p.slug).join(', ')}`); // Reduce noise

    const post = posts.find(p => p.slug.trim().toLowerCase() === trimmedSlug);

    if (!post) {
        console.warn(`[Mock DB findPostBySlug] Post with slug "${trimmedSlug}" not found.`);
        return null;
    }

    console.log(`[Mock DB findPostBySlug] Found post: ID ${post.id}, Title: "${post.title}"`);

    // Simulate fetching author details
    const author = await findUserById(post.author.id);
    const authorDetails = createAuthorObject(author); // Use createAuthorObject for consistent author structure

     // Ensure reactions are calculated/fetched correctly
     const reactionCounts = getReactionCounts(post.id);

    return {
        ...post,
        author: authorDetails,
        reactions: reactionCounts, // Add calculated reaction counts
        publishedAt: new Date(post.publishedAt),
        updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
    };
};


export const findPosts = async (options: {
    page?: number;
    limit?: number;
    category?: string;
    authorId?: string;
    query?: string;
}): Promise<{ posts: Post[], hasMore: boolean, totalPages: number, currentPage: number, totalResults: number }> => {
    const { page = 0, limit = 9, category, authorId, query } = options;
    console.log(`[Mock DB findPosts] Options:`, options);

    let filtered = [...posts];

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
            p.content.toLowerCase().includes(lowerQuery) ||
            p.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
             p.author.name?.toLowerCase().includes(lowerQuery)
        );
    }

    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const totalResults = filtered.length;
    const totalPages = Math.ceil(totalResults / limit);
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const postsForPage = filtered.slice(startIndex, endIndex);
    const hasMore = endIndex < totalResults;

    // Fetch author details and calculate reactions for each post on the page
    const postsWithDetails = await Promise.all(postsForPage.map(async (post) => {
        const author = await findUserById(post.author.id);
        const reactionCounts = getReactionCounts(post.id); // Get reactions for this post
        return {
            ...post,
            author: createAuthorObject(author),
            reactions: reactionCounts, // Include reactions
            publishedAt: new Date(post.publishedAt),
            updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
        };
    }));

    console.log(`[Mock DB findPosts] Found ${totalResults} posts matching criteria. Returning page ${page} (${postsWithDetails.length} posts). HasMore: ${hasMore}.`);
    return {
        posts: postsWithDetails,
        hasMore,
        totalPages,
        currentPage: page,
        totalResults,
    };
};


export const updatePost = async (
    slug: string,
    updateData: Partial<Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views' | 'rating' | 'ratingCount' | 'updatedAt' | 'reactions'>> & { requestingUserId: string }
): Promise<Post | null> => {
    const lowerCaseSlug = slug?.trim().toLowerCase();
     if (!lowerCaseSlug) {
        console.warn(`[Mock DB updatePost] Called with invalid slug: ${slug}`);
        return null;
    }
    console.log(`[Mock DB updatePost] Attempting update for slug: "${lowerCaseSlug}" by user: ${updateData.requestingUserId}`);

    const postIndex = posts.findIndex(p => p.slug.trim().toLowerCase() === lowerCaseSlug);
    if (postIndex === -1) {
        console.error(`[Mock DB updatePost] Post not found for slug: "${lowerCaseSlug}"`);
        return null;
    }

    const originalPost = posts[postIndex];

     const requestingUser = await findUserById(updateData.requestingUserId);
     if (!requestingUser) {
         console.error(`[Mock DB updatePost] Auth failed: Requesting user ${updateData.requestingUserId} not found.`);
         throw new Error("Unauthorized: User not found.");
     }
     if (originalPost.author.id !== requestingUser.id && requestingUser.role !== 'admin') {
          console.error(`[Mock DB updatePost] Auth failed: User ${requestingUser.id} (Role: ${requestingUser.role}) cannot update post owned by ${originalPost.author.id}`);
          throw new Error("Unauthorized: Permission denied.");
     }
    console.log(`[Mock DB updatePost] User ${requestingUser.id} authorized.`);

    let newSlug = originalPost.slug;
    if (updateData.title && updateData.title !== originalPost.title) {
        newSlug = generateSlug(updateData.title);
        console.log(`[Mock DB updatePost] Title changed. New unique slug generated: "${newSlug}"`);
    }

    const updatedContent = updateData.content ?? originalPost.content;
    console.log(`[Mock DB updatePost] Using updated content (length: ${updatedContent.length})`);

    let updatedExcerpt = updateData.excerpt ?? originalPost.excerpt;
     if (updateData.content !== undefined && updateData.excerpt === undefined) {
         updatedExcerpt = generateExcerpt(updatedContent);
         console.log(`[Mock DB updatePost] Auto-generating excerpt.`);
     }

    let updatedHeading = originalPost.heading;
    if (updateData.content !== undefined) {
        updatedHeading = extractHeading(updatedContent, updateData.title ?? originalPost.title);
        console.log(`[Mock DB updatePost] Extracting heading from updated content.`);
    }

    const updatedPost: Post = {
        ...originalPost,
        ...(updateData.title !== undefined && { title: updateData.title }),
        ...(updateData.category !== undefined && { category: updateData.category }),
        ...(updateData.imageUrl !== undefined && { imageUrl: updateData.imageUrl }),
        ...(updateData.tags !== undefined && { tags: updateData.tags }),
        content: updatedContent,
        slug: newSlug,
        excerpt: updatedExcerpt,
        heading: updatedHeading,
        updatedAt: new Date(),
        // Keep fields not directly updatable (views, reactions, etc.)
        views: originalPost.views,
        reactions: originalPost.reactions,
        rating: originalPost.rating,
        ratingCount: originalPost.ratingCount,
        commentCount: originalPost.commentCount,
        // Preserve author and publishedAt
        author: originalPost.author,
        publishedAt: originalPost.publishedAt,
        subheadings: originalPost.subheadings,
        paragraphs: originalPost.paragraphs,
    };

    posts[postIndex] = updatedPost;
    console.log(`[Mock DB updatePost] Post "${updatedPost.title}" (ID: ${updatedPost.id}) updated successfully.`);

    // Fetch author details for the response
    const author = await findUserById(updatedPost.author.id);
    return {
        ...updatedPost,
        author: createAuthorObject(author),
        publishedAt: new Date(updatedPost.publishedAt),
        updatedAt: new Date(updatedPost.updatedAt),
     };
};

export const deletePost = async (slug: string, requestingUserId: string): Promise<boolean> => {
    const lowerCaseSlug = slug?.trim().toLowerCase();
    if (!lowerCaseSlug) {
        console.warn(`[Mock DB deletePost] Called with invalid slug: ${slug}`);
        return false;
    }
    console.log(`[Mock DB deletePost] Attempting delete for slug: "${lowerCaseSlug}" by user: ${requestingUserId}`);

    const postIndex = posts.findIndex(p => p.slug.trim().toLowerCase() === lowerCaseSlug);
    if (postIndex === -1) {
        console.error(`[Mock DB deletePost] Post not found for slug: "${lowerCaseSlug}"`);
        return false;
    }

    const user = await findUserById(requestingUserId);
    const postAuthorId = posts[postIndex].author.id;

    if (!user) {
         console.error(`[Mock DB deletePost] Auth failed: Requesting user ${requestingUserId} not found.`);
         throw new Error("Unauthorized: User not found.");
     }

    if (postAuthorId !== requestingUserId && user.role !== 'admin') {
        console.error(`[Mock DB deletePost] Auth failed: User ${requestingUserId} (Role: ${user.role}) cannot delete post owned by ${postAuthorId}`);
        throw new Error("Unauthorized: Permission denied.");
    }

    const deletedTitle = posts[postIndex].title;
    const postIdToDelete = posts[postIndex].id; // Get ID before splicing

    posts.splice(postIndex, 1);

    // Also remove reactions associated with the deleted post
    const initialReactionCount = reactions.length;
    const reactionsToDelete = reactions.filter(r => r.postId === postIdToDelete);
    reactionsToDelete.forEach(reaction => {
        const index = reactions.findIndex(r => r.postId === reaction.postId && r.userId === reaction.userId);
        if (index > -1) reactions.splice(index, 1);
    });
    console.log(`[Mock DB deletePost] Removed ${initialReactionCount - reactions.length} reactions for deleted post ID ${postIdToDelete}.`);

    console.log(`[Mock DB deletePost] Post deleted: "${deletedTitle}" (Slug: ${slug}). Remaining posts: ${posts.length}`);
    return true;
};


// --- View Count Function ---

export const updatePostViews = async (postId: string): Promise<number | null> => {
    if (!postId) return null;
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
        console.warn(`[Mock DB updatePostViews] Post not found: ${postId}`);
        return null;
    }

    posts[postIndex].views = (posts[postIndex].views || 0) + 1;
    console.log(`[Mock DB updatePostViews] Incremented views for post ${postId} to ${posts[postIndex].views}`);
    return posts[postIndex].views;
};

// --- Reaction Functions ---

// Helper to recalculate reaction counts for a post and update the post object
const recalculateReactionCounts = (postId: string) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const postReactions = reactions.filter(r => r.postId === postId);
    const newCounts: Record<ReactionType, number> = { like: 0, love: 0, laugh: 0, frown: 0, angry: 0 };

    postReactions.forEach(reaction => {
        newCounts[reaction.type]++;
    });

    posts[postIndex].reactions = newCounts;
    // console.log(`[Mock DB] Recalculated reactions for post ${postId}:`, newCounts); // Reduce noise
};

// Get aggregated reaction counts for a post
export const getReactionCounts = (postId: string): Record<ReactionType, number> => {
    const post = posts.find(p => p.id === postId);
    return post?.reactions || { like: 0, love: 0, laugh: 0, frown: 0, angry: 0 };
};

// Add or update a user's reaction to a post
export const addReaction = async (postId: string, userId: string, type: ReactionType | null): Promise<void> => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
        console.warn(`[Mock DB addReaction] Post not found: ${postId}`);
        return;
    }

    // Find existing reaction by this user for this post
    const existingReactionIndex = reactions.findIndex(r => r.postId === postId && r.userId === userId);

    if (existingReactionIndex > -1) {
        // User is changing or removing their reaction
        if (type === null || reactions[existingReactionIndex].type === type) {
             // Remove reaction
             reactions.splice(existingReactionIndex, 1);
             console.log(`[Mock DB addReaction] Removed reaction for post ${postId} by user ${userId}`);
        } else {
            // Update reaction type
             reactions[existingReactionIndex].type = type;
             reactions[existingReactionIndex].timestamp = new Date();
             console.log(`[Mock DB addReaction] Updated reaction to '${type}' for post ${postId} by user ${userId}`);
        }
    } else if (type !== null) {
        // Add new reaction
        const newReaction: UserReaction = {
            postId,
            userId,
            type,
            timestamp: new Date(),
        };
        reactions.push(newReaction);
        console.log(`[Mock DB addReaction] Added new reaction '${type}' for post ${postId} by user ${userId}`);
    }

    // Recalculate and update the counts on the post object
    recalculateReactionCounts(postId);
};

// Get all reactions and the current user's reaction for a post
export const getReactions = async (postId: string, userId?: string): Promise<{ counts: Record<ReactionType, number>, userReaction: ReactionType | null }> => {
    const counts = getReactionCounts(postId);
    let userReaction: ReactionType | null = null;
    if (userId) {
        const reaction = reactions.find(r => r.postId === postId && r.userId === userId);
        userReaction = reaction?.type || null;
    }
    return { counts, userReaction };
};

// --- Seed Data ---
const seedData = async () => {
     if (isSeeded) {
        console.log("[Mock DB] Already seeded. Skipping.");
        return;
     }

     users.length = 0;
     posts.length = 0;
     reactions.length = 0; // Clear reactions on seed
     userIdCounter = 1;
     postIdCounter = 1;
     console.log("[Mock DB] Cleared existing data. Seeding...");

     try {
       const adminPassword = 'adminpassword';
       const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
       const adminUser = await createUser({
           email: 'vedansh2821@gmail.com',
           name: 'Vedansh V.',
           role: 'admin',
           hashedPassword: adminPasswordHash,
           photoURL: 'https://i.pravatar.cc/150?u=vedansh',
           dob: '1990-01-01',
           phone: '123-456-7890',
           firstSchool: 'Sunrise Public School',
           petName: 'Buddy',
       });
       console.log(`[Mock DB Seed] Admin: ${adminUser.email}, Pass: ${adminPassword}`);

       const aayushiPassword = 'password123';
       const aayushiPasswordHash = await bcrypt.hash(aayushiPassword, 10);
       const user1 = await createUser({
           email: 'aayushi@example.com',
           name: 'Aayushi P.',
           role: 'user',
           hashedPassword: aayushiPasswordHash,
           photoURL: 'https://i.pravatar.cc/150?u=aayushi',
           dob: '1995-05-15',
           phone: null,
           firstSchool: 'City Montessori',
           petName: 'Fluffy',
       });
        console.log(`[Mock DB Seed] User: ${user1.email}, Pass: ${aayushiPassword}`);

       const alexPassword = 'password456';
       const alexPasswordHash = await bcrypt.hash(alexPassword, 10);
       const user2 = await createUser({
           email: 'alex@example.com',
           name: 'Alex G.',
           role: 'user',
           hashedPassword: alexPasswordHash,
           photoURL: 'https://i.pravatar.cc/150?u=alex',
           dob: null,
           phone: '987-654-3210',
           firstSchool: 'Oakwood Elementary',
           petName: 'Rex',
       });
        console.log(`[Mock DB Seed] User: ${user2.email}, Pass: ${alexPassword}`);

        // --- Create Posts ---
        const post1 = await createPost({
            title: "Mastering TypeScript for Modern Web Development",
            category: "Technology",
            authorId: adminUser.id,
            tags: ["typescript", "web development", "javascript", "react"],
            imageUrl: `https://picsum.photos/seed/typescript-mastery/1200/600`,
            content: `<h1>Unlocking the Power of TypeScript</h1><p>TypeScript enhances JavaScript by adding static types, making code more predictable and maintainable, especially in large projects.</p><h2>Why TypeScript?</h2><ul><li>Static Typing: Catch errors during development, not at runtime.</li><li>Interfaces & Types: Define clear contracts for your data structures.</li><li>Generics: Write reusable code that works with multiple types.</li></ul><h2>Advanced Techniques</h2><p>Explore decorators, utility types, and module augmentation for even greater control and flexibility in your applications.</p>`
        });

        const post2 = await createPost({
             title: "Sustainable Living: Simple Steps for a Greener Life",
             category: "Lifestyle",
             authorId: user1.id,
             tags: ["sustainability", "eco-friendly", "minimalism", "green living"],
             imageUrl: `https://picsum.photos/seed/sustainable-living/1200/600`,
             content: `<h1>Embracing Sustainable Habits</h1><p>Living sustainably is crucial for our planet's future. It starts with small, conscious choices in our daily lives.</p><h2>Reduce, Reuse, Recycle</h2><p>Focus on minimizing waste through the 3 R's. Bring your own bags, bottles, and containers. Properly sort recyclables.</p><h2>Conscious Consumption</h2><p>Choose products with minimal packaging, buy secondhand when possible, and support eco-conscious brands. Consider reducing meat intake.</p>`
         });

          const post3 = await createPost({
              title: "The Rise of Remote Work: Challenges and Opportunities",
              category: "Technology",
              authorId: user2.id,
              tags: ["remote work", "productivity", "future of work", "collaboration", "work-life balance"],
              imageUrl: `https://picsum.photos/seed/remote-work-rise/1200/600`,
              content: `<h1>Navigating the Remote Work Era</h1><p>The shift to remote work offers flexibility but also presents unique challenges in communication and team cohesion.</p><h2>Benefits & Drawbacks</h2><p><strong>Pros:</strong> Flexibility, no commute, wider talent pool.<br><strong>Cons:</strong> Isolation, blurred work-life boundaries, communication hurdles.</p><h2>Essential Tools</h2><p>Effective communication platforms (Slack, Teams), project management software (Asana, Jira), and video conferencing tools (Zoom, Google Meet) are vital.</p>`
          });

         const post4 = await createPost({
           title: "Mindfulness Meditation: A Beginner's Guide",
           category: "Health",
           authorId: user1.id,
           tags: ["meditation", "mindfulness", "wellness", "mental health", "stress relief"],
           imageUrl: `https://picsum.photos/seed/mindfulness-guide/1200/600`,
           content: `<h1>Finding Calm Within: An Intro to Mindfulness</h1><p>Mindfulness is the practice of paying attention to the present moment without judgment. It's a powerful tool for managing stress and enhancing self-awareness.</p><h2>Getting Started</h2><p>Find a quiet space, sit comfortably, close your eyes gently. Focus on the sensation of your breath entering and leaving your body. When your mind wanders (which it will!), gently guide your focus back to the breath. Start with 5 minutes daily.</p>`
         });

          const post5 = await createPost({
             title: "Exploring Southeast Asia: A Backpacker's Dream",
             category: "Travel",
             authorId: user2.id,
             tags: ["travel", "backpacking", "southeast asia", "budget travel", "adventure", "asia"],
              imageUrl: `https://picsum.photos/seed/southeast-asia/1200/600`,
              content: `<h1>Backpacking Adventures in SEA</h1><p>Southeast Asia is a backpacker's paradise, offering diverse cultures, stunning landscapes, and delicious food at affordable prices.</p><h2>Top Destinations</h2><ul><li>Thailand (Beaches, Temples)</li><li>Vietnam (History, Scenery)</li><li>Cambodia (Angkor Wat)</li><li>Indonesia (Bali, Volcanoes)</li></ul><h2>Budget Tips</h2><p>Stay in hostels, eat local street food, use budget airlines or buses for travel between countries.</p>`
          });

          const post6 = await createPost({
             title: "Introduction to GraphQL vs REST APIs",
             category: "Technology",
             authorId: adminUser.id,
             tags: ["graphql", "rest", "api", "web development", "architecture"],
              imageUrl: `https://picsum.photos/seed/graphql-rest/1200/600`,
              content: `<h1>Choosing Your API Style: GraphQL vs REST</h1><p>APIs are the backbone of modern applications. REST has been the standard, but GraphQL offers a different approach. Let's compare.</p><h2>Key Differences</h2><ul><li><strong>Data Fetching:</strong> REST often requires multiple requests (over/under-fetching), GraphQL allows precise data fetching in one request.</li><li><strong>Endpoints:</strong> REST uses multiple URLs for different resources, GraphQL typically uses a single endpoint.</li><li><strong>Schema:</strong> GraphQL has a built-in schema and type system.</li></ul><h2>When to Use Which</h2><p>Use GraphQL for complex data needs, mobile apps, or when frontend flexibility is key. REST is simpler for basic CRUD operations or when caching is critical.</p>`
          });

           const post7 = await createPost({
             title: "Navigating Modern Relationships: Communication is Key",
             category: "Love",
             authorId: user1.id,
             tags: ["relationships", "communication", "love", "dating", "mental health", "connection"],
             imageUrl: `https://picsum.photos/seed/modern-love/1200/600`,
             content: `<h1>The Art of Communication in Love</h1><p>Strong relationships thrive on effective communication. Understanding and being understood is fundamental.</p><h2>Active Listening</h2><p>Pay full attention when your partner speaks. Put away distractions, make eye contact, and reflect on what you hear to ensure understanding.</p><h2>Expressing Needs</h2><p>Be clear and honest about your feelings and needs using 'I' statements (e.g., 'I feel...' instead of 'You always...'). Avoid blaming and focus on solutions.</p>`
           });

        // --- Seed Reactions ---
        await addReaction(post1.id, user1.id, 'like');
        await addReaction(post1.id, user2.id, 'love');
        await addReaction(post2.id, adminUser.id, 'like');
        await addReaction(post2.id, user2.id, 'laugh');
        await addReaction(post4.id, adminUser.id, 'love');
        await addReaction(post7.id, user2.id, 'like');
        await addReaction(post7.id, adminUser.id, 'love');

        console.log("[Mock DB Seed] Seed data creation finished.");
        isSeeded = true;

      } catch (error) {
         console.error("[Mock DB Seed] Error seeding data:", error);
         isSeeded = false;
      }
 };

 // Ensure seed data runs only once on server start (or module load)
 if (typeof window === 'undefined' && !isSeeded) { // Check if running on server and not seeded
     seedData();
 } else if (typeof window !== 'undefined' && !isSeeded) {
     // Handle client-side seeding if necessary, though usually done server-side
     // seedData(); // Could cause issues if run multiple times
     console.log("[Mock DB] Seeding skipped on client-side.");
 }

