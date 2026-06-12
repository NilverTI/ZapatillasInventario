import { z } from "zod"

export const clientSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  dni: z.string().optional().nullable(),
  phone: z.string().min(6, "Teléfono inválido"),
  whatsapp: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
})

export type ClientFormData = z.infer<typeof clientSchema>
