"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { getStatusLabel } from "@/lib/utils"
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  PackageCheck,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import Link from "next/link"

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
]

const STATUS_COLORS: Record<string, string> = {
  PENDING: "hsl(var(--chart-1))",
  PURCHASED: "hsl(var(--chart-2))",
  IN_TRANSIT: "hsl(var(--chart-3))",
  CUSTOMS: "hsl(var(--chart-4))",
  ARRIVED: "hsl(var(--chart-5))",
  READY_FOR_DELIVERY: "hsl(var(--chart-2))",
  DELIVERED: "hsl(var(--chart-1))",
  CANCELLED: "hsl(var(--destructive))",
}

interface DashboardContentProps {
  stats: {
    totalOrders: number
    pendingOrders: number
    deliveredOrders: number
    monthSales: number
    monthProfit: number
    totalClients: number
    alerts: {
      delayedOrders: { id: string; orderNumber: number; clientName: string; model: string }[]
      readyOrders: { id: string; orderNumber: number; clientName: string; model: string }[]
    }
  }
  chartData: {
    monthlySales: { name: string; total: number }[]
    monthlyProfit: { name: string; total: number }[]
    brandSales: { name: string; count: number }[]
    orderStatus: { name: string; count: number }[]
  }
}

export function DashboardContent({ stats, chartData }: DashboardContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general del sistema</p>
        </div>
      </div>

      {stats.alerts.delayedOrders.length > 0 || stats.alerts.readyOrders.length > 0 ? (
        <div className="space-y-2">
          {stats.alerts.delayedOrders.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Pedidos con más de 20 días sin entregar</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {stats.alerts.delayedOrders.map((o) => (
                    <Link
                      key={o.id}
                      href={`/orders/${o.id}`}
                      className="text-sm text-destructive/80 hover:text-destructive underline"
                    >
                      #{o.orderNumber} - {o.clientName}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
          {stats.alerts.readyOrders.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <PackageCheck className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">Pedidos listos para entregar</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {stats.alerts.readyOrders.map((o) => (
                    <Link
                      key={o.id}
                      href={`/orders/${o.id}`}
                      className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 underline"
                    >
                      #{o.orderNumber} - {o.clientName}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border-muted-foreground/10 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/10 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingOrders}</div>
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/10 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entregados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.deliveredOrders}</div>
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/10 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthSales)}</div>
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/10 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ganancias del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.monthProfit)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/10 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 border-muted-foreground/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Ventas Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v: any) => `S/${v}`} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-muted-foreground/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Ganancias Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.monthlyProfit}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v: any) => `S/${v}`} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-2))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-muted-foreground/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Pedidos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.orderStatus}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }: any) =>
                      `${getStatusLabel(name)} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {chartData.orderStatus.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [value, getStatusLabel(name as string)]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-muted-foreground/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Marcas Más Vendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.brandSales} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
