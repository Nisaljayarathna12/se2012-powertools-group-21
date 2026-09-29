"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BatteryCharging,
  Disc3,
  Droplets,
  Drill,
  Hammer,
  type LucideIcon,
} from "lucide-react"
import { loadCategories } from "@/lib/showcase-api"
import type { Category } from "@/lib/api"

interface HomeCategory {
  key: string
  label: string
  description: string
  icon: LucideIcon
  /**
   * The category name this card filters by in the catalogue. Resolved to a real
   * categoryId at runtime rather than hardcoding a UUID, so re-seeding the
   * database cannot silently break the links.
   *
   * `null` means the storefront has no matching category yet; the card then
   * links to the unfiltered catalogue instead of a query that returns nothing.
   */
  categoryName: string | null
}

const HOME_CATEGORIES: HomeCategory[] = [
  {
    key: "drills",
    label: "Cordless Drills & Drivers",
    description: "18V brushless kits",
    icon: Drill,
    categoryName: "Power Drills",
  },
  {
    key: "grinders",
    label: "Angle Grinders & Cutters",
    description: "115mm to 230mm discs",
    icon: Disc3,
    categoryName: "Angle Grinders",
  },
  {
    key: "saws",
    label: "Circular & Rotary Saws",
    description: "185mm precision cuts",
    icon: Hammer,
    categoryName: "Circular Saws",
  },
  {
    key: "washers",
    label: "Pressure Washers & Pumps",
    description: "180 bar cleaning power",
    icon: Droplets,
    categoryName: null,
  },
  {
    key: "batteries",
    label: "Battery Packs & Chargers",
    description: "18V Li-Ion batteries",
    icon: BatteryCharging,
    categoryName: null,
  },
]

export function HomeCategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    let cancelled = false

    loadCategories()
      .then((data) => {
        if (!cancelled) setCategories(data)
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  const cards = useMemo(
    () =>
      HOME_CATEGORIES.map((category) => {
        const match = category.categoryName
          ? categories.find(
              (c) =>
                c.categoryName.toLowerCase() ===
                category.categoryName?.toLowerCase()
            )
          : undefined

        const href = match
          ? `/catalog?category=${encodeURIComponent(match.categoryId)}`
          : "/catalog"

        return { ...category, href, matched: Boolean(match) }
      }),
    [categories]
  )

  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="mb-8 text-center">
        <h2 className="font-display text-3xl font-bold text-industrial-900">
          Shop by Category
        </h2>
        <p className="mt-2 text-industrial-500">
          Find the right tool for every job
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((category) => (
          <Link
            key={category.key}
            href={category.href}
            className="card group flex flex-col items-center p-6 text-center hover:border-safety-400 hover:shadow-elevated"
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-industrial-100 text-industrial-700 transition-colors group-hover:bg-safety-500 group-hover:text-industrial-900">
              <category.icon size={28} />
            </div>
            <h3 className="text-sm font-semibold text-industrial-800 group-hover:text-safety-600">
              {category.label}
            </h3>
            <p className="mt-1 text-xs text-industrial-500">
              {category.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
