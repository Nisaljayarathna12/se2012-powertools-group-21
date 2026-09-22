export const ACTION_STATUSES = [
  "PLACED",
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
  "FAILED",
]

export const UPDATEABLE_STATUSES: string[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]

export type StatusVariant = "default" | "secondary" | "destructive" | "outline"

export function statusVariant(status: string): StatusVariant {
  const s = status.toUpperCase()
  if (s === "CANCELLED" || s === "RETURNED" || s === "FAILED") {
    return "destructive"
  }
  if (s === "DELIVERED" || s === "COMPLETED") {
    return "default"
  }
  if (
    s === "PLACED" ||
    s === "PENDING" ||
    s === "PROCESSING" ||
    s === "SHIPPED"
  ) {
    return "secondary"
  }
  return "outline"
}