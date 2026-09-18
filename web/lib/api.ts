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

export interface Product {
  productId: number
  name: string
  price: number
  stockQty: number
  imageUrl: string | null
  description: string | null
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

export async function fetchProducts(
  page: number = 0,
  size: number = 12,
  search?: string
): Promise<ProductResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })

  if (search) {
    params.set("search", search)
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