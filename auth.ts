import GitHub from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import NextAuth, { NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/prisma"
import authConfig from "./auth.config"
import { compare } from "bcryptjs"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session:{strategy: 'jwt'},
  pages: {
    signIn: "/login",
    error: "/error",
  },  
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),    
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || "",
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isValidPassword = await compare(credentials.password as string, user.password)

        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id as unknown as string,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },   
}  satisfies NextAuthConfig)