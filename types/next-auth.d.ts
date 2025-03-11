import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  }

  interface Session {
    user?: User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
    picture?: string | null
  }
}

