import { getSuppliers } from "@/actions/supplier-actions"
import { SuppliersContent } from "@/components/suppliers/suppliers-content"

export const dynamic = "force-dynamic"

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const search = typeof sp.search === "string" ? sp.search : undefined
  const suppliers = await getSuppliers(search)
  return <SuppliersContent suppliers={suppliers as any} search={search ?? ""} />
}
