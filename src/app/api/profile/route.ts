// src/app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { findUserById, updateUser, updatePassword } from '@/lib/db/mock-sql';
import bcrypt from 'bcrypt';
import { getUserFromRequest } from '@/lib/auth/server'; // Assuming this helper verifies the user session/token

const SALT_ROUNDS = 10;

// GET handler to fetch profile data for the currently logged-in user
export async function GET(request: Request) {
  try {
    // --- Authentication ---
    // In a real app, get the user ID from a verified session/token
    const currentUser = await getUserFromRequest(request); // Use your server-side auth helper
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized: Not logged in.' }, { status: 401 });
    }

    // --- Fetch User Data ---
    // Fetch potentially updated data from DB (or rely on currentUser from token if it's fresh)
    const user = await findUserById(currentUser.id);
    if (!user) {
      // This case shouldn't happen if getUserFromRequest is working correctly, but good to check
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // --- Prepare Response ---
    // Omit sensitive data like password hash
    const { hashedPassword, ...profileData } = user;

    return NextResponse.json(profileData, { status: 200 });

  } catch (error) {
    console.error('[API GET /api/profile] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


// PUT handler to update profile information (name, dob, phone)
export async function PUT(request: Request) {
  try {
    // --- Authentication ---
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized: Not logged in.' }, { status: 401 });
    }

    // --- Get Request Body ---
    const body = await request.json();
    const { name, dob, phone } = body;

    // --- Basic Validation ---
    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid name format' }, { status: 400 });
    }
    if (dob !== undefined && (typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob))) {
        if (dob !== null) { // Allow setting to null explicitly
           return NextResponse.json({ error: 'Invalid date of birth format (YYYY-MM-DD) or null required' }, { status: 400 });
       }
    }
     if (phone !== undefined && typeof phone !== 'string' && phone !== null) { // Allow null
       return NextResponse.json({ error: 'Invalid phone format or null required' }, { status: 400 });
     }


    // --- Update User in DB ---
    const updatePayload: { name?: string; dob?: string | null; phone?: string | null } = {};
    if (name !== undefined) updatePayload.name = name;
     if (dob !== undefined) updatePayload.dob = dob; // Pass dob directly (string or null)
     if (phone !== undefined) updatePayload.phone = phone; // Pass phone directly (string or null)

    if (Object.keys(updatePayload).length === 0) {
         return NextResponse.json({ message: 'No profile fields provided for update.' }, { status: 200 });
     }


    const updatedUser = await updateUser(currentUser.id, updatePayload);

    if (!updatedUser) {
      // This shouldn't happen if the user was authenticated, but handle it
      return NextResponse.json({ error: 'Failed to update profile, user not found.' }, { status: 404 });
    }

    // --- Prepare Response ---
    const { hashedPassword, ...profileResponse } = updatedUser;
    console.log(`[API PUT /api/profile] Profile updated for user: ${currentUser.id}`);
    return NextResponse.json(profileResponse, { status: 200 });

  } catch (error) {
    console.error('[API PUT /api/profile] Error:', error);
    return NextResponse.json({ error: 'Failed to update profile', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// POST handler specifically for changing password
export async function POST(request: Request) {
    // Endpoint: /api/profile (using POST to distinguish from PUT for general profile update)
    // Or you could use a sub-route like /api/profile/password
    try {
        // --- Authentication ---
        const currentUser = await getUserFromRequest(request);
        if (!currentUser) {
             return NextResponse.json({ error: 'Unauthorized: Not logged in.' }, { status: 401 });
         }

        // --- Get Request Body ---
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        // --- Validation ---
        if (!currentPassword || !newPassword) {
             return NextResponse.json({ error: 'Current password and new password are required.' }, { status: 400 });
        }
        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
        }

        // --- Verify Current Password ---
        const userFromDb = await findUserById(currentUser.id); // Fetch user with hash
        if (!userFromDb || !userFromDb.hashedPassword) {
             // Should not happen if authenticated, but safety check
             return NextResponse.json({ error: 'User data incomplete or not found.' }, { status: 500 });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, userFromDb.hashedPassword);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Incorrect current password.' }, { status: 401 }); // Use 401 Unauthorized or 400 Bad Request
        }

        // --- Hash New Password ---
        const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // --- Update Password in DB ---
        const success = await updatePassword(currentUser.id, newHashedPassword);

        if (!success) {
             // Should not happen if user was found earlier, but handle it
             return NextResponse.json({ error: 'Failed to update password, user not found.' }, { status: 500 });
        }

        console.log(`[API POST /api/profile] Password updated for user: ${currentUser.id}`);
        return NextResponse.json({ message: 'Password updated successfully.' }, { status: 200 });

    } catch (error) {
        console.error('[API POST /api/profile - Password Change] Error:', error);
        return NextResponse.json({ error: 'Failed to update password', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
