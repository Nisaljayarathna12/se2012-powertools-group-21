import { fetchCategories, fetchProducts, type Category } from "@/lib/api"
import { byNewestFirst, toShowcaseProducts, type ShowcaseProduct } from "@/lib/showcase"

const PAGE_SIZE = 24

/**
 * Storefront data access. Reuses the shared API client, which already targets
 * the Spring Boot backend at NEXT_PUBLIC_API_URL (default http://localhost:8080).
 * Endpoints hit here: GET /api/products, GET /api/categories.
 */

export async function loadShowcaseProducts(limit = PAGE_SIZE): Promise<ShowcaseProduct[]> {
  const response = await fetchProducts(0, limit)
  return byNewestFirst(toShowcaseProducts(response))
}

export interface CatalogOptions {
  search?: string
  categoryId?: string
  page?: number
  size?: number
}

export async function loadCatalogProducts({
  search,
  categoryId,
  page = 0,
  size = PAGE_SIZE,
}: CatalogOptions = {}) {
  return fetchProducts(page, size, search, categoryId)
}

export async function loadCategories(): Promise<Category[]> {
  return fetchCategories()
}
