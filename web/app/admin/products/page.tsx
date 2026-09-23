"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, PackagePlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/pagination"
import { StockAdjuster } from "@/components/stock-adjuster"
import { StockBadge } from "@/components/stock-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ApiError,
  fetchProducts,
  type Product,
  type ProductResponse,
} from "@/lib/api"
import {
  clearToken,
  getRole,
  getToken,
  useIsLoggedIn,
  useRole,
} from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

const PRODUCTS_PER_PAGE = 10

export default function AdminProductsPage() {
  const router = useRouter()
  const loggedIn = useIsLoggedIn()
  const role = useRole()

  const [page, setPage] = useState(0)
  const [data, setData] = useState<ProductResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }

    if (getRole() === null) {
      clearToken()
      router.replace("/login")
      return
    }

    if (role !== "ADMIN") return

    let cancelled = false

    fetchProducts(page, PRODUCTS_PER_PAGE)
      .then((res) => {
        if (cancelled) return
        setData(res)
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
          err instanceof Error ? err.message : "Failed to load products"
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [router, role, page])

  if (!loggedIn || role === null) {
    return null
  }

  if (role !== "ADMIN") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">403 — Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only administrators can manage products.
          </p>
        </div>
      </div>
    )
  }

  function handleStockUpdate(updated: Product) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            products: prev.products.map((p) =>
              p.productId === updated.productId ? updated : p
            ),
          }
        : prev
    )
  }

  const products = data?.products ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Products</h1>
            {data ? (
              <Badge variant="outline">{data.totalElements} total</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Adjust stock levels so inventory stays accurate.
          </p>
        </div>

        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/products/new" />}
        >
          <PackagePlus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {error ? (
        <div className="mt-6">
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        </div>
      ) : null}

      <Card className="mt-6">
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="px-6 py-8">
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded bg-muted"
                  />
                ))}
              </div>
            </div>
          ) : products.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No products yet. Add your first product to the catalogue.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>In stock</TableHead>
                    <TableHead>Adjust</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: Product) => {
                    const isOut = product.stockQty <= 0
                    const isLow =
                      !isOut && product.stockQty <= 5
                    return (
                      <TableRow
                        key={product.productId}
                        className={cn(
                          isOut && "bg-destructive/5",
                          isLow && "bg-amber-500/5"
                        )}
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/products/${product.productId}/edit`}
                            className="hover:underline"
                          >
                            {product.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.categoryName ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(product.price)}
                        </TableCell>
                        <TableCell>
                          <StockBadge stockQty={product.stockQty} />
                        </TableCell>
                        <TableCell>
                          <StockAdjuster
                            productId={product.productId}
                            stockQty={product.stockQty}
                            onStockUpdate={handleStockUpdate}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
                <span>
                  {data
                    ? `Showing ${
                        data.totalElements === 0
                          ? 0
                          : data.page * data.size + 1
                      }–${Math.min(
                          (data.page + 1) * data.size,
                          data.totalElements
                        )} of ${data.totalElements} products`
                    : ""}
                </span>
                {data ? (
                  <Pagination
                    page={data.page}
                    totalPages={data.totalPages}
                    onPageChange={setPage}
                  />
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}