"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, PackageSearch, SlidersHorizontal, X } from "lucide-react"
import { QuickViewModal } from "@/components/showcase/quick-view-modal"
import { ShowcaseProductCard } from "@/components/showcase/showcase-product-card"
import { formatPrice } from "@/lib/format"
import { loadCatalogProducts, loadCategories } from "@/lib/showcase-api"
import type { Category } from "@/lib/api"
import {
  BRANDS,
  POWER_SOURCES,
  VOLTAGES,
  maxPrice,
  toShowcaseProducts,
  type ShowcaseProduct,
} from "@/lib/showcase"

type SortOption = "newest" | "price-low" | "price-high" | "name"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest Arrival" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
]

interface CatalogViewProps {
  initialCategoryId: string | null
  initialQuery: string
}

export function CatalogView({
  initialCategoryId,
  initialQuery,
}: CatalogViewProps) {
  const router = useRouter()

  const [products, setProducts] = useState<ShowcaseProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null)
  const [quickViewProduct, setQuickViewProduct] =
    useState<ShowcaseProduct | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialCategoryId ? [initialCategoryId] : []
  )
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [priceCeiling, setPriceCeiling] = useState<number | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedPowerSources, setSelectedPowerSources] = useState<string[]>([])
  const [selectedVoltages, setSelectedVoltages] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>("newest")

  // Derived rather than assigned in the effect body: a fresh search term is
  // pending until the response for that exact term lands.
  const loading = loadedQuery !== searchQuery

  useEffect(() => {
    loadCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let cancelled = false

    loadCatalogProducts({ search: searchQuery || undefined, size: 100 })
      .then((response) => {
        if (cancelled) return
        setProducts(toShowcaseProducts(response))
        setTotalElements(response.totalElements)
      })
      .catch(() => {
        if (cancelled) return
        setProducts([])
        setTotalElements(0)
      })
      .finally(() => {
        if (!cancelled) setLoadedQuery(searchQuery)
      })

    return () => {
      cancelled = true
    }
  }, [searchQuery])

  const ceiling = useMemo(
    () => priceCeiling ?? maxPrice(products),
    [priceCeiling, products]
  )

  const filtered = useMemo(() => {
    let result = products

    if (selectedCategoryIds.length > 0 && categories.length > 0) {
      const selectedNames = new Set(
        categories
          .filter((c) => selectedCategoryIds.includes(c.categoryId))
          .map((c) => c.categoryName)
      )
      result = result.filter(
        (p) => p.categoryName && selectedNames.has(p.categoryName)
      )
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand))
    }

    if (selectedPowerSources.length > 0) {
      result = result.filter((p) =>
        selectedPowerSources.includes(p.powerSource)
      )
    }

    if (selectedVoltages.length > 0) {
      result = result.filter(
        (p) => p.voltage !== null && selectedVoltages.includes(p.voltage)
      )
    }

    if (inStockOnly) {
      result = result.filter((p) => p.inStock)
    }

    if (ceiling > 0) {
      result = result.filter((p) => p.price <= ceiling)
    }

    const sorted = [...result]
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        sorted.sort((a, b) => b.price - a.price)
        break
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        sorted.sort((a, b) => b.productId - a.productId)
    }
    return sorted
  }, [
    products,
    selectedCategoryIds,
    categories,
    selectedBrands,
    selectedPowerSources,
    selectedVoltages,
    inStockOnly,
    ceiling,
    sortBy,
  ])

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }, [])

  const toggleValue = useCallback(
    (
      value: string,
      setter: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
      setter((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      )
    },
    []
  )

  const clearAllFilters = useCallback(() => {
    setSelectedCategoryIds([])
    setSearchQuery("")
    setInStockOnly(false)
    setPriceCeiling(null)
    setSelectedBrands([])
    setSelectedPowerSources([])
    setSelectedVoltages([])
    setSortBy("newest")
    router.replace("/catalog")
  }, [router])

  const activeFilterCount =
    selectedCategoryIds.length +
    selectedBrands.length +
    selectedPowerSources.length +
    selectedVoltages.length +
    (inStockOnly ? 1 : 0) +
    (searchQuery ? 1 : 0)

  const filterContent = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase text-industrial-500">
          Category
        </h3>
        {categories.length === 0 ? (
          <p className="text-sm text-industrial-400">Loading categories…</p>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <label
                key={category.categoryId}
                className="flex cursor-pointer items-center gap-2 text-sm text-industrial-700"
              >
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(category.categoryId)}
                  onChange={() => toggleCategory(category.categoryId)}
                  className="h-4 w-4 rounded border-industrial-300 text-safety-500 focus:ring-safety-500"
                />
                {category.categoryName}
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase text-industrial-500">
          Brand
        </h3>
        <div className="space-y-2">
          {BRANDS.map((brand) => (
            <label
              key={brand}
              className="flex cursor-pointer items-center gap-2 text-sm text-industrial-700"
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleValue(brand, setSelectedBrands)}
                className="h-4 w-4 rounded border-industrial-300 text-safety-500 focus:ring-safety-500"
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase text-industrial-500">
          Power Source
        </h3>
        <div className="space-y-2">
          {POWER_SOURCES.map((source) => (
            <label
              key={source}
              className="flex cursor-pointer items-center gap-2 text-sm text-industrial-700"
            >
              <input
                type="checkbox"
                checked={selectedPowerSources.includes(source)}
                onChange={() => toggleValue(source, setSelectedPowerSources)}
                className="h-4 w-4 rounded border-industrial-300 text-safety-500 focus:ring-safety-500"
              />
              {source}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase text-industrial-500">
          Voltage
        </h3>
        <div className="space-y-2">
          {VOLTAGES.map((voltage) => (
            <label
              key={voltage}
              className="flex cursor-pointer items-center gap-2 text-sm text-industrial-700"
            >
              <input
                type="checkbox"
                checked={selectedVoltages.includes(voltage)}
                onChange={() => toggleValue(voltage, setSelectedVoltages)}
                className="h-4 w-4 rounded border-industrial-300 text-safety-500 focus:ring-safety-500"
              />
              {voltage}
            </label>
          ))}
        </div>
      </div>

      {ceiling > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase text-industrial-500">
            Price Range
          </h3>
          <input
            type="range"
            min={0}
            max={ceiling}
            step={1}
            value={ceiling}
            onChange={(e) => setPriceCeiling(Number(e.target.value))}
            className="w-full accent-safety-500"
            aria-label="Maximum price"
          />
          <div className="mt-1 flex justify-between text-xs text-industrial-500">
            <span>{formatPrice(0)}</span>
            <span className="font-semibold text-industrial-700">
              {formatPrice(ceiling)}
            </span>
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase text-industrial-500">
          Availability
        </h3>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-industrial-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 rounded border-industrial-300 text-safety-500 focus:ring-safety-500"
          />
          In Stock Only
        </label>
      </div>

      {activeFilterCount > 0 ? (
        <button
          type="button"
          onClick={clearAllFilters}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-industrial-300 py-2 text-sm font-medium text-industrial-600 hover:bg-industrial-50"
        >
          <X size={14} /> Clear All Filters
        </button>
      ) : null}
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl animate-fade-in bg-industrial-50 px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-industrial-900">
          Tool Catalog
        </h1>
        <p className="mt-1 text-industrial-500">
          Browse our full range of power tools and hardware
        </p>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="card sticky top-32 p-5">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-industrial-700" />
              <h2 className="font-bold text-industrial-800">Filters</h2>
            </div>
            {filterContent}
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-industrial-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-industrial-300 px-3 py-1.5 text-sm font-medium text-industrial-600 lg:hidden"
              >
                <SlidersHorizontal size={16} /> Filters
                {activeFilterCount > 0 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-safety-500 text-xs font-bold text-industrial-900">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
              <span className="text-sm text-industrial-600">
                <span className="font-bold text-industrial-900">
                  {filtered.length}
                </span>{" "}
                {filtered.length === 1 ? "product" : "products"}
                {totalElements > products.length ? (
                  <span className="text-industrial-400">
                    {" "}
                    of {totalElements}
                  </span>
                ) : null}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="catalog-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools…"
                aria-label="Search products"
                className="h-9 rounded-lg border border-industrial-300 bg-white px-3 text-sm text-industrial-800 placeholder:text-industrial-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="catalog-sort" className="text-sm text-industrial-500">
                Sort by:
              </label>
              <div className="relative">
                <select
                  id="catalog-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="cursor-pointer appearance-none rounded-lg border border-industrial-300 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-industrial-700 focus:outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-industrial-400"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card h-80 animate-pulse bg-industrial-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-industrial-300 py-20 text-center">
              <PackageSearch size={40} className="mb-4 text-industrial-300" />
              <p className="text-lg font-semibold text-industrial-700">
                No products found
              </p>
              <p className="mt-1 text-sm text-industrial-500">
                Try adjusting your filters or search terms
              </p>
              <button type="button" onClick={clearAllFilters} className="btn-primary mt-4">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((product) => (
                <ShowcaseProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 animate-fade-in bg-industrial-900/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] animate-slide-up overflow-y-auto rounded-t-2xl bg-white p-5 lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-industrial-800">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-industrial-500"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
            {filterContent}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="btn-primary mt-6 w-full"
            >
              Show {filtered.length} Results
            </button>
          </div>
        </>
      ) : null}

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  )
}
