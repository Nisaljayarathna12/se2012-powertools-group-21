import { expect, test } from "@playwright/test"

test("sign in with unknown credentials shows an error", async ({ page }) => {
  await page.goto("/login")

  await page.locator("#email").fill(`nobody.${Date.now()}@example.com`)
  await page.locator("#password").fill("wrongpass1")
  await page.locator("form").getByRole("button", { name: "Sign in" }).click()

  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Invalid email or password",
  )
})

test("registration form validates required fields", async ({ page }) => {
  await page.goto("/register")

  await page.locator("form").getByRole("button", { name: "Register" }).click()

  await expect(page.locator("#name-error")).toBeVisible()
  await expect(page.locator("#email-error")).toBeVisible()
  await expect(page.locator("#password-error")).toBeVisible()
})

test("registering then signing in logs the user in", async ({ page }) => {
  const email = `e2e.auth.${Date.now()}@example.com`

  await page.goto("/register")
  await page.locator("#name").fill("E2E Auth User")
  await page.locator("#email").fill(email)
  await page.locator("#password").fill("password123")
  await page.locator("form").getByRole("button", { name: "Register" }).click()

  await expect(page).toHaveURL(/\/login\?registered=1/)
  await expect(page.getByRole("status")).toContainText(
    "account was created successfully",
  )

  await page.locator("#email").fill(email)
  await page.locator("#password").fill("password123")
  await page.locator("form").getByRole("button", { name: "Sign in" }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Profile" })).toBeVisible()
})