"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createExpense } from "@/actions/expense-actions"
import { getSuppliers } from "@/actions/supplier-actions"
import { Select } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  description: z.string().min(1, "Descripción requerida"),
  amount: z.string().min(1, "Monto requerido"),
  category: z.string(),
  date: z.string().optional(),
  supplierId: z.string().optional(),
  orderId: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const CATEGORIES = [
  { value: "SHIPPING", label: "Envío" },
  { value: "CUSTOMS", label: "Aduana" },
  { value: "STORAGE", label: "Almacén" },
  { value: "SUPPLIES", label: "Insumos" },
  { value: "TRANSPORT", label: "Transporte" },
  { value: "OTHER", label: "Otro" },
]

export function ExpenseForm() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    getSuppliers().then(setSuppliers)
  }, [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: "", amount: "", category: "OTHER", date: "", supplierId: "", orderId: "", notes: "" },
  })

  async function onSubmit(data: FormData) {
    const formData = new FormData()
    formData.append("description", data.description)
    formData.append("amount", data.amount)
    formData.append("category", data.category)
    if (data.date) formData.append("date", data.date)
    if (data.supplierId) formData.append("supplierId", data.supplierId)
    if (data.notes) formData.append("notes", data.notes)
    const result = await createExpense(formData)
    if (result && "success" in result && result.success) {
      toast.success("Gasto registrado"); router.push("/expenses"); router.refresh()
    } else {
      toast.error((result as any)?.error || "Error")
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/expenses"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div><h1 className="text-2xl font-bold tracking-tight">Nuevo Gasto</h1></div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader><CardTitle>Registrar Gasto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Descripción *</Label>
                <Input id="description" {...register("description")} />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto *</Label>
                <Input id="amount" type="number" step="0.01" {...register("amount")} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select id="category" options={CATEGORIES} {...register("category")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" type="date" {...register("date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierId">Proveedor</Label>
                <select id="supplierId" {...register("supplierId")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="">Seleccionar</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" {...register("notes")} />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" asChild><Link href="/expenses">Cancelar</Link></Button>
          <Button type="submit" disabled={isSubmitting}><Save className="h-4 w-4 mr-2" />{isSubmitting ? "Guardando..." : "Registrar"}</Button>
        </div>
      </form>
    </div>
  )
}
