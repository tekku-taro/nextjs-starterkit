import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Footer from "@/components/footer"
import Header from "@/components/header"

export default async function Dashboard() {

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
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
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}