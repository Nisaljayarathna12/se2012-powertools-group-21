import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  getStockStatus,
} from "@/lib/stock"

describe("getStockStatus", () => {
  it("reports out of stock at zero or below", () => {
    expect(getStockStatus(0)).toBe("out-of-stock")
    expect(getStockStatus(-2)).toBe("out-of-stock")
  })

  it("reports low stock at or below the default threshold", () => {
    expect(getStockStatus(1)).toBe("low-stock")
    expect(getStockStatus(DEFAULT_LOW_STOCK_THRESHOLD)).toBe("low-stock")
  })

  it("reports in stock above the threshold", () => {
    expect(getStockStatus(DEFAULT_LOW_STOCK_THRESHOLD + 1)).toBe("in-stock")
  })

  it("honors a custom threshold", () => {
    expect(getStockStatus(3, 1)).toBe("in-stock")
    expect(getStockStatus(1, 10)).toBe("low-stock")
  })
})