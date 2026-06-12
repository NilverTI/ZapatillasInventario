import { prisma } from "@/lib/prisma"
import { PaymentsContent } from "@/components/payments/payments-content"

export const dynamic = "force-dynamic"

function serializeDecimal(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  if (typeof value === "object" && "toNumber" in value) return value.toNumber()
  return Number(value)
}

export default async function PaymentsPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      payments: {
        orderBy: { date: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
    take: 100,
  })

  const serialized = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    clientName: o.clientName,
    model: o.model,
    brand: o.brand,
    salePrice: serializeDecimal(o.salePrice),
    advancePayment: serializeDecimal(o.advancePayment),
    extraPayment: serializeDecimal(o.extraPayment),
    status: o.status,
    remaining: serializeDecimal(o.salePrice) - serializeDecimal(o.advancePayment) - serializeDecimal(o.extraPayment),
    payments: o.payments.map((p) => ({
      id: p.id,
      amount: serializeDecimal(p.amount),
      type: p.type,
      method: p.method,
      reference: p.reference,
      date: p.date,
      notes: p.notes,
      user: p.user,
    })),
  }))

  return <PaymentsContent orders={serialized as any} />
}
