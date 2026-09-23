import { cn } from "@/lib/utils"

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("text-red-500", "font-bold")).toBe("text-red-500 font-bold")
  })

  it("ignores falsy values", () => {
    expect(cn("a", null, undefined, false, "b")).toBe("a b")
  })

  it("resolves tailwind conflicts in favor of the last class", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
  })
})