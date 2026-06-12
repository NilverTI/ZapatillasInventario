import { getExpenses } from "@/actions/expense-actions"
import { ExpensesContent } from "@/components/expenses/expenses-content"

export const dynamic = "force-dynamic"

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const dateFrom = typeof sp.dateFrom === "string" ? sp.dateFrom : undefined
  const dateTo = typeof sp.dateTo === "string" ? sp.dateTo : undefined
  const category = typeof sp.category === "string" ? sp.category : undefined
  const expenses = await getExpenses({ dateFrom, dateTo, category })
  return <ExpensesContent expenses={expenses as any} />
}
