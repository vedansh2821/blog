
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { getAllUsers, findUserById } from '@/lib/db/mock-sql'; // Need findUserById for auth check
// Removed getUserFromRequest import, will use headers for mock

export async function GET(request: Request) {
  console.log('[API GET /api/users] Received request');
  try {
    // --- Authentication & Authorization (Mock using Header) ---
    const requestingUserId = request.headers.get('X-Mock-User-ID');
    if (!requestingUserId) {
      console.warn('[API GET /api/users] Unauthorized: Missing X-Mock-User-ID header.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestingUser = await findUserById(requestingUserId);
    if (!requestingUser) {
         console.warn(`[API GET /api/users] Unauthorized: Requesting user ${requestingUserId} not found.`);
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (requestingUser.role !== 'admin') {
      console.warn(`[API GET /api/users] Forbidden: User ${requestingUser.id} (${requestingUser.email}) is not an admin.`);
      return NextResponse.json({ error: 'Forbidden: Only admins can access this resource.' }, { status: 403 });
    }

    console.log(`[API GET /api/users] Authorized admin request from ${requestingUser.email} (${requestingUser.id})`);

    // --- Fetch All Users ---
    const users = await getAllUsers(); // This function should NOT return password hashes

    // --- Format Response ---
    // Ensure dates are ISO strings for JSON compatibility
    const formattedUsers = users.map(user => ({
        ...user,
        joinedAt: user.joinedAt ? new Date(user.joinedAt).toISOString() : undefined,
        // dob: user.dob // Assuming dob is already a string 'YYYY-MM-DD' or null from mock DB
    }));


    console.log(`[API GET /api/users] Returning ${users.length} users for admin ${requestingUser.id}.`);
    return NextResponse.json(formattedUsers, { status: 200 });

  } catch (error) {
    console.error('[API GET /api/users] Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

