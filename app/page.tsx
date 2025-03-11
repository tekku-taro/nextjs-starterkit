import { auth } from "@/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants"
import Footer from "@/components/footer"
import Header from "@/components/header"

export default async function Home() {
  const session = await auth()

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  {APP_NAME}
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  {APP_DESCRIPTION}
                </p>
              </div>
              {session ? (
                <div className="space-x-4">
                  <Button asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-x-4">
                  <Button asChild>
                    <Link href="/register">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
