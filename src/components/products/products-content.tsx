"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/supabase-session-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { deleteProduct } from "@/actions/product-actions"
import { getCategoryLabel } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react"

interface ProductWithVariants {
  id: string
  model: string
  brand: string
  category: string
  description: string | null
  active: boolean
  variants: { id: string; size: string | null; color: string | null; stock: number; price: any | null }[]
}

interface Props {
  products: ProductWithVariants[]
  search?: string
}

export function ProductsContent({ products: initial, search: initialSearch = "" }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"
  const [search, setSearch] = useState(initialSearch)

  function handleSearch(value: string) {
    setSearch(value)
    const params = new URLSearchParams()
    if (value) params.set("search", value)
    router.push(`/products?${params}`)
  }

  async function handleDelete(id: string, model: string) {
    if (!confirm(`¿Eliminar producto ${model}?`)) return
    const result = await deleteProduct(id)
    if (result.success) { toast.success("Producto eliminado"); router.refresh() }
    else { toast.error(result.error || "Error") }
  }

  const totalStock = (p: ProductWithVariants) => p.variants.reduce((s, v) => s + v.stock, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">Catálogo de productos con stock</p>
        </div>
        <Button asChild><Link href="/products/new"><Plus className="h-4 w-4 mr-2" />Nuevo Producto</Link></Button>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar producto..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-8" />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Modelo</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Marca</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Categoría</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Tallas</th>
                  <th className="text-center p-4 font-medium text-muted-foreground text-sm">Stock Total</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {initial.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">No hay productos</td></tr>
                ) : (
                  initial.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{p.model}</td>
                      <td className="p-4">{p.brand}</td>
                      <td className="p-4"><Badge variant="secondary">{getCategoryLabel(p.category)}</Badge></td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {p.variants.map((v) => (
                            <Badge key={v.id} variant="outline" className="text-xs">
                              {v.size || "Única"} {v.color ? `(${v.color})` : ""}
                              <span className="ml-1 text-muted-foreground">x{v.stock}</span>
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold">{totalStock(p)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/products/${p.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id, p.model)}>
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
