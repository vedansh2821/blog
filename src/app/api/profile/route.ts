
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
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized: Not logged in.' }, { status: 401 });
    }

    // --- Fetch User Data ---
    const user = await findUserById(currentUser.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // --- Prepare Response ---
    const { hashedPassword, ...profileData } = user;

    return NextResponse.json(profileData, { status: 200 });

  } catch (error) {
    console.error('[API GET /api/profile] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


// PUT handler to update profile information (name, dob, phone, photoURL)
export async function PUT(request: Request) {
  try {
    // --- Authentication ---
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized: Not logged in.' }, { status: 401 });
    }

    // --- Get Request Body ---
    const body = await request.json();
    const { name, dob, phone, photoURL } = body; // Include photoURL

    // --- Basic Validation ---
    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid name format' }, { status: 400 });
    }
    if (dob !== undefined && (typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob))) {
        if (dob !== null) {
           return NextResponse.json({ error: 'Invalid date of birth format (YYYY-MM-DD) or null required' }, { status: 400 });
       }
    }
     if (phone !== undefined && typeof phone !== 'string' && phone !== null) {
       return NextResponse.json({ error: 'Invalid phone format or null required' }, { status: 400 });
     }
     // Basic URL validation for photoURL (if provided)
     if (photoURL !== undefined && typeof photoURL !== 'string') {
         if (photoURL !== null) {
            return NextResponse.json({ error: 'Invalid photo URL format or null required' }, { status: 400 });
         }
     }
     if (photoURL !== undefined && photoURL !== null && typeof photoURL === 'string') {
         try {
             new URL(photoURL); // Check if it's a valid URL structure
         } catch (_) {
              // Allow potentially relative URLs or data URIs - more complex validation might be needed
              // For now, just ensure it's a string or null
              console.warn("[API PUT /api/profile] Photo URL provided but may not be a standard absolute URL:", photoURL);
         }
     }


    // --- Update User in DB ---
    const updatePayload: { name?: string; dob?: string | null; phone?: string | null; photoURL?: string | null } = {}; // Add photoURL to payload type
    if (name !== undefined) updatePayload.name = name;
     if (dob !== undefined) updatePayload.dob = dob;
     if (phone !== undefined) updatePayload.phone = phone;
     if (photoURL !== undefined) updatePayload.photoURL = photoURL; // Add photoURL to payload

    if (Object.keys(updatePayload).length === 0) {
         return NextResponse.json({ message: 'No profile fields provided for update.' }, { status: 200 });
     }

    const updatedUser = await updateUser(currentUser.id, updatePayload); // Pass the updated payload

    if (!updatedUser) {
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
        const userFromDb = await findUserById(currentUser.id);
        if (!userFromDb || !userFromDb.hashedPassword) {
             return NextResponse.json({ error: 'User data incomplete or not found.' }, { status: 500 });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, userFromDb.hashedPassword);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Incorrect current password.' }, { status: 401 });
        }

        // --- Hash New Password ---
        const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // --- Update Password in DB ---
        const success = await updatePassword(currentUser.id, newHashedPassword);

        if (!success) {
             return NextResponse.json({ error: 'Failed to update password, user not found.' }, { status: 500 });
        }

        console.log(`[API POST /api/profile] Password updated for user: ${currentUser.id}`);
        return NextResponse.json({ message: 'Password updated successfully.' }, { status: 200 });

    } catch (error) {
        console.error('[API POST /api/profile - Password Change] Error:', error);
        return NextResponse.json({ error: 'Failed to update password', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
