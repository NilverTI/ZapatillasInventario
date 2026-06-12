"use client"

import { useState, Fragment } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"
import { ChevronDown, ChevronUp, CreditCard } from "lucide-react"
import Link from "next/link"

interface PaymentDetail {
  id: string
  amount: number
  type: string
  method: string
  reference: string | null
  date: Date
  notes: string | null
  user: { name: string }
}

interface OrderSummary {
  id: string
  orderNumber: number
  clientName: string
  model: string
  brand: string
  salePrice: number
  advancePayment: number
  extraPayment: number
  status: string
  remaining: number
  payments: PaymentDetail[]
}

interface Props {
  orders: OrderSummary[]
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = { ADVANCE: "Adelantado", EXTRA: "Extra", REMAINING: "Restante", FULL: "Completo" }
  return labels[type] || type
}

function getMethodLabel(method: string): string {
  const labels: Record<string, string> = { CASH: "Efectivo", TRANSFER: "Transferencia", YAPE: "Yape", PLIN: "Plin", OTHER: "Otro" }
  return labels[method] || method
}

export function PaymentsContent({ orders }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const totalPagado = (o: OrderSummary) => o.payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
        <p className="text-muted-foreground">Resumen de pagos por pedido</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="w-0 p-4" />
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Modelo</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Cliente</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm">Total</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm">Pagado</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm">Restante</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      No hay pedidos con pagos
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const pagado = totalPagado(order)
                    const restante = order.salePrice - pagado
                    const isOpen = expanded === order.id

                    return (
                      <Fragment key={order.id}>
                        <tr
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => setExpanded(isOpen ? null : order.id)}
                        >
                          <td className="p-4">
                            {order.payments.length > 0 && (
                              isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{order.model}</div>
                            <div className="text-xs text-muted-foreground">{order.brand}</div>
                          </td>
                          <td className="p-4">
                            <Link
                              href={`/orders/${order.id}`}
                              className="hover:text-primary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.clientName}
                            </Link>
                          </td>
                          <td className="p-4 text-right font-medium">{formatCurrency(order.salePrice)}</td>
                          <td className="p-4 text-right font-medium text-emerald-600">{formatCurrency(pagado)}</td>
                          <td className="p-4 text-right font-bold">
                            <span className={restante > 0 ? "text-destructive" : "text-green-600"}>
                              {formatCurrency(restante)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                        </tr>
                        {isOpen && order.payments.length > 0 && (
                          <tr key={`${order.id}-details`} className="bg-muted/30">
                            <td colSpan={7} className="p-0">
                              <div className="px-12 py-4 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Historial de pagos
                                </p>
                                {order.payments.map((p) => (
                                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                    <div className="flex items-center gap-3">
                                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <span className="font-medium text-sm">{formatCurrency(p.amount)}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                          {getTypeLabel(p.type)} · {getMethodLabel(p.method)}
                                        </span>
                                        {p.reference && (
                                          <span className="text-xs text-muted-foreground ml-1">· Ref: {p.reference}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatDate(p.date)} por {p.user.name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
