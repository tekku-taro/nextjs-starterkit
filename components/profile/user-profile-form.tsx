"use client"

import { Account, User } from "@prisma/client"
import { FormEvent, startTransition, useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { updateProfile } from "@/app/actions/profile.actions"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface UserProfileFormProps {
  user: User & { accounts: Account[] }
  isOAuth: boolean
}

export function UserProfileForm({ user, isOAuth }: UserProfileFormProps) {  
  const router = useRouter();
  const session = useSession();
  const [state, action, pending] = useActionState(updateProfile, undefined)

  useEffect(() => {
      // 登録成功時の処理
      if (state?.status === "success") {
        toast.success("Profile updated", {
          description: state.message
        });
        if(state?.data?.name || state?.data?.image) {
          session.update({
            name: state?.data?.name,
            image: state?.data?.image,
            isOAuth: isOAuth
          });
          state.status = ''
          router.push(`/profile`);
        }
      } 
      // エラー処理
      if (state?.status === "error" && state?.message) {
        toast.error("Faild updating profile", {
          description: state.message
        })
      }  
    }, [state, session, router, isOAuth])

  function handleSubmit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);

    startTransition(() => {
      action(formData)
      console.log(state?.status)     
    });
   
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Hidden user ID field */}
      <input type="hidden" name="id" value={user.id} />
      
      {/* Display-only fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            name="email"
            defaultValue={user.email || ""}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Your email cannot be changed
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            type="text"
            name="role"
            defaultValue={user.role || "USER"}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Your role is assigned by administrators
          </p>
        </div>
      </div>
      
      <Separator />
      
      {/* Editable fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            name="name"
            defaultValue={user.name || ""}
            placeholder="Your display name"
          />
          {state?.errors?.name && <p className="text-red-600 text-sm">{state.errors.name}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="username">
            Username
          </Label>
          <Input
            id="username"
            type="text"
            name="username"
            defaultValue={user.username || ""}
            placeholder="Your unique username"
          />
          {state?.errors?.username && <p className="text-red-600 text-sm">{state.errors.username}</p>}
          <p className="text-xs text-muted-foreground">
            This username will be displayed publicly and must be unique
          </p>
        </div>
        
        {/* Show image upload only for email/password users or if no OAuth provider */}
        {!isOAuth && (
          <div className="space-y-2">
            <Label htmlFor="image">
              Profile Image URL
            </Label>
            <Input
              id="image"
              type="text"
              name="image"
              defaultValue={user.image || ""}
              placeholder="https://example.com/your-image.jpg"
            />
            {state?.errors?.image && <p className="text-red-600 text-sm">{state.errors.image}</p>}
            <p className="text-xs text-muted-foreground">
              Enter a URL to your profile image
            </p>
          </div>
        )}
        
        {/* Show password change only for email/password users */}
        {!isOAuth && (
          <div className="space-y-2">
            <Label htmlFor="password">
              New Password
            </Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Leave blank to keep current password"
            />
            {state?.errors?.password && <p className="text-red-600 text-sm">{state.errors.password}</p>}
            <p className="text-xs text-muted-foreground">
              Set a new password or leave blank to keep your current one
            </p>
          </div>
        )}
      </div>
      
      <Button 
        type="submit" 
        disabled={pending}
        variant='default'
        className="w-full cursor-pointer"
      >
        {pending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}