
// IMPORTANT: This is an IN-MEMORY MOCK simulating a SQL database.
// DO NOT USE THIS IN PRODUCTION. Replace with a real database and ORM (like Prisma).

import type { AuthUser } from '@/lib/auth/authContext';
import type { Post, Author } from '@/types/blog'; // Assuming types exist
import bcrypt from 'bcrypt'; // Import bcrypt

interface MockUser extends AuthUser {
    hashedPassword?: string; // Store hashed password here
    dob?: string | null; // Added Date of Birth (YYYY-MM-DD)
    phone?: string | null; // Added Phone Number
    firstSchool?: string | null; // Added First School Name
    petName?: string | null; // Added Pet's Name
    joinedAt: Date; // Added Join Date (non-optional)
}

// --- In-Memory Stores ---
const users: MockUser[] = [];
const posts: Post[] = [];
let postIdCounter = 1;
let userIdCounter = 1;
let isSeeded = false; // Flag to ensure seeding happens only once

// --- User Functions ---

export const findUserByEmail = async (email: string): Promise<MockUser | null> => {
    console.log(`[Mock DB] Finding user by email: ${email}`);
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase()); // Case-insensitive email check
    if (user) {
         console.log(`[Mock DB] User found for ${email}. Stored Hash: ${user.hashedPassword ? user.hashedPassword.substring(0, 10) + '...' : 'NONE'}`);
         return { ...user, joinedAt: new Date(user.joinedAt) }; // Return a copy with Date object
     } else {
         console.log(`[Mock DB] User not found for email: ${email}`);
         return null;
     }
};

export const findUserById = async (id: string): Promise<MockUser | null> => {
    console.log(`[Mock DB findUserById] Finding user by ID: "${id}"`);
    const availableUserIds = users.map(u => u.id);
    console.log(`[Mock DB findUserById] Available user IDs: [${availableUserIds.join(', ')}]`);
    const user = users.find(u => u.id === id);
    if (user) {
        console.log(`[Mock DB findUserById] User found for ID "${id}".`);
        return { ...user, joinedAt: new Date(user.joinedAt) }; // Return copy with Date object
    } else {
        console.warn(`[Mock DB findUserById] User NOT found for ID "${id}".`);
        return null;
    }
};

export const getAllUsers = async (requestingUserId: string): Promise<Omit<MockUser, 'hashedPassword'>[]> => {
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
    return users.map(user => {
        const { hashedPassword, ...userWithoutHash } = user;
        return {
            ...userWithoutHash,
            joinedAt: new Date(userWithoutHash.joinedAt),
        };
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
    };
    const hashSnippet = newUser.hashedPassword ? newUser.hashedPassword.substring(0, 10) + '...' : 'NONE PROVIDED';
    console.log(`[Mock DB] Creating user: ${newUser.email}, Role: ${newUser.role}, ID: ${newUser.id}, Hash: ${hashSnippet}, First School: ${newUser.firstSchool}, Pet Name: ${newUser.petName}`);
    users.push(newUser);
    const { hashedPassword, ...userResponse } = newUser;
    return { ...userResponse, joinedAt: new Date(userResponse.joinedAt) } as MockUser;
};

export const updateUser = async (userId: string, updates: { name?: string; dob?: string | null; phone?: string | null }): Promise<MockUser | null> => {
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
            joinedAt: new Date(0), // Default date for unknown
        };
    }
    return {
        id: user.id,
        name: user.name || user.email || 'Unnamed Author',
        slug: user.id, // Use user ID as author slug for simplicity
        avatarUrl: user.photoURL || `https://i.pravatar.cc/40?u=${user.id}`,
        bio: `Posts by ${user.name || user.email}`,
        joinedAt: new Date(user.joinedAt),
        role: user.role,
    };
};

// Generate a unique slug for a post title
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

    // Ensure uniqueness considering existing slugs (case-insensitive)
    // Check the current state of the posts array *before* adding the new one
    const existingSlugs = posts.map(p => p.slug.toLowerCase());
    while (existingSlugs.includes(finalSlug.toLowerCase())) {
        console.log(`[Mock DB generateSlug] Slug collision detected for "${finalSlug}". Retrying...`);
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
        if (counter > 100) { // Safety break
            console.warn(`[Mock DB generateSlug] Slug generation limit reached for base: ${baseSlug}`);
            finalSlug = `${baseSlug}-${Date.now()}`;
            break;
        }
    }
    console.log(`[Mock DB generateSlug] Generated unique slug: "${finalSlug}" for title: "${title}"`);
    return finalSlug;
};

// Helper to generate excerpt from content (simple text extraction)
const generateExcerpt = (content: string, maxLength: number = 150): string => {
    const textContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (textContent.length <= maxLength) {
        return textContent;
    }
    return textContent.substring(0, maxLength) + '...';
};

// Helper to extract potential heading from content (basic: first H1 or bolded line)
const extractHeading = (content: string, fallbackTitle: string): string => {
     // Try finding first H1 tag
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
        return h1Match[1].trim();
    }
     // Try finding first Markdown H1 (# Heading)
     const mdH1Match = content.match(/^#\s+(.*)/m);
     if (mdH1Match && mdH1Match[1]) {
         return mdH1Match[1].trim();
     }
    // Try finding first bolded line (Markdown or HTML)
    const boldMatch = content.match(/^\s*(?:\*\*|__)(.*?)(?:\*\*|__)\s*$/m) || content.match(/<strong[^>]*>(.*?)<\/strong>/i);
    if (boldMatch && boldMatch[1]) {
        return boldMatch[1].trim();
    }
    return fallbackTitle; // Fallback to post title
}

export const createPost = async (
    // Use a more precise type for incoming data, focusing on 'content'
     postData: {
         title: string;
         category: string;
         authorId: string;
         content: string; // Main content from textarea
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
        content: postData.content, // Store the raw content
        imageUrl: postData.imageUrl || `https://picsum.photos/seed/post${postIdCounter}/1200/600`,
        category: postData.category,
        author: createAuthorObject(author),
        publishedAt: now,
        updatedAt: now,
        commentCount: 0,
        views: Math.floor(Math.random() * 100),
        // Use provided excerpt or generate one
        excerpt: postData.excerpt || autoExcerpt,
        tags: postData.tags || [],
        rating: parseFloat((Math.random() * 1 + 3.5).toFixed(1)),
        ratingCount: Math.floor(Math.random() * 10) + 1,
        // Store derived or fallback heading
        heading: extractedHeading,
        // Structured fields might be empty if not derivable or stored
        subheadings: [], // Could potentially parse from content if needed
        paragraphs: [], // Could potentially parse from content if needed
    };

    console.log(`[Mock DB createPost] Creating post: Title="${newPost.title}", Slug="${newPost.slug}", ID="${newPost.id}"`);
    posts.push(newPost); // Add to the array *before* logging count/finding
    console.log(`[Mock DB createPost] Post added. Current post count: ${posts.length}`);

    // Verify it was added (important for in-memory mock)
    const addedPost = posts.find(p => p.id === newPost.id);
    if (!addedPost) {
        console.error(`[Mock DB createPost] CRITICAL: Failed to add post ID ${newPost.id} to the array!`);
        throw new Error("Failed to save post in mock database.");
    }
    // Return a copy with correct Date objects
    return { ...addedPost, publishedAt: new Date(addedPost.publishedAt), updatedAt: new Date(addedPost.updatedAt) };
};


export const findPostBySlug = async (slug: string): Promise<Post | null> => {
    const trimmedSlug = slug?.trim().toLowerCase();
    if (!trimmedSlug) {
        console.warn(`[Mock DB findPostBySlug] Called with invalid or empty slug: "${slug}"`);
        return null;
    }
    console.log(`[Mock DB findPostBySlug] Searching for post with slug (case-insensitive): "${trimmedSlug}"`);
    console.log(`[Mock DB findPostBySlug] Available slugs: ${posts.map(p => p.slug).join(', ')}`);

    const post = posts.find(p => p.slug.trim().toLowerCase() === trimmedSlug);

    if (!post) {
        console.warn(`[Mock DB findPostBySlug] Post with slug "${trimmedSlug}" not found.`);
        return null;
    }

    console.log(`[Mock DB findPostBySlug] Found post: ID ${post.id}, Title: "${post.title}"`);

    const author = await findUserById(post.author.id);
    if (!author) {
        console.warn(`[Mock DB findPostBySlug] Author with ID ${post.author.id} not found for post ${post.id}. Returning post with unknown author.`);
        // Return post data but with a default 'unknown' author
        return {
            ...post,
            author: createAuthorObject(null), // Indicate author is unknown
            publishedAt: new Date(post.publishedAt),
            updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
        };
    }

    // Return post with full author details
    return {
        ...post,
        author: createAuthorObject(author),
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

    // Enrich posts with full author details (async operation)
    const postsWithDetails = await Promise.all(postsForPage.map(async (post) => {
        const author = await findUserById(post.author.id);
        return {
            ...post,
            publishedAt: new Date(post.publishedAt), // Ensure Date objects
            updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
            author: createAuthorObject(author) // Use the fetched author
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
    // Update payload focuses on 'content'
    updateData: Partial<Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views' | 'rating' | 'ratingCount' | 'updatedAt'>> & { requestingUserId: string }
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

     // Authorization Check
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

    // --- Prepare Updated Data ---
    // Handle potential slug change if title is updated
    let newSlug = originalPost.slug;
    if (updateData.title && updateData.title !== originalPost.title) {
        newSlug = generateSlug(updateData.title); // Ensure new slug is unique
        console.log(`[Mock DB updatePost] Title changed. New unique slug generated: "${newSlug}"`);
    }

    // Use updated content directly if provided
    const updatedContent = updateData.content ?? originalPost.content;
    console.log(`[Mock DB updatePost] Using updated content (length: ${updatedContent.length})`);

    // Auto-update excerpt if content changed and no new excerpt provided
    let updatedExcerpt = updateData.excerpt ?? originalPost.excerpt;
     if (updateData.content !== undefined && updateData.excerpt === undefined) {
         updatedExcerpt = generateExcerpt(updatedContent);
         console.log(`[Mock DB updatePost] Auto-generating excerpt.`);
     }

    // Extract heading from updated content if content was updated
    let updatedHeading = originalPost.heading;
    if (updateData.content !== undefined) {
        updatedHeading = extractHeading(updatedContent, updateData.title ?? originalPost.title);
        console.log(`[Mock DB updatePost] Extracting heading from updated content.`);
    }

    // --- Apply Updates ---
    const updatedPost: Post = {
        ...originalPost, // Start with original post data
        // Apply specific updates from payload
        ...(updateData.title !== undefined && { title: updateData.title }),
        ...(updateData.category !== undefined && { category: updateData.category }),
        ...(updateData.imageUrl !== undefined && { imageUrl: updateData.imageUrl }),
        ...(updateData.tags !== undefined && { tags: updateData.tags }),
        content: updatedContent, // Use the updated content
        slug: newSlug, // Use the potentially updated slug
        excerpt: updatedExcerpt, // Use the potentially updated excerpt
        heading: updatedHeading, // Use the potentially updated heading
        updatedAt: new Date(), // Always update the timestamp
        // Explicitly do NOT update structured fields unless handled separately
        subheadings: originalPost.subheadings,
        paragraphs: originalPost.paragraphs,
    };

    // Replace the old post with the updated one in the array
    posts[postIndex] = updatedPost;
    console.log(`[Mock DB updatePost] Post "${updatedPost.title}" (ID: ${updatedPost.id}) updated successfully.`);

    // Return the updated post with full author details
    const author = await findUserById(updatedPost.author.id); // Re-fetch author
    return {
        ...updatedPost,
        author: createAuthorObject(author), // Ensure author object is correct
        publishedAt: new Date(updatedPost.publishedAt), // Ensure Date object
        updatedAt: new Date(updatedPost.updatedAt), // Ensure Date object
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
        return false; // Indicate post not found
    }

    // Authorization Check
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
    posts.splice(postIndex, 1); // Remove the post from the array
    console.log(`[Mock DB deletePost] Post deleted: "${deletedTitle}" (Slug: ${slug}). Remaining posts: ${posts.length}`);
    return true;
};


// --- Seed Data ---
const seedData = async () => {
     if (isSeeded) {
        console.log("[Mock DB] Already seeded. Skipping.");
        return;
     }

     users.length = 0;
     posts.length = 0;
     userIdCounter = 1;
     postIdCounter = 1;
     console.log("[Mock DB] Cleared existing data. Seeding...");

     try {
       // Create admin user
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

       // Create regular users
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

        // Create posts using 'content' field
        await createPost({
            title: "Mastering TypeScript for Modern Web Development",
            category: "Technology",
            authorId: adminUser.id, // Vedansh
            tags: ["typescript", "web development", "javascript", "react"],
            imageUrl: `https://picsum.photos/seed/typescript-mastery/1200/600`,
            content: `
# Unlocking the Power of TypeScript

TypeScript enhances JavaScript by adding static types, making code more predictable and maintainable, especially in large projects.

## Why TypeScript?

Static Typing: Catch errors during development, not at runtime.
Interfaces & Types: Define clear contracts for your data structures.
Generics: Write reusable code that works with multiple types.

## Advanced Techniques

Explore decorators, utility types, and module augmentation for even greater control and flexibility in your applications.
            `
        });

        await createPost({
             title: "Sustainable Living: Simple Steps for a Greener Life",
             category: "Lifestyle",
             authorId: user1.id, // Aayushi
             tags: ["sustainability", "eco-friendly", "minimalism", "green living"],
             imageUrl: `https://picsum.photos/seed/sustainable-living/1200/600`,
             content: `
# Embracing Sustainable Habits

Living sustainably is crucial for our planet's future. It starts with small, conscious choices in our daily lives.

## Reduce, Reuse, Recycle

Focus on minimizing waste through the 3 R's. Bring your own bags, bottles, and containers. Properly sort recyclables.

## Conscious Consumption

Choose products with minimal packaging, buy secondhand when possible, and support eco-conscious brands. Consider reducing meat intake.
             `
         });

          await createPost({
              title: "The Rise of Remote Work: Challenges and Opportunities",
              category: "Technology",
              authorId: user2.id, // Alex G.
              tags: ["remote work", "productivity", "future of work", "collaboration", "work-life balance"],
              imageUrl: `https://picsum.photos/seed/remote-work-rise/1200/600`,
              content: `
# Navigating the Remote Work Era

The shift to remote work offers flexibility but also presents unique challenges in communication and team cohesion.

## Benefits & Drawbacks

Pros: Flexibility, no commute, wider talent pool.
Cons: Isolation, blurred work-life boundaries, communication hurdles.

## Essential Tools

Effective communication platforms (Slack, Teams), project management software (Asana, Jira), and video conferencing tools (Zoom, Google Meet) are vital.
              `
          });

         await createPost({
           title: "Mindfulness Meditation: A Beginner's Guide",
           category: "Health",
           authorId: user1.id, // Aayushi
           tags: ["meditation", "mindfulness", "wellness", "mental health", "stress relief"],
           imageUrl: `https://picsum.photos/seed/mindfulness-guide/1200/600`,
           content: `
# Finding Calm Within: An Intro to Mindfulness

Mindfulness is the practice of paying attention to the present moment without judgment. It's a powerful tool for managing stress and enhancing self-awareness.

## Getting Started

Find a quiet space, sit comfortably, close your eyes gently. Focus on the sensation of your breath entering and leaving your body. When your mind wanders (which it will!), gently guide your focus back to the breath. Start with 5 minutes daily.
           `
         });

          await createPost({
             title: "Exploring Southeast Asia: A Backpacker's Dream",
             category: "Travel",
             authorId: user2.id, // Alex G.
             tags: ["travel", "backpacking", "southeast asia", "budget travel", "adventure", "asia"],
              imageUrl: `https://picsum.photos/seed/southeast-asia/1200/600`,
              content: `
# Backpacking Adventures in SEA

Southeast Asia is a backpacker's paradise, offering diverse cultures, stunning landscapes, and delicious food at affordable prices.

## Top Destinations

*   Thailand (Beaches, Temples)
*   Vietnam (History, Scenery)
*   Cambodia (Angkor Wat)
*   Indonesia (Bali, Volcanoes)

## Budget Tips

Stay in hostels, eat local street food, use budget airlines or buses for travel between countries.
              `
          });

          await createPost({
             title: "Introduction to GraphQL vs REST APIs",
             category: "Technology",
             authorId: adminUser.id, // Vedansh
             tags: ["graphql", "rest", "api", "web development", "architecture"],
              imageUrl: `https://picsum.photos/seed/graphql-rest/1200/600`,
              content: `
# Choosing Your API Style: GraphQL vs REST

APIs are the backbone of modern applications. REST has been the standard, but GraphQL offers a different approach. Let's compare.

## Key Differences

*   **Data Fetching:** REST often requires multiple requests (over/under-fetching), GraphQL allows precise data fetching in one request.
*   **Endpoints:** REST uses multiple URLs for different resources, GraphQL typically uses a single endpoint.
*   **Schema:** GraphQL has a built-in schema and type system.

## When to Use Which

Use GraphQL for complex data needs, mobile apps, or when frontend flexibility is key. REST is simpler for basic CRUD operations or when caching is critical.
              `
          });

           await createPost({
             title: "Navigating Modern Relationships: Communication is Key",
             category: "Love",
             authorId: user1.id, // Aayushi
             tags: ["relationships", "communication", "love", "dating", "mental health", "connection"],
             imageUrl: `https://picsum.photos/seed/modern-love/1200/600`,
             content: `
# The Art of Communication in Love

Strong relationships thrive on effective communication. Understanding and being understood is fundamental.

## Active Listening

Pay full attention when your partner speaks. Put away distractions, make eye contact, and reflect on what you hear to ensure understanding.

## Expressing Needs

Be clear and honest about your feelings and needs using 'I' statements (e.g., 'I feel...' instead of 'You always...'). Avoid blaming and focus on solutions.
             `
           });


        console.log("[Mock DB Seed] Seed data creation finished.");
        isSeeded = true; // Mark as seeded

      } catch (error) {
         console.error("[Mock DB Seed] Error seeding data:", error);
         // Prevent marking as seeded if error occurs
         isSeeded = false;
      }
 };

 // Initialize seed data when the module loads
 if (!isSeeded) {
     seedData();
 }
