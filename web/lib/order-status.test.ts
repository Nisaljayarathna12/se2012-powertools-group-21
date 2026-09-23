import {
  ACTION_STATUSES,
  UPDATEABLE_STATUSES,
  statusVariant,
} from "@/lib/order-status"

describe("order status helpers", () => {
  it("exposes the full set of action statuses", () => {
    expect(ACTION_STATUSES).toContain("PLACED")
    expect(ACTION_STATUSES).toContain("CANCELLED")
    expect(ACTION_STATUSES).toContain("FAILED")
  })

  it("lists the statuses an admin can update", () => {
    expect(UPDATEABLE_STATUSES).toContain("PENDING")
    expect(UPDATEABLE_STATUSES).toContain("SHIPPED")
    expect(UPDATEABLE_STATUSES).not.toContain("COMPLETED")
  })

  it("maps failed statuses to destructive", () => {
    expect(statusVariant("cancelled")).toBe("destructive")
    expect(statusVariant("RETURNED")).toBe("destructive")
    expect(statusVariant("failed")).toBe("destructive")
  })

  it("maps delivered and completed to default", () => {
    expect(statusVariant("delivered")).toBe("default")
    expect(statusVariant("COMPLETED")).toBe("default")
  })

  it("maps in-progress statuses to secondary", () => {
    expect(statusVariant("placed")).toBe("secondary")
    expect(statusVariant("PENDING")).toBe("secondary")
    expect(statusVariant("processing")).toBe("secondary")
    expect(statusVariant("SHIPPED")).toBe("secondary")
  })

  it("returns outline for unknown statuses", () => {
    expect(statusVariant("REFUNDED")).toBe("outline")
  })
})