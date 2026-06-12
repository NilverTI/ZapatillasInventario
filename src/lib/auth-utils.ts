import { auth } from "@/lib/auth"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")
  return session
}

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")
  if (session.user.role !== "ADMIN") throw new Error("Se requiere rol ADMIN")
  return session
}

export function canManageUsers(role: string | undefined) {
  return role === "ADMIN"
}

export function canDelete(role: string | undefined) {
  return role === "ADMIN"
}
