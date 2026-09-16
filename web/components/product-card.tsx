"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { Product } from "@/lib/api"
import { formatPrice } from "@/lib/format"

export function ProductCard({ product }: { product: Product }) {
  return (
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
  )
}