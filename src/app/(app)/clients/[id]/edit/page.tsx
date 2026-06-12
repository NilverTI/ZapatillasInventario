import { getClientById } from "@/actions/client-actions"
import { notFound } from "next/navigation"
import { ClientForm } from "@/components/clients/client-form"

export const dynamic = "force-dynamic"

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await getClientById(id)
  if (!client) notFound()

  return <ClientForm client={client as any} />
}
