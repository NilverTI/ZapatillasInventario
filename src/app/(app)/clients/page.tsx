import { getClients } from "@/actions/client-actions"
import { ClientsContent } from "@/components/clients/clients-content"

export const dynamic = "force-dynamic"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const search = typeof sp.search === "string" ? sp.search : undefined
  const clients = await getClients(search)
  return <ClientsContent clients={clients} search={search ?? ""} />
}
