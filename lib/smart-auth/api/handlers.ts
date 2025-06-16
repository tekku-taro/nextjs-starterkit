// src/api/handlers.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSmartAuth } from '../index';

// Handle all auth routes
export async function authHandler(
  request: NextRequest,
  { params }: { params: Promise<{ smartauth: string[] }> }
): Promise<NextResponse> {
  // console.log('authHandler')
  const smartAuth = getSmartAuth();
  const {smartauth} = await params;
  const [action] = smartauth;

  try {
    switch (action) {
      case 'signIn':
        return await smartAuth.handleSignIn(request);
      
      case 'signOut':
        return await smartAuth.handleSignOut(request);
      
      case 'callback':
        return await smartAuth.handleCallback(request);
      
      case 'session':
        return await handleGetSession();
      
      case 'csrf':
        return await handleGetCSRF();
      
      case 'updateSession':
        if (request.method === 'POST') {
          return await smartAuth.handleUpdateSession(request);
        }
        break;
      
      default:
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Auth handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

// Get current session
async function handleGetSession(): Promise<NextResponse> {
  const smartAuth = getSmartAuth();
  const session = await smartAuth.getSession();
  
  return NextResponse.json({ session });
}

// Get CSRF token
async function handleGetCSRF(): Promise<NextResponse> {
  const smartAuth = getSmartAuth();
  const csrfToken = smartAuth.generateCSRFToken();
  
  const response = NextResponse.json({ csrfToken });
  response.cookies.set('smartauth-csrf-token', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
  });
  
  return response;
}