"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type Product = {
  id: string
  name: string
  description: string
  price: number
  category: string
}

function isCustomerLoggedIn(): boolean {
  if (typeof window === "undefined") return false
  return Boolean(localStorage.getItem("token"))
}

export default function ProductDetailPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggedIn] = useState(() => isCustomerLoggedIn())

  useEffect(() => {
    let alive = true
    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load product")
        return res.json()
      })
      .then((data) => {
        if (alive) {
          setProduct(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [id])

  if (loading) return <p className="px-6 py-8">Loading...</p>
  if (error) return <p className="px-6 py-8 text-red-500">{error}</p>
  if (!product) return <p className="px-6 py-8">Product not found.</p>

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/products" className="text-sm text-muted-foreground hover:underline">
        &larr; Back to products
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">{product.name}</h1>
      <p className="mt-2 text-muted-foreground">{product.category}</p>
      <p className="mt-4 text-lg font-medium">${product.price}</p>
      <p className="mt-4 leading-relaxed">{product.description}</p>
      {loggedIn ? (
        <Button className="mt-8">Add to Cart</Button>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">Log in to purchase this product.</p>
      )}
    </main>
  )
}