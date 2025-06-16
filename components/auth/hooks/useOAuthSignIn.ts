import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "@/lib/smart-auth/react";

export function useOAuthSignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    if (provider === "google") setIsGoogleLoading(true);
    if (provider === "github") setIsGithubLoading(true);
    
    try {
      await signIn(provider, { callbackUrl });
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
