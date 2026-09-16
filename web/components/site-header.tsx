"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function SiteHeader() {
  const [loggedIn] = useState(() => Boolean(getToken()))

  function handleLogout() {
    localStorage.removeItem("token")
    window.location.href = "/"
  }

  return (
    <header className="border-b px-6 py-3">
      <div className="flex items-center justify-between">
        <h1 className="font-medium">PowerTools</h1>
        <nav className="flex items-center gap-4">
          <Link href="/products" className="text-sm hover:underline">
            Products
          </Link>
          {loggedIn ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Link href="/login">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
