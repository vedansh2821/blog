
// src/app/api/auth/verify-security/route.ts
import { NextResponse } from 'next/server';
import { verifySecurityQuestions } from '@/lib/db/mock-sql';

export async function POST(request: Request) {
  try {
    const { userId, firstSchoolAnswer, petNameAnswer } = await request.json();
    console.log(`[API Verify Security] Verifying for user ID: ${userId}`);

    if (!userId || firstSchoolAnswer === undefined || petNameAnswer === undefined) {
      return NextResponse.json({ error: 'User ID and answers are required' }, { status: 400 });
    }

    const isVerified = await verifySecurityQuestions(userId, firstSchoolAnswer, petNameAnswer);

    if (!isVerified) {
      console.log(`[API Verify Security] Verification failed for user ID: ${userId}`);
      return NextResponse.json({ error: 'Incorrect security question answers.' }, { status: 401 }); // Unauthorized
    }

    console.log(`[API Verify Security] Verification successful for user ID: ${userId}`);
    return NextResponse.json({ message: 'Security questions verified successfully.' }, { status: 200 });

  } catch (error) {
    console.error('[API Verify Security] Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
