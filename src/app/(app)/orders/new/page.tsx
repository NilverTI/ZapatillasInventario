import { Suspense } from "react"
import { OrderForm } from "@/components/orders/order-form"
import { getClients } from "@/actions/client-actions"

export default async function NewOrderPage() {
  const clients = await getClients()

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando...</div>}>
      <OrderForm clients={clients as any} />
    </Suspense>
  )
}
