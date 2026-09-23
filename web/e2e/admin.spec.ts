import { expect, test } from "@playwright/test"

test("admin signs in, views dashboard and manages products", async ({ page }) => {
  const name = `E2E New Grinder ${Date.now()}`

  await page.goto("/login")
  await page.locator("#email").fill("admin@powertools.com")
  await page.locator("#password").fill("Admin@1234")
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Admin" })).toBeVisible()

  await page.goto("/admin")
  await expect(page.getByRole("heading", { name: "Admin dashboard" })).toBeVisible()
  await expect(page.getByText("Total products")).toBeVisible()

  await page.getByRole("button", { name: "Manage Products" }).click()
  await expect(page).toHaveURL(/\/admin\/products$/)
  await expect(page.getByRole("link", { name: "E2E Impact Drill" })).toBeVisible()

  await page.getByRole("button", { name: "Add Product" }).click()
  await expect(page).toHaveURL(/\/admin\/products\/new$/)
  await page.locator("#name").fill(name)
  await page.locator("#category").selectOption({ label: "Angle Grinders" })
  await page.locator("#price").fill("49.99")
  await page.locator("#stockQty").fill("5")
  await page.getByRole("button", { name: "Add product", exact: true }).click()

  await expect(
    page.getByRole("status").filter({ hasText: "added successfully" }),
  ).toBeVisible()
  await expect(page.locator("#name")).toHaveValue("")

  await page.goto("/products")
  await page
    .getByRole("searchbox", { name: "Search products by name" })
    .fill(name)
  await expect(page.getByRole("link", { name })).toBeVisible({
    timeout: 15_000,
  })
})