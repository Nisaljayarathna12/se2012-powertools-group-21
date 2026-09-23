import { act, renderHook } from "@testing-library/react"
import {
  getCartCount,
  refreshCartCount,
  setCartCount,
  useCartCount,
} from "@/lib/cart"
import { fetchCartCount } from "@/lib/api"

jest.mock("@/lib/api", () => ({
  fetchCartCount: jest.fn(),
}))

const mockFetchCartCount = jest.mocked(fetchCartCount)

describe("cart count store", () => {
  beforeEach(() => {
    setCartCount(0)
    mockFetchCartCount.mockReset()
  })

  it("updates and reads the count", () => {
    expect(getCartCount()).toBe(0)
    setCartCount(4)
    expect(getCartCount()).toBe(4)
  })

  it("refreshes the count from the api", async () => {
    mockFetchCartCount.mockResolvedValue({ itemCount: 2, totalQuantity: 7 })

    await refreshCartCount()

    expect(getCartCount()).toBe(7)
    expect(mockFetchCartCount).toHaveBeenCalledTimes(1)
  })

  it("resets to zero when the api call fails", async () => {
    setCartCount(9)
    mockFetchCartCount.mockRejectedValue(new Error("network"))

    await refreshCartCount()

    expect(getCartCount()).toBe(0)
  })

  it("exposes the count as a store, updating subscribers", () => {
    const { result, rerender } = renderHook(() => useCartCount())
    expect(result.current).toBe(0)

    act(() => setCartCount(3))
    rerender()
    expect(result.current).toBe(3)
  })
})