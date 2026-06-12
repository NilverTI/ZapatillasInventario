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
import { createSupplier, updateSupplier } from "@/actions/supplier-actions"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface Props {
  supplier?: { id: string; name: string; contact: string | null; phone: string | null; email: string | null; country: string | null; notes: string | null }
}

export function SupplierForm({ supplier }: Props) {
  const router = useRouter()
  const isEditing = !!supplier

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: supplier ? { name: supplier.name, contact: supplier.contact ?? "", phone: supplier.phone ?? "", email: supplier.email ?? "", country: supplier.country ?? "", notes: supplier.notes ?? "" } : { name: "", contact: "", phone: "", email: "", country: "", notes: "" },
  })

  async function onSubmit(data: FormData) {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) formData.append(k, v) })
    const result = isEditing ? await updateSupplier(supplier!.id, formData) : await createSupplier(formData)
    if (result && "success" in result && result.success) {
      toast.success(isEditing ? "Proveedor actualizado" : "Proveedor creado")
      router.push("/suppliers"); router.refresh()
    } else {
      toast.error((result as any)?.error || "Error")
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/suppliers"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}</h1>
          <p className="text-muted-foreground">{isEditing ? "Actualiza los datos" : "Registra un nuevo proveedor"}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader><CardTitle>Información del Proveedor</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contacto</Label>
                <Input id="contact" {...register("contact")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" {...register("country")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" {...register("notes")} />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" asChild><Link href="/suppliers">Cancelar</Link></Button>
          <Button type="submit" disabled={isSubmitting}><Save className="h-4 w-4 mr-2" />{isSubmitting ? "Guardando..." : "Guardar"}</Button>
        </div>
      </form>
    </div>
  )
}
