"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, PackageSearch } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ApiError, fetchOrder, type OrderDetail, type OrderItemDto } from "@/lib/api"
import { clearToken, getToken } from "@/lib/auth"
import { formatPrice } from "@/lib/format"

export function OrderConfirmation({ orderId }: { orderId: string | null }) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      router.replace("/products")
      return
    }

    if (!getToken()) {
      router.replace("/login")
      return
    }

    let cancelled = false

    fetchOrder(Number(orderId))
      .then((res) => {
        if (cancelled) return
        setOrder(res)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearToken()
          router.replace("/login")
          return
        }
        setError(
          err instanceof ApiError && err.status === 404
            ? "Order not found"
            : "Failed to load order"
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [orderId, router])

  if (!orderId) {
    return null
  }

  if (loading && !order) {
    return (
      <div className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-3xl px-4 py-8 sm:px-6">
        <div className="mx-auto h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="mx-auto mt-4 h-4 w-72 animate-pulse rounded bg-muted" />
        <div className="mt-8 h-72 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-3xl px-4 py-8 text-center">
        <PackageSearch className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 text-xl font-semibold">We couldn&apos;t load your order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {error ?? "Something went wrong."}
        </p>
        <Button
          className="mt-4"
          nativeButton={false}
          render={<Link href="/products" />}
        >
          Continue shopping
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-3xl px-4 py-8 sm:px-6">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Order placed!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you{order.customerName ? `, ${order.customerName}` : ""}. Your
          order #{order.orderId} has been placed and is now{" "}
          <span className="font-medium text-foreground">Pending</span>.
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-lg font-bold">Order #{order.orderId}</p>
              <p className="text-sm text-muted-foreground">
                Placed on {order.orderDate}
              </p>
            </div>
            <Badge variant="secondary">Pending</Badge>
          </div>

          <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Shipping address</dt>
              <dd className="mt-1 whitespace-pre-line">{order.shippingAddress}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment method</dt>
              <dd className="mt-1">
                Cash on Delivery{" "}
                <span className="text-muted-foreground">
                  (will be collected on delivery)
                </span>
              </dd>
            </div>
          </dl>

          <ul className="mt-4 divide-y border-t border-border">
            {order.items.map((item: OrderItemDto) => (
              <li key={item.orderItemId} className="flex items-center gap-3 py-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {formatPrice(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-medium">Total</span>
            <span className="text-xl font-bold">{formatPrice(order.totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button nativeButton={false} render={<Link href="/products" />}>
          Continue shopping
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/orders" />}
        >
          View my orders
        </Button>
      </div>
    </div>
  )
}