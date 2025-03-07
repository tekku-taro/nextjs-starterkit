"use server"
import { hash } from "bcryptjs"
import { prisma } from "@/prisma"
import { v4 as uuidv4 } from "uuid"
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email"

// Register a new user
export async function registerUser({
  name,
  email,
  password,
}: {
  name: string
  email: string
  password: string
}) {
  const hashedPassword = await hash(password, 10)

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (existingUser) {
    throw new Error("User already exists")
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  })

  // Generate verification token
  const token = uuidv4()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  })

  // Send verification email
  await sendVerificationEmail({
    email,
    token,
    name: name || "",
  })

  return user
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

