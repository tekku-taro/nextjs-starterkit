import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export function useOAuthSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    if (provider === "google") setIsGoogleLoading(true);
    if (provider === "github") setIsGithubLoading(true);
    
    try {
      await signIn(provider, { callbackUrl });
      router.push(callbackUrl);
    } catch (error) {
      void error;
      toast.error("Something went wrong", {
        description: "Your sign in request failed. Please try again.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    } finally {
      if (provider === "google") setIsGoogleLoading(false);
      if (provider === "github") setIsGithubLoading(false);
    }
  };

  return { handleOAuthSignIn, isGoogleLoading, isGithubLoading };
}
