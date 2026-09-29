"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { ProductFormModal } from "@/components/admin/product-form-modal"
import { StockAdjuster } from "@/components/stock-adjuster"
import {
  ApiError,
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  updateProduct,
  type Category,
  type CreateProductRequest,
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
import { notify } from "@/lib/toast"

const PRODUCTS_PER_PAGE = 10
const ALL = "all"

const selectClass =
  "h-10 rounded-lg border border-industrial-300 bg-white px-3 text-sm text-industrial-800 focus:border-safety-500 focus:outline-none"

function stockBadge(stockQty: number) {
  if (stockQty <= 0) {
    return { label: "Out of stock", className: "bg-error-100 text-error-700" }
  }
  if (stockQty <= 5) {
    return {
      label: `Low: ${stockQty} left`,
      className: "bg-safety-100 text-safety-700",
    }
  }
  return {
    label: `${stockQty} in stock`,
    className: "bg-success-100 text-success-700",
  }
}

export default function AdminProductsPage() {
  const router = useRouter()
  const loggedIn = useIsLoggedIn()
  const role = useRole()

  const [page, setPage] = useState(0)
  const [data, setData] = useState<ProductResponse | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState(ALL)
  const [brandFilter, setBrandFilter] = useState(ALL)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(
    (targetPage: number) => {
      return fetchProducts(targetPage, PRODUCTS_PER_PAGE)
        .then((res) => {
          setData(res)
          setError(null)
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            clearToken()
            router.replace("/login")
            return
          }
          setError(
            err instanceof Error ? err.message : "Failed to load products"
          )
        })
        .finally(() => setLoading(false))
    },
    [router]
  )

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

    fetchCategories()
      .then((res) => {
        if (!cancelled) setCategories(res)
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load categories")
      })

    load(page)

    return () => {
      cancelled = true
    }
  }, [router, role, page, load])

  const products = useMemo(() => data?.products ?? [], [data])

  const brandOptions = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.brand?.trim()) set.add(p.brand.trim())
    })
    return Array.from(set).sort()
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q)
      const matchesCategory =
        categoryFilter === ALL || p.categoryId === categoryFilter
      const matchesBrand = brandFilter === ALL || p.brand === brandFilter
      return matchesSearch && matchesCategory && matchesBrand
    })
  }, [products, search, categoryFilter, brandFilter])

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

  const filtersActive =
    search.trim() !== "" || categoryFilter !== ALL || brandFilter !== ALL

  function clearFilters() {
    setSearch("")
    setCategoryFilter(ALL)
    setBrandFilter(ALL)
  }

  function goToPage(next: number) {
    setLoading(true)
    setPage(next)
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

  async function handleSave(payload: CreateProductRequest) {
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateProduct(editing.productId, payload)
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
        notify(`Product "${payload.name}" updated successfully`)
      } else {
        const created = await createProduct(payload)
        setData((prev) =>
          prev
            ? { ...prev, products: [created, ...prev.products] }
            : { products: [created], page: 0, size: 1, totalElements: 1, totalPages: 1, first: true, last: true }
        )
        notify(`Product "${payload.name}" added successfully`)
      }
      setModalOpen(false)
      setEditing(null)
      setLoading(true)
      await load(page)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
        return
      }
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProduct(deleteTarget.productId)
      notify(`Product "${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      setLoading(true)
      await load(page)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
        return
      }
      notify(
        err instanceof Error ? err.message : "Failed to delete product"
      )
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = data?.totalPages ?? 1
  const currentStart = filtered.length === 0 ? 0 : page * PRODUCTS_PER_PAGE + 1
  const currentEnd = Math.min((page + 1) * PRODUCTS_PER_PAGE, data?.totalElements ?? 0)

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-industrial-50">
      <div className="border-b border-industrial-200 bg-industrial-800">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-industrial-300 transition-colors hover:text-white"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="font-display text-xl font-bold text-white">
              Product Management
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-industrial-900">
              Product Catalogue
            </h2>
            <p className="mt-1 text-sm text-industrial-500">
              Manage your store catalog — {data?.totalElements ?? 0} products
              total
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
            className="btn-primary shrink-0"
          >
            <Plus size={18} /> Add New Product
          </button>
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-industrial-200 bg-white p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tool name or brand..."
              aria-label="Search products"
              className="h-10 w-full rounded-lg border border-industrial-300 bg-white pl-10 pr-3 text-sm text-industrial-800 placeholder:text-industrial-400 focus:border-safety-500 focus:outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className={selectClass}
          >
            <option value={ALL}>All Categories</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.categoryName}
              </option>
            ))}
          </select>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            aria-label="Filter by brand"
            className={selectClass}
          >
            <option value={ALL}>All Brands</option>
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-industrial-300 px-3 text-sm font-medium text-industrial-600 transition-colors hover:bg-industrial-50"
            >
              <X size={16} /> Clear
            </button>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700"
          >
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-industrial-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-industrial-200 bg-industrial-50 text-xs uppercase tracking-wide text-industrial-500">
                  <th className="px-4 py-3 font-semibold">Image</th>
                  <th className="px-4 py-3 font-semibold">Tool Name</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">
                    Category
                  </th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                    Brand
                  </th>
                  <th className="px-4 py-3 font-semibold">Price (LKR)</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-100">
                {loading && !data ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <div className="h-12 w-12 animate-pulse rounded-lg bg-industrial-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-40 animate-pulse rounded bg-industrial-100" />
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <div className="h-4 w-20 animate-pulse rounded bg-industrial-100" />
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <div className="h-4 w-16 animate-pulse rounded bg-industrial-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-20 animate-pulse rounded bg-industrial-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-16 animate-pulse rounded bg-industrial-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto h-4 w-20 animate-pulse rounded bg-industrial-100" />
                      </td>
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Package
                        size={40}
                        className="mx-auto mb-3 text-industrial-300"
                      />
                      <p className="text-sm font-medium text-industrial-500">
                        No products found
                      </p>
                      <p className="mt-1 text-xs text-industrial-400">
                        Try adjusting your search or filters
                      </p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Package
                        size={40}
                        className="mx-auto mb-3 text-industrial-300"
                      />
                      <p className="text-sm font-medium text-industrial-500">
                        No products match your filters
                      </p>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-3 text-sm font-semibold text-safety-600 hover:text-safety-700"
                      >
                        Clear filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => {
                    const stock = stockBadge(product.stockQty)
                    return (
                      <tr
                        key={product.productId}
                        className="transition-colors hover:bg-industrial-50"
                      >
                        <td className="px-4 py-3">
                          <div className="h-12 w-12 overflow-hidden rounded-lg border border-industrial-200 bg-industrial-50">
                            {product.imageUrl?.trim() ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.imageUrl.trim()}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-industrial-300">
                                <Package size={18} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-industrial-800">
                            {product.name}
                          </div>
                          <div className="text-xs text-industrial-400">
                            #{product.productId}
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <span className="badge bg-industrial-100 text-industrial-600">
                            {product.categoryName ?? "—"}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-industrial-600 sm:table-cell">
                          {product.brand?.trim() || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-industrial-900">
                            {formatPrice(product.price)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${stock.className}`}>
                            {stock.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <StockAdjuster
                              productId={product.productId}
                              stockQty={product.stockQty}
                              onStockUpdate={handleStockUpdate}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(product)
                                setModalOpen(true)
                              }}
                              aria-label={`Edit ${product.name}`}
                              className="btn-icon hover:bg-accent-100 hover:text-accent-700"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(product)}
                              aria-label={`Delete ${product.name}`}
                              className="btn-icon hover:bg-error-100 hover:text-error-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-industrial-200 px-4 py-3">
              <p className="text-xs text-industrial-500">
                Showing {currentStart}–{currentEnd} of {data.totalElements}
                {filtersActive ? ` (${filtered.length} matching on this page)` : ""}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  aria-label="Previous page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-industrial-300 text-industrial-600 transition-colors hover:bg-industrial-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToPage(i)}
                    aria-label={`Page ${i + 1}`}
                    aria-current={page === i ? "page" : undefined}
                    className={
                      "h-8 w-8 rounded-lg text-sm font-semibold transition-colors " +
                      (page === i
                        ? "bg-safety-500 text-industrial-900"
                        : "border border-industrial-300 text-industrial-600 hover:bg-industrial-50")
                    }
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => goToPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-industrial-300 text-industrial-600 transition-colors hover:bg-industrial-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {modalOpen ? (
        <ProductFormModal
          product={editing}
          categories={categories}
          brandSuggestions={brandOptions}
          saving={saving}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
        />
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-industrial-900/60 p-4"
          onMouseDown={() => setDeleteTarget(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-100">
                <AlertTriangle size={24} className="text-error-600" />
              </div>
              <div>
                <h3
                  id="delete-product-title"
                  className="font-display text-lg font-bold text-industrial-900"
                >
                  Delete Product?
                </h3>
                <p className="text-sm text-industrial-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mb-5 rounded-lg border border-industrial-200 bg-industrial-50 p-3">
              <p className="font-semibold text-industrial-800">
                {deleteTarget.name}
              </p>
              <p className="text-xs text-industrial-500">
                {deleteTarget.brand?.trim() || "No brand"} ·{" "}
                {deleteTarget.categoryName ?? "No category"}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger"
              >
                {deleting ? "Deleting…" : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
