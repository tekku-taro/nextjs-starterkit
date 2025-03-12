import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Footer from "@/components/footer"
import Header from "@/components/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { redirect } from "next/navigation"
import { getLoggedInUser } from "@/app/actions/profile.actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ProfilePage() {

  const user = await getLoggedInUser();

  if (!user) {
    redirect("/login")
  }

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
            <CardTitle>
              <span>Profile Information</span>
              <Link href='/profile/edit'>
                <Button variant='outline' className="ml-3 px-6 cursor-pointer">Edit</Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Here&apos;s your account settings and profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Email</TableCell>
                  <TableCell>{user.email}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Role</TableCell>
                  <TableCell>{user.role || "USER"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Name</TableCell>
                  <TableCell>{user.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Username</TableCell>
                  <TableCell>{user.username}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Password</TableCell>
                  <TableCell>*****</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}