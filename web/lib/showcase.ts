import type { Product, ProductResponse } from "@/lib/api"
import {
  getMockAttributes,
  type Brand,
  type PowerSource,
  type ProductSpecifications,
  type Voltage,
} from "@/lib/mock-attributes"

export type { Brand, PowerSource, Voltage, ProductSpecifications }
export { BRANDS, POWER_SOURCES, VOLTAGES } from "@/lib/mock-attributes"

/**
 * View model for the Bolt-derived storefront.
 *
 * Real fields come from Spring Boot's `ProductDto`. The decorative fields
 * (brand, voltage, power source, specifications, features, rating, review
 * count, original price, image) are INVENTED — see `lib/mock-attributes.ts`,
 * which is the single place they come from and the only file to delete once
 * the backend exposes them.
 */
export interface ShowcaseProduct {
  id: string
  productId: number
  name: string
  categoryName: string | null
  price: number
  stockQty: number
  inStock: boolean
  imageUrl: string
  description: string | null

  /** Real when the row has a brand (migration V9); otherwise the mock map. */
  brand: string
  voltage: Voltage | null
  powerSource: PowerSource
  specifications: ProductSpecifications
  features: string[]
  rating: number
  reviewCount: number
  originalPrice: number | null
}

function mergeMockAttributes(product: Product): ShowcaseProduct {
  const mock = getMockAttributes(product.productId)

  return {
    id: String(product.productId),
    productId: product.productId,
    name: product.name,
    categoryName: product.categoryName,
    price: product.price,
    stockQty: product.stockQty,
    inStock: product.stockQty > 0,
    // DB imageUrl wins when present; otherwise fall back to a local asset.
    imageUrl: product.imageUrl?.trim() || mock.imageUrl,
    description: product.description,

    // DB brand wins when set; otherwise fall back to the mock map so legacy
    // rows created before migration V9 still show a brand.
    brand: product.brand?.trim() || mock.brand,
    voltage: mock.voltage,
    powerSource: mock.powerSource,
    specifications: mock.specifications,
    features: mock.features,
    rating: mock.rating,
    reviewCount: mock.reviewCount,
    originalPrice: mock.originalPrice,
  }
}

export function toShowcaseProduct(product: Product): ShowcaseProduct {
  return mergeMockAttributes(product)
}

export function toShowcaseProducts(
  response: ProductResponse
): ShowcaseProduct[] {
  return response.products.map(toShowcaseProduct)
}

/**
 * The backend returns products in insertion order and exposes no created_at,
 * so the carousel falls back to descending productId as a "newest first"
 * approximation. Swap in a real created_at sort once the API returns one.
 */
export function byNewestFirst(
  products: ShowcaseProduct[]
): ShowcaseProduct[] {
  return [...products].sort((a, b) => b.productId - a.productId)
}

/** Compact spec line, matching Bolt's `getSpecSnippet`. */
export function getSpecSnippet(product: ShowcaseProduct): string {
  const specs = product.specifications
  const parts: string[] = []
  if (product.voltage) parts.push(product.voltage)
  if (specs.noLoadSpeed) parts.push(specs.noLoadSpeed)
  if (specs.maxTorque) parts.push(specs.maxTorque)
  if (parts.length === 0 && specs.powerInput) parts.push(specs.powerInput)
  return parts.join(" / ")
}

export function getDiscountPercentage(
  product: ShowcaseProduct
): number | null {
  if (
    !product.originalPrice ||
    product.originalPrice <= product.price
  ) {
    return null
  }
  return Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  )
}

/** Max price across a product set, used to seed the catalog price slider. */
export function maxPrice(products: ShowcaseProduct[]): number {
  return products.reduce((max, p) => Math.max(max, p.price), 0)
}
