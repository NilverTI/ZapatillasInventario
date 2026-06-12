"use client"

import { useRouter } from "next/navigation"
import { useSession } from "@/lib/supabase-session-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency, getStatusLabel, getStatusColor } from "@/lib/utils"
import { deleteClient } from "@/actions/client-actions"
import { toast } from "sonner"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  ShoppingBag,
} from "lucide-react"
import Link from "next/link"

interface ClientWithOrders {
  id: string
  fullName: string
  dni: string | null
  phone: string
  whatsapp: string | null
  address: string | null
  city: string | null
  country: string | null
  email: string | null
  notes: string | null
  createdAt: Date
  orders: {
    id: string
    orderNumber: number
    model: string
    brand: string
    status: string
    salePrice: any
    orderDate: Date
    payments: { amount: any }[]
  }[]
}

interface Props {
  client: ClientWithOrders
}

export function ClientDetail({ client }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  async function handleDelete() {
    if (!confirm(`¿Estás seguro de eliminar a ${client.fullName}?`)) return
    const result = await deleteClient(client.id)
    if (result.success) {
      toast.success("Cliente eliminado")
      router.push("/clients")
    } else {
      toast.error(result.error || "Error al eliminar")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{client.fullName}</h1>
            <p className="text-muted-foreground">
              Cliente desde {formatDate(client.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/orders/new?clientId=${client.id}`}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Nuevo Pedido
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clients/${client.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          {isAdmin && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
            {client.whatsapp && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-500" />
                <span>{client.whatsapp}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
            )}
            {client.dni && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>DNI: {client.dni}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dirección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{client.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>
                {[client.city, client.country].filter(Boolean).join(", ") || "No especificado"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Pedidos</span>
              <span className="font-bold">{client.orders.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Gastado</span>
              <span className="font-bold">
                {formatCurrency(
                  client.orders.reduce((sum, o) => sum + Number(o.salePrice), 0)
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pedidos ({client.orders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground">N°</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Modelo</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Marca</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {client.orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium hover:text-primary"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="p-4">{order.model}</td>
                    <td className="p-4">{order.brand}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatCurrency(order.salePrice)}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {formatDate(order.orderDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
