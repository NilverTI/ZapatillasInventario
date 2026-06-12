import { getOrders } from "@/actions/order-actions"
import { OrdersContent } from "@/components/orders/orders-content"

export const dynamic = "force-dynamic"

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const search = typeof sp.search === "string" ? sp.search : undefined
  const status = typeof sp.status === "string" ? sp.status : undefined
  const brand = typeof sp.brand === "string" ? sp.brand : undefined

  const orders = await getOrders({ search, status, brand })

  return <OrdersContent orders={orders as any} />
}
