"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ApiError,
  fetchAdminOrders,
  updateOrderStatus,
  type AdminOrder,
  type AdminOrdersResponse,
} from "@/lib/api"
import {
  clearToken,
  getRole,
  getToken,
  useIsLoggedIn,
  useRole,
} from "@/lib/auth"
import { OrderStatusSelect } from "@/components/order-status-select"
import { ACTION_STATUSES, statusVariant } from "@/lib/order-status"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

const ORDERS_PER_PAGE = 10

type SortField = "date" | "total" | "status"

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"

export default function AdminOrdersPage() {
  const router = useRouter()
  const loggedIn = useIsLoggedIn()
  const role = useRole()

  const [status, setStatus] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [sort, setSort] = useState<SortField>("date")
  const [direction, setDirection] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(0)
  const [data, setData] = useState<AdminOrdersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }

    if (getRole() === null) {
      clearToken()
      router.replace("/login")
      return
    }

    if (role !== "ADMIN") return

    let cancelled = false

    fetchAdminOrders(page, ORDERS_PER_PAGE, {
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
      sort,
      direction,
    })
      .then((res) => {
        if (cancelled) return
        setData(res)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearToken()
          router.replace("/login")
          return
        }
        if (err instanceof ApiError && err.status === 403) {
          setError("You do not have permission to view orders.")
          return
        }
        setError(
          err instanceof Error ? err.message : "Failed to load orders"
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [router, role, page, status, from, to, sort, direction])

  if (!loggedIn || role === null) {
    return null
  }

  if (role !== "ADMIN") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">403 — Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only administrators can view orders.
          </p>
        </div>
      </div>
    )
  }

  function handleStatusChange(value: string) {
    setStatus(value)
    setPage(0)
  }

  function handleFromChange(value: string) {
    setFrom(value)
    setPage(0)
  }

  function handleToChange(value: string) {
    setTo(value)
    setPage(0)
  }

  function handleSortChange(value: string) {
    setSort(value as SortField)
    setPage(0)
  }

  function toggleDirection() {
    setDirection((d) => (d === "asc" ? "desc" : "asc"))
    setPage(0)
  }

  function clearFilters() {
    setStatus("")
    setFrom("")
    setTo("")
    setSort("date")
    setDirection("desc")
    setPage(0)
  }

  const hasActiveFilters =
    status !== "" || from !== "" || to !== "" || sort !== "date" || direction !== "desc"

  function toggleExpanded(orderId: number) {
    setExpandedId((current) => (current === orderId ? null : orderId))
  }

  async function handleStatusUpdate(
    orderId: number,
    newStatus: string
  ): Promise<void> {
    try {
      const updated = await updateOrderStatus(orderId, newStatus)
      setData((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((o) =>
                o.orderId === orderId ? updated : o
              ),
            }
          : prev
      )
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
        return
      }
      throw err
    }
  }

  const orders = data?.content ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Orders</h1>
          {data ? (
            <Badge variant="outline">{data.totalElements} total</Badge>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Review orders so you can manage fulfillment and track sales.
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[180px] flex-1">
              <label htmlFor="order-status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="order-status"
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={cn(
                  inputClass,
                  "mt-1",
                  !status && "text-muted-foreground"
                )}
              >
                <option value="">All statuses</option>
                {ACTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[160px]">
              <label htmlFor="order-from" className="text-sm font-medium">
                From date
              </label>
              <input
                id="order-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => handleFromChange(e.target.value)}
                className={cn(inputClass, "mt-1")}
              />
            </div>

            <div className="min-w-[160px]">
              <label htmlFor="order-to" className="text-sm font-medium">
                To date
              </label>
              <input
                id="order-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => handleToChange(e.target.value)}
                className={cn(inputClass, "mt-1")}
              />
            </div>

            <div className="min-w-[180px] flex-1">
              <label htmlFor="order-sort" className="text-sm font-medium">
                Sort by
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  id="order-sort"
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className={cn(inputClass)}
                >
                  <option value="date">Order date</option>
                  <option value="total">Total amount</option>
                  <option value="status">Status</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleDirection}
                  aria-label={
                    direction === "asc" ? "Ascending" : "Descending"
                  }
                  title={direction === "asc" ? "Ascending" : "Descending"}
                >
                  {direction === "asc" ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Clear filters
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <div className="mt-6">
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        </div>
      ) : null}

      <Card className="mt-6">
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="px-6 py-8">
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded bg-muted"
                  />
                ))}
              </div>
            </div>
          ) : orders.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              {data
                ? "No orders match your filters. Try adjusting the criteria."
                : "No orders yet. Orders placed by customers will appear here."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Details</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: AdminOrder) => {
                    const expanded = expandedId === order.orderId
                    return (
                      <FragmentRow
                        key={order.orderId}
                        order={order}
                        expanded={expanded}
                        onToggle={() => toggleExpanded(order.orderId)}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
                <span>
                  {data
                    ? `Showing ${
                        data.totalElements === 0
                          ? 0
                          : data.page * data.size + 1
                      }–${Math.min(
                          (data.page + 1) * data.size,
                          data.totalElements
                        )} of ${data.totalElements} orders`
                    : ""}
                </span>
                {data ? (
                  <Pagination
                    page={data.page}
                    totalPages={data.totalPages}
                    onPageChange={setPage}
                  />
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FragmentRow({
  order,
  expanded,
  onToggle,
  onStatusUpdate,
}: {
  order: AdminOrder
  expanded: boolean
  onToggle: () => void
  onStatusUpdate: (orderId: number, status: string) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStatusChange(newStatus: string) {
    if (newStatus === order.status) return
    setSaving(true)
    setError(null)
    try {
      await onStatusUpdate(order.orderId, newStatus)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update order status"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TableRow
        onClick={onToggle}
        className={cn("cursor-pointer", expanded && "bg-muted/50")}
        aria-expanded={expanded}
      >
        <TableCell className="font-medium">#{order.orderId}</TableCell>
        <TableCell>{order.customerName ?? "Guest customer"}</TableCell>
        <TableCell className="text-muted-foreground">
          {order.orderDate}
        </TableCell>
        <TableCell className="text-right">
          {formatPrice(order.totalAmount)}
        </TableCell>
        <TableCell>
          <Badge variant={statusVariant(order.status)}>
            {order.status}
          </Badge>
        </TableCell>
        <TableCell>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
      </TableRow>
      {expanded ? (
        <TableRow>
          <TableCell colSpan={6} className="whitespace-normal">
            <div className="grid gap-6 rounded-lg border bg-muted/50 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="font-medium">Shipping address</p>
                <p className="mt-1 text-muted-foreground">
                  {order.shippingAddress}
                </p>
              </div>
              <div>
                <p className="font-medium">Update status</p>
                <p className="mt-1 text-muted-foreground">
                  Status changes are logged with a timestamp and shown to the
                  customer in their order history.
                </p>
                <div className="mt-2">
                  <OrderStatusSelect
                    id={`order-status-${order.orderId}`}
                    value={order.status}
                    onStatusChange={handleStatusChange}
                    disabled={saving}
                    label={`Update status for order #${order.orderId}`}
                  />
                </div>
                {saving ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Saving status…
                  </p>
                ) : null}
                {error ? (
                  <p
                    role="alert"
                    className="mt-2 text-sm text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}