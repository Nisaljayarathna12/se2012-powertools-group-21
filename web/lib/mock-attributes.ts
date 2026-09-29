/**
 * ============================================================================
 *  MOCK PRESENTATION DATA — NOT FROM THE BACKEND
 * ============================================================================
 *
 *  The Spring Boot `ProductDto` exposes only:
 *    productId, name, price, stockQty, imageUrl, description, categoryId,
 *    categoryName
 *
 *  The Bolt template was designed around a much wider schema (brand, voltage,
 *  power source, specifications, features, rating, review count, original
 *  price, and populated image URLs). The database has none of those columns —
 *  `imageUrl` is in fact NULL for every row, because migration
 *  `V6__clear_product_image_urls.sql` blanked them.
 *
 *  Everything below is INVENTED to satisfy the Bolt visual design. It is
 *  deterministic (keyed by productId) so the UI is stable across renders, and
 *  it is isolated in this single file so it can be deleted the moment the
 *  backend exposes real columns.
 *
 *  BRAND IS NOW REAL. Migration `V9__add_product_brand_column.sql` added
 *  `PRODUCT.brand`, and `ProductDto` exposes it. `brand` below is only a
 *  fallback for rows created before that migration, so admins can backfill.
 *
 *  To go real for good: add the columns + a Flyway migration, extend
 *  `ProductDto`, then delete this file and the `mergeMockAttributes` call in
 *  `lib/showcase.ts`. No component changes required.
 * ============================================================================
 */

export const BRANDS = ["Bosch", "Makita", "Ingco", "DeWalt"] as const
export const POWER_SOURCES = [
  "Cordless/Battery",
  "Corded Electric",
  "Gasoline",
] as const
export const VOLTAGES = ["12V", "18V", "20V Max", "230V"] as const

export type Brand = (typeof BRANDS)[number]
export type PowerSource = (typeof POWER_SOURCES)[number]
export type Voltage = (typeof VOLTAGES)[number]

export interface ProductSpecifications {
  noLoadSpeed?: string
  maxTorque?: string
  batteryCapacity?: string
  weight?: string
  packageContents?: string
  chuckSize?: string
  powerInput?: string
  discDiameter?: string
  bladeDiameter?: string
  cuttingDepth?: string
  [key: string]: string | undefined
}

export interface MockAttributes {
  imageUrl: string
  brand: Brand
  voltage: Voltage | null
  powerSource: PowerSource
  specifications: ProductSpecifications
  features: string[]
  rating: number
  reviewCount: number
  originalPrice: number | null
}

const MOCK_BY_PRODUCT_ID: Record<number, MockAttributes> = {
  1: {
    imageUrl: "/products/drill.png",
    brand: "Makita",
    voltage: "20V Max",
    powerSource: "Cordless/Battery",
    specifications: {
      noLoadSpeed: "0-1800 RPM",
      maxTorque: "50 Nm",
      batteryCapacity: "2.0 Ah Li-Ion",
      chuckSize: "13 mm",
      weight: "1.6 kg",
      packageContents: "Drill, 2 x 2.0Ah batteries, charger",
    },
    features: ["Brushless Motor", "2 Batteries Included", "20V Max Platform"],
    rating: 4.8,
    reviewCount: 124,
    originalPrice: 189.99,
  },
  2: {
    imageUrl: "/products/grinder.svg",
    brand: "Bosch",
    voltage: "230V",
    powerSource: "Corded Electric",
    specifications: {
      powerInput: "850 W",
      discDiameter: "115 mm",
      noLoadSpeed: "11000 RPM",
      weight: "2.3 kg",
    },
    features: ["900W Motor", "Paddle Switch", "Side Handle"],
    rating: 4.6,
    reviewCount: 87,
    originalPrice: 89.9,
  },
  3: {
    imageUrl: "/products/saw.svg",
    brand: "DeWalt",
    voltage: "230V",
    powerSource: "Corded Electric",
    specifications: {
      powerInput: "1600 W",
      bladeDiameter: "185 mm",
      cuttingDepth: "55 mm",
      noLoadSpeed: "4500 RPM",
    },
    features: ["165mm Blade", "Bevel Stop", "Parallel Cut Guide"],
    rating: 4.7,
    reviewCount: 63,
    originalPrice: 189.0,
  },
  4: {
    imageUrl: "/products/impact-wrench.svg",
    brand: "Ingco",
    voltage: "20V Max",
    powerSource: "Cordless/Battery",
    specifications: {
      maxTorque: "520 Nm",
      batteryCapacity: "4.0 Ah Li-Ion",
      weight: "2.2 kg",
      chuckSize: "1/2 inch",
    },
    features: ["Brushless Motor", "3 Speed Modes", "LED Work Light"],
    rating: 4.5,
    reviewCount: 41,
    originalPrice: 219.99,
  },
  5: {
    imageUrl: "/products/sander.svg",
    brand: "Bosch",
    voltage: "230V",
    powerSource: "Corded Electric",
    specifications: {
      powerInput: "300 W",
      weight: "1.4 kg",
      packageContents: "Sander, dust bag, 6 x sanding discs",
    },
    features: ["Variable Speed", "Dust Extraction", "125mm Pad"],
    rating: 4.4,
    reviewCount: 38,
    originalPrice: 99.0,
  },
  6: {
    imageUrl: "/products/rotary-hammer.svg",
    brand: "Makita",
    voltage: "230V",
    powerSource: "Corded Electric",
    specifications: {
      powerInput: "800 W",
      cuttingDepth: "26 mm",
      noLoadSpeed: "4300 RPM",
      weight: "4.6 kg",
    },
    features: ["SDS-Plus Chuck", "3 Mode Operation", "Anti-Vibration"],
    rating: 4.9,
    reviewCount: 56,
    originalPrice: 259.0,
  },
}

const MOCK_FALLBACK: MockAttributes = {
  imageUrl: "/products/placeholder.svg",
  brand: "Ingco",
  voltage: "230V",
  powerSource: "Corded Electric",
  specifications: { powerInput: "See manual" },
  features: ["Professional Grade", "Islandwide Service"],
  rating: 4.3,
  reviewCount: 12,
  originalPrice: null,
}

export function getMockAttributes(productId: number): MockAttributes {
  return MOCK_BY_PRODUCT_ID[productId] ?? MOCK_FALLBACK
}

export function discountPercentage(
  originalPrice: number | null,
  price: number
): number | null {
  if (!originalPrice || originalPrice <= price) return null
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}
