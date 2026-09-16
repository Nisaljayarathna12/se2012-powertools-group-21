"use client"

import { use, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchProduct, type Product } from "@/lib/api"
import { formatPrice } from "@/lib/format"
import { useIsLoggedIn } from "@/lib/auth"

function StockStatus({ stockQty }: { stockQty: number }) {
  return stockQty > 0 ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      In stock ({stockQty} available)
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
      <span className="h-2 w-2 rounded-full bg-destructive" />
      Out of stock
    </span>
  )
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const productId = Number(id)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const loggedIn = useIsLoggedIn()

  useEffect(() => {
    let cancelled = false

    fetchProduct(productId)
      .then((res) => {
        if (cancelled) return
        setProduct(res)
        setError(false)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [productId])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/products" />} className="mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Button>

        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Product not found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The product you are looking for does not exist.
            </p>
          </div>
        ) : loading || !product ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
              <div className="h-24 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {product.categoryName && (
                    <Badge variant="secondary">{product.categoryName}</Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {product.name}
                </h1>
                <p className="text-2xl font-bold">{formatPrice(product.price)}</p>
                <StockStatus stockQty={product.stockQty} />
              </div>

              <div className="rounded-xl border bg-card p-6">
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                  Description
                </h2>
                <p className="text-sm leading-relaxed">
                  {product.description || "No description available."}
                </p>
              </div>

              {loggedIn && (
                <Button size="lg" className="w-full sm:w-auto">
                  Add to Cart
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}