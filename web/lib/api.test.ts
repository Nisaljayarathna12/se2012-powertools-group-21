import {
  ApiError,
  fetchAdminOrders,
  fetchCategories,
  fetchProducts,
  loginUser,
  updateOrderStatus,
} from "@/lib/api"
import { saveToken } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

describe("api client", () => {
  beforeEach(() => {
    window.localStorage.clear()
    global.fetch = jest.fn()
  })

  it("builds product query params and returns products", async () => {
    const payload = { products: [], page: 0, size: 12, totalElements: 0, totalPages: 0, first: true, last: true }
    jest.mocked(global.fetch).mockResolvedValue(jsonResponse(payload))

    await fetchProducts(2, 9, "hammer", "cat-1")

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/api/products?page=2&size=9&search=hammer&category=cat-1`
    )
  })

  it("omits optional product query params when unused", async () => {
    jest.mocked(global.fetch).mockResolvedValue(jsonResponse({ products: [] }))

    await fetchProducts()

    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/api/products?page=0&size=12`)
  })

  it("throws for a failed categories fetch", async () => {
    jest.mocked(global.fetch).mockResolvedValue(jsonResponse({}, false, 500))

    await expect(fetchCategories()).rejects.toThrow("Failed to fetch categories")
  })

  it("postJson serializes the request body", async () => {
    jest.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ token: "t", role: "ADMIN", userId: 1 })
    )

    await loginUser({ email: "a@b.c", password: "pw" })

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/api/auth/login`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.c", password: "pw" }),
      })
    )
  })

  it("surfaces the backend message on errors", async () => {
    jest.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ message: "Invalid credentials" }, false, 401)
    )

    await expect(loginUser({ email: "a@b.c", password: "wrong" })).rejects.toThrow(
      "Invalid credentials"
    )
  })

  it("falls back to the default message when the body is not json", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.reject(new Error("parse")),
    } as unknown as Response)

    const error = await loginUser({ email: "a@b.c", password: "wrong" }).catch(
      (e) => e
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(503)
    expect(error.message).toBe("Login failed. Please try again.")
  })

  it("attaches the bearer token to authenticated calls", async () => {
    saveToken("jwt-123")
    jest.mocked(global.fetch).mockResolvedValue(jsonResponse({}))

    await updateOrderStatus(7, "SHIPPED")

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/api/admin/orders/7/status`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer jwt-123" }),
      })
    )
  })

  it("passes through the admin orders envelope unchanged", async () => {
    const envelope = {
      content: [{ orderId: 5, status: "PENDING" }],
      page: 2,
      size: 10,
      totalElements: 22,
      totalPages: 3,
      first: false,
      last: true,
    }
    jest.mocked(global.fetch).mockResolvedValue(jsonResponse(envelope))

    const result = await fetchAdminOrders(2, 10, { status: "PENDING" })

    expect(result.page).toBe(2)
    expect(result.totalPages).toBe(3)
    expect(result.last).toBe(true)
    expect(result.content[0].orderId).toBe(5)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/orders?page=2&size=10&status=PENDING"),
      expect.objectContaining({ headers: {} })
    )
  })
})