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
      <Card className="border-muted-foreground/10 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Vista escritorio (Tabla) */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Modelo</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Marca</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Categoría</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tallas / Variantes</th>
                  <th className="text-center p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Stock Total</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {initial.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      No hay productos en el catálogo
                    </td>
                  </tr>
                ) : (
                  initial.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="p-4 font-semibold text-foreground">{p.model}</td>
                      <td className="p-4 text-foreground">{p.brand}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className="font-semibold">
                          {getCategoryLabel(p.category)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {p.variants.map((v) => (
                            <Badge key={v.id} variant="outline" className="text-xs bg-muted/20 border-muted-foreground/10">
                              {v.size || "Única"} {v.color ? `(${v.color})` : ""}
                              <span className="ml-1 font-bold text-foreground">x{v.stock}</span>
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-foreground">{totalStock(p)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/products/${p.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
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

          {/* Vista móvil (Tarjetas) */}
          <div className="grid gap-4 md:hidden p-4 bg-muted/10">
            {initial.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay productos en el catálogo</p>
            ) : (
              initial.map((p) => (
                <div
                  key={p.id}
                  className="border border-muted-foreground/10 rounded-xl p-4 space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">{p.brand}</span>
                      <span className="font-bold text-foreground text-sm block mt-0.5">{p.model}</span>
                    </div>
                    <Badge variant="secondary" className="font-bold text-[10px] px-2 py-0.5">
                      {getCategoryLabel(p.category)}
                    </Badge>
                  </div>

                  <div className="space-y-2 border-y py-2 border-muted-foreground/5">
                    <span className="text-muted-foreground text-[10px] block uppercase tracking-wider">Tallas y Variantes en Stock</span>
                    {p.variants.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Sin variantes de stock registradas</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {p.variants.map((v) => (
                          <Badge key={v.id} variant="outline" className="text-xs bg-muted/20 border-muted-foreground/10 py-0.5">
                            {v.size || "Única"} {v.color ? `(${v.color})` : ""}
                            <span className="ml-1 font-bold text-foreground">x{v.stock}</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase">Stock Total</span>
                      <span className="font-bold text-sm text-foreground">{totalStock(p)} pares</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                        <Link href={`/products/${p.id}/edit`}>
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Link>
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(p.id, p.model)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      )}
                    </div>
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
