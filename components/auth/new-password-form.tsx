"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { updatePasswordWithToken } from "@/app/actions/auth.actions"
import { toast } from "sonner"
import { Label } from "../ui/label"



export function NewPasswordForm({ token }: { token: string }) {
  const router = useRouter()

  const [state, action, pending] = useActionState(updatePasswordWithToken, undefined)

  useEffect(() => {
    // 成功時の処理
    if (state?.status === "success") {        
      toast.success("Password updated", {
        description: state.message,
      })
      router.push('/login')
    }
    
    // エラー処理
    if (state?.status === "error") {
      toast.error("Something went wrong", {
        description: state.message || "Failed to update password. Please try again."
      })
    }   
  
  }, [state, router])


  return (
    <form action={action}>
      <input type='hidden' name='token' value={token} />
      <div className='space-y-6'>
        <div className="space-y-2">
          <Label htmlFor='password'>New Password</Label>
          <Input
            id='password'
            name='password'
            type='password'
            required
            autoComplete='password'
          />
          {state?.errors?.password && <p className="text-red-600">{state.errors.password}</p>}           
        </div>
        <div className="space-y-2">
          <Label htmlFor='confirmPassword'>Confirm New Password</Label>
          <Input
            id='confirmPassword'
            name='confirmPassword'
            type='password'
            required
            autoComplete='confirmPassword'
          />
          {state?.errors?.confirmPassword && (
              <div>
                <ul className="text-red-600">
                  {state.errors.confirmPassword.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}            
        </div>
        <div>
          <Button type="submit" className="w-full" disabled={pending} variant='default'>
            {pending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>                
        </div>

      </div>
    </form>
  )
}

