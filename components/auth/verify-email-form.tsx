"use client"

import { useActionState, useEffect} from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { verifyEmail } from "@/app/actions/auth.actions"
import { toast } from "sonner"
import { Label } from "../ui/label"


export function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  const [state, action, pending] = useActionState(verifyEmail, undefined)  

  useEffect(() => {
    if (!email) {
      toast.error("Something went wrong", {
        description: "No email found. Please try the verification process again."
      })
      return
    }    
    // 成功時の処理
    if (state?.status === "success") {        
      toast.success("Email verified", {
        description: state.message,
      })
      router.push('/login')
    }
    
    // エラー処理
    if (state?.status === "error") {
      toast.error("Something went wrong", {
        description: state.message || "Failed to verify email. Please try again."
      })
    }   
  
  }, [state, email, router])

  return (
    <form action={action} className="space-y-4">
      <input type='hidden' name='email' value={email || ''} />
      <div className='space-y-6'>
        <div className="space-y-2">
          <Label htmlFor='email'>Verification Code</Label>
          <Input
            id='code'
            name='code'
            type='text'
            required
            placeholder="123456"
            aria-invalid={!!state?.errors?.code}
          />
          {state?.errors?.code && <p className="text-red-600 text-sm">{state.errors.code}</p>}
        </div>
        <div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Verify Email
          </Button>        
        </div>
      </div>
    </form>
  )
}

