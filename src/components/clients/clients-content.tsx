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

      <Card className="border-muted-foreground/10 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Vista escritorio (Tabla) */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nombre</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Teléfono</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Ciudad</th>
                  <th className="text-center p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Pedidos</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Registro</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Acciones</th>
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
                    <tr key={client.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="p-4">
                        <Link href={`/clients/${client.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                          {client.fullName}
                        </Link>
                        {client.dni && (
                          <span className="text-xs text-muted-foreground ml-2">DNI: {client.dni}</span>
                        )}
                      </td>
                      <td className="p-4 text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {client.phone}
                        </div>
                      </td>
                      <td className="p-4 text-foreground">
                        {client.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {client.email}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">{client.city || "-"}</td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary" className="font-semibold">{client._count.orders}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
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

          {/* Vista móvil (Tarjetas) */}
          <div className="grid gap-4 md:hidden p-4 bg-muted/10">
            {clients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay clientes registrados</p>
            ) : (
              clients.map((client) => (
                <div
                  key={client.id}
                  className="border border-muted-foreground/10 rounded-xl p-4 space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/clients/${client.id}`} className="font-bold text-foreground hover:text-primary text-sm transition-colors block">
                        {client.fullName}
                      </Link>
                      {client.dni && (
                        <span className="text-[10px] text-muted-foreground">DNI: {client.dni}</span>
                      )}
                    </div>
                    <Badge variant="secondary" className="font-bold text-[10px] px-2 py-0.5">
                      {client._count.orders} {client._count.orders === 1 ? "pedido" : "pedidos"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-y py-2 border-muted-foreground/5">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">WhatsApp</span>
                      <a
                        href={`https://wa.me/51${client.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-medium hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </a>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Ciudad</span>
                      <span className="font-medium text-foreground block mt-0.5">{client.city || "-"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-[10px]">Correo Electrónico</span>
                      {client.email ? (
                        <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {client.email}
                        </span>
                      ) : (
                        <span className="text-muted-foreground block mt-0.5">-</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      Registrado el {formatDate(client.createdAt)}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                        <Link href={`/clients/${client.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                          Ver
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                        <Link href={`/clients/${client.id}/edit`}>
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Link>
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(client.id, client.fullName)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      )}
                    </div>
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
