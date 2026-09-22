"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Package, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StockBadge } from "@/components/stock-badge"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { AddToCart } from "@/components/add-to-cart"
import {
  ApiError,
  deleteProduct,
  fetchProduct,
  type Product,
} from "@/lib/api"
import { formatPrice } from "@/lib/format"
import { getStockStatus } from "@/lib/stock"
import { clearToken, useIsLoggedIn, useRole } from "@/lib/auth"

function StockInfo({ stockQty }: { stockQty: number }) {
  const status = getStockStatus(stockQty)

  if (status === "out-of-stock") {
    return (
      <span className="text-sm text-muted-foreground">
        Currently unavailable
      </span>
    )
  }

  if (status === "low-stock") {
    return (
      <span className="text-sm font-medium text-amber-600 dark:text-amber-500">
        Only {stockQty} left in stock
      </span>
    )
  }

  return (
    <span className="text-sm text-muted-foreground">
      {stockQty} units available
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const loggedIn = useIsLoggedIn()
  const role = useRole()
  const isAdmin = role === "ADMIN"
  const isCustomer = role === "CUSTOMER"
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteProduct(productId)
      setConfirmOpen(false)
      router.push("/products")
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
        return
      }
      if (err instanceof ApiError && err.status === 403) {
        setDeleteError("You do not have permission to delete products.")
      } else {
        setDeleteError(
          err instanceof Error ? err.message : "Failed to delete product"
        )
      }
    } finally {
      setDeleting(false)
    }
  }

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
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StockBadge stockQty={product.stockQty} />
                  <StockInfo stockQty={product.stockQty} />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                  Description
                </h2>
                <p className="text-sm leading-relaxed">
                  {product.description || "No description available."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {loggedIn && isCustomer ? (
                  <AddToCart product={product} />
                ) : null}
                {isAdmin && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/admin/products/${product.productId}/edit`}
                      />
                    }
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    size="lg"
                    variant="destructive"
                    className="w-full sm:w-auto"
                    type="button"
                    onClick={() => {
                      setDeleteError(null)
                      setConfirmOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {product ? (
        <ConfirmDialog
          open={confirmOpen}
          title={`Delete "${product.name}"?`}
          description="This will remove the product from the catalogue. Customers will no longer see it, and the action cannot be undone."
          confirmLabel="Delete"
          busy={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}
    </div>
  )
}