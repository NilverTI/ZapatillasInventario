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
            <div className="w-[180px]">
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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase">N°</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase">Cliente</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase">Modelo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase">Marca</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase">Estado</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase">Venta</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase">Restante</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase">Ganancia</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase">Fecha</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase">Acciones</th>
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
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">#{order.orderNumber}</td>
                      <td className="p-3">
                        <div>
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {order.clientName}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {order.clientPhone}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{order.model}</td>
                      <td className="p-3">{order.brand}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(order.salePrice)}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={
                            calcRemaining(order) > 0
                              ? "text-destructive font-medium"
                              : "text-green-600 font-medium"
                          }
                        >
                          {formatCurrency(calcRemaining(order))}
                        </span>
                      </td>
                      <td className="p-3 text-right text-emerald-600 font-medium">
                        {formatCurrency(calcProfit(order))}
                      </td>
                      <td className="p-3 text-muted-foreground text-sm">
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
        </CardContent>
      </Card>
    </div>
  )
}
