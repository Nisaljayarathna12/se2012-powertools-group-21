import { formatPrice } from "@/lib/format"

// Intl separates the LKR code from the amount with U+00A0 (no-break space).
const NBSP = "\u00A0"

describe("formatPrice", () => {
  it("formats LKR with no decimals", () => {
    expect(formatPrice(1234.5)).toBe(`LKR${NBSP}1,235`)
  })

  it("handles zero", () => {
    expect(formatPrice(0)).toBe(`LKR${NBSP}0`)
  })

  it("handles negative values", () => {
    expect(formatPrice(-12.1)).toBe(`-LKR${NBSP}12`)
  })

  it("groups thousands for large amounts", () => {
    expect(formatPrice(1200000)).toBe(`LKR${NBSP}1,200,000`)
  })
})
