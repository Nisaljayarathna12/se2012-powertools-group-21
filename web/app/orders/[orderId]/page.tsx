"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, MapPin, PackageSearch } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ApiError,
  fetchOrder,
  type OrderDetail,
  type OrderItemDto,
} from "@/lib/api"
import { clearToken, getToken, useIsLoggedIn } from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { statusVariant } from "@/lib/order-status"

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = use(params)
  const router = useRouter()
  const loggedIn = useIsLoggedIn()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }

    let cancelled = false

    fetchOrder(Number(orderId))
      .then((res) => {
        if (cancelled) return
        setOrder(res)
        setError(false)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearToken()
          router.replace("/login")
          return
        }
        setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [orderId, router])

  if (!loggedIn) {
    return null
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/orders" />}
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Button>

      {error ? (
        <div className="flex flex-col items-center py-16 text-center">
          <PackageSearch className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">
            We couldn&apos;t load this order
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The order may not exist or you don&apos;t have access to it.
          </p>
        </div>
      ) : loading || !order ? (
        <div className="space-y-4">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="h-40 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded bg-muted" />
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Order #{order.orderId}
              </h1>
              <Badge variant={statusVariant(order.status)}>
                {order.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Placed on {order.orderDate}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Shipping address
              </CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-line text-sm">
              {order.shippingAddress}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="divide-y">
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

              <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-medium">Total</span>
                <span className="text-xl font-bold">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Payment method:{" "}
                <span className="font-medium text-foreground">
                  Cash on Delivery
                </span>{" "}
                (will be collected on delivery).
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}