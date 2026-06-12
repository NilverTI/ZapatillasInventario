"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createUser, updateUser } from "@/actions/user-actions"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

const userFormSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().optional(),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
  active: z.string().optional(),
})

type UserFormData = z.infer<typeof userFormSchema>

interface Props {
  user?: {
    id: string
    name: string
    email: string
    role: string
    active: boolean
  }
}

export function UserForm({ user }: Props) {
  const router = useRouter()
  const isEditing = !!user

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user
      ? { name: user.name, email: user.email, role: user.role as any, active: user.active ? "true" : "false", password: "" }
      : { name: "", email: "", password: "", role: "EMPLOYEE", active: "true" },
  })

  async function onSubmit(data: UserFormData) {
    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("email", data.email)
    formData.append("role", data.role)
    formData.append("active", data.active || "true")
    if (data.password) formData.append("password", data.password)

    const result = isEditing
      ? await updateUser(user!.id, formData)
      : await createUser(formData)

    if (result && "success" in result && result.success) {
      toast.success(isEditing ? "Usuario actualizado" : "Usuario creado")
      router.push("/users")
      router.refresh()
    } else {
      toast.error((result as any)?.error || "Error al guardar")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Actualiza los datos del usuario" : "Registra un nuevo usuario"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {isEditing ? "Nueva Contraseña (dejar vacío para mantener)" : "Contraseña *"}
                </Label>
                <Input id="password" type="password" {...register("password")} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <select
                  id="role"
                  {...register("role")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="EMPLOYEE">Empleado</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="active">Estado</Label>
                <select
                  id="active"
                  {...register("active")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" asChild>
            <Link href="/users">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  )
}
