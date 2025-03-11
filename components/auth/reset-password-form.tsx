"use client"

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { resetPassword } from "@/app/actions/auth.actions"
import { toast } from "sonner"
import { Label } from "../ui/label"


export function ResetPasswordForm() {

  const [state, action, pending] = useActionState(resetPassword, undefined)


  useEffect(() => {
    // 成功時の処理
    if (state?.status === "success") {        
      toast.success("Password reset email sent", {
        description: state.message,
      })
    }
    
    // エラー処理
    if (state?.status === "error" && state?.message) {
      toast.error("Something went wrong", {
        description: state.message
      })
    }   
  
  }, [state])

  return (
    <form action={action} className="space-y-4">
      <div className='space-y-6'>
        <div className="space-y-2">
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            name='email'
            type='email'
            required
            autoComplete='email'
            placeholder="name@example.com" 
            aria-invalid={!!state?.errors?.email}
          />
          {state?.errors?.email && <p className="text-red-600">{state.errors.email}</p>}
        </div>
        <div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </div>
      </div>
    </form>
  )
}

