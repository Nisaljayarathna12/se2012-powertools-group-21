"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, LayoutList, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ApiError,
  fetchCustomerOrders,
  type AdminOrder,
} from "@/lib/api"
import { clearToken, getToken, useIsLoggedIn } from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { statusVariant } from "@/lib/order-status"

export default function OrdersPage() {
  const router = useRouter()
  const loggedIn = useIsLoggedIn()
  const [orders, setOrders] = useState<AdminOrder[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notCustomer, setNotCustomer] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }

    let cancelled = false

    fetchCustomerOrders()
      .then((res) => {
        if (cancelled) return
        setOrders(res)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearToken()
          router.replace("/login")
          return
        }
        if (err instanceof ApiError && err.status === 403) {
          setNotCustomer(true)
          return
        }
        setError(err instanceof Error ? err.message : "Failed to load your orders")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [router])

  if (!loggedIn) {
    return null
  }

  if (notCustomer) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Order history unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only customer accounts have order history.
          </p>
        </div>
      </div>
    )
  }

  if (loading && !orders) {
    return (
      <div className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <LayoutList className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Order history</h1>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : orders && orders.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-xl font-semibold">No orders yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            When you place an order, it will show up here so you can track it.
          </p>
          <Button
            className="mt-4"
            nativeButton={false}
            render={<Link href="/products" />}
          >
            Browse products
          </Button>
        </div>
      ) : orders ? (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {orders.map((order) => (
                <li key={order.orderId}>
                  <Link
                    href={`/orders/${order.orderId}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">#{order.orderId}</p>
                        <Badge variant={statusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.orderDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-bold sm:text-base">
                        {formatPrice(order.totalAmount)}
                      </p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}