import { useSyncExternalStore } from "react"
import { fetchCartCount } from "@/lib/api"

let count = 0
let listeners: Array<() => void> = []

function emit(): void {
  listeners.forEach((listener) => listener())
}

export function setCartCount(value: number): void {
  count = value
  emit()
}

export function getCartCount(): number {
  return count
}

export async function refreshCartCount(): Promise<void> {
  try {
    const data = await fetchCartCount()
    setCartCount(data.totalQuantity)
  } catch {
    setCartCount(0)
  }
}

function subscribe(callback: () => void): () => void {
  listeners.push(callback)
  return () => {
    listeners = listeners.filter((listener) => listener !== callback)
  }
}

function getSnapshot(): number {
  return count
}

function getServerSnapshot(): number {
  return 0
}

export function useCartCount(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}