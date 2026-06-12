import { prisma } from "./prisma"
import { auth } from "./auth"

export async function logActivity(
  action: string,
  entity: string,
  entityId?: string,
  details?: string
) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action,
      entity,
      entityId,
      details,
    },
  })
}
