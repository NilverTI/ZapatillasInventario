"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/supabase-session-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { deleteSupplier } from "@/actions/supplier-actions"
import { toast } from "sonner"
import Link from "next/link"
import { Plus, Search, Pencil, Trash2, Globe, Phone } from "lucide-react"

interface SupplierWithCount {
  id: string
  name: string
  contact: string | null
  phone: string | null
  email: string | null
  country: string | null
  _count: { orders: number }
}

interface Props {
  suppliers: SupplierWithCount[]
  search?: string
}

export function SuppliersContent({ suppliers: initial, search: initialSearch = "" }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"
  const [search, setSearch] = useState(initialSearch)

  function handleSearch(value: string) {
    setSearch(value)
    const params = new URLSearchParams()
    if (value) params.set("search", value)
    router.push(`/suppliers?${params}`)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar proveedor ${name}?`)) return
    const result = await deleteSupplier(id)
    if (result.success) {
      toast.success("Proveedor eliminado")
      router.refresh()
    } else {
      toast.error(result.error || "Error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">Gestiona tus proveedores</p>
        </div>
        <Button asChild>
          <Link href="/suppliers/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedor..."
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
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Contacto / Email</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">País</th>
                  <th className="text-center p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Pedidos</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {initial.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      No hay proveedores registrados
                    </td>
                  </tr>
                ) : (
                  initial.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="p-4 font-semibold text-foreground">{s.name}</td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-foreground">{s.contact || "-"}</div>
                        {s.email && <div className="text-xs text-muted-foreground mt-0.5">{s.email}</div>}
                      </td>
                      <td className="p-4">
                        {s.country ? (
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" /> {s.country}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-semibold text-foreground">{s._count.orders}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/suppliers/${s.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id, s.name)}>
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
            {initial.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay proveedores registrados</p>
            ) : (
              initial.map((s) => (
                <div
                  key={s.id}
                  className="border border-muted-foreground/10 rounded-xl p-4 space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-foreground text-sm block">{s.name}</span>
                      {s.country && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Globe className="h-3 w-3" /> {s.country}
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary" className="font-bold text-[10px] px-2 py-0.5">
                      {s._count.orders} {s._count.orders === 1 ? "pedido" : "pedidos"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-y py-2 border-muted-foreground/5">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Contacto</span>
                      <span className="font-semibold text-foreground mt-0.5 block">{s.contact || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Teléfono</span>
                      {s.phone ? (
                        <a
                          href={`https://wa.me/51${s.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-medium hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="h-3 w-3" />
                          {s.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground mt-0.5 block">-</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-[10px]">Correo Electrónico</span>
                      <span className="font-semibold text-foreground mt-0.5 block">{s.email || "-"}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                      <Link href={`/suppliers/${s.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Link>
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(s.id, s.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </Button>
                    )}
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
