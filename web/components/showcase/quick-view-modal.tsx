"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ShoppingCart, X } from "lucide-react"
import { useCart } from "@/components/showcase/cart-provider"
import { StarRating } from "@/components/showcase/star-rating"
import { formatPrice } from "@/lib/format"
import { getDiscountPercentage, getSpecSnippet } from "@/lib/showcase"
import type { ShowcaseProduct } from "@/lib/showcase"

interface QuickViewModalProps {
  product: ShowcaseProduct | null
  onClose: () => void
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  if (!product) return null
  const current = product
  const discount = getDiscountPercentage(current)
  const snippet = getSpecSnippet(current)

  async function handleAdd() {
    const ok = await addItem(current.productId)
    if (ok) {
      setAdded(true)
      setTimeout(() => setAdded(false), 1500)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 animate-fade-in bg-industrial-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 animate-slide-up overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-industrial-600 backdrop-blur transition-colors hover:bg-industrial-100"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          <div className="relative aspect-square overflow-hidden bg-industrial-100 sm:rounded-l-2xl">
            <Image
              src={current.imageUrl}
              alt={current.name}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
            {discount ? (
              <span className="badge absolute left-3 top-3 bg-safety-500 font-bold text-industrial-900">
                -{discount}%
              </span>
            ) : null}
          </div>

          <div className="flex flex-col p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="badge bg-industrial-100 text-industrial-600">
                {current.categoryName ?? "Uncategorised"}
              </span>
              <span className="badge bg-safety-500 font-semibold text-industrial-900">
                {current.brand}
              </span>
            </div>
            <h2 className="mb-1 text-lg font-bold text-industrial-900">
              {current.name}
            </h2>
            <div className="mb-2">
              <StarRating
                rating={current.rating}
                count={current.reviewCount}
                showCount
              />
            </div>
            <p className="mb-3 text-sm text-industrial-600">
              {current.description ?? "No description available."}
            </p>

            {current.features.length > 0 ? (
              <ul className="mb-3 space-y-1">
                {current.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-xs text-industrial-600"
                  >
                    <Check size={14} className="text-safety-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mb-3">
              <span
                className={
                  current.inStock
                    ? "badge bg-green-100 text-green-700"
                    : "badge bg-red-100 text-red-700"
                }
              >
                {current.inStock
                  ? `${current.stockQty} in stock`
                  : "Out of Stock"}
              </span>
            </div>

            <div className="mt-auto">
              <div className="mb-3 flex items-end gap-2">
                {current.originalPrice ? (
                  <span className="text-sm text-industrial-400 line-through">
                    {formatPrice(current.originalPrice)}
                  </span>
                ) : null}
                <span className="text-2xl font-bold text-industrial-900">
                  {formatPrice(current.price)}
                </span>
              </div>
              {snippet ? (
                <p className="mb-3 text-xs text-industrial-500">{snippet}</p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!current.inStock}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  {added ? <Check size={18} /> : <ShoppingCart size={18} />}
                  {added ? "Added!" : "Add to Cart"}
                </button>
                <Link
                  href={`/products/${current.id}`}
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
