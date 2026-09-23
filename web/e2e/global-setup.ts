import { request, type APIRequestContext, type FullConfig } from "@playwright/test"

const API = "http://localhost:8081"
const ADMIN_EMAIL = "admin@powertools.com"
const ADMIN_PASSWORD = "Admin@1234"

const POWER_DRILLS = "a1b2c3d4-e5f6-7890-abcd-ef1234567801"
const ANGLE_GRINDERS = "a1b2c3d4-e5f6-7890-abcd-ef1234567802"

interface SeedProduct {
  name: string
  price: string
  stock: number
  categoryId: string
}

const SEED_PRODUCTS: SeedProduct[] = [
  { name: "E2E Impact Drill", price: "139.99", stock: 20, categoryId: POWER_DRILLS },
  { name: "E2E Mini Sander", price: "59.99", stock: 3, categoryId: POWER_DRILLS },
  { name: "E2E 4.5 Grinder", price: "89.99", stock: 12, categoryId: ANGLE_GRINDERS },
]

async function ensureProduct(
  ctx: APIRequestContext,
  token: string,
  product: SeedProduct,
) {
  const search = await ctx.get(
    `${API}/api/products?search=${encodeURIComponent(product.name)}&size=50`,
  )
  if (search.status() !== 200) {
    throw new Error(`product search failed: ${search.status()}`)
  }
  const page = (await search.json()) as { products: Array<{ name: string }> }
  const exists = page.products.some(
    (p) => p.name.toLowerCase() === product.name.toLowerCase(),
  )
  if (exists) return

  const created = await ctx.post(`${API}/api/admin/products`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      categoryId: product.categoryId,
      name: product.name,
      price: product.price,
      stockQty: product.stock,
      imageUrl: null,
      description: "E2E seeded product",
    },
  })
  if (created.status() !== 201) {
    throw new Error(`seed product failed: ${created.status()} ${await created.text()}`)
  }
}

export default async function globalSetup(_config: FullConfig) {
  const ctx = await request.newContext()
  try {
    const login = await ctx.post(`${API}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })
    if (login.status() !== 200) {
      throw new Error(`admin login failed: ${login.status()}`)
    }
    const { token } = (await login.json()) as { token: string }
    for (const product of SEED_PRODUCTS) {
      await ensureProduct(ctx, token, product)
    }
  } finally {
    await ctx.dispose()
  }
}