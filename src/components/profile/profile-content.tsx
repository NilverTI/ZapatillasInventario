"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { changePassword, getCurrentUser } from "@/actions/user-actions"
import { formatDate } from "@/lib/utils"
import { Save, User, Shield, Calendar } from "lucide-react"
import { useEffect, useState as useStateFn } from "react"

interface UserData {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
}

export function ProfileContent() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  async function handleChangePassword() {
    if (!oldPassword || !newPassword) {
      toast.error("Completa todos los campos")
      return
    }
    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    setSaving(true)
    const result = await changePassword(oldPassword, newPassword)
    setSaving(false)
    if (result.success) {
      toast.success("Contraseña actualizada")
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      toast.error(result.error || "Error")
    }
  }

  if (!user) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Información de tu cuenta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nombre</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rol</span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {user.role === "ADMIN" ? "Administrador" : "Empleado"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Miembro desde</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(user.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cambiar Contraseña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Contraseña Actual</Label>
            <Input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleChangePassword} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Actualizar Contraseña"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
