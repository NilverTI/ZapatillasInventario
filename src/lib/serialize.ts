import { prisma } from "./prisma"

type Decimal = { toString: () => string; toNumber: () => number }

function serializeDecimal(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as Decimal).toNumber()
  }
  return Number(value)
}

function serializeOrder(order: any): any {
  return {
    ...order,
    importCost: serializeDecimal(order.importCost),
    salePrice: serializeDecimal(order.salePrice),
    advancePayment: serializeDecimal(order.advancePayment),
    extraPayment: serializeDecimal(order.extraPayment),
    payments: order.payments?.map((p: any) => ({
      ...p,
      amount: serializeDecimal(p.amount),
    })),
    client: order.client ? {
      ...order.client,
    } : undefined,
  }
}

export function serializeOrders(orders: any[]): any[] {
  return orders.map(serializeOrder)
}

export function serializeOrderDetail(order: any): any {
  if (!order) return null
  return {
    ...serializeOrder(order),
    history: order.history?.map((h: any) => ({
      ...h,
    })),
    attachments: order.attachments?.map((a: any) => ({
      ...a,
    })),
  }
}
