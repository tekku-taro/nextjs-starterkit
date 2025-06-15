// src/adapters/prisma.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthAdapter, User } from '../index';

export interface PrismaAdapterOptions {
  userTable?: string;
}

export interface CreateUserInput {
  email: string;
  name?: string;
  image?: string;
  password?: string;
  role?: string;
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
      const userData: any = {
        email: data.email,
        name: data.name,
        image: data.image,
      };

      // Hash password if provided
      if (data.password) {
        userData.password = await bcrypt.hash(data.password, 12);
      }

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

  async verifyUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await (this.prisma as any)[this.userTable].findUnique({
        where: { email },
      });

      if (!user || !user.password) return null;

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
      return null;
    }
  }

  async updateSession(userId: string, data: any): Promise<void> {
    try {
      await (this.prisma as any)[this.userTable].update({
        where: { id: userId },
        data: data,
      });
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
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
      const updateData: any = {};
      
      if (data.email) updateData.email = data.email;
      if (data.name) updateData.name = data.name;
      if (data.image) updateData.image = data.image;
      if (data.role) updateData.role = data.role;
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 12);
      }

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