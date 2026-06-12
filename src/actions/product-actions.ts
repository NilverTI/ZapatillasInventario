"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { auth } from "@/lib/auth"
import { z } from "zod"

const productSchema = z.object({
  model: z.string().min(1, "Modelo requerido"),
  brand: z.string().min(1, "Marca requerida"),
  category: z.string().optional(),
  description: z.string().optional(),
})

const variantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  price: z.coerce.number().min(0).optional(),
})

export async function getProducts(search?: string) {
  const where = search
    ? {
        OR: [
          { model: { contains: search, mode: "insensitive" as const } },
          { brand: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}
  return prisma.product.findMany({
    where,
    orderBy: [{ brand: "asc" }, { model: "asc" }],
    include: {
      variants: true,
    },
  })
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  })
}

export async function createProduct(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const raw = Object.fromEntries(formData)
  const validated = productSchema.safeParse(raw)
  if (!validated.success) return { error: "Datos inválidos", details: validated.error.flatten() }

  const product = await prisma.product.create({
    data: {
      model: validated.data.model,
      brand: validated.data.brand,
      category: (validated.data.category || "OTHER") as any,
      description: validated.data.description || null,
    },
  })

  await logActivity("create", "product", product.id, `Producto ${product.model} creado`)
  revalidatePath("/products")
  return { success: true, product }
}

export async function updateProduct(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const raw = Object.fromEntries(formData)
  const validated = productSchema.safeParse(raw)
  if (!validated.success) return { error: "Datos inválidos", details: validated.error.flatten() }

  const product = await prisma.product.update({
    where: { id },
    data: {
      model: validated.data.model,
      brand: validated.data.brand,
      category: (validated.data.category || "OTHER") as any,
      description: validated.data.description || null,
    },
  })

  await logActivity("update", "product", id, `Producto ${product.model} actualizado`)
  revalidatePath("/products")
  return { success: true }
}

export async function deleteProduct(id: string) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }
  if (session.user.role !== "ADMIN") return { error: "Solo administradores" }

  await prisma.product.delete({ where: { id } })
  await logActivity("delete", "product", id, "Producto eliminado")
  revalidatePath("/products")
  return { success: true }
}

export async function upsertVariant(productId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const raw = Object.fromEntries(formData)
  const validated = variantSchema.safeParse(raw)
  if (!validated.success) return { error: "Datos inválidos" }

  const variantId = formData.get("variantId") as string | null

  if (variantId) {
    await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        size: validated.data.size || null,
        color: validated.data.color || null,
        stock: validated.data.stock,
        price: validated.data.price || null,
      },
    })
  } else {
    await prisma.productVariant.create({
      data: {
        productId,
        size: validated.data.size || null,
        color: validated.data.color || null,
        stock: validated.data.stock,
        price: validated.data.price || null,
      },
    })
  }

  revalidatePath("/products")
  return { success: true }
}

export async function deleteVariant(id: string) {
  await prisma.productVariant.delete({ where: { id } })
  revalidatePath("/products")
  return { success: true }
}
