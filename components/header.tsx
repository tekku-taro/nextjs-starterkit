import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import { signOutUser } from "@/app/actions/auth.actions"
import Link from "next/link"
import { auth } from "@/auth"
import { BRAND_NAME } from "@/lib/constants"

const Header = async () => {  
  const session = await auth()

  return ( 
    <header className="border-b">
      <div className="container mx-auto py-4 flex items-center justify-between">
        <Link className="flex items-center justify-center" href="/">
          <span className="text-lg font-semibold">{BRAND_NAME}</span>
        </Link>        
        <div className="flex items-center gap-6">
          {session ? (
            <>
              <nav>
                <ul className="flex items-center gap-6">
                  <li><Link href="/dashboard" className="text-sm font-medium hover:text-primary">Dashboard</Link></li>
                  <li><Link href="/features" className="text-sm font-medium hover:text-primary">Features</Link></li>
                  <li><Link href="/settings" className="text-sm font-medium hover:text-primary">Settings</Link></li>
                </ul>
              </nav>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 cursor-pointer">
                      {session?.user?.image ? (
                        <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                      ) : (
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{session?.user?.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <form action={signOutUser} className="w-full">
                      <button className="w-full text-left flex items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>

  );
}
 
export default Header;