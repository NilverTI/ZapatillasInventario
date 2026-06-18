"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStatusColor,
  getCategoryLabel,
} from "@/lib/utils"
import { deleteOrder } from "@/actions/order-actions"
import { toast } from "sonner"
import Link from "next/link"
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Filter,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface OrderWithRelations {
  id: string
  orderNumber: number
  clientName: string
  clientPhone: string
  model: string
  brand: string
  category: string
  status: string
  salePrice: any
  importCost: any
  advancePayment: any
  extraPayment: any
  orderDate: Date
  estimatedArrival: Date | null
  quantity: number
  client: { fullName: string; phone: string }
  payments: { amount: any }[]
}

interface Props {
  orders: OrderWithRelations[]
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "PENDING", label: "Pendiente" },
  { value: "PURCHASED", label: "Comprado" },
  { value: "IN_TRANSIT", label: "En tránsito" },
  { value: "CUSTOMS", label: "Aduanas" },
  { value: "ARRIVED", label: "Llegó al país" },
  { value: "READY_FOR_DELIVERY", label: "Listo para entregar" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
]

export function OrdersContent({ orders: initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const router = useRouter()

  function calcRemaining(order: OrderWithRelations) {
    return Number(order.salePrice) - Number(order.advancePayment) - Number(order.extraPayment)
  }

  function calcProfit(order: OrderWithRelations) {
    return Number(order.salePrice) - Number(order.importCost)
  }

  function applyFilters() {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (statusFilter) params.set("status", statusFilter)
    router.push(`/orders?${params}`)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este pedido?")) return
    const result = await deleteOrder(id)
    if (result.success) {
      toast.success("Pedido eliminado")
      setOrders(orders.filter((o) => o.id !== id))
    } else {
      toast.error(result.error || "Error al eliminar")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">Gestiona todos los pedidos</p>
        </div>
        <Button asChild>
          <Link href="/orders/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pedido
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cliente, modelo, marca..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full sm:w-[180px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Estado
              </label>
              <Select
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
            <Button variant="secondary" onClick={applyFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-muted-foreground/10 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Vista escritorio (Tabla) */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">N°</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Cliente</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Modelo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Marca</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Estado</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Venta</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Restante</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Ganancia</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Fecha</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center p-8 text-muted-foreground">
                      No hay pedidos registrados
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="p-3 font-semibold text-foreground">#{order.orderNumber}</td>
                      <td className="p-3">
                        <div>
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {order.clientName}
                          </Link>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {order.clientPhone}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-foreground">{order.model}</td>
                      <td className="p-3 text-foreground">{order.brand}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-foreground">
                        {formatCurrency(order.salePrice)}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={
                            calcRemaining(order) > 0
                              ? "text-destructive font-semibold"
                              : "text-green-600 font-semibold"
                          }
                        >
                          {formatCurrency(calcRemaining(order))}
                        </span>
                      </td>
                      <td className="p-3 text-right text-emerald-600 font-semibold">
                        {formatCurrency(calcProfit(order))}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/orders/${order.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(order.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Vista móvil (Tarjetas) */}
          <div className="grid gap-4 md:hidden p-4 bg-muted/10">
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay pedidos registrados</p>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-muted-foreground/10 rounded-xl p-4 space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Pedido</span>
                      <Link href={`/orders/${order.id}`} className="font-bold text-foreground hover:text-primary text-sm transition-colors">
                        #{order.orderNumber}
                      </Link>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-y py-2 border-muted-foreground/5">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Cliente</span>
                      <span className="font-semibold text-foreground">{order.clientName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">WhatsApp</span>
                      <a
                        href={`https://wa.me/51${order.clientPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-medium hover:underline"
                      >
                        {order.clientPhone}
                      </a>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Modelo / Marca</span>
                      <span className="font-semibold text-foreground">{order.brand} {order.model}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Fecha Pedido</span>
                      <span className="text-muted-foreground">{formatDate(order.orderDate)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Monto Venta</span>
                      <span className="font-bold text-sm text-foreground">{formatCurrency(order.salePrice)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Pendiente</span>
                      <span className={`font-bold text-sm ${calcRemaining(order) > 0 ? "text-destructive" : "text-green-600"}`}>
                        {formatCurrency(calcRemaining(order))}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Ganancia</span>
                      <span className="font-bold text-sm text-emerald-600">{formatCurrency(calcProfit(order))}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-muted-foreground/5">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(order.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
