import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Footer from "@/components/footer"
import Header from "@/components/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserProfileForm } from "@/components/profile/user-profile-form"
import { redirect } from "next/navigation"
import { getLoggedInUser } from "@/app/actions/profile.actions"

export default async function EditProfilePage() {

  const user = await getLoggedInUser();

  if (!user) {
    redirect("/login")
  }

  const isOAuth = user.accounts.some(account => 
    account.provider === "google" || account.provider === "github"
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          {/* Avatar section for OAuth users */}
          {user.image && (
            <div className="flex justify-center mb-8">
              <Avatar className="h-16 w-16 mr-3">
                <AvatarImage src={user.image} alt={user.name || "User"} />
                <AvatarFallback>{user.name?.substring(0, 2) || "U"}</AvatarFallback>
              </Avatar>
            </div>
          )}
          <span>Your Profile</span> 
        </h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your account settings and profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserProfileForm 
              user={user} 
              isOAuth={isOAuth} 
            />
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}