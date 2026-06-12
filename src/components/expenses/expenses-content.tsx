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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Descripción</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Categoría</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Monto</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Proveedor</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Registró</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fecha</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">No hay gastos</td></tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{e.description}</td>
                      <td className="p-4"><Badge variant="secondary">{CATEGORY_LABELS[e.category] || e.category}</Badge></td>
                      <td className="p-4 text-right font-bold">{formatCurrency(e.amount)}</td>
                      <td className="p-4 text-sm">{e.supplier?.name || "-"}</td>
                      <td className="p-4 text-sm text-muted-foreground">{e.creator.name}</td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(e.date)}</td>
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
        </CardContent>
      </Card>
    </div>
  )
}
