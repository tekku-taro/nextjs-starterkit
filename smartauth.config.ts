// smartauth.config.ts
import { SmartAuthConfig } from './lib/smart-auth';
import { PrismaAdapter } from './lib/smart-auth/adapters/prisma';
import { prisma } from './prisma';


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
    signIn: '/api/auth/signin',
    signOut: '/api/auth/signout',
    callback: '/api/auth/callback',
    csrf: '/api/auth/csrf',
    updateSession: '/api/auth/updateSession',
  },
  secret: process.env.AUTH_SECRET,
  adapter: new PrismaAdapter(prisma),
};

export default config;