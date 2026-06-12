import { getSupplierById } from "@/actions/supplier-actions"
import { notFound } from "next/navigation"
import { SupplierForm } from "@/components/suppliers/supplier-form"

export const dynamic = "force-dynamic"

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supplier = await getSupplierById(id)
  if (!supplier) notFound()
  return <SupplierForm supplier={supplier as any} />
}
