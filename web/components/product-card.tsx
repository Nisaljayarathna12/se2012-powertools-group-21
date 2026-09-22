"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { StockBadge } from "@/components/stock-badge"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ApiError, deleteProduct, type Product } from "@/lib/api"
import { useRole } from "@/lib/auth"
import { formatPrice } from "@/lib/format"

export function ProductCard({
  product,
  onProductDeleted,
}: {
  product: Product
  onProductDeleted?: (id: number) => void
}) {
  const router = useRouter()
  const isAdmin = useRole() === "ADMIN"

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleEdit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/admin/products/${product.productId}/edit`)
  }

  function openDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDeleteError(null)
    setConfirmOpen(true)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteProduct(product.productId)
      setConfirmOpen(false)
      onProductDeleted?.(product.productId)
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setDeleteError("You do not have permission to delete products.")
      } else {
        setDeleteError(
          err instanceof Error ? err.message : "Failed to delete product"
        )
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Link href={`/products/${product.productId}`} className="block h-full focus-visible:outline-none">
        <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
          <CardContent className="p-0">
            <div className="relative aspect-square overflow-hidden bg-muted">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No image
                </div>
              )}
              <StockBadge
                stockQty={product.stockQty}
                className="absolute left-2 top-2 bg-background/80 backdrop-blur"
              />
              {isAdmin ? (
                <div className="absolute right-2 top-2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={handleEdit}
                    aria-label={`Edit ${product.name}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={openDelete}
                    aria-label={`Delete ${product.name}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-destructive/30 bg-background/80 text-destructive shadow-sm backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium leading-tight line-clamp-2">
                {product.name}
              </h3>
              <p className="mt-2 text-lg font-bold">{formatPrice(product.price)}</p>
            </div>
          </CardContent>
        </Card>
      </Link>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${product.name}"?`}
        description="This will remove the product from the catalogue. Customers will no longer see it, and the action cannot be undone."
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}