const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

import { getToken } from "@/lib/auth"

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleError(res: Response, defaultMessage: string): Promise<never> {
  let message = defaultMessage
  try {
    const data = await res.json()
    if (data && typeof data.message === "string") {
      message = data.message
    }
  } catch {
    // ignore parse errors, keep default message
  }
  throw new ApiError(res.status, message)
}

export interface Category {
  categoryId: string
  categoryName: string
  categoryDescription: string | null
}

export interface Product {
  productId: number
  name: string
  price: number
  stockQty: number
  imageUrl: string | null
  description: string | null
  categoryId: string | null
  categoryName: string | null
}

export interface ProductResponse {
  products: Product[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/api/categories`)

  if (!res.ok) {
    throw new Error("Failed to fetch categories")
  }

  return res.json()
}

export async function fetchProducts(
  page: number = 0,
  size: number = 12,
  search?: string,
  categoryId?: string
): Promise<ProductResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })

  if (search) {
    params.set("search", search)
  }

  if (categoryId) {
    params.set("category", categoryId)
  }

  const res = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`)

  if (!res.ok) {
    throw new Error("Failed to fetch products")
  }

  return res.json()
}

export async function fetchProduct(id: number): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/api/products/${id}`)

  if (!res.ok) {
    throw new Error("Failed to fetch product")
  }

  return res.json()
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface User {
  userId: number
  name: string
  email: string
  role: string
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function postJson<T>(
  path: string,
  body: unknown,
  defaultMessage: string
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    await handleError(res, defaultMessage)
  }

  return res.json()
}

export async function registerUser(data: RegisterRequest): Promise<User> {
  return postJson<User>(
    "/api/auth/register",
    data,
    "Registration failed. Please try again."
  )
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresAt: number
  userId: number
  name: string
  email: string
  role: string
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  return postJson<LoginResponse>(
    "/api/auth/login",
    data,
    "Login failed. Please try again."
  )
}

export interface ProfileRequest {
  name: string
  email: string
}

export async function fetchProfile(): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    headers: authHeaders(),
  })

  if (!res.ok) {
    await handleError(res, "Failed to load profile")
  }

  return res.json()
}

export async function updateProfile(data: ProfileRequest): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    await handleError(res, "Failed to update profile")
  }

  return res.json()
}

export interface AdminSummary {
  user: User
  products: number
  categories: number
}

export async function fetchAdminSummary(): Promise<AdminSummary> {
  const res = await fetch(`${API_BASE_URL}/api/admin/summary`, {
    headers: authHeaders(),
  })

  if (!res.ok) {
    await handleError(res, "Failed to load admin summary")
  }

  return res.json()
}

export interface AdminOrder {
  orderId: number
  orderDate: string
  totalAmount: number
  status: string
  shippingAddress: string
  customerName: string | null
}

export interface AdminOrdersResponse {
  content: AdminOrder[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface AdminOrderFilters {
  status?: string
  from?: string
  to?: string
  sort?: string
  direction?: "asc" | "desc"
}

export async function fetchAdminOrders(
  page: number = 0,
  size: number = 10,
  filters: AdminOrderFilters = {}
): Promise<AdminOrdersResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })

  if (filters.status) params.set("status", filters.status)
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.direction) params.set("direction", filters.direction)

  const res = await fetch(
    `${API_BASE_URL}/api/admin/orders?${params.toString()}`,
    { headers: authHeaders() }
  )

  if (!res.ok) {
    await handleError(res, "Failed to load orders")
  }

  const data = await res.json()
  return { ...data, page: data.number }
}

export async function updateOrderStatus(
  id: number,
  status: string
): Promise<AdminOrder> {
  const res = await fetch(`${API_BASE_URL}/api/admin/orders/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status }),
  })

  if (!res.ok) {
    await handleError(res, "Failed to update order status")
  }

  return res.json()
}

export async function fetchCustomerOrders(): Promise<AdminOrder[]> {
  const res = await fetch(`${API_BASE_URL}/api/customer/orders`, {
    headers: authHeaders(),
  })

  if (!res.ok) {
    await handleError(res, "Failed to load your orders")
  }

  return res.json()
}

export interface AdminDashboard {
  user: User
  products: number
  orders: number
  customers: number
  lowStockCount: number
  recentOrders: AdminOrder[]
  lowStockProducts: Product[]
}

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  const res = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
    headers: authHeaders(),
  })

  if (!res.ok) {
    await handleError(res, "Failed to load admin dashboard")
  }

  return res.json()
}

export interface CreateProductRequest {
  categoryId: string
  name: string
  price: number
  stockQty: number
  imageUrl: string | null
  description: string | null
}

export async function createProduct(
  data: CreateProductRequest
): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/api/admin/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    await handleError(res, "Failed to create product")
  }

  return res.json()
}

export async function updateProduct(
  id: number,
  data: CreateProductRequest
): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    await handleError(res, "Failed to update product")
  }

  return res.json()
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })

  if (!res.ok) {
    await handleError(res, "Failed to delete product")
  }
}

export async function adjustProductStock(
  id: number,
  adjustment: number
): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/api/admin/products/${id}/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ adjustment }),
  })

  if (!res.ok) {
    await handleError(res, "Failed to update stock")
  }

  return res.json()
}

export interface CartItem {
  cartItemId: number
  productId: number
  name: string
  price: number
  quantity: number
  imageUrl: string | null
  stockQty: number
  lineTotal: number
}

export interface Cart {
  cartId: number
  items: CartItem[]
  itemCount: number
  totalQuantity: number
  totalAmount: number
}

export interface CartCount {
  itemCount: number
  totalQuantity: number
}

export async function fetchCart(): Promise<Cart> {
  const res = await fetch(`${API_BASE_URL}/api/cart`, {
    headers: authHeaders(),
  })

  if (!res.ok) {
    await handleError(res, "Failed to load cart")
  }

  return res.json()
}

export async function fetchCartCount(): Promise<CartCount> {
  const res = await fetch(`${API_BASE_URL}/api/cart/count`, {
    headers: authHeaders(),
  })

  if (!res.ok) {
    await handleError(res, "Failed to load cart")
  }

  return res.json()
}

export async function addToCart(
  productId: number,
  quantity: number
): Promise<Cart> {
  const res = await fetch(`${API_BASE_URL}/api/cart/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ productId, quantity }),
  })

  if (!res.ok) {
    await handleError(res, "Failed to add to cart")
  }

  return res.json()
}

export async function updateCartItem(
  cartItemId: number,
  quantity: number
): Promise<Cart> {
  const res = await fetch(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ quantity }),
  })

  if (!res.ok) {
    await handleError(res, "Failed to update cart")
  }

  return res.json()
}

export async function removeCartItem(cartItemId: number): Promise<Cart> {
  const res = await fetch(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })

  if (!res.ok) {
    await handleError(res, "Failed to remove item from cart")
  }

  return res.json()
}

export interface CreateOrderRequest {
  street: string
  city: string
  postalCode: string
  phone: string
}

export interface OrderItemDto {
  orderItemId: number
  productId: number
  name: string
  quantity: number
  unitPrice: number
  imageUrl: string | null
  lineTotal: number
}

export interface OrderDetail {
  orderId: number
  orderDate: string
  totalAmount: number
  status: string
  shippingAddress: string
  customerName: string | null
  items: OrderItemDto[]
}

export async function createOrder(
  data: CreateOrderRequest
): Promise<OrderDetail> {
  const res = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    await handleError(res, "Failed to place order")
  }

  return res.json()
}

export async function fetchOrder(orderId: number): Promise<OrderDetail> {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
    headers: authHeaders(),
  })

  if (!res.ok) {
    await handleError(res, "Failed to load order")
  }

  return res.json()
}