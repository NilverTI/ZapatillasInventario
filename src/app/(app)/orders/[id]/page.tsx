import { getOrderById } from "@/actions/order-actions"
import { notFound } from "next/navigation"
import { OrderDetail } from "@/components/orders/order-detail"

export const dynamic = "force-dynamic"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrderById(id)
  if (!order) notFound()

  return <OrderDetail order={order as any} />
}
