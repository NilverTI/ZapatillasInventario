"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Download, FileSpreadsheet, FileText, FileCode,
  TrendingUp, TrendingDown, DollarSign, Percent,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Summary {
  totalSales: number
  totalProfit: number
  totalExpenses: number
  netProfit: number
  margin: number
  monthSales: number
  monthProfit: number
  monthExpenses: number
}

interface Props {
  summary: Summary
}

export function ReportsContent({ summary }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [exportType, setExportType] = useState("orders")

  async function handleExport(type: string) {
    setLoading(type)
    try {
      const params = new URLSearchParams({ type })
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const response = await fetch(`/api/export?${params}`)
      if (!response.ok) throw new Error("Error al exportar")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const extensions: Record<string, string> = { "orders-excel": "xlsx", "orders-pdf": "pdf", "orders-csv": "csv", "expenses-excel": "xlsx" }
      a.download = `reporte-${type}.${extensions[type] || "xlsx"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Reporte exportado")
    } catch {
      toast.error("Error al exportar")
    } finally {
      setLoading(null)
    }
  }

  const statCards = [
    { title: "Ventas Totales", value: summary.totalSales, icon: TrendingUp, color: "text-blue-600" },
    { title: "Ganancia Total", value: summary.totalProfit, icon: TrendingUp, color: "text-emerald-600" },
    { title: "Gastos Totales", value: summary.totalExpenses, icon: TrendingDown, color: "text-red-600" },
    { title: "Ganancia Neta", value: summary.netProfit, icon: DollarSign, color: summary.netProfit >= 0 ? "text-emerald-600" : "text-red-600" },
    { title: "Margen Neto", value: summary.margin, icon: Percent, color: summary.margin >= 10 ? "text-emerald-600" : "text-amber-600", suffix: "%" },
  ]

  const monthCards = [
    { title: "Ventas del Mes", value: summary.monthSales, color: "text-blue-600" },
    { title: "Ganancia del Mes", value: summary.monthProfit, color: "text-emerald-600" },
    { title: "Gastos del Mes", value: summary.monthExpenses, color: "text-red-600" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">Resumen financiero y exportación de datos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${s.color}`}>
                  {"suffix" in s ? `${s.value}%` : formatCurrency(s.value)}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {monthCards.map((m) => (
          <Card key={m.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${m.color}`}>{formatCurrency(m.value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exportar Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">Fecha Desde</Label>
               <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-full sm:w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fecha Hasta</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-full sm:w-40" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" onClick={() => handleExport("orders-excel")} disabled={loading !== null} className="h-20 flex-col gap-1">
              <FileSpreadsheet className="h-5 w-5 text-green-500" />
              <span className="text-xs">{loading === "orders-excel" ? "Exportando..." : "Pedidos Excel"}</span>
            </Button>
            <Button variant="outline" onClick={() => handleExport("orders-pdf")} disabled={loading !== null} className="h-20 flex-col gap-1">
              <FileText className="h-5 w-5 text-red-500" />
              <span className="text-xs">{loading === "orders-pdf" ? "Exportando..." : "Pedidos PDF"}</span>
            </Button>
            <Button variant="outline" onClick={() => handleExport("orders-csv")} disabled={loading !== null} className="h-20 flex-col gap-1">
              <FileCode className="h-5 w-5 text-blue-500" />
              <span className="text-xs">{loading === "orders-csv" ? "Exportando..." : "Pedidos CSV"}</span>
            </Button>
            <Button variant="outline" onClick={() => handleExport("expenses-excel")} disabled={loading !== null} className="h-20 flex-col gap-1">
              <Download className="h-5 w-5 text-purple-500" />
              <span className="text-xs">{loading === "expenses-excel" ? "Exportando..." : "Gastos Excel"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
