"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"
import { useCart } from "@/components/showcase/cart-provider"
import { StarRating } from "@/components/showcase/star-rating"
import { formatPrice } from "@/lib/format"
import { getDiscountPercentage, getSpecSnippet } from "@/lib/showcase"
import type { ShowcaseProduct } from "@/lib/showcase"

interface ProductCarouselProps {
  products: ShowcaseProduct[]
}

const AUTO_PLAY_INTERVAL = 3500

export function ProductCarousel({ products }: ProductCarouselProps) {
  const { addItem } = useCart()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [addedId, setAddedId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [visibleCount, setVisibleCount] = useState(1)

  useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth >= 1024) setVisibleCount(3)
      else if (window.innerWidth >= 640) setVisibleCount(2)
      else setVisibleCount(1)
    }
    updateVisible()
    window.addEventListener("resize", updateVisible)
    return () => window.removeEventListener("resize", updateVisible)
  }, [])

  const maxIndex = Math.max(0, products.length - visibleCount)

  // Clamp during render instead of in an effect: shrinking the viewport (or a
  // shorter product list) must not leave the track parked past the end.
  const index = Math.min(currentIndex, maxIndex)

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const from = Math.min(prev, maxIndex)
      return from >= maxIndex ? 0 : from + 1
    })
  }, [maxIndex])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => {
      const from = Math.min(prev, maxIndex)
      return from <= 0 ? maxIndex : from - 1
    })
  }, [maxIndex])

  useEffect(() => {
    if (isPaused || products.length === 0) return
    timerRef.current = setInterval(goNext, AUTO_PLAY_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, goNext, products.length])

  async function handleAdd(event: React.MouseEvent, product: ShowcaseProduct) {
    event.preventDefault()
    event.stopPropagation()
    const ok = await addItem(product.productId)
    if (ok) {
      setAddedId(product.id)
      setTimeout(() => setAddedId(null), 1500)
    }
  }

  if (products.length === 0) return null

  const trackShift = -(index * (100 / visibleCount))
  const showNav = products.length > visibleCount

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${trackShift}%)` }}
        >
          {products.map((product) => {
            const discount = getDiscountPercentage(product)
            const snippet = getSpecSnippet(product)
            return (
            <div
              key={product.id}
              className="shrink-0 px-3"
              style={{ width: `${100 / visibleCount}%` }}
            >
              <div className="card group flex h-full flex-col overflow-hidden hover:border-safety-400 hover:shadow-elevated">
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative aspect-square overflow-hidden bg-industrial-100">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {discount ? (
                      <span className="badge absolute left-3 top-3 bg-safety-500 font-bold text-industrial-900">
                        -{discount}%
                      </span>
                    ) : null}
                    {!product.inStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-industrial-900/60">
                        <span className="badge bg-industrial-800 text-white">
                          Out of Stock
                        </span>
                      </div>
                    )}
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
                      onClick={(event) => handleAdd(event, product)}
                      disabled={!product.inStock}
                      aria-label={`Add ${product.name} to cart`}
                      className="flex h-9 items-center gap-1.5 rounded-lg bg-safety-500 px-3 text-sm font-semibold text-industrial-900 transition-all hover:bg-safety-400 hover:shadow-elevated active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {addedId === product.id ? (
                        <>
                          <Check size={16} /> Added
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={16} /> Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      </div>

      {showNav ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-industrial-800 text-white shadow-elevated transition-all hover:bg-industrial-900 hover:scale-110 active:scale-95"
            aria-label="Previous products"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-industrial-800 text-white shadow-elevated transition-all hover:bg-industrial-900 hover:scale-110 active:scale-95"
            aria-label="Next products"
          >
            <ChevronRight size={24} />
          </button>

          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={
                  index === i
                    ? "h-2 w-8 rounded-full bg-safety-500 transition-all"
                    : "h-2 w-2 rounded-full bg-industrial-300 transition-all hover:bg-industrial-400"
                }
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
