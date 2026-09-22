"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  Package,
  PlusCircle,
  ShoppingCart,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StockBadge } from "@/components/stock-badge"
import {
  ApiError,
  fetchAdminDashboard,
  type AdminDashboard,
  type AdminOrder,
} from "@/lib/api"
import {
  clearToken,
  getRole,
  getToken,
  useIsLoggedIn,
  useRole,
} from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { statusVariant } from "@/lib/order-status"

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: number | string
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const loggedIn = useIsLoggedIn()
  const role = useRole()
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

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

    fetchAdminDashboard()
      .then((data) => {
        if (!cancelled) setDashboard(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearToken()
          router.replace("/login")
          return
        }
        if (err instanceof ApiError && err.status === 403) {
          setLoadError("You do not have permission to access the admin panel.")
          return
        }
        setLoadError(
          err instanceof Error ? err.message : "Failed to load admin dashboard"
        )
      })

    return () => {
      cancelled = true
    }
  }, [router, role])

  if (!loggedIn || role === null) {
    return null
  }

  if (role !== "ADMIN") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">403 — Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The admin panel is only available to administrators. Sign in with an
            admin account to continue.
          </p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {loadError}
        </div>
      </div>
    )
  }

  const recentOrders = dashboard?.recentOrders ?? []
  const lowStockProducts = dashboard?.lowStockProducts ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Admin dashboard</h1>
            {dashboard ? (
              <Badge variant="outline">{dashboard.user.role}</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {dashboard
              ? `Welcome back, ${dashboard.user.name}. Here's what's happening in your store.`
              : "Loading your workspace…"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/products" />}
          >
            <Package className="h-4 w-4" />
            Manage Products
          </Button>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/products/new" />}
          >
            <PlusCircle className="h-4 w-4" />
            Add Product
          </Button>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/orders" />}
          >
            View Orders
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Package className="h-4 w-4" />}
          label="Total products"
          value={dashboard?.products ?? "—"}
        />
        <MetricCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Total orders"
          value={dashboard?.orders ?? "—"}
        />
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="Total customers"
          value={dashboard?.customers ?? "—"}
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Low stock alerts"
          value={dashboard?.lowStockCount ?? "—"}
        />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/orders" />}
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <Card className="mt-3">
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No orders yet. Orders placed by customers will appear here.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order: AdminOrder) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="font-medium">
                        #{order.orderId}
                      </TableCell>
                      <TableCell>
                        {order.customerName ?? "Guest customer"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.orderDate}
                      </TableCell>
                      <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Low stock alerts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Products at or below the low stock threshold need restocking.
        </p>

        <Card className="mt-3">
          <CardContent className="p-0">
            {lowStockProducts.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                All products are fully stocked.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.categoryName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StockBadge stockQty={product.stockQty} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}