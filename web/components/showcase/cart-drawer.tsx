"use client"

import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { useCart } from "@/components/showcase/cart-provider"
import { formatPrice } from "@/lib/format"

export function CartDrawer() {
  const { cart, isCartOpen, closeCart, changeQuantity, removeItem, pending } =
    useCart()

  if (!isCartOpen) return null

  const items = cart?.items ?? []

  return (
    <>
      <div
        className="fixed inset-0 z-50 animate-fade-in bg-industrial-900/60 backdrop-blur-sm"
        onClick={closeCart}
      />

      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md animate-slide-in-right flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-industrial-200 bg-industrial-800 px-4 py-4">
          <div className="flex items-center gap-2 text-white">
            <ShoppingBag size={20} className="text-safety-400" />
            <span className="font-display text-lg font-bold">
              Your Cart ({cart?.itemCount ?? 0})
            </span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-industrial-700"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag size={48} className="mb-4 text-industrial-300" />
              <p className="text-lg font-semibold text-industrial-700">
                Your cart is empty
              </p>
              <p className="mt-1 text-sm text-industrial-500">
                Browse our catalog to find quality power tools
              </p>
              <Link
                href="/catalog"
                onClick={closeCart}
                className="btn-primary mt-6"
              >
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex gap-3 rounded-lg border border-industrial-200 p-3"
                >
                  <Link
                    href={`/products/${item.productId}`}
                    onClick={closeCart}
                    className="shrink-0"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-industrial-100 text-center text-[10px] text-industrial-400">
                        No image
                      </div>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.productId}`}
                        onClick={closeCart}
                        className="text-sm font-semibold text-industrial-800 hover:text-safety-600"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.cartItemId)}
                        disabled={pending}
                        className="shrink-0 text-industrial-400 hover:text-red-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <span className="text-xs text-industrial-500">
                      {formatPrice(item.price)} each
                    </span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-industrial-200">
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(item.cartItemId, item.quantity - 1)
                          }
                          disabled={pending}
                          className="flex h-7 w-7 items-center justify-center text-industrial-600 hover:bg-industrial-50 disabled:opacity-50"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(item.cartItemId, item.quantity + 1)
                          }
                          disabled={pending || item.quantity >= item.stockQty}
                          className="flex h-7 w-7 items-center justify-center text-industrial-600 hover:bg-industrial-50 disabled:opacity-50"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-industrial-900">
                        {formatPrice(item.lineTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-industrial-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-industrial-600">
                Subtotal ({cart?.totalQuantity ?? 0} item
                {cart?.totalQuantity === 1 ? "" : "s"})
              </span>
              <span className="text-xl font-bold text-industrial-900">
                {formatPrice(cart?.totalAmount ?? 0)}
              </span>
            </div>
            <p className="mb-3 text-xs text-industrial-500">
              Shipping and taxes calculated at checkout
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/cart"
              onClick={closeCart}
              className="mt-2 block text-center text-sm font-medium text-industrial-600 hover:text-safety-600"
            >
              View full cart
            </Link>
          </div>
        ) : null}
      </div>
    </>
  )
}
