"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
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
  fetchCategories,
  fetchProduct,
  updateProduct,
  type Category,
  type Product,
} from "@/lib/api"
import {
  clearToken,
  getRole,
  getToken,
  useIsLoggedIn,
  useRole,
} from "@/lib/auth"
import { cn } from "@/lib/utils"

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"

interface FormErrors {
  name?: string
  categoryId?: string
  price?: string
  stockQty?: string
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const productId = Number(id)

  const router = useRouter()
  const loggedIn = useIsLoggedIn()
  const role = useRole()

  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [price, setPrice] = useState("")
  const [stockQty, setStockQty] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [description, setDescription] = useState("")

  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  function prefill(product: Product) {
    setName(product.name)
    setCategoryId(product.categoryId ?? "")
    setPrice(product.price.toString())
    setStockQty(product.stockQty.toString())
    setImageUrl(product.imageUrl ?? "")
    setDescription(product.description ?? "")
  }

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

    Promise.all([fetchProduct(productId), fetchCategories()])
      .then(([product, cats]) => {
        if (cancelled) return
        setCategories(cats)
        prefill(product)
        setFormError(null)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
          return
        }
        setFormError(
          err instanceof Error ? err.message : "Failed to load product"
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [router, role, productId])

  if (!loggedIn || role === null) {
    return null
  }

  if (role !== "ADMIN") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">403 — Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only administrators can edit products.
          </p>
        </div>
      </div>
    )
  }

  function validate(): FormErrors {
    const next: FormErrors = {}

    if (!name.trim()) {
      next.name = "Name is required"
    }

    if (!categoryId) {
      next.categoryId = "Category is required"
    }

    const priceNum = Number(price)
    if (!price.trim()) {
      next.price = "Price is required"
    } else if (Number.isNaN(priceNum) || priceNum <= 0) {
      next.price = "Price must be greater than zero"
    }

    const stockNum = Number(stockQty)
    if (!stockQty.trim()) {
      next.stockQty = "Stock quantity is required"
    } else if (!Number.isInteger(stockNum) || stockNum < 0) {
      next.stockQty = "Stock must be a non-negative whole number"
    }

    return next
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const next = validate()
    setErrors(next)
    setFormError(null)
    setSuccess(null)

    if (Object.keys(next).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      await updateProduct(productId, {
        categoryId,
        name: name.trim(),
        price: Number(price),
        stockQty: Number(stockQty),
        imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
        description: description.trim() ? description.trim() : null,
      })
      setSuccess(`Product "${name.trim()}" updated successfully.`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
        return
      }
      if (err instanceof ApiError && err.status === 403) {
        setFormError("You do not have permission to edit products.")
        return
      }
      setFormError(
        err instanceof Error ? err.message : "Failed to update product"
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    router.back()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {loading ? "Loading product…" : `Edit product #${productId}`}
          </CardTitle>
          <CardDescription>
            Update the details for this power tool.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {notFound ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              Product not found. It may have been removed.
            </div>
          ) : loading ? (
            <div className="space-y-4">
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {formError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {formError}
                </div>
              ) : null}

              {success ? (
                <div
                  role="status"
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-500"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {success}
                  </span>
                  <span className="mt-1.5 inline-flex items-center gap-2">
                    <Link
                      href={`/products/${productId}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      View product
                    </Link>
                    <span className="text-muted-foreground">
                      or continue editing below.
                    </span>
                  </span>
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
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  placeholder="e.g. 18V Cordless Drill"
                  className={cn(inputClass, errors.name && "border-destructive")}
                />
                {errors.name ? (
                  <p id="name-error" className="text-sm text-destructive">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Category
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  aria-invalid={Boolean(errors.categoryId)}
                  aria-describedby={
                    errors.categoryId ? "category-error" : undefined
                  }
                  className={cn(
                    inputClass,
                    errors.categoryId && "border-destructive",
                    !categoryId && "text-muted-foreground"
                  )}
                >
                  <option value="">Select a category…</option>
                  {categories.map((category) => (
                    <option
                      key={category.categoryId}
                      value={category.categoryId}
                    >
                      {category.categoryName}
                    </option>
                  ))}
                </select>
                {errors.categoryId ? (
                  <p id="category-error" className="text-sm text-destructive">
                    {errors.categoryId}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">
                    Price
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    aria-invalid={Boolean(errors.price)}
                    aria-describedby={errors.price ? "price-error" : undefined}
                    placeholder="0.00"
                    className={cn(
                      inputClass,
                      errors.price && "border-destructive"
                    )}
                  />
                  {errors.price ? (
                    <p id="price-error" className="text-sm text-destructive">
                      {errors.price}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="stockQty" className="text-sm font-medium">
                    Stock quantity
                  </label>
                  <input
                    id="stockQty"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    aria-invalid={Boolean(errors.stockQty)}
                    aria-describedby={
                      errors.stockQty ? "stockQty-error" : undefined
                    }
                    placeholder="0"
                    className={cn(
                      inputClass,
                      errors.stockQty && "border-destructive"
                    )}
                  />
                  {errors.stockQty ? (
                    <p id="stockQty-error" className="text-sm text-destructive">
                      {errors.stockQty}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="imageUrl" className="text-sm font-medium">
                  Image URL
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://… (optional)"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Product details (optional)"
                  className={cn(
                    inputClass,
                    "h-auto resize-y py-2 leading-relaxed"
                  )}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row-reverse">
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}