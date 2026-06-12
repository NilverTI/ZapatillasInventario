import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const orderId = formData.get("orderId") as string | null
    const attachmentType = (formData.get("type") as string) || "OTHER"

    if (!file || !orderId) {
      return NextResponse.json({ error: "Faltan archivo u orderId" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split(".").pop() || "bin"
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const uploadDir = join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)

    const attachment = await prisma.attachment.create({
      data: {
        orderId,
        type: attachmentType as any,
        filename: file.name,
        url: `/uploads/${filename}`,
      },
    })

    return NextResponse.json({ success: true, attachment })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}
