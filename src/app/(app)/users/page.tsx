import { getUsers } from "@/actions/user-actions"
import { UsersContent } from "@/components/users/users-content"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const users = await getUsers()
  return <UsersContent users={users as any} />
}
