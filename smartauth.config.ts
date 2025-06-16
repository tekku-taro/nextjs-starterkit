// smartauth.config.ts
import { PrismaAdapter } from './lib/smart-auth/adapters/prisma';
import { prisma } from './prisma';
import { SmartAuthConfig } from './types/smart-auth.types';


const config: SmartAuthConfig = {
  providers: {
    credentials: {
      emailField: 'email',
      passwordField: 'password',
      table: 'users',
    },
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    },
    github: {
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    },
  },
  redirects: {
    default: '/dashboard',
    signIn: '/login',
    // error: '/auth/error',
  },
  endpoints: {
    signIn: '/api/auth/signIn',
    signOut: '/api/auth/signOut',
    callback: '/api/auth/callback',
    csrf: '/api/auth/csrf',
    updateSession: '/api/auth/updateSession',
    session: '/api/auth/session',
  },
  secret: process.env.AUTH_SECRET,
  adapter: new PrismaAdapter(prisma),
  sessionExpires: 30 * 24 * 60 * 60, // 30 days
};

export default config;