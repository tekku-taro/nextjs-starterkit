// src/types.ts

export interface CreateUserInput {
  email: string;
  name?: string;
  image?: string;
  password?: string;
  role?: string;
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
  [key: string]: unknown;
}

export interface AuthAdapter {
  getUserByEmail(email: string): Promise<User | null>;
  createUser(data: CreateUserInput): Promise<User>;
  verifyUser(email: string|null, password: string|null, emailVerificationRequired?:boolean): Promise<User | null>;
  updateSession(userId: string, data: {user: Partial<User>} & Record<string, unknown>): Promise<void>;
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, data: Partial<CreateUserInput>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  linkAccount(userId: string, account: { provider: string; providerAccountId: string; type: 'oauth'; access_token?: string; refresh_token?: string; expires_at?: number; }): Promise<void>;
  getAccountByProviderAccountId(provider: string, providerAccountId: string): Promise<{ userId: string } | null>;
}

export interface SmartAuthConfig {
  providers: {
    credentials?: { emailField: string; passwordField: string; table: string; };
    google?: { clientId: string; clientSecret: string; };
    github?: { clientId: string; clientSecret: string; };
  };
  redirects: { default: string; signIn: string; error?: string; };
  endpoints: { signIn: string; signOut: string; callback: string; csrf: string; updateSession: string; session: string; };
  secret?: string;
  adapter?: AuthAdapter;
  sessionExpires: number;
}
