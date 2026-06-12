import { getUserById } from "@/actions/user-actions"
import { notFound } from "next/navigation"
import { UserForm } from "@/components/users/user-form"

export const dynamic = "force-dynamic"

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUserById(id)
  if (!user) notFound()

  return <UserForm user={user as any} />
}
