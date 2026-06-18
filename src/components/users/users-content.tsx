"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/supabase-session-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { deleteUser } from "@/actions/user-actions"
import { toast } from "sonner"
import Link from "next/link"
import { Plus, Shield, ShieldOff, Trash2, Pencil, Mail, Calendar, User } from "lucide-react"

interface UserWithCount {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: Date
  _count: { orders: number }
}

interface Props {
  users: UserWithCount[]
}

export function UsersContent({ users }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"
  const [list, setList] = useState(users)

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`¿Desactivar a ${name}?`)) return
    const result = await deleteUser(id)
    if (result.success) {
      toast.success("Usuario desactivado")
      router.refresh()
    } else {
      toast.error(result.error || "Error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/users/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Link>
          </Button>
        )}
      </div>

      <Card className="border-muted-foreground/10 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Vista escritorio (Tabla) */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nombre</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Rol</th>
                  <th className="text-center p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Pedidos</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Estado</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Registro</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  list.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="p-4 font-semibold text-foreground">{u.name}</td>
                      <td className="p-4 text-muted-foreground">{u.email}</td>
                      <td className="p-4">
                        <Badge variant={u.role === "ADMIN" ? "default" : "secondary"} className="gap-1 font-semibold">
                          {u.role === "ADMIN" ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <ShieldOff className="h-3 w-3" />
                          )}
                          {u.role === "ADMIN" ? "Admin" : "Empleado"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center font-medium text-foreground">{u._count.orders}</td>
                      <td className="p-4">
                        <Badge variant={u.active ? "default" : "destructive"} className="font-semibold">
                          {u.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/users/${u.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeactivate(u.id, u.name)}
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
            {list.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay usuarios registrados</p>
            ) : (
              list.map((u) => (
                <div
                  key={u.id}
                  className="border border-muted-foreground/10 rounded-xl p-4 space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-foreground text-sm block">{u.name}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" /> {u.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"} className="font-bold text-[9px] px-1.5 py-0.5 gap-0.5">
                        {u.role === "ADMIN" ? <Shield className="h-2.5 w-2.5" /> : <ShieldOff className="h-2.5 w-2.5" />}
                        {u.role === "ADMIN" ? "Admin" : "Empleado"}
                      </Badge>
                      <Badge variant={u.active ? "default" : "destructive"} className="font-bold text-[9px] px-1.5 py-0.5">
                        {u.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-y py-2 border-muted-foreground/5">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Pedidos</span>
                      <span className="font-semibold text-foreground mt-0.5 block">{u._count.orders}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Registro</span>
                      <span className="font-semibold text-foreground mt-0.5 block flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(u.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                      <Link href={`/users/${u.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Link>
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeactivate(u.id, u.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Desactivar
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
