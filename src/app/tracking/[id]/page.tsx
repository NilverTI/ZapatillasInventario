import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { TrackingContent } from "@/components/tracking/tracking-content"

export const dynamic = "force-dynamic"

function serializeDecimal(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  if (typeof value === "object" && "toNumber" in value) return value.toNumber()
  return Number(value)
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      history: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  })

  if (!order) notFound()

  const serialized = {
    ...order,
    salePrice: serializeDecimal(order.salePrice),
    importCost: serializeDecimal(order.importCost),
    advancePayment: serializeDecimal(order.advancePayment),
    extraPayment: serializeDecimal(order.extraPayment),
  }

  return <TrackingContent order={serialized as any} />
}
