import {
  getDiscountPercentage,
  getSpecSnippet,
  maxPrice,
  toShowcaseProduct,
  toShowcaseProducts,
} from "@/lib/showcase"
import { getMockAttributes } from "@/lib/mock-attributes"
import type { Product, ProductResponse } from "@/lib/api"

const baseProduct: Product = {
  productId: 1,
  name: "18V Cordless Drill",
  brand: null,
  price: 89.0,
  stockQty: 12,
  imageUrl: null,
  description: "Compact drill",
  categoryId: "c1",
  categoryName: "Drills",
}

describe("toShowcaseProduct", () => {
  it("carries real API fields through untouched", () => {
    const result = toShowcaseProduct(baseProduct)

    expect(result.productId).toBe(1)
    expect(result.name).toBe("18V Cordless Drill")
    expect(result.price).toBe(89.0)
    expect(result.stockQty).toBe(12)
    expect(result.categoryName).toBe("Drills")
    expect(result.inStock).toBe(true)
  })

  it("marks zero stock as out of stock", () => {
    expect(toShowcaseProduct({ ...baseProduct, stockQty: 0 }).inStock).toBe(
      false
    )
  })

  it("prefers the database imageUrl when one exists", () => {
    const result = toShowcaseProduct({
      ...baseProduct,
      imageUrl: "/uploads/real.png",
    })

    expect(result.imageUrl).toBe("/uploads/real.png")
  })

  it("falls back to a local asset when imageUrl is null or blank", () => {
    expect(toShowcaseProduct(baseProduct).imageUrl).toBe(
      "/products/drill.png"
    )
    expect(
      toShowcaseProduct({ ...baseProduct, imageUrl: "   " }).imageUrl
    ).toBe("/products/drill.png")
  })

  it("prefers the database brand when one exists", () => {
    expect(toShowcaseProduct({ ...baseProduct, brand: "Hitachi" }).brand).toBe(
      "Hitachi"
    )
  })

  it("falls back to the mock brand for legacy rows with no brand", () => {
    expect(toShowcaseProduct({ ...baseProduct, brand: null }).brand).toBe(
      "Makita"
    )
    expect(toShowcaseProduct({ ...baseProduct, brand: "  " }).brand).toBe(
      "Makita"
    )
  })

  it("supplies presentation attributes the API does not expose", () => {
    const result = toShowcaseProduct(baseProduct)

    expect(result.voltage).toBe("20V Max")
    expect(result.rating).toBeGreaterThan(0)
    expect(result.features.length).toBeGreaterThan(0)
  })

  it("falls back safely for unknown product ids", () => {
    const result = toShowcaseProduct({ ...baseProduct, productId: 9999 })

    expect(result.brand).toBeTruthy()
    expect(result.imageUrl).toBe("/products/placeholder.svg")
    expect(result.originalPrice).toBeNull()
  })
})

describe("getDiscountPercentage", () => {
  it("computes a rounded discount", () => {
    expect(getDiscountPercentage(toShowcaseProduct(baseProduct))).toBe(53)
  })

  it("returns null when there is no original price", () => {
    const product = toShowcaseProduct({ ...baseProduct, productId: 9999 })
    expect(getDiscountPercentage(product)).toBeNull()
  })

  it("returns null when the original price is not above the price", () => {
    const product = { ...toShowcaseProduct(baseProduct), originalPrice: 50 }
    expect(getDiscountPercentage(product)).toBeNull()
  })
})

describe("getSpecSnippet", () => {
  it("joins voltage and speed", () => {
    expect(getSpecSnippet(toShowcaseProduct(baseProduct))).toBe(
      "20V Max / 0-1800 RPM / 50 Nm"
    )
  })

  it("falls back to power input when no speed or torque exists", () => {
    const product = toShowcaseProduct({ ...baseProduct, productId: 2 })
    expect(getSpecSnippet(product)).toBe("230V / 11000 RPM")
  })
})

describe("toShowcaseProducts / maxPrice", () => {
  const response: ProductResponse = {
    products: [baseProduct, { ...baseProduct, productId: 2, price: 250 }],
    page: 0,
    size: 2,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  }

  it("maps every product in the response", () => {
    expect(toShowcaseProducts(response)).toHaveLength(2)
  })

  it("returns the highest price in the set", () => {
    expect(maxPrice(toShowcaseProducts(response))).toBe(250)
  })

  it("returns 0 for an empty set", () => {
    expect(maxPrice([])).toBe(0)
  })
})

describe("getMockAttributes", () => {
  it("is deterministic for the same product id", () => {
    expect(getMockAttributes(3)).toBe(getMockAttributes(3))
  })
})
