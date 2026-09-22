"use client"

import { Badge } from "@/components/ui/badge"
import { statusVariant, UPDATEABLE_STATUSES } from "@/lib/order-status"
import { cn } from "@/lib/utils"

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"

export function OrderStatusSelect({
  value,
  onStatusChange,
  disabled = false,
  id,
  label,
}: {
  value: string
  onStatusChange: (status: string) => void
  disabled?: boolean
  id?: string
  label?: string
}) {
  const options =
    UPDATEABLE_STATUSES.includes(value) || !value
      ? UPDATEABLE_STATUSES
      : [value, ...UPDATEABLE_STATUSES]

  const control = (
    <select
      id={id}
      value={value}
      onChange={(e) => onStatusChange(e.target.value)}
      disabled={disabled}
      aria-label={label ?? "Update order status"}
      className={cn(selectClass)}
    >
      {options.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={statusVariant(value)}>{value}</Badge>
      </div>
      {control}
    </div>
  )
}