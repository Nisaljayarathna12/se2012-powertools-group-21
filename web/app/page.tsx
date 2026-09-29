"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react"
import { ProductCarousel } from "@/components/showcase/product-carousel"
import { QuickViewModal } from "@/components/showcase/quick-view-modal"
import { HomeCategoryGrid } from "@/components/showcase/home-category-grid"
import { ShowcaseProductCard } from "@/components/showcase/showcase-product-card"
import { loadShowcaseProducts } from "@/lib/showcase-api"
import type { ShowcaseProduct } from "@/lib/showcase"

const CAROUSEL_COUNT = 8
const FEATURED_COUNT = 4

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "1-Year Warranty" },
  { icon: Truck, label: "Islandwide Delivery" },
  { icon: BadgeCheck, label: "100% Genuine Brands" },
]

export default function HomePage() {
  const [products, setProducts] = useState<ShowcaseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [quickViewProduct, setQuickViewProduct] =
    useState<ShowcaseProduct | null>(null)

  useEffect(() => {
    let cancelled = false

    loadShowcaseProducts(CAROUSEL_COUNT)
      .then((data) => {
        if (!cancelled) setProducts(data)
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="animate-fade-in bg-industrial-50">
      <section className="relative overflow-hidden bg-industrial-900">
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="badge mb-4 bg-safety-500/20 text-safety-400">
              Authorized Power Tool Dealer
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Heavy Duty Power Tools &amp; Cordless Kits
            </h1>
            <p className="mt-4 max-w-xl text-lg text-industrial-300">
              Genuine Bosch, Makita, DeWalt &amp; Ingco power tools with
              manufacturer warranty. Islandwide delivery across Sri Lanka.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/catalog" className="btn-primary text-base">
                Browse Catalog <ArrowRight size={18} />
              </Link>
              <Link
                href="/catalog"
                className="btn-secondary border-industrial-600 bg-industrial-800/50 text-white hover:bg-industrial-700"
              >
                View Deals
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6">
              {TRUST_BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 text-sm font-medium text-industrial-200"
                >
                  <badge.icon size={20} className="text-safety-400" />
                  {badge.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HomeCategoryGrid />

      {products.length > 0 ? (
        <section className="bg-industrial-900 py-14">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 text-center">
              <h2 className="font-display text-3xl font-bold text-white">
                Featured Power Tools
              </h2>
              <p className="mt-2 text-industrial-400">
                Top-rated tools auto-scrolling &mdash; hover to pause
              </p>
            </div>
            <ProductCarousel products={products} />
          </div>
        </section>
      ) : null}

      <section className="bg-industrial-100 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold text-industrial-900">
                Featured Products
              </h2>
              <p className="mt-2 text-industrial-500">
                Best-selling power tools our customers love
              </p>
            </div>
            <Link
              href="/catalog"
              className="hidden items-center gap-1 text-sm font-semibold text-safety-600 hover:text-safety-700 sm:flex"
            >
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: FEATURED_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className="card h-80 animate-pulse bg-industrial-100"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-industrial-300 py-20 text-center">
              <Wrench size={40} className="mb-4 text-industrial-300" />
              <p className="text-lg font-semibold text-industrial-700">
                No products available yet
              </p>
              <p className="mt-1 text-sm text-industrial-500">
                Products will appear here once they are added to the catalogue.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, FEATURED_COUNT).map((product) => (
                <ShowcaseProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-industrial-800 p-8 sm:flex-row">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Need help choosing the right tool?
            </h2>
            <p className="mt-2 text-industrial-300">
              Our experts are ready to help you find the perfect power tool for
              your project.
            </p>
          </div>
          <Link href="/contact" className="btn-primary shrink-0">
            Contact Us <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  )
}
