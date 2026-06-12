"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { clientSchema, type ClientFormData } from "@/schemas/client-schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient, updateClient } from "@/actions/client-actions"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface Props {
  client?: {
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
  }
}

export function ClientForm({ client }: Props) {
  const router = useRouter()
  const isEditing = !!client

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client || {
      fullName: "",
      dni: "",
      phone: "",
      whatsapp: "",
      address: "",
      city: "",
      country: "",
      email: "",
      notes: "",
    },
  })

  async function onSubmit(data: ClientFormData) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value as string)
      }
    })

    const result = isEditing
      ? await updateClient(client!.id, formData)
      : await createClient(formData)

    if (result.success) {
      toast.success(isEditing ? "Cliente actualizado" : "Cliente creado")
      router.push("/clients")
      router.refresh()
    } else {
      toast.error(result.error || "Error al guardar")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Actualiza los datos del cliente" : "Registra un nuevo cliente"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input id="dni" {...register("dni")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Celular *</Label>
                <Input id="phone" {...register("phone")} />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" {...register("whatsapp")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" {...register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" {...register("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" {...register("country")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" {...register("address")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Observaciones</Label>
                <Input id="notes" {...register("notes")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" asChild>
            <Link href="/clients">Cancelar</Link>
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
