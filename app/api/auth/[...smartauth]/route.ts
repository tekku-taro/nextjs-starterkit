import { authHandler } from '@/lib/smart-auth/api/handlers';
import { NextRequest, NextResponse } from 'next/server';

// Example API route file structure:
// app/api/auth/[...smartauth]/route.ts
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ smartauth: string[] }> }
) {
  return authHandler(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ smartauth: string[] }> }
) {
  return authHandler(request, context);
}