import { useSyncExternalStore } from "react"

const TOKEN_KEY = "powertools_token"
const AUTH_CHANGE_EVENT = "powertools-auth-change"

export type Role = "ADMIN" | "CUSTOMER"

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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export function getRole(): Role | null {
  if (typeof window === "undefined") return null

  const token = getToken()
  if (!token) return null

  const payload = decodeJwtPayload(token)
  if (!payload) return null

  if (typeof payload.exp === "number" && Date.now() >= payload.exp * 1000) {
    return null
  }

  return payload.role === "ADMIN" || payload.role === "CUSTOMER"
    ? payload.role
    : null
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

function getRoleSnapshot(): Role | null {
  return getRole()
}

function getServerRoleSnapshot(): Role | null {
  return null
}

export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useRole(): Role | null {
  return useSyncExternalStore(subscribe, getRoleSnapshot, getServerRoleSnapshot)
}