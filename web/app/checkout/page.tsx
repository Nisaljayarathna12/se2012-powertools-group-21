"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ApiError,
  createOrder,
  fetchCart,
  type Cart,
  type CartItem,
} from "@/lib/api"
import { refreshCartCount } from "@/lib/cart"
import { clearToken, getToken, useIsLoggedIn } from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"

interface FormErrors {
  street?: string
  city?: string
  postalCode?: string
  phone?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const loggedIn = useIsLoggedIn()

  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notCustomer, setNotCustomer] = useState(false)
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [phone, setPhone] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
          <h1 className="text-2xl font-semibold">Checkout unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only customer accounts can place orders.
          </p>
        </div>
      </div>
    )
  }

  const items = cart?.items ?? []

  function validate(): FormErrors {
    const next: FormErrors = {}
    if (!street.trim()) next.street = "Street address is required"
    if (!city.trim()) next.city = "City is required"
    if (!postalCode.trim()) next.postalCode = "Postal code is required"
    if (!phone.trim()) next.phone = "Phone number is required"
    return next
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const next = validate()
    setErrors(next)
    setFormError(null)

    if (Object.keys(next).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      const order = await createOrder({
        street: street.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        phone: phone.trim(),
      })
      refreshCartCount()
      router.replace(`/checkout/success?orderId=${order.orderId}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
        return
      }
      setFormError(err instanceof Error ? err.message : "Failed to place order")
      setSubmitting(false)
    }
  }

  if (loading && !cart) {
    return (
      <div className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-5xl px-4 py-8 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (!cart || items.length === 0) {
    return (
      <div className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center py-16 text-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          <h1 className="mt-3 text-xl font-semibold">Your cart is empty</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add some items to your cart before checking out.
          </p>
          <Button
            className="mt-4"
            nativeButton={false}
            render={<Link href="/products" />}
          >
            Browse products
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Checkout</h1>

      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="h-fit">
            <CardContent className="px-6 py-5">
              <h2 className="text-base font-semibold">Shipping address</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                We need these details to deliver your order.
              </p>

              <div className="mt-5 space-y-4">
                {formError ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {formError}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label htmlFor="street" className="text-sm font-medium">
                    Street address
                  </label>
                  <input
                    id="street"
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    aria-invalid={Boolean(errors.street)}
                    aria-describedby={errors.street ? "street-error" : undefined}
                    placeholder="123 Example St"
                    autoComplete="street-address"
                    className={cn(
                      inputClass,
                      errors.street && "border-destructive"
                    )}
                  />
                  {errors.street ? (
                    <p id="street-error" className="text-sm text-destructive">
                      {errors.street}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm font-medium">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    aria-invalid={Boolean(errors.city)}
                    aria-describedby={errors.city ? "city-error" : undefined}
                    placeholder="City name"
                    autoComplete="address-level2"
                    className={cn(inputClass, errors.city && "border-destructive")}
                  />
                  {errors.city ? (
                    <p id="city-error" className="text-sm text-destructive">
                      {errors.city}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="postalCode" className="text-sm font-medium">
                      Postal code
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      aria-invalid={Boolean(errors.postalCode)}
                      aria-describedby={
                        errors.postalCode ? "postalCode-error" : undefined
                      }
                      placeholder="12345"
                      autoComplete="postal-code"
                      className={cn(
                        inputClass,
                        errors.postalCode && "border-destructive"
                      )}
                    />
                    {errors.postalCode ? (
                      <p
                        id="postalCode-error"
                        className="text-sm text-destructive"
                      >
                        {errors.postalCode}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? "phone-error" : undefined}
                      placeholder="+1 555 000 0000"
                      autoComplete="tel"
                      className={cn(
                        inputClass,
                        errors.phone && "border-destructive"
                      )}
                    />
                    {errors.phone ? (
                      <p id="phone-error" className="text-sm text-destructive">
                        {errors.phone}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardContent className="px-6 py-5">
              <h2 className="text-base font-semibold">Order summary</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>

              <ul className="mt-4 divide-y">
                {items.map((item: CartItem) => (
                  <li key={item.cartItemId} className="flex items-center gap-3 py-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-medium">Total</span>
                <span className="text-xl font-bold">
                  {formatPrice(cart.totalAmount)}
                </span>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <Truck className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Payment method: <span className="font-medium">Cash on Delivery</span>.
                  The delivery agent will collect payment when your order arrives.
                </p>
              </div>

              <Button className="mt-4 w-full" type="submit" disabled={submitting}>
                {submitting ? "Placing order…" : "Place Order"}
              </Button>

              <Link
                href="/cart"
                className="mt-3 block text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Back to cart
              </Link>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}