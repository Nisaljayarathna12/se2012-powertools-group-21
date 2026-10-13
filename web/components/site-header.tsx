"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  User,
  Wrench,
  X,
} from "lucide-react"
import { useCart } from "@/components/showcase/cart-provider"
import { refreshCartCount, useCartCount } from "@/lib/cart"
import { clearToken, useIsLoggedIn, useRole } from "@/lib/auth"

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Tool Catalog", href: "/catalog" },
  { label: "Special Deals", href: "/catalog?deals=true" },
  { label: "Brand Warranty", href: "/warranty" },
  { label: "Contact", href: "/contact" },
]

const SEARCH_CATEGORIES = [  { label: "All Categories", value: "all" },
  { label: "Drills", value: "a1b2c3d4-e5f6-7890-abcd-ef1234567801" },
  { label: "Grinders", value: "a1b2c3d4-e5f6-7890-abcd-ef1234567802" },
  { label: "Saws", value: "a1b2c3d4-e5f6-7890-abcd-ef1234567803" },
  { label: "Impact Wrenches", value: "a1b2c3d4-e5f6-7890-abcd-ef1234567804" },
  { label: "Sanders", value: "a1b2c3d4-e5f6-7890-abcd-ef1234567805" },
  { label: "Jigsaws", value: "a1b2c3d4-e5f6-7890-abcd-ef1234567806" },
  { label: "Rotary Hammers", value: "a1b2c3d4-e5f6-7890-abcd-ef1234567807" },
]

/** Square icon button used for every right-hand header action. `relative`
 *  anchors the cart count badge. */
const iconButtonClass =
  "relative flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-industrial-700"

function HeaderInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const loggedIn = useIsLoggedIn()
  const role = useRole()
  const cartCount = useCartCount()
  const { openCart } = useCart()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (loggedIn && role === "CUSTOMER") {
      refreshCartCount()
    }
  }, [loggedIn, role])

  function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set("q", searchQuery.trim())
    if (selectedCategory !== "all") params.set("category", selectedCategory)
    const query = params.toString()
    router.push(query ? `/catalog?${query}` : "/catalog")
    setMobileMenuOpen(false)
  }

  function handleLogout() {
    clearToken()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-industrial-700 bg-industrial-800 shadow-lg">
      <div className="border-b border-industrial-700/50 bg-industrial-900 text-xs text-industrial-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <span className="hidden sm:block">
            Islandwide delivery in Sri Lanka | Genuine brands with warranty
          </span>
          <span className="font-medium text-safety-400">+94 76 677 3047 / +94 35 225 9285</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-safety-500">
            <Wrench size={22} className="text-industrial-900" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display text-lg font-bold leading-none text-white">
              JAYARATHNA
            </div>
            <div className="text-xs font-medium text-safety-400">
              Hardware &amp; Tools
            </div>
          </div>
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 items-center md:flex">
          <div className="flex w-full overflow-hidden rounded-lg border border-industrial-600 bg-white">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Search category"
                className="h-10 cursor-pointer appearance-none border-r border-industrial-200 bg-industrial-50 px-3 pr-8 text-sm font-medium text-industrial-700 focus:outline-none"
              >
                {SEARCH_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-industrial-400"
              />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search power tools, brands, models..."
              className="h-10 flex-1 px-3 text-sm text-industrial-800 placeholder:text-industrial-400 focus:outline-none"
            />
            <button
              type="submit"
              className="flex h-10 items-center justify-center bg-safety-500 px-4 text-industrial-900 transition-colors hover:bg-safety-400"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {loggedIn && role === "CUSTOMER" ? (
            <button
              type="button"
              onClick={openCart}
              className={iconButtonClass}
              aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            >
              <ShoppingCart size={22} />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-safety-500 px-1 text-xs font-bold text-industrial-900">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </button>
          ) : null}

          {loggedIn ? (
            <>
              {role === "CUSTOMER" ? (
                <Link
                  href="/orders"
                  className={`${iconButtonClass} hidden md:flex`}
                  aria-label="My orders"
                >
                  <Package size={20} />
                </Link>
              ) : null}
              {role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className={iconButtonClass}
                  aria-label="Admin dashboard"
                >
                  <LayoutDashboard size={20} />
                </Link>
              ) : null}
              <Link
                href={role === "ADMIN" ? "/admin" : "/profile"}
                className={iconButtonClass}
                aria-label={role === "ADMIN" ? "Admin account" : "My account"}
              >
                <User size={20} />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={iconButtonClass}
                aria-label="Sign out"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-industrial-700"
              >
                Sign in
              </Link>
              <Link href="/register" className="btn-primary !px-4 !py-2">
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-industrial-700 md:hidden"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="flex w-full overflow-hidden rounded-lg border border-industrial-600 bg-white">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search power tools..."
              className="h-10 flex-1 px-3 text-sm text-industrial-800 focus:outline-none"
            />
            <button
              type="submit"
              className="flex h-10 items-center bg-safety-500 px-4 text-industrial-900"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </div>
        </form>
      </div>

      <nav className="border-t border-industrial-700/50 bg-industrial-800">
        <div className="mx-auto hidden max-w-7xl items-center gap-1 px-4 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-industrial-200 transition-colors hover:border-safety-500 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div className="border-t border-industrial-700 bg-industrial-800 md:hidden">
          <div className="flex flex-col py-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-industrial-200 hover:bg-industrial-700 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  )
}

export function SiteHeader() {
  return (
    <Suspense fallback={<div className="h-[1px]" />}>
      <HeaderInner />
    </Suspense>
  )
}
