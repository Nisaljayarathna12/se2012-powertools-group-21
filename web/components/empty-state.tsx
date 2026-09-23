"use client"

import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title?: string
  description?: string
  onClearSearch?: () => void
}

export function EmptyState({
  title = "No products available",
  description = "Check back later for new power tools.",
  onClearSearch,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {onClearSearch ? (
        <Button
          variant="outline"
          className="mt-4"
          onClick={onClearSearch}
        >
          Clear search
        </Button>
      ) : null}
    </div>
  )
}