"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ApiError,
  fetchCustomerOrders,
  fetchProfile,
  updateProfile,
  type AdminOrder,
  type User,
} from "@/lib/api"
import { clearToken, getToken } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import { statusVariant } from "@/lib/order-status"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"

interface FormErrors {
  name?: string
  email?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }

    let cancelled = false

    fetchProfile()
      .then((profile) => {
        if (cancelled) return
        setUser(profile)
        setName(profile.name)
        setEmail(profile.email)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearToken()
          router.replace("/login")
          return
        }
        setLoadError(
          err instanceof Error ? err.message : "Failed to load profile"
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (!user || user.role !== "CUSTOMER") return

    let cancelled = false

    fetchCustomerOrders()
      .then((res) => {
        if (cancelled) return
        setOrders(res)
        setOrdersError(null)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearToken()
          router.replace("/login")
          return
        }
        if (err instanceof ApiError && err.status === 403) {
          setOrdersError("Only customers have order history.")
          return
        }
        setOrdersError(
          err instanceof Error ? err.message : "Failed to load your orders"
        )
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, router])

  function validate(): FormErrors {
    const next: FormErrors = {}

    if (!name.trim()) {
      next.name = "Name is required"
    } else if (name.trim().length < 2) {
      next.name = "Name must be at least 2 characters"
    }

    if (!email.trim()) {
      next.email = "Email is required"
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Enter a valid email address"
    }

    return next
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const next = validate()
    setErrors(next)
    setFormError(null)
    setSaved(false)

    if (Object.keys(next).length > 0) {
      return
    }

    setSaving(true)
    try {
      const updated = await updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
      })
      setUser(updated)
      setName(updated.name)
      setEmail(updated.email)
      setSaved(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
        return
      }
      setFormError(
        err instanceof Error ? err.message : "Failed to update profile"
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-2">
          <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {loadError}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Profile</CardTitle>
            {user ? <Badge variant="outline">{user.role}</Badge> : null}
          </div>
          <CardDescription>View and update your account details.</CardDescription>
        </CardHeader>

        <CardContent>
          {saved ? (
            <div
              role="status"
              className="mb-5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
            >
              Profile updated successfully.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {formError ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSaved(false)
                }}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                autoComplete="name"
                className={cn(inputClass, errors.name && "border-destructive")}
              />
              {errors.name ? (
                <p id="name-error" className="text-sm text-destructive">
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setSaved(false)
                }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                autoComplete="email"
                className={cn(inputClass, errors.email && "border-destructive")}
              />
              {errors.email ? (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {user?.role === "CUSTOMER" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Order history</CardTitle>
            <CardDescription>
              Track the progress of your orders.
            </CardDescription>
            <Link href="/orders" className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
              View all orders
            </Link>
          </CardHeader>
          <CardContent>
            {ordersLoading && orders.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded bg-muted"
                  />
                ))}
              </div>
            ) : ordersError ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {ordersError}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You haven&apos;t placed any orders yet.
              </p>
            ) : (
              <ul className="space-y-4">
                {orders.map((order) => (
                  <li
                    key={order.orderId}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">#{order.orderId}</p>
                      <Badge variant={statusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-muted-foreground">
                      <span>{order.orderDate}</span>
                      <span className="font-semibold text-foreground">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
      </div>
    </div>
  )
}