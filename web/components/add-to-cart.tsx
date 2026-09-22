"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addToCart, ApiError, type Product } from "@/lib/api"
import { refreshCartCount } from "@/lib/cart"
import { clearToken } from "@/lib/auth"
import { notify } from "@/lib/toast"
import { cn } from "@/lib/utils"

const qtyInputClass =
  "h-9 w-14 rounded-lg border border-input bg-background px-2 py-1 text-center text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

export function AddToCart({ product }: { product: Product }) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const outOfStock = product.stockQty <= 0

  function clampQty(value: number): number {
    return Math.min(Math.max(1, value), Math.max(1, product.stockQty))
  }

  async function handleAdd() {
    setAdding(true)
    setError(null)
    try {
      await addToCart(product.productId, quantity)
      notify(`${quantity} × ${product.name} added to cart`)
      refreshCartCount()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
        return
      }
      setError(
        err instanceof Error ? err.message : "Failed to add to cart"
      )
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="w-full sm:w-auto">
      {!outOfStock ? (
        <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
          <span
            id={`qty-${product.productId}-label`}
            className="text-sm text-muted-foreground"
          >
            Quantity
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => clampQty(q - 1))}
            disabled={adding || quantity <= 1}
            aria-label="Decrease quantity"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={1}
            max={product.stockQty}
            step={1}
            inputMode="numeric"
            value={quantity}
            onChange={(e) => {
              const n = Number(e.target.value)
              setQuantity(
                Number.isNaN(n) ? 1 : clampQty(Math.round(n))
              )
            }}
            aria-labelledby={`qty-${product.productId}-label`}
            className={cn(qtyInputClass)}
            disabled={adding}
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => clampQty(q + 1))}
            disabled={adding || quantity >= product.stockQty}
            aria-label="Increase quantity"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <Button
        size="lg"
        type="button"
        className="w-full sm:w-auto"
        disabled={outOfStock || adding}
        onClick={handleAdd}
      >
        <ShoppingCart className="h-4 w-4" />
        {outOfStock
          ? "Out of stock"
          : adding
            ? "Adding…"
            : "Add to Cart"}
      </Button>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}