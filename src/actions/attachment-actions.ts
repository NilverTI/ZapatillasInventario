"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import { unlink } from "fs/promises"
import { join } from "path"

export async function deleteAttachment(attachmentId: string) {
  const session = await auth()
  if (!session?.user) return { error: "No autorizado" }

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  })
  if (!attachment) return { error: "Archivo no encontrado" }

  try {
    const filePath = join(process.cwd(), "public", attachment.url)
    await unlink(filePath)
  } catch {}

  await prisma.attachment.delete({ where: { id: attachmentId } })
  await logActivity("delete", "attachment", attachmentId, `Archivo ${attachment.filename} eliminado`)
  revalidatePath(`/orders/${attachment.orderId}`)
  return { success: true }
}
