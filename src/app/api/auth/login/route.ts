// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { findUserByEmail } from '@/lib/db/mock-sql'; // Import from mock DB
import type { AuthUser } from '@/lib/auth/authContext';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user in the mock database
    const user = await findUserByEmail(email);

    if (!user || !user.hashedPassword) {
      console.log(`Login failed: User not found or no password hash for ${email}`);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      console.log(`Login failed: Invalid password for ${email}`);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    console.log(`Login successful for ${email}`);

    // Prepare user data to send back (omit password hash)
    const userResponse: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      role: user.role, // Include role
    };

    // In a real app, you'd typically create a session token (e.g., JWT) here
    // and return it to the client to store (e.g., in cookies or localStorage).
    // For this example, we'll just return the user data.
    return NextResponse.json(userResponse, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login.', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
