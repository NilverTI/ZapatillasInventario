import { getOrderById } from "@/actions/order-actions"
import { getClients } from "@/actions/client-actions"
import { notFound } from "next/navigation"
import { OrderForm } from "@/components/orders/order-form"

export const dynamic = "force-dynamic"

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, clients] = await Promise.all([
    getOrderById(id),
    getClients(),
  ])
  if (!order) notFound()

  return <OrderForm order={order as any} clients={clients as any} />
}
