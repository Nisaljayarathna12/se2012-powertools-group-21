import { useSyncExternalStore } from "react"

const TOKEN_KEY = "powertools_token"
const AUTH_CHANGE_EVENT = "powertools-auth-change"

function notifyAuthChange(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

export function saveToken(token: string): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TOKEN_KEY, token)
  notifyAuthChange()
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function clearToken(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TOKEN_KEY)
  notifyAuthChange()
}

export function isCustomerLoggedIn(): boolean {
  if (typeof document === "undefined") return false
  return Boolean(getToken()) || document.cookie.includes("customerId=")
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(AUTH_CHANGE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

function getSnapshot(): boolean {
  return isCustomerLoggedIn()
}

function getServerSnapshot(): boolean {
  return false
}

export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}