"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { auth } from "@/lib/auth"
import { z } from "zod"

const paymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.coerce.number().positive("Monto debe ser positivo"),
  type: z.enum(["ADVANCE", "EXTRA", "REMAINING", "FULL"]),
  method: z.enum(["CASH", "TRANSFER", "YAPE", "PLIN", "OTHER"]),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function registerPayment(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const raw = Object.fromEntries(formData)
  const validated = paymentSchema.safeParse(raw)

  if (!validated.success) {
    return { error: "Datos inválidos", details: validated.error.flatten() }
  }

  const payment = await prisma.payment.create({
    data: {
      ...validated.data,
      userId: session.user.id,
    } as any,
  })

  const order = await prisma.order.findUnique({ where: { id: validated.data.orderId } })
  if (order) {
    const totalPayments = (await prisma.payment.findMany({
      where: { orderId: validated.data.orderId },
      select: { amount: true },
    })).reduce((sum, p) => sum + Number(p.amount), 0)

    if (totalPayments >= Number(order.salePrice)) {
      await prisma.order.update({
        where: { id: validated.data.orderId },
        data: { status: "DELIVERED", deliveryDate: new Date() },
      })
    }
  }

  await logActivity("create", "payment", payment.id, `Pago de S/ ${validated.data.amount} registrado`)
  revalidatePath("/orders")
  revalidatePath("/payments")
  return { success: true, payment }
}

export async function getOrderPayments(orderId: string) {
  return prisma.payment.findMany({
    where: { orderId },
    orderBy: { date: "desc" },
    include: { user: { select: { name: true } } },
  })
}
