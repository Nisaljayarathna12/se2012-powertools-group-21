"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearToken, useIsLoggedIn, useRole } from "@/lib/auth"
import { refreshCartCount, setCartCount, useCartCount } from "@/lib/cart"

export function SiteHeader() {
  const router = useRouter()
  const loggedIn = useIsLoggedIn()
  const role = useRole()
  const cartCount = useCartCount()

  useEffect(() => {
    if (loggedIn && role === "CUSTOMER") {
      refreshCartCount()
    } else {
      setCartCount(0)
    }
  }, [loggedIn, role])

  function handleLogout() {
    setCartCount(0)
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

          {role === "CUSTOMER" ? (
            <Link
              href="/orders"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Orders
            </Link>
          ) : null}

          {role === "ADMIN" ? (
            <Link
              href="/admin"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Admin
            </Link>
          ) : null}

          {loggedIn && role === "CUSTOMER" ? (
            <Link
              href="/cart"
              className="relative inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
          ) : null}

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