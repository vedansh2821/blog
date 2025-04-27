// src/app/api/profile/[userId]/route.ts
import { NextResponse } from 'next/server';
import { findUserById, findPosts } from '@/lib/db/mock-sql';
import type { AuthUser } from '@/lib/auth/authContext';
import { getUserFromRequest } from '@/lib/auth/server'; // To check admin status

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const targetUserId = params.userId;
  console.log(`[API GET /api/profile/${targetUserId}] Received request`);

  try {
    // --- Authentication (Optional but recommended for rate limiting/basic checks) ---
    // You might want to check if *someone* is logged in, even if not the target user
    const requestingUser = await getUserFromRequest(request); // Check who is making the request

    // --- Fetch Target User Data ---
    const targetUser = await findUserById(targetUserId);

    if (!targetUser) {
      console.warn(`[API GET /api/profile/${targetUserId}] Target user not found.`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // --- Authorization & Data Filtering ---
    let profileData: Partial<AuthUser> & { joinedAt?: Date | string } = {}; // Initialize with allowed fields

    // Fields always visible to everyone
    profileData = {
      id: targetUser.id,
      name: targetUser.name,
      photoURL: targetUser.photoURL,
      joinedAt: targetUser.joinedAt, // Include join date
      // You might add other public fields like bio here if they exist on MockUser
    };

    // Fields visible only to Admins
    if (requestingUser && requestingUser.role === 'admin') {
        console.log(`[API GET /api/profile/${targetUserId}] Requesting user ${requestingUser.id} is admin. Including all details.`);
      profileData.email = targetUser.email;
      profileData.dob = targetUser.dob;
      profileData.phone = targetUser.phone;
      profileData.role = targetUser.role;
    } else {
         console.log(`[API GET /api/profile/${targetUserId}] Requesting user is not admin or not logged in. Returning public data only.`);
         // Ensure non-admin fields are NOT included if not admin
          delete profileData.email;
          delete profileData.dob;
          delete profileData.phone;
          delete profileData.role; // Role might be considered sensitive depending on app
    }

    // --- Fetch User's Posts (Publicly visible) ---
    // Always fetch posts, regardless of requesting user's role
    const postResults = await findPosts({ authorId: targetUserId, limit: 100 }); // Fetch all posts for the user profile view

    console.log(`[API GET /api/profile/${targetUserId}] Profile data prepared. Including ${postResults.posts.length} posts.`);
    return NextResponse.json({ profile: profileData, posts: postResults.posts }, { status: 200 });

  } catch (error) {
    console.error(`[API GET /api/profile/${targetUserId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch user profile', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
