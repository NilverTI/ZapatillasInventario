"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { orderSchema, orderStatusSchema } from "@/schemas/order-schema"
import { logActivity } from "@/lib/activity"
import { auth } from "@/lib/auth"
import { serializeOrders, serializeOrderDetail } from "@/lib/serialize"

export async function getOrders(filters?: {
  search?: string
  status?: string
  brand?: string
  model?: string
  size?: string
  country?: string
  dateFrom?: string
  dateTo?: string
}) {
  const where: any = {}

  if (filters?.search) {
    where.OR = [
      { clientName: { contains: filters.search, mode: "insensitive" as const } },
      { clientPhone: { contains: filters.search } },
      { model: { contains: filters.search, mode: "insensitive" as const } },
      { brand: { contains: filters.search, mode: "insensitive" as const } },
    ]
  }
  if (filters?.status) where.status = filters.status
  if (filters?.brand) where.brand = { contains: filters.brand, mode: "insensitive" as const }
  if (filters?.model) where.model = { contains: filters.model, mode: "insensitive" as const }
  if (filters?.size) where.size = filters.size
  if (filters?.country) where.importCountry = { contains: filters.country, mode: "insensitive" as const }
  if (filters?.dateFrom || filters?.dateTo) {
    where.orderDate = {}
    if (filters?.dateFrom) where.orderDate.gte = new Date(filters.dateFrom)
    if (filters?.dateTo) where.orderDate.lte = new Date(filters.dateTo)
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      payments: true,
      client: { select: { fullName: true, phone: true } },
    },
  })
  return serializeOrders(orders)
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      payments: { orderBy: { date: "desc" } },
      attachments: true,
      history: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  })
  return serializeOrderDetail(order)
}

export async function createOrder(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const raw = Object.fromEntries(formData)
  const validated = orderSchema.safeParse(raw)

  if (!validated.success) {
    return { error: "Datos inválidos", details: validated.error.flatten() }
  }

  const data = validated.data

  const client = await prisma.client.findUnique({ where: { id: data.clientId } })
  if (!client) return { error: "Cliente no encontrado" }

  const order = await prisma.order.create({
    data: {
      clientId: data.clientId,
      clientName: client.fullName,
      clientPhone: client.phone,
      quantity: data.quantity,
      model: data.model,
      brand: data.brand,
      category: data.category,
      color: data.color,
      size: data.size,
      importCountry: data.importCountry,
      supplier: data.supplier,
      importCost: data.importCost,
      salePrice: data.salePrice,
      advancePayment: data.advancePayment,
      extraPayment: data.extraPayment,
      status: data.status,
      estimatedArrival: data.estimatedArrival ? new Date(data.estimatedArrival) : null,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      notes: data.notes,
      createdBy: session.user.id,
    },
  })

  await prisma.orderHistory.create({
    data: {
      orderId: order.id,
      status: order.status,
      userId: session.user.id,
      note: "Pedido creado",
    },
  })

  if (data.advancePayment > 0) {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: data.advancePayment,
        type: "ADVANCE",
        method: "OTHER",
        userId: session.user.id,
        notes: "Pago adelantado al crear pedido",
      },
    })
  }

  await logActivity("create", "order", order.id, `Pedido #${order.orderNumber} creado`)
  revalidatePath("/orders")
  return { success: true, order }
}

export async function updateOrderStatus(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const raw = Object.fromEntries(formData)
  const validated = orderStatusSchema.safeParse(raw)

  if (!validated.success) {
    return { error: "Datos inválidos" }
  }

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return { error: "Pedido no encontrado" }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: validated.data.status,
      deliveryDate: validated.data.status === "DELIVERED" ? new Date() : order.deliveryDate,
    },
  })

  await prisma.orderHistory.create({
    data: {
      orderId: id,
      status: validated.data.status,
      userId: session.user.id,
      note: validated.data.note || undefined,
    },
  })

  await logActivity("update_status", "order", id, `Pedido #${order.orderNumber} → ${validated.data.status}`)
  revalidatePath("/orders")
  return { success: true, order: updated }
}

export async function updateOrder(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const raw = Object.fromEntries(formData)
  const validated = orderSchema.safeParse(raw)

  if (!validated.success) {
    return { error: "Datos inválidos", details: validated.error.flatten() }
  }

  const data = validated.data

  const order = await prisma.order.update({
    where: { id },
    data: {
      quantity: data.quantity,
      model: data.model,
      brand: data.brand,
      category: data.category,
      color: data.color,
      size: data.size,
      importCountry: data.importCountry,
      supplier: data.supplier,
      importCost: data.importCost,
      salePrice: data.salePrice,
      advancePayment: data.advancePayment,
      extraPayment: data.extraPayment,
      status: data.status,
      estimatedArrival: data.estimatedArrival ? new Date(data.estimatedArrival) : null,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      notes: data.notes,
    },
  })

  await logActivity("update", "order", id, `Pedido #${order.orderNumber} actualizado`)
  revalidatePath("/orders")
  return { success: true, order }
}

export async function deleteOrder(id: string) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }
  if (session.user.role !== "ADMIN") return { error: "Solo administradores pueden eliminar pedidos" }

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return { error: "Pedido no encontrado" }

  await prisma.order.delete({ where: { id } })

  await logActivity("delete", "order", id, `Pedido #${order.orderNumber} eliminado`)
  revalidatePath("/orders")
  return { success: true }
}

export async function getDashboardStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    monthOrders,
    totalClients,
    alerts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { not: "DELIVERED" }, NOT: { status: "CANCELLED" } } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.findMany({
      where: { orderDate: { gte: startOfMonth } },
      select: { salePrice: true, importCost: true },
    }),
    prisma.client.count(),
    getAlerts(),
  ])

  const monthSales = monthOrders.reduce((sum, o) => sum + Number(o.salePrice), 0)
  const monthProfit = monthOrders.reduce((sum, o) => sum + Number(o.salePrice) - Number(o.importCost), 0)

  return {
    totalOrders,
    pendingOrders,
    deliveredOrders,
    monthSales,
    monthProfit,
    totalClients,
    alerts,
  }
}

export async function getAlerts() {
  const now = new Date()
  const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)

  const delayedOrders = await prisma.order.findMany({
    where: {
      status: { notIn: ["DELIVERED", "CANCELLED"] },
      createdAt: { lte: twentyDaysAgo },
    },
    select: { id: true, orderNumber: true, clientName: true, model: true },
    orderBy: { createdAt: "asc" },
    take: 10,
  })

  const readyOrders = await prisma.order.findMany({
    where: { status: "READY_FOR_DELIVERY" },
    select: { id: true, orderNumber: true, clientName: true, model: true },
    take: 10,
  })

  return { delayedOrders, readyOrders }
}

export async function getDashboardStatsFallback(): Promise<Awaited<ReturnType<typeof getDashboardStats>>> {
  return {
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    monthSales: 0,
    monthProfit: 0,
    totalClients: 0,
    alerts: { delayedOrders: [], readyOrders: [] },
  } as Awaited<ReturnType<typeof getDashboardStats>>
}

export async function getChartDataFallback(): Promise<Awaited<ReturnType<typeof getChartData>>> {
  return {
    monthlySales: [],
    monthlyProfit: [],
    brandSales: [],
    orderStatus: [],
  } as unknown as Awaited<ReturnType<typeof getChartData>>
}

export async function getChartData() {
  const orders = await prisma.order.findMany({
    select: {
      salePrice: true,
      importCost: true,
      brand: true,
      status: true,
      orderDate: true,
    },
  })

  const monthlySales: Record<string, number> = {}
  const monthlyProfit: Record<string, number> = {}
  const brandCount: Record<string, number> = {}
  const statusCount: Record<string, number> = {}

  for (const o of orders) {
    const month = new Date(o.orderDate).toLocaleString("es-PE", { month: "short", year: "2-digit" })
    monthlySales[month] = (monthlySales[month] || 0) + Number(o.salePrice)
    monthlyProfit[month] = (monthlyProfit[month] || 0) + (Number(o.salePrice) - Number(o.importCost))
    brandCount[o.brand] = (brandCount[o.brand] || 0) + 1
    statusCount[o.status] = (statusCount[o.status] || 0) + 1
  }

  return {
    monthlySales: Object.entries(monthlySales).map(([name, total]) => ({ name, total })),
    monthlyProfit: Object.entries(monthlyProfit).map(([name, total]) => ({ name, total })),
    brandSales: Object.entries(brandCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    orderStatus: Object.entries(statusCount).map(([name, count]) => ({ name, count })),
  }
}
