"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { auth } from "@/lib/auth"
import { z } from "zod"

const expenseSchema = z.object({
  description: z.string().min(1, "Descripción requerida"),
  amount: z.coerce.number().min(0.01, "Monto requerido"),
  category: z.string(),
  date: z.string().optional(),
  supplierId: z.string().optional(),
  orderId: z.string().optional(),
  notes: z.string().optional(),
})

function serializeDecimal(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  if (typeof value === "object" && "toNumber" in value) return value.toNumber()
  return Number(value)
}

export async function getExpenses(filters?: {
  dateFrom?: string
  dateTo?: string
  category?: string
}) {
  const where: any = {}
  if (filters?.dateFrom || filters?.dateTo) {
    where.date = {}
    if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.date.lte = new Date(filters.dateTo)
  }
  if (filters?.category) where.category = filters.category

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      supplier: { select: { name: true } },
      order: { select: { orderNumber: true, model: true } },
      creator: { select: { name: true } },
    },
    take: 100,
  })

  return expenses.map((e) => ({
    ...e,
    amount: serializeDecimal(e.amount),
  }))
}

export async function getExpenseById(id: string) {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { supplier: { select: { name: true } }, order: { select: { orderNumber: true } } },
  })
  if (!expense) return null
  return { ...expense, amount: serializeDecimal(expense.amount) }
}

export async function createExpense(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const raw = Object.fromEntries(formData)
  const validated = expenseSchema.safeParse(raw)
  if (!validated.success) return { error: "Datos inválidos", details: validated.error.flatten() }

  const expense = await prisma.expense.create({
    data: {
      description: validated.data.description,
      amount: validated.data.amount,
      category: validated.data.category as any,
      date: validated.data.date ? new Date(validated.data.date) : new Date(),
      supplierId: validated.data.supplierId || null,
      orderId: validated.data.orderId || null,
      notes: validated.data.notes || null,
      createdBy: session.user.id,
    },
  })

  await logActivity("create", "expense", expense.id, `Gasto ${expense.description} creado`)
  revalidatePath("/expenses")
  return { success: true }
}

export async function deleteExpense(id: string) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }
  if (session.user.role !== "ADMIN") return { error: "Solo administradores" }

  await prisma.expense.delete({ where: { id } })
  await logActivity("delete", "expense", id, "Gasto eliminado")
  revalidatePath("/expenses")
  return { success: true }
}

export async function getExpenseStats() {
  const expenses = await prisma.expense.findMany({
    select: { amount: true, category: true, date: true },
  })

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const byCategory: Record<string, number> = {}
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount)
  }

  const thisMonth = expenses.filter((e) => {
    const d = new Date(e.date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthTotal = thisMonth.reduce((sum, e) => sum + Number(e.amount), 0)

  return { total, monthTotal, byCategory }
}
