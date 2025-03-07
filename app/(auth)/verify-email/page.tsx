import { VerifyEmailForm } from "@/components/auth/verify-email-form"

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] py-12">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
        <p className="text-sm text-muted-foreground">We&apos;ve sent you a verification code. Please enter it below.</p>
      </div>
      <VerifyEmailForm />
    </div>
  )
}

