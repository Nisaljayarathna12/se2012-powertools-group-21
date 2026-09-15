"use client"

import { useCallback, useEffect, useState } from "react"
import { ProductGrid } from "@/components/product-grid"
import { Pagination } from "@/components/pagination"
import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { fetchProducts, type ProductResponse } from "@/lib/api"

const PRODUCTS_PER_PAGE = 12

export default function ProductsPage() {
  const [page, setPage] = useState(0)
  const [data, setData] = useState<ProductResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadProducts = useCallback(async (pageNum: number) => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetchProducts(pageNum, PRODUCTS_PER_PAGE)
      setData(res)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts(page)
  }, [page, loadProducts])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse our selection of power tools.
          </p>
        </div>

        {error ? (
          <ErrorState onRetry={() => loadProducts(page)} />
        ) : loading && !data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <div className="aspect-square animate-pulse bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : data && data.products.length === 0 ? (
          <EmptyState />
        ) : data ? (
          <>
            <ProductGrid products={data.products} />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
