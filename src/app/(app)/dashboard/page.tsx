import { DashboardContent } from "@/components/dashboard/dashboard-content"
import {
  getDashboardStats,
  getChartData,
  getDashboardStatsFallback,
  getChartDataFallback,
} from "@/actions/order-actions"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let stats = await getDashboardStatsFallback()
  let chartData = await getChartDataFallback()

  try {
    const results = await Promise.allSettled([
      getDashboardStats(),
      getChartData(),
    ])

    if (results[0].status === "fulfilled") stats = results[0].value
    if (results[1].status === "fulfilled") chartData = results[1].value
  } catch {
    // fallbacks already set
  }

  return <DashboardContent stats={stats} chartData={chartData} />
}
