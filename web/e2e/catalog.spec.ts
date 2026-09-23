import { expect, test } from "@playwright/test"

test("browse products with search and category filters", async ({ page }) => {
  await page.goto("/products")
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible()

  const search = page.getByRole("searchbox", {
    name: "Search products by name",
  })
  await search.fill("E2E Impact")
  await expect(
    page.getByText(/Found \d+ products? matching/),
  ).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole("link", { name: "E2E Impact Drill" })).toBeVisible()

  await search.fill("")
  await page.getByRole("button", { name: "Angle Grinders", exact: true }).click()
  await expect(page.getByRole("link", { name: "E2E 4.5 Grinder" })).toBeVisible()

  await page.getByRole("button", { name: "All Products", exact: true }).click()
  await expect(page.getByRole("link", { name: "E2E Impact Drill" })).toBeVisible()
})

test("product detail shows price and stock badge", async ({ page }) => {
  await page.goto("/products")
  await page.getByRole("link", { name: "E2E Mini Sander" }).click()

  await expect(
    page.getByRole("heading", { name: "E2E Mini Sander" }),
  ).toBeVisible()
  await expect(page.getByText("$59.99")).toBeVisible()
  await expect(page.getByText("Low Stock").first()).toBeVisible()
})

test("unknown product detail shows not-found state", async ({ page }) => {
  await page.goto("/products/999999")
  await expect(page.getByRole("heading", { name: "Product not found" })).toBeVisible()
})