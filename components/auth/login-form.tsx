"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { startTransition, useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { Label } from "../ui/label"
import { loginUser } from "@/app/actions/auth.actions"
import OauthButtons from "./oauth-buttons"
import { useOAuthSignIn } from "./hooks/useOAuthSignIn"


export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const { handleOAuthSignIn, isGoogleLoading, isGithubLoading } = useOAuthSignIn();

  const [state, action, pending] = useActionState(loginUser, undefined)
  
  useEffect(() => {
    // ログイン成功時の処理
    if (state?.status === "success") {
      toast.success("User logged in.", {
        // description: "User is logged in successfully.",
        // description: "Please verify your email address before signing in",
      })      
      router.push(state.callbackUrl || '/dashboard')
    }
    
    // エラー処理
    if (state?.status === "error" && state?.message) {
      toast.error("Authentication failed", {
        description: state.message
      })
    }  
  
  }, [state, router])
  
  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    startTransition(() => action(formData));
  }
  
  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* callbackUrlを隠しフィールドとして保持 */}
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
          <div className="space-y-2">
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              name='password'
              type='password'
              required
              autoComplete='password'
              aria-invalid={!!state?.errors?.password}
            />
            {state?.errors?.password && <p className="text-red-600">{state.errors.password}</p>}
          </div>
          <div>
            <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          </div>

          <div className='text-sm text-center text-muted-foreground'>
            Don&apos;t have an account?{' '}
            <Link href='/register' target='_self' className='link'>
              Sign Up
            </Link>
          </div>
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <OauthButtons
        handleOAuthSignIn={handleOAuthSignIn}
        isGoogleLoading={isGoogleLoading}
        isGithubLoading={isGithubLoading}
      />
    </div>
  )
}