import { formatPrice } from "@/lib/format"

describe("formatPrice", () => {
  it("formats dollars with cents", () => {
    expect(formatPrice(1234.5)).toBe("$1,234.50")
  })

  it("handles zero", () => {
    expect(formatPrice(0)).toBe("$0.00")
  })

  it("handles negative values", () => {
    expect(formatPrice(-12.1)).toBe("-$12.10")
  })
})