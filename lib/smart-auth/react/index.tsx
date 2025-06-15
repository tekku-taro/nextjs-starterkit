// src/react/index.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
  update: (data?: any) => Promise<Session | null>;
  refresh: () => Promise<Session | null>;
}

export const SessionContext = createContext<SessionContextType>({
  session: null,
  status: 'loading',
  update: async () => null,
  refresh: async () => null,
});

export interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  const fetchSession = async (): Promise<Session | null> => {
    try {
      const response = await fetch('/api/auth/session', {
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
  };

  const updateSession = async (data?: any): Promise<Session | null> => {
    try {
      const response = await fetch('/api/auth/updateSession', {
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
  };

  useEffect(() => {
    const loadSession = async () => {
      setStatus('loading');
      const sessionData = await fetchSession();
      setSession(sessionData);
      setStatus(sessionData ? 'authenticated' : 'unauthenticated');
    };

    loadSession();

    // Listen for storage events (sign in/out in other tabs)
    const handleStorageChange = () => {
      loadSession();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: SessionContextType = {
    session,
    status,
    update: updateSession,
    refresh: fetchSession
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
  [key: string]: any;
}

export async function signIn(provider: string = 'credentials', options: SignInOptions = {}) {
  if (provider === 'credentials') {
    // For credentials, we need to handle form submission
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/signIn';

    if (options.email) {
      const emailInput = document.createElement('input');
      emailInput.type = 'hidden';
      emailInput.name = 'email';
      emailInput.value = options.email;
      form.appendChild(emailInput);
    }

    if (options.password) {
      const passwordInput = document.createElement('input');
      passwordInput.type = 'hidden';
      passwordInput.name = 'password';
      passwordInput.value = options.password;
      form.appendChild(passwordInput);
    }

    // Add CSRF token
    const csrfToken = await getCSRFToken();
    if (csrfToken) {
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfToken';
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);
    }

    if (options.redirectTo) {
      const redirectInput = document.createElement('input');
      redirectInput.type = 'hidden';
      redirectInput.name = 'redirectTo';
      redirectInput.value = options.redirectTo;
      form.appendChild(redirectInput);
    }

    // Add any other options as hidden fields
    for (const key in options) {
      if (options.hasOwnProperty(key) && !['email', 'password', 'redirectTo'].includes(key)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(options[key]);
        form.appendChild(input);
      }
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  } else {
    // For OAuth providers, redirect to sign-in endpoint
    const params = new URLSearchParams({ provider });
    if (options.redirectTo) {
      params.set('redirectTo', options.redirectTo);
    }
    for (const key in options) {
      if (options.hasOwnProperty(key) && !['redirectTo'].includes(key) && options[key] !== undefined) {
        params.set(key, String(options[key]));
      }
    }
    window.location.href = `/api/auth/signIn?${params}`;
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
  
  window.location.href = `/api/auth/signOut${params.toString() ? `?${params.toString()}` : ''}`;
}

export async function getCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/csrf', {
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
  const { session, status } = useSession();

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

// Sign In Form Component
// export interface SignInFormProps {
//   onSubmit?: (email: string, password: string) => void;
//   className?: string;
//   redirectTo?: string;
// }

// export function SignInForm({ onSubmit, className = '', redirectTo }: SignInFormProps) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const csrfToken = useCSRFToken();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       if (onSubmit) {
//         onSubmit(email, password);
//       } else {
//         await signIn('credentials', { email, password, redirectTo });
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOAuthSignIn = async (provider: string) => {
//     setLoading(true);
//     try {
//       await signIn(provider, { redirectTo });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className={`max-w-md mx-auto ${className}`}>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//             Email
//           </label>
//           <input
//             id="email"
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//           />
//         </div>
        
//         <div>
//           <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//             Password
//           </label>
//           <input
//             id="password"
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//           />
//         </div>

//         {csrfToken && (
//           <input type="hidden" name="csrfToken" value={csrfToken} />
//         )}

//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//         >
//           {loading ? 'Signing in...' : 'Sign In'}
//         </button>
//       </form>

//       <div className="mt-6">
//         <div className="relative">
//           <div className="absolute inset-0 flex items-center">
//             <div className="w-full border-t border-gray-300" />
//           </div>
//           <div className="relative flex justify-center text-sm">
//             <span className="px-2 bg-white text-gray-500">Or continue with</span>
//           </div>
//         </div>

//         <div className="mt-6 grid grid-cols-2 gap-3">
//           <button
//             onClick={() => handleOAuthSignIn('google')}
//             disabled={loading}
//             className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
//           >
//             Google
//           </button>
          
//           <button
//             onClick={() => handleOAuthSignIn('github')}
//             disabled={loading}
//             className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
//           >
//             GitHub
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }