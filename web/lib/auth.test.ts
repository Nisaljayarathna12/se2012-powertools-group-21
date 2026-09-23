import { renderHook, act } from "@testing-library/react"
import {
  clearToken,
  getRole,
  getToken,
  isCustomerLoggedIn,
  saveToken,
  useIsLoggedIn,
  useRole,
} from "@/lib/auth"

function makeToken(payload: Record<string, unknown>): string {
  const b64 = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url")
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.${b64({})}`
}

describe("auth token helpers", () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.cookie = "customerId=; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  })

  it("saves, reads, and clears the token", () => {
    expect(getToken()).toBeNull()
    saveToken("abc.def.ghi")
    expect(getToken()).toBe("abc.def.ghi")
    clearToken()
    expect(getToken()).toBeNull()
  })

  it("returns null for a malformed token", () => {
    window.localStorage.setItem("powertools_token", "not-a-jwt")
    expect(getRole()).toBeNull()
  })

  it("reads the role from a valid token", () => {
    window.localStorage.setItem(
      "powertools_token",
      makeToken({ role: "ADMIN", exp: 4102444800 })
    )
    expect(getRole()).toBe("ADMIN")
  })

  it("returns null once the token has expired", () => {
    window.localStorage.setItem(
      "powertools_token",
      makeToken({ role: "CUSTOMER", exp: 1 })
    )
    expect(getRole()).toBeNull()
  })

  it("returns null for an unknown role", () => {
    window.localStorage.setItem(
      "powertools_token",
      makeToken({ role: "SUPERUSER", exp: 4102444800 })
    )
    expect(getRole()).toBeNull()
  })

  it("detects a logged-in customer via token or cookie", () => {
    expect(isCustomerLoggedIn()).toBe(false)
    saveToken("abc.def.ghi")
    expect(isCustomerLoggedIn()).toBe(true)
    clearToken()
    document.cookie = "customerId=42"
    expect(isCustomerLoggedIn()).toBe(true)
  })
})

describe("auth hooks", () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.cookie = "customerId=; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  })

  it("tracks login state reactively", () => {
    const { result, rerender } = renderHook(() => useIsLoggedIn())
    expect(result.current).toBe(false)

    act(() => saveToken("abc.def.ghi"))
    rerender()
    expect(result.current).toBe(true)

    act(() => clearToken())
    rerender()
    expect(result.current).toBe(false)
  })

  it("tracks the role reactively", () => {
    const { result, rerender } = renderHook(() => useRole())
    expect(result.current).toBeNull()

    act(() =>
      saveToken(makeToken({ role: "ADMIN", exp: 4102444800 }))
    )
    rerender()
    expect(result.current).toBe("ADMIN")
  })
})