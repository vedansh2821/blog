

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
let isSeeded = false; // Flag to ensure seeding happens only once

// --- User Functions ---

export const findUserByEmail = async (email: string): Promise<MockUser | null> => {
    console.log(`[Mock DB] Finding user by email: ${email}`);
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase()); // Case-insensitive email check
    if (user) {
         console.log(`[Mock DB] User found for ${email}. Stored Hash: ${user.hashedPassword ? user.hashedPassword.substring(0, 10) + '...' : 'NONE'}`);
         // Ensure joinedAt is returned as a Date object
         return { ...user, joinedAt: new Date(user.joinedAt) }; // Return a copy
     } else {
         console.log(`[Mock DB] User not found for email: ${email}`);
         return null;
     }
};

export const findUserById = async (id: string): Promise<MockUser | null> => {
    console.log(`[Mock DB] Finding user by ID: ${id}`);
    const user = users.find(u => u.id === id);
     // Ensure joinedAt is returned as a Date object
    return user ? { ...user, joinedAt: new Date(user.joinedAt) } : null;
};

// Add function to get all users (excluding password hashes)
export const getAllUsers = async (requestingUserId: string): Promise<Omit<MockUser, 'hashedPassword'>[]> => {
    // Authorization check (although simple for mock)
    const requestingUser = await findUserById(requestingUserId);
    if (!requestingUser || requestingUser.role !== 'admin') {
        console.warn(`[Mock DB] Unauthorized attempt to get all users by ID: ${requestingUserId}`);
        // In a real app, throw an error or return empty based on policy
        throw new Error("Forbidden: Only admins can access the full user list.");
    }

    console.log(`[Mock DB] Getting all users for admin ID: ${requestingUserId}`);
    // Return copies of users without the password hash
    return users.map(user => {
        const { hashedPassword, ...userWithoutHash } = user;
        // Ensure date objects are handled correctly when returning
        return {
            ...userWithoutHash,
            joinedAt: new Date(userWithoutHash.joinedAt),
             // dob might be null, handle appropriately if needed, but should be string 'YYYY-MM-DD' or null
        };
    });
};


export const createUser = async (userData: Omit<MockUser, 'id' | 'joinedAt'>): Promise<MockUser> => {
    const newUser: MockUser = {
        ...userData,
        id: `user-${userIdCounter++}`, // Use a simple counter for predictable IDs during seeding/dev
        email: userData.email?.toLowerCase(), // Store email in lowercase
        joinedAt: new Date(), // Set join date on creation
        dob: userData.dob || null, // Ensure dob and phone are handled
        phone: userData.phone || null,
    };
    // Ensure password hash exists before logging
    const hashSnippet = newUser.hashedPassword ? newUser.hashedPassword.substring(0, 10) + '...' : 'NONE PROVIDED';
    console.log(`[Mock DB] Creating user: ${newUser.email}, Role: ${newUser.role}, ID: ${newUser.id}, Hash: ${hashSnippet}`);
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
        bio: `Posts by ${user.name || user.email}`, // Simple bio
        joinedAt: new Date(user.joinedAt), // Include joinedAt Date object
    };
};


// Refined slug generation
const generateSlug = (title: string): string => {
    let baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-')        // Replace spaces with hyphens
        .replace(/-+/g, '-')         // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, '');    // Trim leading/trailing hyphens

    // Handle potential empty slug after sanitization
    if (!baseSlug) {
        baseSlug = `post-${Date.now()}`;
    }

    let finalSlug = baseSlug;
    let counter = 1;

    // Check if the base slug already exists (case-insensitive)
    while (posts.some(p => p.slug.toLowerCase() === finalSlug.toLowerCase())) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
        // Safety break for extreme cases
        if (counter > 100) {
            console.warn(`[Mock DB] Slug generation reached limit for base: ${baseSlug}`);
            finalSlug = `${baseSlug}-${Date.now()}`; // Add timestamp as last resort
            break;
        }
    }

    console.log(`[Mock DB] Generated slug: ${finalSlug} for title: "${title}"`);
    return finalSlug;
};


export const createPost = async (
    postData: Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views' | 'rating' | 'ratingCount' | 'updatedAt'> & { authorId: string, content?: string, excerpt?: string, imageUrl?: string, tags?: string[], heading?: string, subheadings?: string[], paragraphs?: string[] },
    // Note: addUniqueSuffix parameter removed as generateSlug now always ensures uniqueness
): Promise<Post> => {
    const author = await findUserById(postData.authorId);
    if (!author) {
        throw new Error(`[Mock DB] Author not found for ID: ${postData.authorId}`);
    }

    // Construct content if structured fields are provided
     let constructedContent = postData.content || ''; // Use provided content as default
     if (!constructedContent && (postData.heading || (postData.subheadings && postData.subheadings.length > 0) || (postData.paragraphs && postData.paragraphs.length > 0))) {
         constructedContent = ''; // Start fresh if structure exists but content doesn't
         if (postData.heading) {
             constructedContent += `<h1 class="text-2xl font-bold mb-4">${postData.heading}</h1>`;
         }
         if (postData.subheadings && postData.subheadings.length > 0) {
            constructedContent += `<h2 class="text-xl font-semibold mt-6 mb-3">Subheadings</h2><ul>`; // Added title for subheadings section
            postData.subheadings.forEach(subheading => {
               if (typeof subheading === 'string' && subheading.trim()) {
                   constructedContent += `<li class="mb-2"><h3 class="text-lg font-medium">${subheading.trim()}</h3></li>`; // Added styling
               }
            });
            constructedContent += `</ul>`;
        }
        if (postData.paragraphs && postData.paragraphs.length > 0) {
            const validParagraphs = postData.paragraphs.filter(p => typeof p === 'string' && p.trim());
            if (validParagraphs.length > 0) {
                constructedContent += `<div class="prose-p:my-4">${validParagraphs.map(p => `<p>${p.trim()}</p>`).join('')}</div>`; // Wrap paragraphs
            }
        }
     }

     // Ensure content is not empty
     if (!constructedContent.trim()) {
         console.warn("[Mock DB] Post content is empty after construction. Using placeholder.");
         constructedContent = "<p>Placeholder content.</p>";
     }


    const now = new Date();
    // Generate a unique slug based on the title
    const generatedSlug = generateSlug(postData.title);

    const newPost: Post = {
        id: `post-${postIdCounter++}`,
        slug: generatedSlug, // Use the unique generated slug
        title: postData.title,
        content: constructedContent, // Use constructed or provided content
        imageUrl: postData.imageUrl || `https://picsum.photos/seed/post${postIdCounter}/1200/600`,
        category: postData.category,
        author: createAuthorObject(author),
        publishedAt: now,
        updatedAt: now,
        commentCount: 0,
        views: Math.floor(Math.random() * 100), // Lower initial views
        excerpt: postData.excerpt || constructedContent.replace(/<[^>]*>/g, '').substring(0, 150) + '...', // Auto-generate from constructed content
        tags: postData.tags || [],
        rating: parseFloat((Math.random() * 1 + 3.5).toFixed(1)), // Slightly better initial rating
        ratingCount: Math.floor(Math.random() * 10) + 1, // Lower initial rating count
        heading: postData.heading || postData.title, // Store raw heading
        subheadings: postData.subheadings || [], // Store raw subheadings
        paragraphs: postData.paragraphs || [], // Store raw paragraphs
    };
    console.log(`[Mock DB createPost] Creating post: "${newPost.title}" (Slug: "${newPost.slug}") by ${newPost.author.name}`);
    posts.push(newPost); // Add to the in-memory array
    return { ...newPost, publishedAt: new Date(newPost.publishedAt), updatedAt: new Date(newPost.updatedAt) };
};

export const findPostBySlug = async (slug: string): Promise<Post | null> => {
    const lowerCaseSlug = slug?.toLowerCase(); // Handle potential null/undefined slug
    if (!lowerCaseSlug) {
        console.warn(`[Mock DB] findPostBySlug called with invalid slug: ${slug}`);
        return null;
    }
    console.log(`[Mock DB] Searching for post with slug (case-insensitive): "${lowerCaseSlug}"`);
    console.log(`[Mock DB] Available post slugs: ${posts.map(p => p.slug.toLowerCase()).join(', ')}`); // Log available slugs

    // Find post with case-insensitive slug comparison
    const post = posts.find(p => p.slug.toLowerCase() === lowerCaseSlug);

    if (!post) {
        console.warn(`[Mock DB] Post with slug "${lowerCaseSlug}" not found.`);
        return null;
    }

    console.log(`[Mock DB] Found post: ID ${post.id}, Title: "${post.title}" for slug: "${slug}"`);

    // Simulate fetching author details again (important for up-to-date info)
    const author = await findUserById(post.author.id);
    if (!author) {
        console.warn(`[Mock DB] Author with ID ${post.author.id} not found for post ${post.id}`);
        // Decide how to handle - return post with unknown author or null?
        // Returning with unknown author for now.
         return {
            ...post,
            author: createAuthorObject(null), // Use unknown author
            publishedAt: new Date(post.publishedAt),
            updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
        };
    }

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
    authorId?: string; // Use authorId for filtering
    query?: string;
}): Promise<{ posts: Post[], hasMore: boolean, totalPages: number, currentPage: number, totalResults: number }> => {
    const { page = 0, limit = 9, category, authorId, query } = options;
    console.log(`[Mock DB findPosts] Finding posts:`, options);


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
            p.content.toLowerCase().includes(lowerQuery) ||
            p.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
             p.author.name?.toLowerCase().includes(lowerQuery) // Check optional author name
        );
    }

    // Sort AFTER filtering
    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());


    const totalResults = filtered.length;
    const totalPages = Math.ceil(totalResults / limit);
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const postsForPage = filtered.slice(startIndex, endIndex);
    const hasMore = endIndex < totalResults;


    const postsWithDetails = await Promise.all(postsForPage.map(async (post) => {
        const pubDate = new Date(post.publishedAt);
        const updDate = post.updatedAt ? new Date(post.updatedAt) : undefined;
        const author = await findUserById(post.author.id);
        return { ...post, publishedAt: pubDate, updatedAt: updDate, author: createAuthorObject(author) };
    }));


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
    // Ensure updateData includes potentially partial structured content
    updateData: Partial<Omit<Post, 'id' | 'slug' | 'author' | 'publishedAt' | 'commentCount' | 'views' | 'rating' | 'ratingCount' | 'updatedAt'>> & { requestingUserId: string }
): Promise<Post | null> => {
    const lowerCaseSlug = slug?.toLowerCase();
     if (!lowerCaseSlug) {
        console.warn(`[Mock DB] updatePost called with invalid slug: ${slug}`);
        return null;
    }
    console.log(`[Mock DB] Attempting to update post with slug: ${lowerCaseSlug}`);

    const postIndex = posts.findIndex(p => p.slug.toLowerCase() === lowerCaseSlug);
    if (postIndex === -1) {
        console.log(`[Mock DB] Post not found for update: ${slug}`);
        return null;
    }

     // Authorization Check
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
    console.log(`[Mock DB] User ${requestingUser.id} authorized to update post ${slug}.`);

    const originalPost = posts[postIndex];

    // Regenerate slug ONLY if title changed and new title provided
    let newSlug = originalPost.slug;
    if (updateData.title && updateData.title !== originalPost.title) {
         newSlug = generateSlug(updateData.title); // Will ensure uniqueness
         console.log(`[Mock DB] Title changed, generated new unique slug: ${newSlug}`);
    }


    // Construct updated content if structured fields are changing
    let updatedContent = updateData.content ?? originalPost.content; // Use new content if provided
     const hasStructureUpdate = updateData.heading !== undefined || updateData.subheadings !== undefined || updateData.paragraphs !== undefined;

     if (hasStructureUpdate) {
         console.log(`[Mock DB] Structured content update detected for post ${slug}.`);
        const currentHeading = updateData.heading ?? originalPost.heading;
        const currentSubheadings = updateData.subheadings ?? originalPost.subheadings;
        const currentParagraphs = updateData.paragraphs ?? originalPost.paragraphs;

        updatedContent = ''; // Reconstruct from potentially updated parts
         if (currentHeading) {
             updatedContent += `<h1 class="text-2xl font-bold mb-4">${currentHeading}</h1>`;
         }
         if (currentSubheadings && currentSubheadings.length > 0) {
             updatedContent += `<h2 class="text-xl font-semibold mt-6 mb-3">Subheadings</h2><ul>`;
             currentSubheadings.forEach(subheading => {
                if (typeof subheading === 'string' && subheading.trim()) {
                    updatedContent += `<li class="mb-2"><h3 class="text-lg font-medium">${subheading.trim()}</h3></li>`;
                }
             });
             constructedContent += `</ul>`;
         }
         if (currentParagraphs && currentParagraphs.length > 0) {
             const validParagraphs = currentParagraphs.filter(p => typeof p === 'string' && p.trim());
             if (validParagraphs.length > 0) {
                 updatedContent += `<div class="prose-p:my-4">${validParagraphs.map(p => `<p>${p.trim()}</p>`).join('')}</div>`;
             }
         }
         // If only structured data was updated, but no actual content generated, keep original content?
         // Or should it default to empty? Let's keep original if new construction is empty.
         if (!updatedContent.trim() && originalPost.content) {
             console.log(`[Mock DB] Reconstructed content is empty, reverting to original content for post ${slug}.`);
             updatedContent = originalPost.content;
         }
     }


    const updatedPost: Post = {
        ...originalPost,
        ...updateData, // Apply other updates from payload
        slug: newSlug, // Assign potentially new slug
        content: updatedContent, // Assign newly constructed/updated content
        updatedAt: new Date(),
        excerpt: updateData.excerpt ?? originalPost.excerpt, // Use new excerpt if provided, else keep old
        // Keep raw structured fields updated as well
        heading: updateData.heading ?? originalPost.heading,
        subheadings: updateData.subheadings ?? originalPost.subheadings,
        paragraphs: updateData.paragraphs ?? originalPost.paragraphs,
    };

    // Update excerpt if content was changed and no new excerpt was provided
     if ((updateData.content || hasStructureUpdate) && !updateData.excerpt) {
         updatedPost.excerpt = updatedContent.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
     }


    posts[postIndex] = updatedPost;
    console.log(`[Mock DB] Post updated: ${updatedPost.title} (Slug: ${updatedPost.slug})`);

    const author = await findUserById(updatedPost.author.id);
    return {
        ...updatedPost,
        author: createAuthorObject(author),
        publishedAt: new Date(updatedPost.publishedAt),
        updatedAt: new Date(updatedPost.updatedAt),
     };
};

export const deletePost = async (slug: string, requestingUserId: string): Promise<boolean> => {
    const lowerCaseSlug = slug?.toLowerCase();
    if (!lowerCaseSlug) {
        console.warn(`[Mock DB] deletePost called with invalid slug: ${slug}`);
        return false;
    }
    console.log(`[Mock DB] Deleting post with slug: ${lowerCaseSlug} by user: ${requestingUserId}`);

    const postIndex = posts.findIndex(p => p.slug.toLowerCase() === lowerCaseSlug);
    if (postIndex === -1) {
        console.log(`[Mock DB] Post not found for delete: ${slug}`);
        return false; // Indicate post not found
    }

    // Authorization Check
    const user = await findUserById(requestingUserId);
    const postAuthorId = posts[postIndex].author.id;

    if (!user) {
         console.error(`[Mock DB] Authorization failed: Requesting user ${requestingUserId} not found.`);
         throw new Error("Unauthorized");
     }

    if (postAuthorId !== requestingUserId && user.role !== 'admin') {
        console.error(`[Mock DB] Authorization failed: User ${requestingUserId} (Role: ${user.role}) cannot delete post owned by ${postAuthorId}`);
        throw new Error("Unauthorized");
    }

    posts.splice(postIndex, 1);
    console.log(`[Mock DB] Post deleted: ${slug}`);
    return true;
};


// --- Seed Data (Optional) ---
const seedData = async () => {
     // Only seed if not already seeded in this server instance
     if (isSeeded) {
        console.log("[Mock DB] Already seeded. Skipping.");
        return;
     }

     // Clear existing data before seeding
     users.length = 0;
     posts.length = 0;
     userIdCounter = 1;
     postIdCounter = 1;
     console.log("[Mock DB] Cleared existing data. Seeding initial data...");

     try {
       // Create admin user
       const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
       const adminUser = await createUser({
           email: 'vedansh2821@gmail.com',
           name: 'Vedansh V.',
           role: 'admin',
           hashedPassword: adminPasswordHash,
           photoURL: 'https://i.pravatar.cc/150?u=vedansh',
           dob: '1990-01-01',
           phone: '123-456-7890',
       });
       console.log(`[Mock DB] Admin user created: ${adminUser.email}, ID: ${adminUser.id}`);

       // Create regular users
       const aayushiPasswordHash = await bcrypt.hash('password123', 10);
       const user1 = await createUser({
           email: 'aayushi@example.com',
           name: 'Aayushi P.',
           role: 'user',
           hashedPassword: aayushiPasswordHash,
           photoURL: 'https://i.pravatar.cc/150?u=aayushi',
           dob: '1995-05-15',
           phone: null,
       });
        console.log(`[Mock DB] User created: ${user1.email}, ID: ${user1.id}`);

       const alexPasswordHash = await bcrypt.hash('password456', 10);
       const user2 = await createUser({
           email: 'alex@example.com',
           name: 'Alex G.',
           role: 'user',
           hashedPassword: alexPasswordHash,
           photoURL: 'https://i.pravatar.cc/150?u=alex',
           dob: null,
           phone: '987-654-3210',
       });
        console.log(`[Mock DB] User created: ${user2.email}, ID: ${user2.id}`);


        // Create posts
        await createPost({
            title: "Mastering TypeScript for Modern Web Development",
            category: "Technology",
            authorId: adminUser.id, // Vedansh
            tags: ["typescript", "web development", "javascript", "react"],
            imageUrl: `https://picsum.photos/seed/typescript-mastery/1200/600`,
            heading: "Mastering TypeScript", // Added heading
            subheadings: ["Why TypeScript?", "Key Features"], // Added subheadings
            paragraphs: [ // Added paragraphs
                "TypeScript has become an essential tool for building robust and scalable web applications. This post explores key concepts like static typing, interfaces, generics, and decorators.",
                "Improved code quality and maintainability. Early error detection during development. Enhanced developer experience with autocompletion and refactoring tools.",
                "We'll dive into practical examples using React and Node.js."
            ]
        });

        await createPost({
             title: "Sustainable Living: Simple Steps for a Greener Life",
             category: "Lifestyle",
             authorId: user1.id, // Aayushi
             tags: ["sustainability", "eco-friendly", "minimalism", "green living"],
             imageUrl: `https://picsum.photos/seed/sustainable-living/1200/600`,
             heading: "A Greener Life",
             subheadings: ["Easy Swaps"],
             paragraphs: [
                 "Making sustainable choices doesn't have to be overwhelming. This article provides actionable tips for reducing your environmental impact.",
                 "Reusable shopping bags. Water bottles and coffee cups. Switching to LED bulbs. Reducing meat consumption.",
                 "Every small step contributes to a healthier planet."
             ]
         });

          await createPost({
              title: "The Rise of Remote Work: Challenges and Opportunities",
              category: "Technology", // Or could be Lifestyle/Business
              authorId: user2.id, // Alex G.
              tags: ["remote work", "productivity", "future of work", "collaboration"],
              imageUrl: `https://picsum.photos/seed/remote-work-rise/1200/600`,
              heading: "Remote Work Revolution",
              paragraphs: [
                   "Remote work is transforming the professional landscape. We discuss the benefits, drawbacks, and tools needed for successful remote collaboration.",
                   "\"The ability to work from anywhere is a game-changer, but requires discipline and effective communication.\"",
                   "Adapting to this new normal is key for both employees and employers."
              ]
          });

         await createPost({
           title: "Mindfulness Meditation: A Beginner's Guide",
           category: "Health",
           authorId: user1.id, // Aayushi
           tags: ["meditation", "mindfulness", "wellness", "mental health", "stress relief"],
           imageUrl: `https://picsum.photos/seed/mindfulness-guide/1200/600`,
           heading: "Beginner's Mindfulness",
           subheadings: ["Getting Started"],
           paragraphs: [
                "Learn the basics of mindfulness meditation and how it can help reduce stress and improve focus.",
                "Find a quiet space. Sit comfortably. Focus on your breath. Gently redirect your attention when your mind wanders.",
                "Even 5-10 minutes daily can make a difference."
           ]
         });

          await createPost({
             title: "Exploring Southeast Asia: A Backpacker's Dream",
             category: "Travel",
             authorId: user2.id, // Alex G.
             tags: ["travel", "backpacking", "southeast asia", "budget travel", "adventure"],
              imageUrl: `https://picsum.photos/seed/southeast-asia/1200/600`,
              heading: "SEA Backpacking",
              paragraphs: [
                   "Southeast Asia offers incredible experiences for budget travelers. From vibrant cities to stunning beaches, here's a look at must-visit destinations.",
                   "Tips on accommodation, food, and navigating different cultures."
              ]
          });

          await createPost({
             title: "Introduction to GraphQL vs REST APIs",
             category: "Technology",
             authorId: adminUser.id, // Vedansh
             tags: ["graphql", "rest", "api", "web development", "architecture"],
              imageUrl: `https://picsum.photos/seed/graphql-rest/1200/600`,
              heading: "GraphQL vs REST",
              subheadings: ["Key Differences"],
              paragraphs: [
                  "Comparing GraphQL and REST architectural styles for building APIs. Understanding the pros and cons of each approach.",
                  "Data Fetching: GraphQL allows clients to request exactly what they need. Endpoints: REST typically uses multiple endpoints, while GraphQL uses a single endpoint. Schema & Typing: GraphQL has a strong type system.",
                  "Which one is right for your next project?"
              ]
          });

           // Add a post in the 'Love' category
           await createPost({
             title: "Navigating Modern Relationships: Communication is Key",
             category: "Love", // New Category
             authorId: user1.id, // Aayushi
             tags: ["relationships", "communication", "love", "dating", "mental health"],
             imageUrl: `https://picsum.photos/seed/modern-love/1200/600`,
             heading: "Communication in Relationships",
             subheadings: ["Tips for Better Communication"],
             paragraphs: [
                  "Building and maintaining healthy relationships in today's fast-paced world requires conscious effort, especially in communication.",
                  "Active Listening: Truly hear what your partner is saying, without interrupting. Express Needs Clearly: Avoid ambiguity; state your feelings and needs openly. Empathy: Try to understand your partner's perspective, even if you disagree. Constructive Conflict: Address disagreements respectfully, focusing on the issue, not the person.",
                  "Investing in communication strengthens the foundation of any relationship."
             ]
           });


        console.log("[Mock DB] Seed data creation finished.");
        isSeeded = true; // Mark as seeded

      } catch (error) {
         console.error("[Mock DB] Error seeding data:", error);
      }
 };

 // Initialize seed data only if not already seeded
 if (!isSeeded) {
     seedData();
 }

