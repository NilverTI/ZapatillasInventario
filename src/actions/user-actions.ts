"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { requireAdmin, requireAuth } from "@/lib/auth-utils"
import { getAdminClient } from "@/lib/supabase-admin"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const userSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").optional(),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
  active: z.string().optional(),
})

export async function getUsers() {
  await requireAuth()
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  })
}

export async function getUserById(id: string) {
  await requireAuth()
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  })
  return user
}

export async function createUser(formData: FormData) {
  await requireAdmin()

  const raw = Object.fromEntries(formData)
  const validated = userSchema.safeParse({ ...raw, active: raw.active || "true" })

  if (!validated.success) {
    return { error: "Datos inválidos", details: validated.error.flatten() }
  }

  const existing = await prisma.user.findUnique({ where: { email: validated.data.email } })
  if (existing) return { error: "El email ya está registrado" }

  const supabase = getAdminClient()
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: validated.data.email,
    password: validated.data.password || "123456",
    email_confirm: true,
    user_metadata: { name: validated.data.name },
  })

  if (authError || !authData.user) {
    return { error: authError?.message || "Error al crear usuario en Supabase Auth" }
  }

  const user = await prisma.user.create({
    data: {
      id: authData.user.id,
      name: validated.data.name,
      email: validated.data.email,
      password: "",
      role: validated.data.role,
      active: validated.data.active === "false" ? false : true,
    },
  })

  await logActivity("create", "user", user.id, `Usuario ${user.name} creado`)
  revalidatePath("/users")
  return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
}

export async function updateUser(id: string, formData: FormData) {
  await requireAdmin()

  const raw = Object.fromEntries(formData)
  const data: any = {
    name: raw.name as string,
    email: raw.email as string,
    role: raw.role as "ADMIN" | "EMPLOYEE",
    active: raw.active !== "false",
  }

  if (raw.password && typeof raw.password === "string" && raw.password.length > 0) {
    const supabase = getAdminClient()
    const { error: authError } = await supabase.auth.admin.updateUserById(id, {
      password: raw.password,
    })
    if (authError) {
      return { error: authError.message }
    }
  }

  const user = await prisma.user.update({ where: { id }, data })
  await logActivity("update", "user", id, `Usuario ${user.name} actualizado`)
  revalidatePath("/users")
  return { success: true }
}

export async function deleteUser(id: string) {
  await requireAdmin()

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return { error: "Usuario no encontrado" }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN", active: true } })
  if (user.role === "ADMIN" && adminCount <= 1) {
    return { error: "No puedes eliminar el único administrador" }
  }

  const supabase = getAdminClient()
  await supabase.auth.admin.deleteUser(id)

  await prisma.user.update({ where: { id }, data: { active: false } })
  await logActivity("deactivate", "user", id, `Usuario ${user.name} desactivado`)
  revalidatePath("/users")
  return { success: true }
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const session = await requireAuth()
  const supabase = await createClient()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: session.user.email,
    password: oldPassword,
  })

  if (signInError) return { error: "Contraseña actual incorrecta" }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) return { error: updateError.message }
  return { success: true }
}

export async function getCurrentUser() {
  const session = await requireAuth()
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
}
