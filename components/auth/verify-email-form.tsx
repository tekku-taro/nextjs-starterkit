"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { verifyEmail } from "@/app/actions/auth.actions"
import { toast } from "sonner"

const verifyEmailSchema = z.object({
  code: z.string().length(6, { message: "Verification code must be 6 characters" }),
})

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>

export function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: "",
    },
  })

  async function onSubmit(data: VerifyEmailFormValues) {
    if (!email) {
      toast("Something went wrong", {
        description: "No email found. Please try the verification process again.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      })
      return
    }

    setIsLoading(true)

    try {
      await verifyEmail({
        email,
        code: data.code,
      })

      toast("Email verified", {
        description: "Your email has been verified. You can now sign in.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      })

      router.push("/login")
    } catch (error) {
      toast("Something went wrong", {
        description: "Failed to verify email. Please try again.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <Input placeholder="123456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Verify Email
        </Button>
      </form>
    </Form>
  )
}

