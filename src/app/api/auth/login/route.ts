// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { findUserByEmail } from '@/lib/db/mock-sql'; // Import from mock DB
import type { AuthUser } from '@/lib/auth/authContext';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    console.log(`[API Login] Attempting login for: ${email}`);

    if (!email || !password) {
      console.warn('[API Login] Failed: Email or password missing.');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user in the mock database
    const user = await findUserByEmail(email);

    if (!user) {
      console.warn(`[API Login] Failed: User not found for email: ${email}`);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.hashedPassword) {
        console.error(`[API Login] CRITICAL FAILURE: User ${email} found but has no hashedPassword in the database!`);
        // This indicates a problem with user creation or data integrity in the mock DB.
        return NextResponse.json({ error: 'Authentication system error. Please contact support.' }, { status: 500 });
    }

    console.log(`[API Login] User found: ${email}. Comparing password...`);
    // Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      console.warn(`[API Login] Failed: Invalid password for email: ${email}`);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    console.log(`[API Login] Login successful for: ${email}`);

    // Prepare user data to send back (omit password hash)
    // Ensure the returned object matches the AuthUser interface precisely
    const userResponse: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      role: user.role,
      // Include optional fields if they exist, otherwise they will be undefined/null as per AuthUser
      dob: user.dob,
      phone: user.phone,
      joinedAt: user.joinedAt // Ensure joinedAt is included
    };

    // In a real app, you'd typically create a session token (e.g., JWT) here
    // and return it to the client to store (e.g., in cookies or localStorage).
    // For this example, we'll just return the user data.
    return NextResponse.json(userResponse, { status: 200 });

  } catch (error) {
    console.error('[API Login] Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login.', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
