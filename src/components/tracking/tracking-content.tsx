"use client"

import { Package, PackageCheck, Truck, Plane, Ship, Warehouse, CheckCircle, XCircle } from "lucide-react"
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"

interface OrderWithHistory {
  id: string
  orderNumber: number
  model: string
  brand: string
  status: string
  orderDate: Date
  estimatedArrival: Date | null
  deliveryDate: Date | null
  salePrice: any
  advancePayment: any
  extraPayment: any
  quantity: number
  history: {
    id: string
    status: string
    note: string | null
    createdAt: Date
    user: { name: string }
  }[]
}

interface Props {
  order: OrderWithHistory
}

const statusIcons: Record<string, any> = {
  PENDING: Package,
  PURCHASED: ShoppingBagIcon,
  IN_TRANSIT: Plane,
  CUSTOMS: Ship,
  ARRIVED: Warehouse,
  READY_FOR_DELIVERY: PackageCheck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
}

function ShoppingBagIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

const allStatuses = [
  { status: "PENDING", label: "Pendiente" },
  { status: "PURCHASED", label: "Comprado" },
  { status: "IN_TRANSIT", label: "En tránsito" },
  { status: "CUSTOMS", label: "Aduanas" },
  { status: "ARRIVED", label: "Llegó al país" },
  { status: "READY_FOR_DELIVERY", label: "Listo para entregar" },
  { status: "DELIVERED", label: "Entregado" },
]

export function TrackingContent({ order }: Props) {
  const currentStatusIndex = allStatuses.findIndex((s) => s.status === order.status)
  const isCancelled = order.status === "CANCELLED"
  const remaining = Number(order.salePrice) - Number(order.advancePayment) - Number(order.extraPayment)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="max-w-lg mx-auto p-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Seguimiento de Pedido</h1>
          <p className="text-muted-foreground">Zapas Import</p>
        </div>

        <div className="rounded-xl border bg-card shadow-sm p-6 mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">N° de Pedido</p>
            <p className="text-3xl font-bold text-primary">#{order.orderNumber}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modelo</span>
              <span className="font-medium">{order.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Marca</span>
              <span className="font-medium">{order.brand}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cantidad</span>
              <span>{order.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha de pedido</span>
              <span>{formatDate(order.orderDate)}</span>
            </div>
            {order.estimatedArrival && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Llegada estimada</span>
                <span>{formatDate(order.estimatedArrival)}</span>
              </div>
            )}
            {order.deliveryDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entregado</span>
                <span>{formatDate(order.deliveryDate)}</span>
              </div>
            )}
            {remaining > 0 && (
              <div className="flex justify-between pt-3 border-t">
                <span className="text-muted-foreground">Pago pendiente</span>
                <span className="font-bold text-destructive">{formatCurrency(remaining)}</span>
              </div>
            )}
          </div>
        </div>

        {!isCancelled && (
          <div className="rounded-xl border bg-card shadow-sm p-6">
            <h2 className="font-semibold mb-6 text-center">Progreso del pedido</h2>
            <div className="space-y-0 relative">
              {allStatuses.map((s, index) => {
                const Icon = statusIcons[s.status] || Package
                const isCompleted = index <= currentStatusIndex
                const isCurrent = index === currentStatusIndex
                const historyEntry = order.history.find((h) => h.status === s.status)

                return (
                  <div key={s.status} className="flex gap-4 pb-6 relative">
                    {index < allStatuses.length - 1 && (
                      <div
                        className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${
                          isCompleted ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p
                        className={`font-medium text-sm ${
                          isCompleted ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {s.label}
                      </p>
                      {historyEntry && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(historyEntry.createdAt)}
                          {historyEntry.note && ` - ${historyEntry.note}`}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
