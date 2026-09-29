"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Image as ImageIcon, X } from "lucide-react"
import type { Category, CreateProductRequest, Product } from "@/lib/api"
import { ApiError } from "@/lib/api"
import { notify } from "@/lib/toast"
import { cn } from "@/lib/utils"

interface ProductFormModalProps {
  /** null opens the modal in "add" mode. */
  product: Product | null
  categories: Category[]
  brandSuggestions: string[]
  saving: boolean
  onSave: (data: CreateProductRequest) => Promise<void>
  onClose: () => void
}

interface FormState {
  name: string
  brand: string
  categoryId: string
  price: string
  stockQty: string
  imageUrl: string
  description: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const EMPTY_FORM: FormState = {
  name: "",
  brand: "",
  categoryId: "",
  price: "",
  stockQty: "0",
  imageUrl: "",
  description: "",
}

const inputClass =
  "h-10 w-full rounded-lg border border-industrial-300 bg-white px-3 text-sm text-industrial-800 placeholder:text-industrial-400 focus:border-safety-500 focus:outline-none focus:ring-1 focus:ring-safety-500"
const labelClass = "mb-1 block text-xs font-semibold text-industrial-600"
const errorClass = "mt-1 text-xs text-error-600"

function productToForm(product: Product): FormState {
  return {
    name: product.name,
    brand: product.brand ?? "",
    categoryId: product.categoryId ?? "",
    price: product.price.toString(),
    stockQty: product.stockQty.toString(),
    imageUrl: product.imageUrl ?? "",
    description: product.description ?? "",
  }
}

export function ProductFormModal({
  product,
  categories,
  brandSuggestions,
  saving,
  onSave,
  onClose,
}: ProductFormModalProps) {
  // The parent renders this component fresh on every open, so the form can be
  // seeded from the product in a lazy initializer instead of an effect.
  const [form, setForm] = useState<FormState>(() =>
    product ? productToForm(product) : EMPTY_FORM
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [onClose])

  function update<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): FormErrors {
    const next: FormErrors = {}

    if (!form.name.trim()) next.name = "Product name is required"
    if (!form.brand.trim()) next.brand = "Brand is required"
    if (!form.categoryId) next.categoryId = "Category is required"

    const price = Number(form.price)
    if (!form.price.trim()) {
      next.price = "Price is required"
    } else if (Number.isNaN(price) || price <= 0) {
      next.price = "Price must be greater than zero"
    }

    const stock = Number(form.stockQty)
    if (!form.stockQty.trim()) {
      next.stockQty = "Stock quantity is required"
    } else if (!Number.isInteger(stock) || stock < 0) {
      next.stockQty = "Stock must be a non-negative whole number"
    }

    return next
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const next = validate()
    setErrors(next)
    setFormError(null)

    if (Object.keys(next).length > 0) return

    try {
      await onSave({
        name: form.name.trim(),
        brand: form.brand.trim(),
        categoryId: form.categoryId,
        price: Number(form.price),
        stockQty: Number(form.stockQty),
        imageUrl: form.imageUrl.trim() ? form.imageUrl.trim() : null,
        description: form.description.trim() ? form.description.trim() : null,
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError("A product with this name already exists.")
        return
      }
      if (err instanceof ApiError && err.status === 403) {
        setFormError("You do not have permission to manage products.")
        return
      }
      setFormError(
        err instanceof Error ? err.message : "Failed to save product"
      )
      notify("Failed to save product")
    }
  }

  const isEdit = Boolean(product)

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-industrial-900/60 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-elevated"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-industrial-200 bg-white px-6 py-4">
          <h2
            id="product-form-title"
            className="font-display text-xl font-bold text-industrial-900"
          >
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-industrial-400 transition-colors hover:bg-industrial-100 hover:text-industrial-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5 px-6 py-5">
            {formError ? (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700"
              >
                <AlertCircle size={16} className="shrink-0" />
                {formError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="modal-name" className={labelClass}>
                  Product Name *
                </label>
                <input
                  id="modal-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  placeholder="e.g. 18V Cordless Impact Drill Kit"
                  className={cn(
                    inputClass,
                    errors.name && "border-error-500"
                  )}
                />
                {errors.name ? <p className={errorClass}>{errors.name}</p> : null}
              </div>

              <div>
                <label htmlFor="modal-brand" className={labelClass}>
                  Brand *
                </label>
                <input
                  id="modal-brand"
                  type="text"
                  list="admin-brand-suggestions"
                  value={form.brand}
                  onChange={(e) => update("brand", e.target.value)}
                  aria-invalid={Boolean(errors.brand)}
                  placeholder="e.g. Bosch"
                  className={cn(
                    inputClass,
                    errors.brand && "border-error-500"
                  )}
                />
                <datalist id="admin-brand-suggestions">
                  {brandSuggestions.map((brand) => (
                    <option key={brand} value={brand} />
                  ))}
                </datalist>
                {errors.brand ? (
                  <p className={errorClass}>{errors.brand}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="modal-category" className={labelClass}>
                  Category *
                </label>
                <select
                  id="modal-category"
                  value={form.categoryId}
                  onChange={(e) => update("categoryId", e.target.value)}
                  aria-invalid={Boolean(errors.categoryId)}
                  className={cn(
                    inputClass,
                    errors.categoryId && "border-error-500"
                  )}
                >
                  <option value="">— Select —</option>
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
                  <p className={errorClass}>{errors.categoryId}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="modal-price" className={labelClass}>
                  Price (LKR) *
                </label>
                <input
                  id="modal-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  aria-invalid={Boolean(errors.price)}
                  placeholder="e.g. 18500"
                  className={cn(
                    inputClass,
                    errors.price && "border-error-500"
                  )}
                />
                {errors.price ? (
                  <p className={errorClass}>{errors.price}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="modal-stock" className={labelClass}>
                  Stock Quantity *
                </label>
                <input
                  id="modal-stock"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.stockQty}
                  onChange={(e) => update("stockQty", e.target.value)}
                  aria-invalid={Boolean(errors.stockQty)}
                  className={cn(
                    inputClass,
                    errors.stockQty && "border-error-500"
                  )}
                />
                {errors.stockQty ? (
                  <p className={errorClass}>{errors.stockQty}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <label htmlFor="modal-image" className={labelClass}>
                  Product Image URL
                </label>
                <input
                  id="modal-image"
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => update("imageUrl", e.target.value)}
                  placeholder="https://…"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col items-center">
                <span className={labelClass}>Preview</span>
                <div className="h-20 w-20 overflow-hidden rounded-lg border border-industrial-200 bg-industrial-50">
                  {form.imageUrl.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.imageUrl.trim()}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-industrial-300">
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="modal-description" className={labelClass}>
                Detailed Description
              </label>
              <textarea
                id="modal-description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                placeholder="Full product description for the detail page..."
                className="w-full rounded-lg border border-industrial-300 bg-white px-3 py-2 text-sm text-industrial-800 placeholder:text-industrial-400 focus:border-safety-500 focus:outline-none focus:ring-1 focus:ring-safety-500"
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-industrial-200 bg-white px-6 py-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
