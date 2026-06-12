"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createProduct, updateProduct, upsertVariant, deleteVariant } from "@/actions/product-actions"
import { Select } from "@/components/ui/select"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  model: z.string().min(1, "Modelo requerido"),
  brand: z.string().min(1, "Marca requerida"),
  category: z.string().optional(),
  description: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const CATEGORIES = [
  { value: "RUNNING", label: "Running" },
  { value: "CASUAL", label: "Casual" },
  { value: "BASKETBALL", label: "Basketball" },
  { value: "FOOTBALL", label: "Fútbol" },
  { value: "SKATE", label: "Skate" },
  { value: "OTHER", label: "Otro" },
]

interface Props {
  product?: {
    id: string
    model: string
    brand: string
    category: string
    description: string | null
    variants: { id: string; size: string | null; color: string | null; stock: number; price: any | null }[]
  }
}

export function ProductForm({ product }: Props) {
  const router = useRouter()
  const isEditing = !!product
  const [variants, setVariants] = useState(product?.variants || [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: product ? { model: product.model, brand: product.brand, category: product.category, description: product.description ?? "" } : { model: "", brand: "", category: "OTHER", description: "" },
  })

  async function onSubmit(data: FormData) {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined) formData.append(k, v) })
    const result = isEditing ? await updateProduct(product!.id, formData) : await createProduct(formData)
    if (result && "success" in result && result.success) {
      toast.success(isEditing ? "Producto actualizado" : "Producto creado")
      router.push("/products"); router.refresh()
    } else {
      toast.error((result as any)?.error || "Error")
    }
  }

  async function handleAddVariant() {
    const size = prompt("Talla (ej: 42, M, o dejar vacío para única):")
    const color = prompt("Color (opcional):")
    const stock = prompt("Stock inicial:", "0")
    const price = prompt("Precio (opcional):")

    if (!product) {
      toast.error("Guarda el producto primero antes de agregar variantes")
      return
    }

    const fd = new FormData()
    if (size) fd.append("size", size)
    if (color) fd.append("color", color)
    fd.append("stock", stock || "0")
    if (price) fd.append("price", price)

    const result = await upsertVariant(product.id, fd)
    if (result.success) { toast.success("Variante agregada"); router.refresh() }
    else { toast.error(result.error || "Error") }
  }

  async function handleRemoveVariant(id: string) {
    if (!confirm("¿Eliminar esta variante?")) return
    await deleteVariant(id)
    toast.success("Variante eliminada")
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/products"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Editar Producto" : "Nuevo Producto"}</h1>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader><CardTitle>Información del Producto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input id="model" {...register("model")} />
                {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input id="brand" {...register("brand")} />
                {errors.brand && <p className="text-sm text-destructive">{errors.brand.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select id="category" options={CATEGORIES} {...register("category")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" {...register("description")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Variantes / Stock
                <Button type="button" variant="outline" size="sm" onClick={handleAddVariant}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar Variante
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin variantes registradas</p>
              ) : (
                <div className="space-y-2">
                  {variants.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">{v.size || "Talla única"}</span>
                        {v.color && <span className="text-muted-foreground ml-2">({v.color})</span>}
                        <span className="ml-3 text-muted-foreground">Stock: {v.stock}</span>
                        {v.price && <span className="ml-3 text-muted-foreground">Precio: S/ {Number(v.price).toFixed(2)}</span>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveVariant(v.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" asChild><Link href="/products">Cancelar</Link></Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />{isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  )
}
