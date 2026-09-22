"use client"

import { useEffect, useState } from "react"
import { ProductSearch } from "@/components/product-search"
import { ProductGrid } from "@/components/product-grid"
import { CategoryFilter } from "@/components/category-filter"
import { Pagination } from "@/components/pagination"
import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import {
  fetchCategories,
  fetchProducts,
  type Category,
  type ProductResponse,
} from "@/lib/api"

const PRODUCTS_PER_PAGE = 12
const SEARCH_DEBOUNCE_MS = 400

export default function ProductsPage() {
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  )
  const [data, setData] = useState<ProductResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchCategories()
      .then((res) => {
        if (cancelled) return
        setCategories(res)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPage(0)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancelled = false

    const search = debouncedQuery.length > 0 ? debouncedQuery : undefined

    fetchProducts(
      page,
      PRODUCTS_PER_PAGE,
      search,
      selectedCategoryId ?? undefined
    )
      .then((res) => {
        if (cancelled) return
        setData(res)
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
  }, [page, debouncedQuery, selectedCategoryId, reloadKey])

  const isSearching = debouncedQuery.length > 0

  function handleCategorySelect(categoryId: string | null) {
    setSelectedCategoryId(categoryId)
    setPage(0)
  }

  function handleProductDeleted(productId: number) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            products: prev.products.filter((p) => p.productId !== productId),
            totalElements: Math.max(0, prev.totalElements - 1),
          }
        : prev
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse our selection of power tools.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
          <aside className="mb-6 lg:mb-0">
            <CategoryFilter
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={handleCategorySelect}
            />
          </aside>

          <div>
            <div className="mb-8">
              <ProductSearch value={query} onChange={setQuery} />
            </div>

            {isSearching ? (
              <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
                {data
                  ? `Found ${data.totalElements} ${
                      data.totalElements === 1 ? "product" : "products"
                    } matching “${debouncedQuery}”`
                  : `Searching for “${debouncedQuery}”…`}
              </p>
            ) : null}

            {error ? (
              <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />
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
              <EmptyState
                title={
                  isSearching && selectedCategoryId
                    ? "No products match your search in this category"
                    : isSearching
                      ? "No products match your search"
                      : selectedCategoryId
                        ? "No products in this category"
                        : "No products available"
                }
                description={
                  isSearching
                    ? "Try a different keyword or clear the search."
                    : selectedCategoryId
                      ? "Try selecting a different category."
                      : "Check back later for new power tools."
                }
                onClearSearch={
                  isSearching ? () => setQuery("") : undefined
                }
              />
            ) : data ? (
              <>
                <ProductGrid
                  products={data.products}
                  onProductDeleted={handleProductDeleted}
                />
                <Pagination
                  page={data.page}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}