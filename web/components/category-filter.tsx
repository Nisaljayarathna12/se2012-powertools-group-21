"use client"

import { cn } from "@/lib/utils"
import type { Category } from "@/lib/api"

interface CategoryFilterProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelect: (categoryId: string | null) => void
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelect,
}: CategoryFilterProps) {
  const itemClass = (active: boolean) =>
    cn(
      "rounded-lg px-3 py-2 text-left text-sm transition-colors",
      active
        ? "bg-primary font-medium text-primary-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )

  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Categories
      </h2>
      <div className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={selectedCategoryId === null}
          className={itemClass(selectedCategoryId === null)}
        >
          All Products
        </button>
        {categories.map((category) => {
          const active = selectedCategoryId === category.categoryId
          return (
            <button
              key={category.categoryId}
              type="button"
              onClick={() => onSelect(category.categoryId)}
              aria-pressed={active}
              className={itemClass(active)}
            >
              {category.categoryName}
            </button>
          )
        })}
      </div>
    </div>
  )
}