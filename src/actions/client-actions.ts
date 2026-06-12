"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { clientSchema } from "@/schemas/client-schema"
import { logActivity } from "@/lib/activity"
import { auth } from "@/lib/auth"

function serializeDecimal(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  if (typeof value === "object" && "toNumber" in value) return value.toNumber()
  return Number(value)
}

export async function getClients(search?: string) {
  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
          { dni: { contains: search } },
        ],
      }
    : {}

  return prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  })
}

export async function getClientById(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { payments: true },
      },
    },
  })
  if (!client) return null
  return {
    ...client,
    orders: client.orders.map((o) => ({
      ...o,
      salePrice: serializeDecimal(o.salePrice),
      importCost: serializeDecimal(o.importCost),
      advancePayment: serializeDecimal(o.advancePayment),
      extraPayment: serializeDecimal(o.extraPayment),
      payments: o.payments.map((p) => ({
        ...p,
        amount: serializeDecimal(p.amount),
      })),
    })),
  }
}

export async function createClient(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const raw = Object.fromEntries(formData)
  const validated = clientSchema.safeParse(raw)

  if (!validated.success) {
    return { error: "Datos inválidos", details: validated.error.flatten() }
  }

  const client = await prisma.client.create({
    data: validated.data as any,
  })

  await logActivity("create", "client", client.id, `Cliente ${client.fullName} creado`)
  revalidatePath("/clients")
  return { success: true, client }
}

export async function updateClient(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const raw = Object.fromEntries(formData)
  const validated = clientSchema.safeParse(raw)

  if (!validated.success) {
    return { error: "Datos inválidos", details: validated.error.flatten() }
  }

  const client = await prisma.client.update({
    where: { id },
    data: validated.data as any,
  })

  await logActivity("update", "client", id, `Cliente ${client.fullName} actualizado`)
  revalidatePath("/clients")
  return { success: true, client }
}

export async function deleteClient(id: string) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }
  if (session.user.role !== "ADMIN") return { error: "Solo administradores pueden eliminar clientes" }

  const client = await prisma.client.findUnique({ where: { id } })
  if (!client) return { error: "Cliente no encontrado" }

  await prisma.client.delete({ where: { id } })

  await logActivity("delete", "client", id, `Cliente ${client.fullName} eliminado`)
  revalidatePath("/clients")
  return { success: true }
}
