import { RegisterForm } from "@/components/auth/register-form"

export default async function RegisterPage() {

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] py-12">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">Enter your email below to create your account</p>
      </div>
      <RegisterForm />
    </div>
  )
}

