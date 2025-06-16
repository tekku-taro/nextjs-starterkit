// src/adapters/prisma.ts
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { User, AuthAdapter, CreateUserInput } from '@/types/smart-auth.types';

export interface PrismaAdapterOptions {
  userTable?: string;
}


export class PrismaAdapter implements AuthAdapter {
  private prisma: PrismaClient;
  private userTable: string;

  constructor(prisma: PrismaClient, options: PrismaAdapterOptions = {}) {
    this.prisma = prisma;
    this.userTable = options.userTable || 'user';
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = await (this.prisma as any)[this.userTable].findUnique({
        where: { email },
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async createUser(data: CreateUserInput): Promise<User> {
    try {
      const userData: Prisma.UserCreateInput = {
        email: data.email,
        name: data.name,
        image: data.image,
      };

      // Hash password if provided
      if (data.password) {
        userData.password = await bcrypt.hash(data.password, 12);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = await (this.prisma as any)[this.userTable].create({
        data: userData,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async verifyUser(email: string|null, password: string|null, emailVerificationRequired:boolean = false): Promise<User | null> {
    try {
      if(email == null || password == null) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = await (this.prisma as any)[this.userTable].findUnique({
        where: { email },
      });

      if (!user || !user.password) return null;

      // Check if email verification is required and if email is verified
      if (emailVerificationRequired && !user.emailVerified) {
        throw new Error('Email not verified');
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    } catch (error) {
      console.error('Error verifying user:', error);
      if(error instanceof Error) {
        throw error;
      }
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateSession(userId: string, data: {user: Partial<User>} & Record<string, unknown>): Promise<void> {
    try {
      // await (this.prisma as any)[this.userTable].update({
      //   where: { id: userId },
      //   data: data,
      // });
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = await (this.prisma as any)[this.userTable].findUnique({
        where: { id },
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async updateUser(id: string, data: Partial<CreateUserInput>): Promise<User | null> {
    try {
      const updateData: Prisma.UserUpdateInput = {};
      
      if (data.email) updateData.email = data.email;
      if (data.name) updateData.name = data.name;
      if (data.image) updateData.image = data.image;
      if (data.role !== undefined) updateData.role = data.role as Prisma.UserUpdateInput['role'];
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 12);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = await (this.prisma as any)[this.userTable].update({
        where: { id },
        data: updateData,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.prisma as any)[this.userTable].delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Account linking methods for OAuth
  async linkAccount(userId: string, account: {
    provider: string;
    providerAccountId: string;
    type: 'oauth';
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  }): Promise<void> {
    try {
      // Assuming you have an Account model
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.prisma as any).account.create({
        data: {
          userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
        },
      });
    } catch (error) {
      console.error('Error linking account:', error);
    }
  }

  async getAccountByProviderAccountId(
    provider: string,
    providerAccountId: string
  ): Promise<{ userId: string } | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const account = await (this.prisma as any).account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      });

      return account ? { userId: account.userId } : null;
    } catch (error) {
      console.error('Error getting account:', error);
      return null;
    }
  }
}