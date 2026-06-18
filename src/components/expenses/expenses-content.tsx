"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/supabase-session-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { deleteExpense } from "@/actions/expense-actions"
import { toast } from "sonner"
import Link from "next/link"
import { Plus, Trash2, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ExpenseWithRelations {
  id: string
  description: string
  amount: number
  category: string
  date: Date
  notes: string | null
  supplier: { name: string } | null
  order: { orderNumber: number; model: string } | null
  creator: { name: string }
}

interface Props {
  expenses: ExpenseWithRelations[]
}

const CATEGORY_LABELS: Record<string, string> = {
  SHIPPING: "Envío", CUSTOMS: "Aduana", STORAGE: "Almacén",
  SUPPLIES: "Insumos", TRANSPORT: "Transporte", OTHER: "Otro",
}

export function ExpensesContent({ expenses }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  function handleFilter() {
    const params = new URLSearchParams()
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    router.push(`/expenses?${params}`)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return
    const result = await deleteExpense(id)
    if (result.success) { toast.success("Gasto eliminado"); router.refresh() }
    else { toast.error(result.error || "Error") }
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
          <p className="text-muted-foreground">Control de gastos operativos</p>
        </div>
        <Button asChild><Link href="/expenses/new"><Plus className="h-4 w-4 mr-2" />Nuevo Gasto</Link></Button>
      </div>

      <div className="flex gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Desde</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hasta</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
        </div>
        <Button variant="secondary" size="sm" onClick={handleFilter}>
          <ArrowUpDown className="h-4 w-4 mr-1" /> Filtrar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Registros</span>
            <span className="text-destructive">Total: {formatCurrency(total)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Vista escritorio (Tabla) */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Descripción</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Categoría</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Monto</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Proveedor</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Registró</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Fecha</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      No hay gastos registrados
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="p-4 font-semibold text-foreground">{e.description}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className="font-semibold">
                          {CATEGORY_LABELS[e.category] || e.category}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-bold text-foreground">{formatCurrency(e.amount)}</td>
                      <td className="p-4 text-foreground font-medium">{e.supplier?.name || "-"}</td>
                      <td className="p-4 text-muted-foreground">{e.creator.name}</td>
                      <td className="p-4 text-muted-foreground text-xs">{formatDate(e.date)}</td>
                      <td className="p-4 text-right">
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Vista móvil (Tarjetas) */}
          <div className="grid gap-4 md:hidden p-4 bg-muted/10">
            {expenses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay gastos registrados</p>
            ) : (
              expenses.map((e) => (
                <div
                  key={e.id}
                  className="border border-muted-foreground/10 rounded-xl p-4 space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-foreground text-sm block">{e.description}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">{formatDate(e.date)}</span>
                    </div>
                    <Badge variant="secondary" className="font-bold text-[10px] px-2 py-0.5">
                      {CATEGORY_LABELS[e.category] || e.category}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-y py-2 border-muted-foreground/5">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Proveedor</span>
                      <span className="font-semibold text-foreground mt-0.5 block">{e.supplier?.name || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Registró</span>
                      <span className="font-semibold text-foreground mt-0.5 block">{e.creator.name}</span>
                    </div>
                    {e.order && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground block text-[10px]">Pedido Relacionado</span>
                        <span className="font-semibold text-foreground mt-0.5 block">
                          #{e.order.orderNumber} - {e.order.model}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase">Monto</span>
                      <span className="font-bold text-sm text-destructive">{formatCurrency(e.amount)}</span>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10 animate-fade-in"
                        onClick={() => handleDelete(e.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
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
