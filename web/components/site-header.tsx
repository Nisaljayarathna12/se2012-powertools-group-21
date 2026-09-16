"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { clearToken, useIsLoggedIn } from "@/lib/auth"

export function SiteHeader() {
  const router = useRouter()
  const loggedIn = useIsLoggedIn()

  function handleLogout() {
    clearToken()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold">
          PowerTools
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/products"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Products
          </Link>

          {loggedIn ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Profile
              </Link>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleLogout}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
                Register
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}