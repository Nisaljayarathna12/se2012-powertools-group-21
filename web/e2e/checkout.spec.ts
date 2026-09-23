import { expect, test } from "@playwright/test"

test("register, shop, checkout and see order history", async ({ page }) => {
  const email = `e2e.buyer.${Date.now()}@example.com`
  const password = "password123"

  await page.goto("/register")
  await page.locator("#name").fill("E2E Buyer")
  await page.locator("#email").fill(email)
  await page.locator("#password").fill(password)
  await page.locator("form").getByRole("button", { name: "Register" }).click()

  await expect(page).toHaveURL(/\/login\?registered=1/)

  await page.locator("#email").fill(email)
  await page.locator("#password").fill(password)
  await page.locator("form").getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible()

  await page.goto("/products")
  const search = page.getByRole("searchbox", {
    name: "Search products by name",
  })
  await search.fill("E2E Impact Drill")
  await page.getByRole("link", { name: "E2E Impact Drill" }).click()

  await expect(
    page.getByRole("heading", { name: "E2E Impact Drill" }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Increase quantity" }).click()
  await page.getByRole("button", { name: "Add to Cart" }).click()
  await expect(
    page.getByRole("link", { name: "Cart, 2 items" }),
  ).toBeVisible({ timeout: 15_000 })

  await page.goto("/cart")
  await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible()
  await expect(page.getByText("$279.98").first()).toBeVisible()
  await page.getByRole("button", { name: "Proceed to Checkout" }).click()

  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible()
  await page.locator("#street").fill("42 Main Street")
  await page.locator("#city").fill("Colombo")
  await page.locator("#postalCode").fill("00100")
  await page.locator("#phone").fill("0770123456")
  await page.getByRole("button", { name: "Place Order" }).click()

  await expect(page).toHaveURL(/\/checkout\/success\?orderId=\d+/, {
    timeout: 20_000,
  })
  await expect(page.getByRole("heading", { name: "Order placed!" })).toBeVisible()
  await expect(page.getByText(/Order #\d+/)).toBeVisible()
  await expect(page.getByText("Pending").first()).toBeVisible()

  await page.getByRole("button", { name: "View my orders" }).click()
  await expect(page).toHaveURL(/\/orders$/)
  await expect(page.getByText("PENDING").first()).toBeVisible()
})