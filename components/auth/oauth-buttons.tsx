'use client'

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"

export function  OauthButtons({handleOAuthSignIn, isGoogleLoading,  isGithubLoading}:{
  handleOAuthSignIn:(provider: "google" | "github") => Promise<void>;
  isGoogleLoading:boolean;
  isGithubLoading:boolean;
}) {
  const searchParams = useSearchParams()
  
  const urlError = 
    searchParams.get('error') === 'OAuthAccountNotLinked' 
      ? 'このメールアドレスは既に別のプロバイダーで登録されています。' 
      : '';

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => handleOAuthSignIn("google")} disabled={isGoogleLoading}>
          {isGoogleLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>
        <Button variant="outline" onClick={() => handleOAuthSignIn("github")} disabled={isGithubLoading}>
          {isGithubLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.gitHub className="mr-2 h-4 w-4" />
          )}
          GitHub
        </Button>
      </div>
      {urlError && <p className="text-red-600">{urlError}</p>}
    </>     
  )
}
 
export default OauthButtons;