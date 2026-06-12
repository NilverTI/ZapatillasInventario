"use server"

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { prisma } from "./prisma"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
})

const registerSchema = z.object({
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
})

export async function loginAction(formData: FormData) {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validated.success) {
    return { error: "Datos inválidos", details: validated.error.flatten() }
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    return { error: "Credenciales inválidas" }
  }

  return { success: true }
}

export async function registerAction(formData: FormData) {
  const validated = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validated.success) {
    return { error: "Datos inválidos", details: validated.error.flatten() }
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: authData, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error || !authData.user) {
    return { error: "Error al registrar usuario" }
  }

  try {
    await prisma.user.create({
      data: {
        id: authData.user.id,
        name: validated.data.name,
        email: validated.data.email,
        password: "",
        role: "EMPLOYEE",
      },
    })
  } catch {
    // DB not available, user exists only in Supabase Auth
  }

  return { success: true }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await supabase.auth.signOut()
}
