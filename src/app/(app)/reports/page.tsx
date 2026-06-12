import { prisma } from "@/lib/prisma"
import { getDashboardStats } from "@/actions/order-actions"
import { getExpenseStats } from "@/actions/expense-actions"
import { ReportsContent } from "@/components/reports/reports-content"

export const dynamic = "force-dynamic"

function serializeDecimal(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  if (typeof value === "object" && "toNumber" in value) return value.toNumber()
  return Number(value)
}

export default async function ReportsPage() {
  const [stats, expenseStats] = await Promise.all([
    getDashboardStats(),
    getExpenseStats(),
  ])

  const allOrders = await prisma.order.findMany({
    select: { salePrice: true, importCost: true },
  })

  const totalSales = allOrders.reduce((s, o) => s + serializeDecimal(o.salePrice), 0)
  const totalProfit = allOrders.reduce((s, o) => s + serializeDecimal(o.salePrice) - serializeDecimal(o.importCost), 0)
  const totalExpenses = expenseStats.total
  const netProfit = totalProfit - totalExpenses
  const margin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0"

  return (
    <ReportsContent
      summary={{
        totalSales,
        totalProfit,
        totalExpenses,
        netProfit,
        margin: Number(margin),
        monthSales: stats.monthSales,
        monthProfit: stats.monthProfit,
        monthExpenses: expenseStats.monthTotal,
      }}
    />
  )
}
