"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Product = {
  id: string
  name: string
  description: string
  price: number
  category: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true
    fetch(`/api/products?page=${page}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load products")
        return res.json()
      })
      .then((data) => {
        if (alive) {
          setProducts(data)
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
  }, [page])

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Products</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id} className="rounded-lg border p-4">
              <a href={`/products/${product.id}`} className="hover:underline">
                <h2 className="font-medium">{product.name}</h2>
              </a>
              <p className="text-sm text-muted-foreground">{product.description}</p>
              <p className="mt-2 font-medium">${product.price}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8 flex gap-4">
        <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          Previous
        </Button>
        <span className="self-center text-sm text-muted-foreground">Page {page}</span>
        <Button onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </main>
  )
}