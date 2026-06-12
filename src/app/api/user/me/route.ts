import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, image: true },
    })

    if (dbUser) {
      return NextResponse.json(dbUser)
    }
  } catch {
    // DB not available, return Supabase user data
  }

  return NextResponse.json({
    id: user.id,
    name: user.user_metadata?.name ?? user.email,
    email: user.email,
    role: "EMPLOYEE",
    image: user.user_metadata?.avatar_url ?? null,
  })
}
