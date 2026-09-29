"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  Package,
  Pencil,
  RotateCcw,
  Shield,
  Trash2,
  Truck,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddToCart } from "@/components/add-to-cart"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useCart } from "@/components/showcase/cart-provider"
import { StarRating } from "@/components/showcase/star-rating"
import {
  ApiError,
  deleteProduct,
  fetchProduct,
  type Product,
} from "@/lib/api"
import { formatPrice } from "@/lib/format"
import {
  getDiscountPercentage,
  getSpecSnippet,
  toShowcaseProduct,
  type ShowcaseProduct,
} from "@/lib/showcase"
import { getStockStatus } from "@/lib/stock"
import { clearToken, useIsLoggedIn, useRole } from "@/lib/auth"

type Tab = "specs" | "warranty"

const TRUST_ICONS = [
  { icon: Truck, label: "Islandwide Delivery" },
  { icon: Shield, label: "1-Year Warranty" },
  { icon: RotateCcw, label: "7-Day Returns" },
]

function StockInfo({ stockQty }: { stockQty: number }) {
  const status = getStockStatus(stockQty)

  if (status === "out-of-stock") {
    return <span className="text-sm text-muted-foreground">Currently unavailable</span>
  }

  if (status === "low-stock") {
    return (
      <span className="text-sm font-medium text-amber-600 dark:text-amber-500">
        Only {stockQty} left in stock
      </span>
    )
  }

  return (
    <span className="text-sm text-muted-foreground">
      {stockQty} units available
    </span>
  )
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const productId = Number(id)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("specs")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const loggedIn = useIsLoggedIn()
  const role = useRole()
  const isAdmin = role === "ADMIN"
  const isCustomer = role === "CUSTOMER"
  const router = useRouter()
  const { addItem } = useCart()

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteProduct(productId)
      setConfirmOpen(false)
      router.push("/products")
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
        return
      }
      if (err instanceof ApiError && err.status === 403) {
        setDeleteError("You do not have permission to delete products.")
      } else {
        setDeleteError(
          err instanceof Error ? err.message : "Failed to delete product"
        )
      }
    } finally {
      setDeleting(false)
    }
  }

  async function handleBuyNow() {
    const added = await addItem(productId)
    if (added) router.push("/checkout")
  }

  useEffect(() => {
    let cancelled = false

    fetchProduct(productId)
      .then((res) => {
        if (cancelled) return
        setProduct(res)
        setError(false)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [productId])

  if (error) {
    return (
      <div className="mx-auto max-w-7xl bg-industrial-50 px-4 py-20 text-center">
        <Package size={48} className="mx-auto mb-4 text-industrial-300" />
        <h1 className="font-display text-2xl font-bold text-industrial-900">
          Product Not Found
        </h1>
        <p className="mt-2 text-industrial-500">
          The product you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/catalog" className="btn-primary mt-6">
          Back to Catalog
        </Link>
      </div>
    )
  }

  if (loading || !product) {
    return (
      <div className="mx-auto max-w-7xl bg-industrial-50 px-4 py-20">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 rounded bg-industrial-100" />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="aspect-square rounded-xl bg-industrial-100" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded bg-industrial-100" />
              <div className="h-6 w-1/2 rounded bg-industrial-100" />
              <div className="h-10 w-1/3 rounded bg-industrial-100" />
              <div className="h-12 w-full rounded bg-industrial-100" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const outOfStock = product.stockQty <= 0

  // Display view: real API fields plus the quarantined presentation attributes
  // (brand, voltage, specs, rating, image fallback). See lib/mock-attributes.ts.
  const view: ShowcaseProduct = toShowcaseProduct(product)
  const discount = getDiscountPercentage(view)
  const snippet = getSpecSnippet(view)

  const specEntries: [string, string][] = [
    ["Product ID", String(product.productId)],
    ["Brand", view.brand],
    ["Category", product.categoryName ?? "Uncategorised"],
    ["Power Source", view.powerSource],
    ...(view.voltage ? ([["Voltage", view.voltage]] as [string, string][]) : []),
    ...Object.entries(view.specifications).map(
      ([key, value]) =>
        [
          key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (c) => c.toUpperCase())
            .trim(),
          value as string,
        ] as [string, string]
    ),
    ["Price", formatPrice(product.price)],
    ["Availability", outOfStock ? "Out of stock" : `${product.stockQty} in stock`],
  ]

  return (
    <div className="mx-auto max-w-7xl animate-fade-in bg-industrial-50 px-4 py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-industrial-500">
        <Link href="/" className="hover:text-safety-600">
          Home
        </Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-safety-600">
          Catalog
        </Link>
        {product.categoryName ? (
          <>
            <span>/</span>
            <Link
              href={`/catalog?category=${product.categoryId}`}
              className="hover:text-safety-600"
            >
              {product.categoryName}
            </Link>
          </>
        ) : null}
        <span>/</span>
        <span className="font-medium text-industrial-700">{product.name}</span>
      </nav>

      <Link
        href="/catalog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-industrial-600 hover:text-safety-600"
      >
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card relative aspect-square overflow-hidden">
          <Image
            src={view.imageUrl}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          {discount ? (
            <span className="badge absolute left-3 top-3 bg-safety-500 font-bold text-industrial-900">
              -{discount}%
            </span>
          ) : null}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="badge bg-industrial-100 text-industrial-600">
              {product.categoryName ?? "Uncategorised"}
            </span>
            <span className="badge bg-safety-500 font-semibold text-industrial-900">
              {view.brand}
            </span>
            {outOfStock ? (
              <span className="badge bg-red-100 text-red-700">Out of Stock</span>
            ) : (
              <span className="badge bg-green-100 text-green-700">
                <Check size={12} className="mr-1" /> In Stock
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl font-bold text-industrial-900 lg:text-3xl">
            {product.name}
          </h1>

          <div className="mt-2">
            <StarRating
              rating={view.rating}
              count={view.reviewCount}
              showCount
            />
          </div>

          <p className="mt-3 text-sm text-industrial-600">
            {product.description || "No description available."}
          </p>

          {view.features.length > 0 ? (
            <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {view.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-industrial-600"
                >
                  <Check size={14} className="text-safety-600" />
                  {feature}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 flex items-end gap-3">
            {view.originalPrice ? (
              <span className="text-lg text-industrial-400 line-through">
                {formatPrice(view.originalPrice)}
              </span>
            ) : null}
            <span className="text-3xl font-bold text-industrial-900">
              {formatPrice(product.price)}
            </span>
          </div>

          {snippet ? (
            <p className="mt-1 text-xs text-industrial-500">{snippet}</p>
          ) : null}

          <div className="mt-2">
            <StockInfo stockQty={product.stockQty} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {loggedIn && isCustomer ? (
              <>
                <AddToCart product={product} />
                <Button
                  size="lg"
                  type="button"
                  onClick={handleBuyNow}
                  disabled={outOfStock}
                  className="w-full sm:w-auto"
                >
                  <Zap />
                  Buy Now
                </Button>
              </>
            ) : null}
            {isAdmin ? (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                  nativeButton={false}
                  render={<Link href={`/admin/products/${product.productId}/edit`} />}
                >
                  <Pencil />
                  Edit
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full sm:w-auto"
                  type="button"
                  onClick={() => {
                    setDeleteError(null)
                    setConfirmOpen(true)
                  }}
                >
                  <Trash2 />
                  Delete
                </Button>
              </>
            ) : null}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 rounded-lg border border-industrial-200 bg-industrial-50 p-4">
            {TRUST_ICONS.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1 text-center"
              >
                <item.icon size={20} className="text-safety-600" />
                <span className="text-xs font-medium text-industrial-600">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex gap-1 border-b border-industrial-200">
          {(
            [
              { key: "specs" as Tab, label: "Technical Specifications" },
              { key: "warranty" as Tab, label: "Warranty & Service" },
            ] satisfies { key: Tab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? "border-safety-500 text-industrial-900 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
                  : "text-industrial-500 hover:text-industrial-700 border-transparent border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "specs" ? (
            <div className="animate-fade-in">
              <table className="w-full max-w-2xl">
                <tbody>
                  {specEntries.map(([key, value], i) => (
                    <tr
                      key={key}
                      className={i % 2 === 0 ? "bg-industrial-50" : "bg-white"}
                    >
                      <td className="w-1/3 border-b border-industrial-100 px-4 py-3 text-sm font-medium text-industrial-600">
                        {key}
                      </td>
                      <td className="border-b border-industrial-100 px-4 py-3 text-sm text-industrial-800">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="max-w-2xl animate-fade-in space-y-4">
              <div className="flex items-start gap-3">
                <Shield size={24} className="mt-0.5 shrink-0 text-safety-600" />
                <div>
                  <h3 className="font-semibold text-industrial-800">
                    Manufacturer Warranty
                  </h3>
                  <p className="mt-1 text-sm text-industrial-600">
                    This {product.name} comes with a 1-year manufacturer warranty
                    covering defects in materials and workmanship. The warranty
                    is valid from the date of purchase with the original receipt.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check size={24} className="mt-0.5 shrink-0 text-safety-600" />
                <div>
                  <h3 className="font-semibold text-industrial-800">
                    What&apos;s Covered
                  </h3>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-industrial-600">
                    <li>Manufacturing defects in motor and components</li>
                    <li>Battery and charger defects (cordless models)</li>
                    <li>Replacement of faulty parts at no cost</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw size={24} className="mt-0.5 shrink-0 text-safety-600" />
                <div>
                  <h3 className="font-semibold text-industrial-800">
                    Replacement Parts
                  </h3>
                  <p className="mt-1 text-sm text-industrial-600">
                    Genuine replacement parts and accessories are available at
                    our store. Contact us for parts ordering and repair services.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${product.name}"?`}
        description="This will remove the product from the catalogue. Customers will no longer see it, and the action cannot be undone."
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
