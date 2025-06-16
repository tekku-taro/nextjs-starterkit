// src/react/index.tsx
'use client';

import smartAuthConfig from '../../../smartauth.config';
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
}

export interface Session {
  user: User;
  expires: string;
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';


export interface SessionContextType {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: (data?: {user: Partial<User>} & Record<string, unknown>) => Promise<Session | null>;
  reloadSession: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType>({
  session: null,
  status: 'loading',
  update: async () => null,
  reloadSession: async () => {},
});

export interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  const fetchSession = useCallback(async (): Promise<Session | null> => {
    try {
      const response = await fetch(smartAuthConfig.endpoints.session, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.session || null;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const updateSession = useCallback(async (data?: {user: Partial<User>} & Record<string, unknown>): Promise<Session | null> => {
    try {
      const response = await fetch(smartAuthConfig.endpoints.updateSession, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data || {}),
      });

      if (response.ok) {
        const result = await response.json();
        setSession(result.session);
        setStatus(result.session ? 'authenticated' : 'unauthenticated');
        return result.session;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const reloadSession = useCallback(async () => {
    setStatus('loading');
    const sessionData = await fetchSession();
    setSession(sessionData);
    setStatus(sessionData ? 'authenticated' : 'unauthenticated');
  }, [fetchSession]);

  useEffect(() => {
    // Internal function for initial load and storage event handling within useEffect
    const loadSession = async () => {
      setStatus('loading');
      const sessionData = await fetchSession();
      setSession(sessionData);
      setStatus(sessionData ? 'authenticated' : 'unauthenticated');
    };

    loadSession(); // Initial load

    // Listen for storage events (sign in/out in other tabs)
    const handleStorageChange = () => {
      loadSession();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchSession]);

  const value: SessionContextType = {
    session,
    status,
    update: updateSession,
    reloadSession: reloadSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export interface SignInOptions {
  email?: string|null;
  password?: string;
  redirect?: boolean;
  redirectTo?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface SignInResponse {
  ok: boolean;
  error: string | undefined | null;
  status?: number;
  url?: string | null;
}

export async function signIn(provider: string = 'credentials', options: SignInOptions = {}): Promise<SignInResponse | undefined> {
  if (provider === 'credentials') {
    const { email, password, redirect = true, redirectTo, ...customPayloadOptions } = options;

    const csrfToken = await getCSRFToken();

    const payload = {
      email,
      password,
      csrfToken,
      redirectTo,
      ...customPayloadOptions,
    };

    try {
      const response = await fetch(smartAuthConfig.endpoints.signIn, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      // Try to parse JSON, but don't fail if body is empty or not JSON
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const finalRedirectUrl = redirectTo || data.url || '/'; // Determine redirect URL
        if (redirect) {
          window.location.href = finalRedirectUrl;
          // Note: Code execution might stop here due to navigation.
          // The promise resolves, but subsequent .then() in caller might not execute.
          return { ok: true, error: undefined, url: finalRedirectUrl };
        }
        // If redirect is false, return success response for caller to handle
        return { ok: true, error: undefined, url: data.url || response.url };
      } else {
        // Authentication failed or other server error
        return {
          ok: false,
          error: data.message || 'Invalid email or password.',
          status: response.status,
          url: response.url,
        };
      }
    } catch {
      // Network error or other issues with the fetch call itself
      return { ok: false, error: 'NetworkError', status: 0, url: null };
    }
  } else {
    // For OAuth providers, redirect to sign-in endpoint
    const params = new URLSearchParams({ provider });
    if (options.redirectTo) {
      params.set('redirectTo', options.redirectTo);
    }
    for (const key in options) {
      // Ensure that we are not passing undefined values and only relevant options for OAuth
      if (options.hasOwnProperty(key) && key !== 'redirectTo' && key !== 'redirect' && options[key] !== undefined) {
        params.set(key, String(options[key]));
      }
    }
    window.location.href = `${smartAuthConfig.endpoints.signIn}?${params}`;
    return undefined;
  }
}

export interface SignOutOptions {
  redirect?: boolean;
  redirectTo?: string;
}

export async function signOut(options: SignOutOptions = {}) {
  const params = new URLSearchParams();
  if (options.redirect) {
    params.set('redirect', String(options.redirect));
  }
  if (options.redirectTo) {
    params.set('redirectTo', options.redirectTo);
  }
  
  window.location.href = `${smartAuthConfig.endpoints.signOut}${params.toString() ? `?${params.toString()}` : ''}`;
}

export async function getCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch(smartAuthConfig.endpoints.csrf, {
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.csrfToken;
    }
    return null;
  } catch {
    return null;
  }
}

// Hook for getting CSRF token
export function useCSRFToken() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);

  useEffect(() => {
    getCSRFToken().then(setCSRFToken);
  }, []);

  return csrfToken;
}

// Helper component for protected routes
export interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  fallback = <div>Loading...</div>, 
  redirectTo = '/auth/signin' 
}: ProtectedRouteProps) {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated' && redirectTo) {
      window.location.href = redirectTo;
    }
  }, [status, redirectTo]);

  if (status === 'loading') {
    return <>{fallback}</>;
  }

  if (status === 'unauthenticated') {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
