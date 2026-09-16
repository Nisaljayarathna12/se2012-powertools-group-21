"use client"

import { Package } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold">No products available</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Check back later for new power tools.
      </p>
    </div>
  )
}
