// src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { findUserByEmail, createUser } from '@/lib/db/mock-sql'; // Import from mock DB
import type { AuthUser } from '@/lib/auth/authContext';

const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    // Basic validation (add more as needed)
    if (password.length < 6) {
         return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
     }
     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }


    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.log(`Signup failed: Email already exists - ${email}`);
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 }); // 409 Conflict
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user in the mock database with default 'user' role
    const newUser = await createUser({
      email,
      name,
      hashedPassword,
      role: 'user', // Default role for new signups
      photoURL: `https://i.pravatar.cc/150?u=${email}`, // Default avatar
    });

    console.log(`Signup successful for ${email}`);

    // Prepare user data to send back (omit password hash)
    const userResponse: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      photoURL: newUser.photoURL,
      role: newUser.role, // Include role
    };

    // Like login, you might create a session/token here in a real app.
    return NextResponse.json(userResponse, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during signup.', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
