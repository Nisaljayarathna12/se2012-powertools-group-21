import { render, screen } from "@testing-library/react"
import { StockBadge } from "@/components/stock-badge"

describe("StockBadge", () => {
  it("renders the in-stock label for healthy stock", () => {
    render(<StockBadge stockQty={12} />)
    expect(screen.getByText("In Stock")).toBeInTheDocument()
  })

  it("renders the low-stock label at the threshold", () => {
    render(<StockBadge stockQty={5} />)
    expect(screen.getByText("Low Stock")).toBeInTheDocument()
  })

  it("renders the out-of-stock label at zero", () => {
    render(<StockBadge stockQty={0} />)
    expect(screen.getByText("Out of Stock")).toBeInTheDocument()
  })

  it("honors a custom low-stock threshold", () => {
    render(<StockBadge stockQty={3} lowStockThreshold={1} />)
    expect(screen.getByText("In Stock")).toBeInTheDocument()
  })
})