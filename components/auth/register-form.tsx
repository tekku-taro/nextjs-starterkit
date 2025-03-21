"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, startTransition, useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { registerUser } from "@/app/actions/auth.actions"

import { Label } from "../ui/label"
import Link from "next/link"
import OauthButtons from "./oauth-buttons"
import { useOAuthSignIn } from "./hooks/useOAuthSignIn"
import { useSession } from "next-auth/react"



export function RegisterForm() {
  const router = useRouter()
  const session = useSession();
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const { handleOAuthSignIn, isGoogleLoading, isGithubLoading } = useOAuthSignIn();

  const [state, action, pending] = useActionState(registerUser, undefined)
  

  
  useEffect(() => {

  // 登録成功時の処理
  if (state?.status === "success") {
    toast.success("User registered", {
      description: state.message
      // description: "User is registered successfully.",
      // description: "Please verify your email address before signing in",
    })
    const {data:user} = state;
    session.update({
      name: user?.name,
      email: user?.email,
      role: user?.role,
      image: user?.image,
      isOAuth: false
    });
    state.status = ''
    // callbackUrlページにリダイレクト
    router.push(state?.callbackUrl || '/dashboard')
  }
  
  // エラー処理
  if (state?.status === "error" && state?.message) {
    toast.error("Registration failed", {
      description: state.message
    })
  }    
  
  }, [state, router, session])


  
  function handleSubmit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    startTransition(() => action(formData));
  }

  return (
    <div className="grid gap-6">
      
      <form onSubmit={handleSubmit}>
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
        <div className='space-y-6'>
          <div className="space-y-2">
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              name='name'
              type='text'
              required
              autoComplete='name'
              placeholder="John Doe"
            />
            {state?.errors?.name && <p className="text-red-600 text-sm">{state.errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              required
              autoComplete='email'
              placeholder="name@example.com"
            />
            {state?.errors?.email && <p className="text-red-600 text-sm">{state.errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              name='password'
              type='password'
              required
              autoComplete='password'
            />
            {state?.errors?.password && <p className="text-red-600 text-sm">{state.errors.password}</p>}           
          </div>
          <div className="space-y-2">
            <Label htmlFor='confirmPassword'>ConfirmPassword</Label>
            <Input
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              required
              autoComplete='confirmPassword'
            />
            {state?.errors?.confirmPassword && (
                <div>
                  <ul className="text-red-600 text-sm">
                    {state.errors.confirmPassword.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}            
          </div>
          <div>
          <Button disabled={pending} className="w-full" variant='default'>
            {pending ? 'Signing Up...' : 'Sign Up'}
          </Button>            
          </div>

          <div className='text-sm text-center text-muted-foreground'>
            Already have an account?{' '}
            <Link href='/login' target='_self' className='link'>
              Sign In
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