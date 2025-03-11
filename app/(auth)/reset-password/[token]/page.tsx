import { NewPasswordForm } from "@/components/auth/new-password-form";


export default async function NewPasswordPage(props: {
  params: Promise<{
    token: string
  }>  
}) {
  const { token }  = await props.params;

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] py-12">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Enter new password</h1>
        <p className="text-sm text-muted-foreground">Please enter your new password below</p>
      </div>
      <NewPasswordForm token={token} />
    </div>
  )
}