export type StockStatus = "in-stock" | "low-stock" | "out-of-stock"

export const DEFAULT_LOW_STOCK_THRESHOLD = 5

export function getStockStatus(
  stockQty: number,
  lowStockThreshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): StockStatus {
  if (stockQty <= 0) return "out-of-stock"
  if (stockQty <= lowStockThreshold) return "low-stock"
  return "in-stock"
}