"use client"

import { cn } from "@/lib/utils"
import { getStockStatus, type StockStatus } from "@/lib/stock"

interface StockBadgeProps {
  stockQty: number
  lowStockThreshold?: number
  className?: string
}

const STOCK_STYLES: Record<
  StockStatus,
  { label: string; badge: string; dot: string }
> = {
  "in-stock": {
    label: "In Stock",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
    dot: "bg-emerald-500",
  },
  "low-stock": {
    label: "Low Stock",
    badge: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-500",
    dot: "bg-amber-500",
  },
  "out-of-stock": {
    label: "Out of Stock",
    badge: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
}

export function StockBadge({
  stockQty,
  lowStockThreshold,
  className,
}: StockBadgeProps) {
  const status = getStockStatus(stockQty, lowStockThreshold)
  const style = STOCK_STYLES[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        style.badge,
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", style.dot)} />
      {style.label}
    </span>
  )
}