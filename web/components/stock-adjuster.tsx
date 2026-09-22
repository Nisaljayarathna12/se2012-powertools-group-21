"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { adjustProductStock, ApiError, type Product } from "@/lib/api"
import { clearToken } from "@/lib/auth"
import { cn } from "@/lib/utils"

const inputClass =
  "h-9 w-16 rounded-lg border border-input bg-background px-2 py-1 text-center text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

export function StockAdjuster({
  productId,
  stockQty,
  onStockUpdate,
}: {
  productId: number
  stockQty: number
  onStockUpdate: (updated: Product) => void
}) {
  const router = useRouter()
  const [amount, setAmount] = useState("1")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function parseAmount(): number | null {
    const n = Number(amount)
    if (!amount.trim() || !Number.isInteger(n) || n <= 0) return null
    return n
  }

  async function apply(delta: 1 | -1) {
    const value = parseAmount()
    if (value === null) {
      setError("Enter a positive whole number")
      return
    }
    if (delta === -1 && value > stockQty) {
      setError("Cannot reduce below zero")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const updated = await adjustProductStock(productId, value * delta)
      onStockUpdate(updated)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
        return
      }
      setError(
        err instanceof Error ? err.message : "Failed to update stock"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => apply(-1)}
          disabled={saving}
          aria-label="Decrease stock"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={saving}
          aria-label="Stock adjustment amount"
          className={cn(inputClass, error && "border-destructive")}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => apply(1)}
          disabled={saving}
          aria-label="Increase stock"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {saving ? (
        <p className="mt-1 text-xs text-muted-foreground">Saving…</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}