import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { getDashboardStats, getChartData } from "@/actions/order-actions"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [stats, chartData] = await Promise.all([
    getDashboardStats(),
    getChartData(),
  ])

  return <DashboardContent stats={stats} chartData={chartData} />
}
