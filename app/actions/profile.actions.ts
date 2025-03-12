"use server"

import { z } from "zod"
import { prisma } from "@/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

// Define the validation schema
const profileSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters")
    .optional()
    .nullable(),
  image: z.string().url("Please enter a valid URL").optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().nullable(),
})

type UserUpdateData = {
  name: string
  username?: string|null
  image?: string|null
  password?: string|null
}
export type FormState =
  {
      status?: string;
      data?:{
        name?: string;
        username?: string | null | undefined;
        password?: string | null | undefined
        image?: string | null | undefined;
      };
      errors?: {
        name?: string[];
        username?: string[];
        password?: string[];
        image?: string[];
      };
      message?: string;
    }
  | undefined

export async function updateProfile(prevState: FormState, formData: FormData) {
  try {
    // Get current session
    const session = await auth()
    if (!session?.user) {
      return {
        status: 'error',
        message: "You must be logged in to update your profile",
      }
    }

    const validatedFields = profileSchema.safeParse({
      id: formData.get('id'),
      name: formData.get('name'),
      username: formData.get('username') || null,
      image: formData.get('image') || null,
      password: formData.get('password') || null,
    })

    if (!validatedFields.success) {
      // Return validation errors
      return {
        status: 'error',
        message: "Validation error. Try again.",
        errors: validatedFields.error.flatten().fieldErrors
      }
    }  

    const validatedData = validatedFields.data

    // Check if the user ID matches the session user
    if (validatedData.id !== parseInt(session.user.id || '')) {
      return {
        status: 'error',
        message: "You can only update your own profile",
      }
    }

    // Check if username is already taken by another user
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: {
            not: validatedData.id
          }
        }
      })

      if (existingUser) {
        return {
          status: 'error',
          message: "Username is already taken",
          errors: {
            username: ["This username is already taken"]
          }
        }
      }
    }

    const user = await getLoggedInUser();
  
    const isOAuth = !!user?.accounts.some(account => 
      account.provider === "google" || account.provider === "github"
    )

    // Prepare data for update
    const updateData:UserUpdateData = {
      name: validatedData.name,
      username: validatedData.username,
    }

    
    // Hash password if provided
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10)
    }
    if (!isOAuth) {
      updateData.image = validatedData.image
    }

    // Update the user profile
    await prisma.user.update({
      where: {
        id: validatedData.id
      },
      data: updateData
    })

    revalidatePath('/')

    return {
      status: 'success',
      message: "Profile updated successfully",
      data: validatedData
    }
  } catch (error) {
    console.error("Profile update error:", error)
    return {
      status: 'error',
      message: "An error occurred while updating your profile",
    }
  }
}

export async function getLoggedInUser() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return await prisma.user.findUnique({
    where: {
      id: parseInt(session?.user?.id)
    },
    include: {
      accounts: true
    }
  })
}