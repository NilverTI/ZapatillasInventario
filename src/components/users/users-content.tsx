"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { deleteUser } from "@/actions/user-actions"
import { toast } from "sonner"
import Link from "next/link"
import { Plus, Shield, ShieldOff, Trash2, Pencil } from "lucide-react"

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
        <Button asChild>
          <Link href="/users/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Nombre</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Email</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Rol</th>
                  <th className="text-center p-4 font-medium text-muted-foreground text-sm">Pedidos</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Estado</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Registro</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm">Acciones</th>
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
                    <tr key={u.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{u.name}</td>
                      <td className="p-4 text-muted-foreground">{u.email}</td>
                      <td className="p-4">
                        <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                          {u.role === "ADMIN" ? (
                            <Shield className="h-3 w-3 mr-1" />
                          ) : (
                            <ShieldOff className="h-3 w-3 mr-1" />
                          )}
                          {u.role === "ADMIN" ? "Admin" : "Empleado"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">{u._count.orders}</td>
                      <td className="p-4">
                        <Badge variant={u.active ? "default" : "destructive"}>
                          {u.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/users/${u.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeactivate(u.id, u.name)}
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
