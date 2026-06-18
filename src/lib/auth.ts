import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { prisma } from "./prisma"
import { cache } from "react"

export interface Session {
  user: {
    id: string
    name: string
    email: string
    role: string
    image: string | null
  }
}

export const auth = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) return null

  try {
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, image: true, active: true },
    })

    if (!dbUser) {
      dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, name: true, email: true, role: true, image: true, active: true },
      })

      if (dbUser) {
        await prisma.user.update({
          where: { email: user.email },
          data: { id: user.id },
        })
      }
    }

    if (!dbUser || !dbUser.active) return null

    return {
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        image: dbUser.image ?? null,
      },
    }
  } catch {
    return {
      user: {
        id: user.id,
        name: user.user_metadata?.name ?? user.email,
        email: user.email,
        role: "EMPLOYEE",
        image: user.user_metadata?.avatar_url ?? null,
      },
    }
  }
})

