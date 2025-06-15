// src/index.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
// import { randomBytes } from 'crypto';
import * as jose from 'jose';
import defaultConfig from '../../smartauth.config';
import { redirect as nextNavigationRedirect } from 'next/navigation';

export interface SmartAuthConfig {
  providers: {
    credentials?: {
      emailField: string;
      passwordField: string;
      table: string;
    };
    google?: {
      clientId: string;
      clientSecret: string;
    };
    github?: {
      clientId: string;
      clientSecret: string;
    };
  };
  redirects: {
    default: string;
    signIn: string;
    error?: string;
  };
  endpoints: {
    signIn: string;
    signOut: string;
    callback: string;
    csrf: string;
    updateSession: string;
  };
  secret?: string;
  adapter?: AuthAdapter;
}

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

export interface AuthAdapter {
  getUserByEmail(email: string): Promise<User | null>;
  createUser(data: any): Promise<User>;
  verifyUser(email: string, password: string): Promise<User | null>;
  updateSession(userId: string, data: any): Promise<void>;
}

export interface AuthResponse {
  session: Session | null;
  user?: User;
}

class SmartAuth {
  private config: SmartAuthConfig;
  private secret: string;

  constructor(config: SmartAuthConfig) {
    this.config = config;
    this.secret = config.secret || process.env.AUTH_SECRET || 'default-secret';
    console.log('SmartAuth initialized with secret:', this.secret); 
  }

  public getConfig(): SmartAuthConfig {
    return this.config;
  }


  // CSRF Token generation and validation
  generateCSRFToken(): string {
    // return randomBytes(32).toString('hex');
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

  }

  validateCSRFToken(token: string, sessionToken?: string): boolean {
    // Simple validation - in production, you'd want more sophisticated validation
    return typeof token === 'string' && token.length === 64;
  }

  // JWT Token utilities
  async signJWT(payload: Session): Promise<string> {
    console.log('Signing JWT with secret:', this.secret); 
    const secretKey = new TextEncoder().encode(this.secret);
    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
    return await new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + thirtyDaysInSeconds)
      .sign(secretKey);
  }

  async verifyJWT(token: string): Promise<Session | null> {
    console.log('Verifying JWT with secret:', this.secret); 
    const secretKey = new TextEncoder().encode(this.secret);
    try {
      const { payload } = await jose.jwtVerify(token, secretKey);
      // jwtVerify は 'exp' クレームを検証します。成功すれば、ペイロードは有効なセッションです。
      return payload as unknown as Session;
    } catch (error) {
      console.error('JWT Verification Error (jose):', error);
      if (error instanceof jose.errors.JWTExpired) {
        console.log("Token expired (verified by jose)");
      }
      return null;
    }
  }

  // Session management
  async createSession(user: User): Promise<Session> {
    // Sessionオブジェクトの'expires'フィールドは情報提供用として保持できます。
    // JWTの実際の有効期限はsignJWT内の'exp'クレームによって設定・検証されます。
    const session: Session = {
      user,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), 
    };
    return session;
  }

  async getSession(): Promise<Session | null> {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('smartauth-session-token')?.value;
    console.log("sessionToken", sessionToken)
    if (!sessionToken) return null;

    const decodedSession = await this.verifyJWT(sessionToken);
    console.log("decoded session", decodedSession)
    if (!decodedSession) return null;

    return decodedSession;
  }

  // OAuth2 URL generators
  getGoogleAuthURL(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.providers.google!.clientId,
      redirect_uri: `${process.env.SMARTAUTH_URL}${this.config.endpoints.callback}?provider=google`,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  getGitHubAuthURL(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.providers.github!.clientId,
      redirect_uri: `${process.env.SMARTAUTH_URL}${this.config.endpoints.callback}?provider=github`,
      scope: 'user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  // OAuth2 token exchange
  async exchangeGoogleCode(code: string): Promise<User | null> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.providers.google!.clientId,
          client_secret: this.config.providers.google!.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.SMARTAUTH_URL}${this.config.endpoints.callback}?provider=google`,
        }),
      });

      const tokens = await tokenResponse.json();
      if (!tokens.access_token) return null;

      // Get user info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const userData = await userResponse.json();
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        image: userData.picture,        
      };
    } catch {
      return null;
    }
  }

  async exchangeGitHubCode(code: string): Promise<User | null> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          client_id: this.config.providers.github!.clientId,
          client_secret: this.config.providers.github!.clientSecret,
          code,
        }),
      });

      const tokens = await tokenResponse.json();
      if (!tokens.access_token) return null;

      // Get user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const userData = await userResponse.json();

      // Get user email (GitHub might not return email in user endpoint)
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((email: any) => email.primary)?.email || userData.email;

      return {
        id: userData.id.toString(),
        email: primaryEmail,
        name: userData.name || userData.login,
        image: userData.avatar_url,
      };
    } catch {
      return null;
    }
  }

  // Sign In handler
  async handleSignIn(request: NextRequest): Promise<NextResponse> {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');

    if (!provider || provider === 'credentials') {
      // Handle credentials sign in
      if (request.method !== 'POST') {
        return NextResponse.redirect(new URL(this.config.redirects.signIn, request.url));
      }

      const formData = await request.formData();
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const csrfToken = formData.get('csrfToken') as string;
      const redirect = formData.get('redirect') as string;
      const redirectTo = formData.get('callbackUrl') as string;

      if (!this.validateCSRFToken(csrfToken)) {
        return NextResponse.redirect(new URL(`${this.config.redirects.error || this.config.redirects.signIn}?error=csrf`, request.url));
      }

      if (!this.config.adapter) {
        return NextResponse.redirect(new URL(`${this.config.redirects.error || this.config.redirects.signIn}?error=no-adapter`, request.url));
      }

      const user = await this.config.adapter.verifyUser(email, password);
      if (!user) {
        return NextResponse.redirect(new URL(`${this.config.redirects.error || this.config.redirects.signIn}?error=invalid-credentials`, request.url));
      }

      const session = await this.createSession(user);
      const sessionToken = await this.signJWT(session);

      let response = null;
      if (!redirect) {
        response = NextResponse.json({ session });
      } else {
        response = NextResponse.redirect(new URL(redirectTo || this.config.redirects.default, request.url));
      }
      
      response.cookies.set('smartauth-session-token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return response;
    } else {
      const callbackUrl = url.searchParams.get('callbackUrl') ?? this.config.redirects.default;
      // Handle OAuth sign in
      // const state = randomBytes(32).toString('hex');
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const state = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      

      let authUrl: string;
      if (provider === 'google' && this.config.providers.google) {
        authUrl = this.getGoogleAuthURL(state);
      } else if (provider === 'github' && this.config.providers.github) {
        authUrl = this.getGitHubAuthURL(state);
      } else {
        return NextResponse.redirect(new URL(`${this.config.redirects.error || this.config.redirects.signIn}?error=unsupported-provider`, request.url));
      }

      const response = NextResponse.redirect(authUrl);
      response.cookies.set('smartauth-state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
      });
      response.cookies.set('callbackUrl', callbackUrl, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
      });

      return response;
    }
  }

  // OAuth Callback handler
  async handleCallback(request: NextRequest): Promise<NextResponse> {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    const cookieStore = await cookies();
    const storedState = cookieStore.get('smartauth-state')?.value;
    const callbackUrl = cookieStore.get('callbackUrl')?.value;

    if (!state || state !== storedState) {
      return NextResponse.redirect(new URL(`${this.config.redirects.error || this.config.redirects.signIn}?error=state-mismatch`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL(`${this.config.redirects.error || this.config.redirects.signIn}?error=no-code`, request.url));
    }

    let user: User | null = null;
    if (provider === 'google') {
      user = await this.exchangeGoogleCode(code);
    } else if (provider === 'github') {
      user = await this.exchangeGitHubCode(code);
    }

    if (!user) {
      return NextResponse.redirect(new URL(`${this.config.redirects.error || this.config.redirects.signIn}?error=oauth-failed`, request.url));
    }

    // Create or update user in database if adapter is available
    if (this.config.adapter) {
      const existingUser = await this.config.adapter.getUserByEmail(user.email);
      if (!existingUser) {
        user = await this.config.adapter.createUser(user);
      } else {
        user = existingUser;
      }
    }

    const session = await this.createSession(user);
    const sessionToken = await this.signJWT(session);

    const response = NextResponse.redirect(new URL(callbackUrl || this.config.redirects.default, request.url));
    response.cookies.set('smartauth-session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Clear state cookie
    response.cookies.delete('smartauth-state');
    response.cookies.delete('callbackUrl');

    return response;
  }

  // Sign Out handler
  async handleSignOut(request: NextRequest): Promise<NextResponse> {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('smartauth-session-token');
    return response;
  }

  // Update Session handler
  async handleUpdateSession(request: NextRequest): Promise<NextResponse> {
    const session = await this.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const data = await request.json();
    
    if (this.config.adapter) {
      await this.config.adapter.updateSession(session.user.id, data);
    }

    // セッションデータを更新します。 'data' が Session 型のプロパティ（user, expires）を
    // 上書きする可能性があることに注意してください。意図した更新方法に合わせて調整が必要です。
    const updatedSessionData = { ...session, ...data } as Session; // 型アサーションを追加

    const sessionToken = await this.signJWT(updatedSessionData);
    const response = NextResponse.json({ session: updatedSessionData });
    response.cookies.set('smartauth-session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  }

  redirectToSignIn(redirectTo?:string) {
      nextNavigationRedirect(redirectTo || this.config.redirects.signIn);
  }

  redirectToDefault(redirectTo?:string) {
      nextNavigationRedirect(redirectTo || this.config.redirects.default);
  }
}

  // Sign In with credentials method for Server Actions
  export async function signInWithCredentials({email, password, redirect, redirectTo}:{email: string, password: string, redirect?: boolean, redirectTo?: string}): Promise<{ user?: User; error?: string }> {
    const smartAuth = getSmartAuth();
    const config = smartAuth.getConfig();
  
    if (!config.adapter) {
      throw new Error('Authentication adapter not configured.');
    }

    const user = await config.adapter.verifyUser(email, password);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const session = await smartAuth.createSession(user);
    const sessionToken = await smartAuth.signJWT(session);

    const cookieStore = await cookies();
    cookieStore.set("smartauth-session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    if(redirect) {
      smartAuth.redirectToDefault(redirectTo);
    }


    return { user };
  }


// Sign Out method for Server Actions
export async function signOut({redirect, redirectTo}:{redirect?: boolean, redirectTo?: string}): Promise<void> {
  const smartAuth = getSmartAuth();

  const cookieStore = await cookies();
  cookieStore.delete("smartauth-session-token");
  if(redirect) {
    smartAuth.redirectToSignIn(redirectTo);
  }
  return;
}


// Global instance
let smartAuthInstance: SmartAuth | null = null;

export function configure(config: SmartAuthConfig): SmartAuth {
  smartAuthInstance = new SmartAuth(config);
  return smartAuthInstance;
}

export function getSmartAuth(): SmartAuth {
  if (!smartAuthInstance) {
    if (!defaultConfig) {
      throw new Error(
        'SmartAuth: Default configuration is missing. Ensure smartauth.config.ts exists and exports a default configuration.'
      );
    }
    try {
      configure(defaultConfig);
    } catch (error) {
      throw new Error(
        `SmartAuth: Automatic configuration failed. Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (!smartAuthInstance) {
      // This state should ideally not be reached if configure() works as expected
      // and defaultConfig was valid.
      throw new Error(
        'SmartAuth: Configuration attempt was made, but instance is still null. This indicates an issue within the configure function or SmartAuth constructor.'
      );
    }
  }
  return smartAuthInstance;
}

// Auth helper for API routes
export async function auth(): Promise<AuthResponse> {
  const smartAuth = getSmartAuth();
  const session = await smartAuth.getSession();
  return { session, user: session?.user };
}

// Route handlers
// export async function GET(request: NextRequest) {
//   const smartAuth = getSmartAuth();
//   const url = new URL(request.url);
  
//   if (url.pathname.includes('/signIn')) {
//     return smartAuth.handleSignIn(request);
//   } else if (url.pathname.includes('/callback')) {
//     return smartAuth.handleCallback(request);
//   } else if (url.pathname.includes('/signOut')) {
//     return smartAuth.handleSignOut(request);
//   }
  
//   return NextResponse.json({ error: 'Not found' }, { status: 404 });
// }

// export async function POST(request: NextRequest) {
//   const smartAuth = getSmartAuth();
//   const url = new URL(request.url);
  
//   if (url.pathname.includes('/signIn')) {
//     return smartAuth.handleSignIn(request);
//   } else if (url.pathname.includes('/updateSession')) {
//     return smartAuth.handleUpdateSession(request);
//   }
  
//   return NextResponse.json({ error: 'Not found' }, { status: 404 });
// }