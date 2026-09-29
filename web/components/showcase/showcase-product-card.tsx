"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, Eye, ShoppingCart } from "lucide-react"
import { useCart } from "@/components/showcase/cart-provider"
import { StarRating } from "@/components/showcase/star-rating"
import { formatPrice } from "@/lib/format"
import { getDiscountPercentage, getSpecSnippet } from "@/lib/showcase"
import type { ShowcaseProduct } from "@/lib/showcase"

interface ShowcaseProductCardProps {
  product: ShowcaseProduct
  onQuickView?: (product: ShowcaseProduct) => void
}

export function ShowcaseProductCard({
  product,
  onQuickView,
}: ShowcaseProductCardProps) {
  const { addItem, isCustomer } = useCart()
  const [added, setAdded] = useState(false)

  const discount = getDiscountPercentage(product)
  const snippet = getSpecSnippet(product)

  async function handleAdd(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    const ok = await addItem(product.productId)
    if (ok) {
      setAdded(true)
      setTimeout(() => setAdded(false), 1500)
    }
  }

  return (
    <div className="card group relative flex h-full flex-col overflow-hidden hover:border-industrial-300 hover:shadow-elevated">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-industrial-100">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {discount ? (
            <span className="badge absolute left-3 top-3 bg-safety-500 font-bold text-industrial-900">
              -{discount}%
            </span>
          ) : null}
          {!product.inStock ? (
            <div className="absolute inset-0 flex items-center justify-center bg-industrial-900/60">
              <span className="badge bg-industrial-800 text-white">
                Out of Stock
              </span>
            </div>
          ) : null}
          {onQuickView && product.inStock ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onQuickView(product)
              }}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-industrial-800/90 px-3 py-1.5 text-xs font-semibold text-white opacity-0 backdrop-blur transition-all group-hover:opacity-100 hover:bg-industrial-900"
            >
              <Eye size={14} /> Quick View
            </button>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="badge bg-industrial-100 text-industrial-600">
            {product.categoryName ?? "Uncategorised"}
          </span>
          <span className="text-xs font-semibold text-industrial-500">
            {product.brand}
          </span>
        </div>

        <Link href={`/products/${product.id}`}>
          <h3 className="mb-1 text-sm font-semibold leading-snug text-industrial-800 hover:text-safety-600">
            {product.name}
          </h3>
        </Link>

        {snippet ? (
          <p className="mb-2 text-xs text-industrial-500">{snippet}</p>
        ) : null}

        {product.features.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1">
            {product.features.slice(0, 2).map((feature) => (
              <span
                key={feature}
                className="badge border border-industrial-200 bg-industrial-50 text-industrial-600"
              >
                {feature}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mb-3">
          <StarRating
            rating={product.rating}
            count={product.reviewCount}
            showCount
          />
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            {product.originalPrice ? (
              <span className="block text-xs text-industrial-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            ) : null}
            <span className="text-lg font-bold text-industrial-900">
              {formatPrice(product.price)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.inStock}
            aria-label={
              isCustomer ? `Add ${product.name} to cart` : "Sign in to add to cart"
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-safety-500 text-industrial-900 transition-all hover:bg-safety-400 hover:shadow-elevated active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {added ? <Check size={18} /> : <ShoppingCart size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
