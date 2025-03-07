import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, User } from "lucide-react"

export default async function Dashboard() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{session.user?.name || "User"}</div>
            <p className="text-xs text-muted-foreground">{session.user?.email}</p>
          </CardContent>
          <CardFooter>
            <form action="/api/auth/signout" method="post">
              <Button variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </form>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to your Dashboard</CardTitle>
            <CardDescription>This is a protected page only accessible to authenticated users.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You are now signed in. This starter kit includes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>NextAuth.js integration</li>
              <li>Email/password authentication</li>
              <li>OAuth providers (Google, GitHub)</li>
              <li>Password reset functionality</li>
              <li>Email verification</li>
              <li>Protected routes</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

