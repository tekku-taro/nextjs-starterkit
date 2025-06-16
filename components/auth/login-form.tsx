"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { FormEvent, startTransition, useActionState, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { Label } from "../ui/label"
import { loginUser } from "@/app/actions/auth.actions"
import OauthButtons from "./oauth-buttons"
import { useOAuthSignIn } from "./hooks/useOAuthSignIn"
import { signIn, useSession } from "@/lib/smart-auth/react"


export function LoginForm() {
  const router = useRouter()
  const session = useSession();
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const { handleOAuthSignIn, isGoogleLoading, isGithubLoading } = useOAuthSignIn();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [state, action, pending] = useActionState(loginUser, undefined)
  const [apiPending, setApiPending] = useState(false)
  
  useEffect(() => {
    const handleEffect = async () => {
      // ログイン成功時の処理
      if (state?.status === "success") {
        toast.success("User logged in.");

        state.status = "";
        // セッション情報を更新
        await session.reloadSession();
        // callbackUrlページにリダイレクト
        router.push(state.callbackUrl || '/dashboard');
      } else if (state?.status === "error" && state?.message) {
        // エラー処理
        toast.error("Authentication failed", {
          description: state.message,
        });
      }
    };

    handleEffect();
  }, [state, router, session])
  

  function handleSubmit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
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
              ref={emailRef}
              name='email'
              type='email'
              required
              autoComplete='email'
              placeholder="name@example.com" 
              aria-invalid={!!state?.errors?.email}
            />
            {state?.errors?.email && <p className="text-red-600 text-sm">{state.errors.email}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor='password'>Password</Label>
              <Link
                  href="/reset-password"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
              </Link>
            </div>
            <Input
              id='password'
              ref={passwordRef}
              name='password'
              type='password'
              required
              autoComplete='password'
              aria-invalid={!!state?.errors?.password}
            />
            {state?.errors?.password && <p className="text-red-600 text-sm">{state.errors.password}</p>}
          </div>
          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Sign In Via ServerAction
          </Button>
            <Button type="button" className="w-full" disabled={apiPending} onClick={async() => {
              setApiPending(true);
              const res = await signIn('credentials', {
                email: emailRef.current?.value || '',
                password: passwordRef.current?.value || '',
                // redirectTo: callbackUrl,
                redirect: false,
              })
              if(res?.ok) {
                toast.success("User logged in.");

                await session.reloadSession();
                // callbackUrlページにリダイレクト
                router.push(callbackUrl || '/dashboard');                
              } else if(res?.error) {
                toast.error("Authentication failed", {
                  description: res.error,
                });
              }

              setApiPending(false)
            }}>
            {apiPending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Sign In Via API
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