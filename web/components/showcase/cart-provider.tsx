"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import {
  ApiError,
  addToCart as apiAddToCart,
  fetchCart,
  removeCartItem as apiRemoveCartItem,
  updateCartItem as apiUpdateCartItem,
  type Cart,
} from "@/lib/api"
import { refreshCartCount } from "@/lib/cart"
import { clearToken, useIsLoggedIn, useRole } from "@/lib/auth"
import { notify } from "@/lib/toast"

interface CartContextValue {
  cart: Cart | null
  loading: boolean
  pending: boolean
  isCustomer: boolean
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (productId: number, quantity?: number) => Promise<boolean>
  changeQuantity: (cartItemId: number, quantity: number) => Promise<void>
  removeItem: (cartItemId: number) => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

/**
 * Cart state backed by the Spring Boot /api/cart endpoints rather than the
 * local-state array the original Bolt CartContext used, so the drawer, the
 * header badge and the checkout page all read the same server-side cart.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const loggedIn = useIsLoggedIn()
  const role = useRole()
  const isCustomer = loggedIn && role === "CUSTOMER"

  const [cart, setCart] = useState<Cart | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [pending, setPending] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // The server cart only exists for a signed-in customer, so both the value
  // and the loading flag are derived rather than reset from an effect.
  const activeCart = isCustomer ? cart : null
  const loading = isCustomer && !loaded

  const handleAuthError = useCallback(() => {
    setIsCartOpen(false)
    clearToken()
    router.push("/login")
  }, [router])

  const run = useCallback(
    async (action: () => Promise<Cart | void>) => {
      setPending(true)
      try {
        const next = await action()
        if (next) setCart(next)
        refreshCartCount()
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleAuthError()
          return
        }
        notify(err instanceof Error ? err.message : "Cart update failed")
      } finally {
        setPending(false)
      }
    },
    [handleAuthError]
  )

  useEffect(() => {
    if (!isCustomer) return

    let cancelled = false

    fetchCart()
      .then((data) => {
        if (!cancelled) setCart(data)
      })
      .catch(() => {
        if (!cancelled) setCart(null)
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [isCustomer])

  const addItem = useCallback(
    async (productId: number, quantity = 1) => {
      if (!isCustomer) {
        router.push("/login")
        return false
      }

      let added = false
      await run(async () => {
        const next = await apiAddToCart(productId, quantity)
        added = true
        notify(`${quantity} item${quantity === 1 ? "" : "s"} added to cart`)
        return next
      })
      if (added) setIsCartOpen(true)
      return added
    },
    [isCustomer, router, run]
  )

  const changeQuantity = useCallback(
    async (cartItemId: number, quantity: number) => {
      if (quantity <= 0) {
        await run(() => apiRemoveCartItem(cartItemId))
        return
      }
      await run(() => apiUpdateCartItem(cartItemId, quantity))
    },
    [run]
  )

  const removeItem = useCallback(
    async (cartItemId: number) => {
      await run(() => apiRemoveCartItem(cartItemId))
    },
    [run]
  )

  const value = useMemo<CartContextValue>(
    () => ({
      cart: activeCart,
      loading,
      pending,
      isCustomer,
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      addItem,
      changeQuantity,
      removeItem,
    }),
    [
      activeCart,
      loading,
      pending,
      isCustomer,
      isCartOpen,
      addItem,
      changeQuantity,
      removeItem,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
