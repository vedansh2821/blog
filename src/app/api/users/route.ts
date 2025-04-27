
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db/mock-sql';
import { getUserFromRequest } from '@/lib/auth/server';

export async function GET(request: Request) {
  console.log('[API GET /api/users] Received request');
  try {
    // --- Authentication & Authorization ---
    const requestingUser = await getUserFromRequest(request);
    if (!requestingUser) {
      console.warn('[API GET /api/users] Unauthorized: Not logged in.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (requestingUser.role !== 'admin') {
      console.warn(`[API GET /api/users] Forbidden: User ${requestingUser.id} is not an admin.`);
      return NextResponse.json({ error: 'Forbidden: Only admins can access this resource.' }, { status: 403 });
    }

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
