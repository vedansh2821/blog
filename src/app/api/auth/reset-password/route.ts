
// src/app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { updatePassword, findUserById } from '@/lib/db/mock-sql'; // Import findUserById for safety check

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();
    console.log(`[API Reset Password] Attempting reset for user ID: ${userId}`);

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    // Safety check: ensure user still exists (though security verification should precede this)
    const userExists = await findUserById(userId);
    if (!userExists) {
         console.warn(`[API Reset Password] User ${userId} not found during reset attempt.`);
         return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Hash the new password
    const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update the password in the database
    const success = await updatePassword(userId, newHashedPassword);

    if (!success) {
      // This might happen if the user was deleted between verification and reset
      console.error(`[API Reset Password] Failed to update password for user ID: ${userId} (updatePassword returned false).`);
      return NextResponse.json({ error: 'Failed to update password. User might not exist.' }, { status: 500 });
    }

    console.log(`[API Reset Password] Password successfully reset for user ID: ${userId}`);
    return NextResponse.json({ message: 'Password reset successfully.' }, { status: 200 });

  } catch (error) {
    console.error('[API Reset Password] Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during password reset.', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
