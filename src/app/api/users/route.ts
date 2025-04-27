
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { getAllUsers, findUserById } from '@/lib/db/mock-sql'; // Need findUserById for auth check
import type { AuthUser } from '@/lib/auth/authContext'; // Import AuthUser for explicit typing

export async function GET(request: Request) {
  console.log('[API GET /api/users] Received request');
  try {
    // --- Authentication & Authorization (Mock using Header) ---
    const requestingUserId = request.headers.get('X-Mock-User-ID');
    if (!requestingUserId) {
      console.warn('[API GET /api/users] Unauthorized: Missing X-Mock-User-ID header.');
      return NextResponse.json({ error: 'Unauthorized: Missing user identification.' }, { status: 401 });
    }

    // Log the ID received from the header
    console.log(`[API GET /api/users] Received X-Mock-User-ID: "${requestingUserId}"`);

    const requestingUser = await findUserById(requestingUserId);
    if (!requestingUser) {
         console.warn(`[API GET /api/users] Unauthorized: Requesting user ${requestingUserId} not found in DB.`);
         return NextResponse.json({ error: 'Unauthorized: User not found.' }, { status: 401 });
    }

    if (requestingUser.role !== 'admin') {
      console.warn(`[API GET /api/users] Forbidden: User ${requestingUser.id} (${requestingUser.email}) is not an admin.`);
      return NextResponse.json({ error: 'Forbidden: Only admins can access this resource.' }, { status: 403 });
    }

    console.log(`[API GET /api/users] Authorized admin request from ${requestingUser.email} (${requestingUser.id})`);

    // --- Fetch All Users (function internally checks auth again, which is slightly redundant but ok) ---
    // Pass requestingUserId again, although the check above already confirmed admin status
    const users = await getAllUsers(requestingUserId);

    // --- Format Response ---
    // Ensure dates are ISO strings and structure matches AuthUser (excluding password)
    const formattedUsers: AuthUser[] = users.map(user => {
        // The getAllUsers function already removed the hashedPassword
        return {
            ...user,
            // Convert date to ISO string safely, handle potential invalid dates
            joinedAt: user.joinedAt instanceof Date && !isNaN(user.joinedAt.getTime())
                        ? user.joinedAt.toISOString()
                        : (user.joinedAt && !isNaN(new Date(user.joinedAt).getTime())
                            ? new Date(user.joinedAt).toISOString()
                            : undefined), // Return undefined if date is invalid/missing
             // dob should already be 'YYYY-MM-DD' string or null from the mock DB
             dob: user.dob,
        };
    });


    console.log(`[API GET /api/users] Returning ${formattedUsers.length} users for admin ${requestingUser.id}.`);
    return NextResponse.json(formattedUsers, { status: 200 });

  } catch (error) {
    console.error('[API GET /api/users] Error fetching users:', error);
    // Return specific error messages from the catch block
     if (error instanceof Error && (error.message.includes("Unauthorized") || error.message.includes("Forbidden"))) {
         // Handle auth errors potentially thrown from getAllUsers
         const status = error.message.includes("Unauthorized") ? 401 : 403;
         return NextResponse.json({ error: error.message }, { status });
     }
    // Default 500 for other errors
    return NextResponse.json({ error: 'Failed to fetch users', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
