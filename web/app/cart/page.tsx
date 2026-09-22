"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  ApiError,
  fetchCart,
  removeCartItem,
  updateCartItem,
  type Cart,
  type CartItem,
} from "@/lib/api"
import { refreshCartCount } from "@/lib/cart"
import { clearToken, getToken, useIsLoggedIn } from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { notify } from "@/lib/toast"

function draftsFromCart(cart: Cart): Record<number, string> {
  return Object.fromEntries(
    cart.items.map((item) => [item.cartItemId, String(item.quantity)])
  )
}

export default function CartPage() {
  const router = useRouter()
  const loggedIn = useIsLoggedIn()

  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notCustomer, setNotCustomer] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [removing, setRemoving] = useState<CartItem | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }

    let cancelled = false

    fetchCart()
      .then((res) => {
        if (cancelled) return
        setCart(res)
        setDrafts(draftsFromCart(res))
        setNotCustomer(false)
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
          setNotCustomer(true)
          return
        }
        setError(err instanceof Error ? err.message : "Failed to load cart")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [router])

  if (!loggedIn) {
    return null
  }

  if (notCustomer) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Cart unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only customer accounts can use the shopping cart.
          </p>
        </div>
      </div>
    )
  }

  const items = cart?.items ?? []

  function itemQty(item: CartItem): number {
    const draft = drafts[item.cartItemId]
    if (draft === undefined) return item.quantity
    const parsed = Number(draft)
    if (!Number.isFinite(parsed)) return item.quantity
    return Math.min(Math.max(1, Math.trunc(parsed)), item.stockQty)
  }

  function lineTotal(item: CartItem): number {
    return item.price * itemQty(item)
  }

  const totalQuantity = items.reduce((sum, item) => sum + itemQty(item), 0)
  const totalAmount = items.reduce((sum, item) => sum + lineTotal(item), 0)

  async function syncQuantity(item: CartItem, quantity: number) {
    setBusyId(item.cartItemId)
    setError(null)
    try {
      const updated = await updateCartItem(item.cartItemId, quantity)
      setCart(updated)
      setDrafts(draftsFromCart(updated))
      refreshCartCount()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
        return
      }
      setDrafts((prev) => ({ ...prev, [item.cartItemId]: String(item.quantity) }))
      setError(err instanceof Error ? err.message : "Failed to update cart")
    } finally {
      setBusyId(null)
    }
  }

  function clearPendingTimer(cartItemId: number) {
    const timer = timersRef.current[cartItemId]
    if (timer) {
      clearTimeout(timer)
      delete timersRef.current[cartItemId]
    }
  }

  function step(item: CartItem, delta: number) {
    const current = itemQty(item)
    const next = Math.min(Math.max(1, current + delta), item.stockQty)
    if (next === current) return

    setDrafts((prev) => ({ ...prev, [item.cartItemId]: String(next) }))
    clearPendingTimer(item.cartItemId)
    syncQuantity(item, next)
  }

  function handleInputChange(item: CartItem, raw: string) {
    setDrafts((prev) => ({ ...prev, [item.cartItemId]: raw }))

    const parsed = Number(raw)
    if (raw === "" || !Number.isFinite(parsed) || parsed < 1) {
      return
    }

    clearPendingTimer(item.cartItemId)
    timersRef.current[item.cartItemId] = setTimeout(() => {
      delete timersRef.current[item.cartItemId]
      syncQuantity(item, Math.trunc(parsed))
    }, 450)
  }

  function handleInputBlur(item: CartItem) {
    clearPendingTimer(item.cartItemId)

    const current = itemQty(item)
    setDrafts((prev) => ({ ...prev, [item.cartItemId]: String(current) }))

    if (current !== item.quantity) {
      syncQuantity(item, current)
    }
  }

  async function handleRemove() {
    if (!removing) return

    setBusyId(removing.cartItemId)
    setDialogError(null)
    try {
      const updated = await removeCartItem(removing.cartItemId)
      setCart(updated)
      setDrafts(draftsFromCart(updated))
      refreshCartCount()
      notify(`${removing.name} removed from cart`)
      setRemoving(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
        return
      }
      setDialogError(
        err instanceof Error ? err.message : "Failed to remove item"
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Your cart</h1>
        {cart ? (
          <span className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        <Card>
          <CardContent className="p-0">
            {loading && !cart ? (
              <div className="px-6 py-8">
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded bg-muted"
                    />
                  ))}
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                <h2 className="mt-3 text-lg font-semibold">
                  Your cart is empty
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Browse the catalogue and add some power tools.
                </p>
                <Button
                  className="mt-4"
                  nativeButton={false}
                  render={<Link href="/products" />}
                >
                  Browse products
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {items.map((item: CartItem) => {
                  const busy = busyId === item.cartItemId
                  const qty = itemQty(item)
                  return (
                    <li
                      key={item.cartItemId}
                      className="flex gap-4 p-4"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 items-center justify-between gap-3">
                        <div>
                          <Link
                            href={`/products/${item.productId}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {formatPrice(item.price)} each
                          </p>
                          {item.stockQty > qty ? null : (
                            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
                              Only {item.stockQty} left in stock
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => step(item, -1)}
                              disabled={busy || qty <= 1}
                              aria-label="Decrease quantity"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={item.stockQty}
                              value={drafts[item.cartItemId] ?? String(item.quantity)}
                              onChange={(e) =>
                                handleInputChange(item, e.target.value)
                              }
                              onBlur={() => handleInputBlur(item)}
                              disabled={busy}
                              aria-label={`Quantity of ${item.name}`}
                              className="h-8 w-14 rounded-md border border-input bg-background px-1 text-center text-sm tabular-nums outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => step(item, 1)}
                              disabled={busy || qty >= item.stockQty}
                              aria-label="Increase quantity"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-semibold">
                            {formatPrice(lineTotal(item))}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setRemoving(item)
                          setDialogError(null)
                        }}
                        disabled={busy}
                        aria-label={`Remove ${item.name} from cart`}
                        className="self-start rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {items.length > 0 && cart ? (
          <div className="rounded-lg border bg-background px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Cart total ({totalQuantity}{" "}
                {totalQuantity === 1 ? "item" : "items"})
              </span>
              <span className="text-2xl font-bold">
                {formatPrice(totalAmount)}
              </span>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" nativeButton={false} render={<Link href="/products" />}>
                Continue Shopping
              </Button>
              <Button nativeButton={false} render={<Link href="/checkout" />}>
                Proceed to Checkout
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {removing ? (
        <ConfirmDialog
          open
          title={`Remove "${removing.name}"?`}
          description="This item will be removed from your cart."
          confirmLabel="Remove"
          busy={busyId === removing.cartItemId}
          error={dialogError}
          onConfirm={handleRemove}
          onCancel={() => setRemoving(null)}
        />
      ) : null}
    </div>
  )
}