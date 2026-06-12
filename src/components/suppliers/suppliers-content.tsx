"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/supabase-session-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Nombre</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Contacto</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">País</th>
                  <th className="text-center p-4 font-medium text-muted-foreground text-sm">Pedidos</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {initial.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">No hay proveedores</td>
                  </tr>
                ) : (
                  initial.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{s.name}</td>
                      <td className="p-4">
                        <div className="text-sm">{s.contact || "-"}</div>
                        {s.email && <div className="text-xs text-muted-foreground">{s.email}</div>}
                      </td>
                      <td className="p-4">
                        {s.country && (
                          <div className="flex items-center gap-1 text-sm">
                            <Globe className="h-3 w-3" /> {s.country}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">{s._count.orders}</td>
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
        </CardContent>
      </Card>
    </div>
  )
}
