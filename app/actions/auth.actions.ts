"use server"
import bcrypt, { hash } from "bcryptjs"
import { prisma } from "@/prisma"
import { v4 as uuidv4 } from "uuid"
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email"
import { z } from "zod"
import { signIn, signOut } from "@/auth"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { redirect } from "next/navigation"

// バリデーションスキーマ
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).trim(),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters').trim(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
export type FormState =
  {
      status?: string;  
      callbackUrl?: string;
      errors?: {
        name?: string[]
        email?: string[]
        password?: string[]
        confirmPassword?: string[]
      };
      message?: string;
    }
  | undefined

// Register a new user
export async function registerUser(prevState:FormState, formData:FormData) {
  // callbackUrlを取得（urlSearchParamsからは直接取得できないため）
  const callbackUrl = formData.get("callbackUrl") as string || "/dashboard"

  // バリデーション
  const validatedFields = registerSchema.safeParse(
    {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    }
  )

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      status: "error",
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation error. Try again."
    }
  }

  // 2. Prepare data for insertion into database
  const { name, email, password } = validatedFields.data
  // e.g. Hash the user's password before storing it
  const hashedPassword = await bcrypt.hash(password, 10)

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (existingUser) {
    return {
      status: "error",
      message: "User already exists"
    }    
    // throw new Error("User already exists")
  }

  try {
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    await signIn('credentials', {
      email: user.email,
      password: password,
    })

    return {
      status: "success", 
      message: 'User registered successfully',
      callbackUrl
    }    

  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { status: 'error', message: "can't register user. Try again." };    
  }



  // Generate verification token
  // const token = uuidv4()
  // const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // await prisma.verificationToken.create({
  //   data: {
  //     identifier: email,
  //     token,
  //     expires,
  //   },
  // })

  // Send verification email
  // await sendVerificationEmail({
  //   email,
  //   token,
  //   name: name || "",
  // })
}


export async function loginUser(prevState:FormState, formData:FormData) {
  // callbackUrlを取得（urlSearchParamsからは直接取得できないため）
  const callbackUrl = formData.get("callbackUrl") as string || "/dashboard"
  
  // バリデーション
  const validatedFields = loginSchema.safeParse(
    {
      email: formData.get('email'),
      password: formData.get('password'),
    }
  )  

  if (!validatedFields.success) {
    // バリデーションエラーを整形して返す
    return {
      status: "error",
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid email or password"
    }
  }
  
  // 2. Prepare data for insertion into database
  const { email, password } = validatedFields.data

  try {
    // 認証
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    
    // 成功
    return {
      status: "success",
      message: 'User logged in successfully',
      callbackUrl
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { status: 'error', message: 'Invalid email or password' };    
  } 
}

// Verify email
export async function verifyEmail({
  email,
  code,
}: {
  email: string
  code: string
}) {
  // Find verification token
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token: code,
    },
  })

  if (!verificationToken) {
    throw new Error("Invalid verification code")
  }

  if (new Date() > verificationToken.expires) {
    throw new Error("Verification code has expired")
  }

  // Update user
  await prisma.user.update({
    where: {
      email,
    },
    data: {
      emailVerified: new Date(),
    },
  })

  // Delete verification token
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: email,
        token: code,
      },
    },
  })

  return true
}

// Reset password
export async function resetPassword(email: string) {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  // Generate reset token
  const token = uuidv4()
  const expires = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

  // Delete any existing reset tokens for this user
  await prisma.resetPasswordToken.deleteMany({
    where: {
      email,
    },
  })

  // Create new reset token
  await prisma.resetPasswordToken.create({
    data: {
      email,
      token,
      expires,
    },
  })

  // Send password reset email
  await sendPasswordResetEmail({
    email,
    token,
    name: user.name || "",
  })

  return true
}

// Update password with reset token
export async function updatePasswordWithToken({
  email,
  token,
  password,
}: {
  email: string
  token: string
  password: string
}) {
  // Find reset token
  const resetToken = await prisma.resetPasswordToken.findFirst({
    where: {
      email,
      token,
    },
  })

  if (!resetToken) {
    throw new Error("Invalid reset token")
  }

  if (new Date() > resetToken.expires) {
    throw new Error("Reset token has expired")
  }

  // Hash new password
  const hashedPassword = await hash(password, 10)

  // Update user password
  await prisma.user.update({
    where: {
      email,
    },
    data: {
      password: hashedPassword,
    },
  })

  // Delete reset token
  await prisma.resetPasswordToken.delete({
    where: {
      id: resetToken.id,
    },
  })

  return true
}


// Sign user out
export async function signOutUser() { 
  await signOut();
  redirect('/login');
}