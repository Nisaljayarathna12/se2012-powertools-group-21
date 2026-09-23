import type { Metadata } from "next"
import { OrderConfirmation } from "@/components/order-confirmation"

export const metadata: Metadata = {
  title: "Order confirmation",
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const { orderId } = await searchParams

  return <OrderConfirmation orderId={orderId || null} />
}