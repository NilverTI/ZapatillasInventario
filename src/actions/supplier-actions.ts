"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { auth } from "@/lib/auth"
import { z } from "zod"

const supplierSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
})

export async function getSuppliers(search?: string) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { contact: { contains: search, mode: "insensitive" as const } },
          { country: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}
  return prisma.supplier.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  })
}

export async function getSupplierById(id: string) {
  return prisma.supplier.findUnique({ where: { id } })
}

export async function createSupplier(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const raw = Object.fromEntries(formData)
  const validated = supplierSchema.safeParse(raw)
  if (!validated.success) return { error: "Datos inválidos", details: validated.error.flatten() }

  const supplier = await prisma.supplier.create({ data: validated.data as any })
  await logActivity("create", "supplier", supplier.id, `Proveedor ${supplier.name} creado`)
  revalidatePath("/suppliers")
  return { success: true }
}

export async function updateSupplier(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const raw = Object.fromEntries(formData)
  const validated = supplierSchema.safeParse(raw)
  if (!validated.success) return { error: "Datos inválidos", details: validated.error.flatten() }

  const supplier = await prisma.supplier.update({ where: { id }, data: validated.data as any })
  await logActivity("update", "supplier", id, `Proveedor ${supplier.name} actualizado`)
  revalidatePath("/suppliers")
  return { success: true }
}

export async function deleteSupplier(id: string) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }
  if (session.user.role !== "ADMIN") return { error: "Solo administradores" }

  await prisma.supplier.delete({ where: { id } })
  await logActivity("delete", "supplier", id, "Proveedor eliminado")
  revalidatePath("/suppliers")
  return { success: true }
}
