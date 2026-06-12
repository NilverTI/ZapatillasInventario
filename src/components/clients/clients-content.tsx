"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/supabase-session-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Plus, Search, Phone, Mail, Eye, Pencil, Trash2 } from "lucide-react"
import { deleteClient } from "@/actions/client-actions"
import { toast } from "sonner"
import Link from "next/link"

interface ClientWithCount {
  id: string
  fullName: string
  dni: string | null
  phone: string
  email: string | null
  city: string | null
  createdAt: Date
  _count: { orders: number }
}

interface Props {
  clients: ClientWithCount[]
  search?: string
}

export function ClientsContent({ clients: initialClients, search: initialSearch = "" }: Props) {
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState(initialSearch)
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  function handleSearch(value: string) {
    setSearch(value)
    const params = new URLSearchParams()
    if (value) params.set("search", value)
    router.push(`/clients?${params}`)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás seguro de eliminar a ${name}?`)) return
    const result = await deleteClient(id)
    if (result.success) {
      toast.success("Cliente eliminado")
      setClients(clients.filter((c) => c.id !== id))
    } else {
      toast.error(result.error || "Error al eliminar")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tus clientes</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Nombre</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Teléfono</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Email</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Ciudad</th>
                  <th className="text-center p-4 font-medium text-muted-foreground text-sm">Pedidos</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Registro</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      No hay clientes registrados
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <Link href={`/clients/${client.id}`} className="font-medium hover:text-primary">
                          {client.fullName}
                        </Link>
                        {client.dni && (
                          <span className="text-xs text-muted-foreground ml-2">DNI: {client.dni}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {client.phone}
                        </div>
                      </td>
                      <td className="p-4">
                        {client.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {client.email}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">{client.city || "-"}</td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary">{client._count.orders}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {formatDate(client.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/clients/${client.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/clients/${client.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(client.id, client.fullName)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
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
