
// src/app/api/auth/verify-email/route.ts
import { NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/db/mock-sql';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    console.log(`[API Verify Email] Checking email: ${email}`);

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      console.log(`[API Verify Email] User not found for email: ${email}`);
      return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 });
    }

    console.log(`[API Verify Email] User found for email: ${email}, returning ID: ${user.id}`);
    // Only return the user ID, not the full user object
    return NextResponse.json({ userId: user.id }, { status: 200 });

  } catch (error) {
    console.error('[API Verify Email] Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
