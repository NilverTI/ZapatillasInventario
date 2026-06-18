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

      <Card className="border-muted-foreground/10 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Vista escritorio (Tabla) */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="w-10 p-4" />
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Modelo / Producto</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Cliente</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Total</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Pagado</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Restante</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      No hay pedidos con pagos registrados
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
                          className="border-b hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => setExpanded(isOpen ? null : order.id)}
                        >
                          <td className="p-4 text-center">
                            {order.payments.length > 0 && (
                              isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-foreground">{order.model}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{order.brand}</div>
                          </td>
                          <td className="p-4">
                            <Link
                              href={`/orders/${order.id}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.clientName}
                            </Link>
                          </td>
                          <td className="p-4 text-right font-semibold text-foreground">{formatCurrency(order.salePrice)}</td>
                          <td className="p-4 text-right font-semibold text-emerald-600">{formatCurrency(pagado)}</td>
                          <td className="p-4 text-right">
                            <span className={restante > 0 ? "text-destructive font-bold" : "text-green-600 font-bold"}>
                              {formatCurrency(restante)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                        </tr>
                        {isOpen && order.payments.length > 0 && (
                          <tr key={`${order.id}-details`} className="bg-muted/10">
                            <td colSpan={7} className="p-0">
                              <div className="px-12 py-4 space-y-3 border-l-2 border-primary">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  Historial de pagos registrados
                                </p>
                                <div className="space-y-2">
                                  {order.payments.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-muted-foreground/5 last:border-0 last:pb-0">
                                      <div className="flex items-center gap-3">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <span className="font-semibold text-sm text-foreground">{formatCurrency(p.amount)}</span>
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

          {/* Vista móvil (Tarjetas) */}
          <div className="grid gap-4 md:hidden p-4 bg-muted/10">
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay pedidos con pagos registrados</p>
            ) : (
              orders.map((order) => {
                const pagado = totalPagado(order)
                const restante = order.salePrice - pagado
                const isOpen = expanded === order.id

                return (
                  <div
                    key={order.id}
                    className="border border-muted-foreground/10 rounded-xl p-4 bg-card shadow-sm hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Pedido #{order.orderNumber}</span>
                        <span className="font-bold text-foreground text-sm block mt-0.5">{order.brand} {order.model}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-y py-2 border-muted-foreground/5">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Cliente</span>
                        <Link href={`/orders/${order.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                          {order.clientName}
                        </Link>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Total Venta</span>
                        <span className="font-semibold text-foreground">{formatCurrency(order.salePrice)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Total Pagado</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(pagado)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Monto Restante</span>
                        <span className={`font-bold ${restante > 0 ? "text-destructive" : "text-green-600"}`}>
                          {formatCurrency(restante)}
                        </span>
                      </div>
                    </div>

                    {order.payments.length > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : order.id)}
                          className="w-full flex items-center justify-between text-xs font-semibold text-primary hover:underline py-1"
                        >
                          <span>{isOpen ? "Ocultar historial de pagos" : "Ver historial de pagos"}</span>
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        {isOpen && (
                          <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-2 text-xs">
                            {order.payments.map((p) => (
                              <div key={p.id} className="border-b border-muted-foreground/5 last:border-0 pb-2 last:pb-0">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-bold text-foreground block">{formatCurrency(p.amount)}</span>
                                    <span className="text-muted-foreground text-[10px]">
                                      {getTypeLabel(p.type)} · {getMethodLabel(p.method)}
                                      {p.reference && ` · Ref: ${p.reference}`}
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground text-[10px] text-right block">
                                    {formatDate(p.date)}<br />por {p.user.name}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
