import { z } from "zod"

export const orderSchema = z.object({
  clientId: z.string().min(1, "Cliente requerido"),
  quantity: z.number().int().min(1, "Cantidad debe ser al menos 1"),
  model: z.string().min(1, "Modelo requerido"),
  brand: z.string().min(1, "Marca requerida"),
  category: z.enum(["RUNNING", "CASUAL", "BASKETBALL", "FOOTBALL", "SKATE", "OTHER"]),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  importCountry: z.string().min(1, "País de importación requerido"),
  supplier: z.string().min(1, "Proveedor requerido"),
  importCost: z.number().positive("Costo de importación debe ser positivo"),
  salePrice: z.number().positive("Precio de venta debe ser positivo"),
  advancePayment: z.number().min(0, "Pago adelantado no puede ser negativo").default(0),
  extraPayment: z.number().min(0, "Pago extra no puede ser negativo").default(0),
  status: z.enum([
    "PENDING", "PURCHASED", "IN_TRANSIT", "CUSTOMS",
    "ARRIVED", "READY_FOR_DELIVERY", "DELIVERED", "CANCELLED",
  ]).default("PENDING"),
  estimatedArrival: z.string().optional().nullable(),
  deliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type OrderFormData = z.infer<typeof orderSchema>

export const orderStatusSchema = z.object({
  status: z.enum([
    "PENDING", "PURCHASED", "IN_TRANSIT", "CUSTOMS",
    "ARRIVED", "READY_FOR_DELIVERY", "DELIVERED", "CANCELLED",
  ]),
  note: z.string().optional().nullable(),
})

export type OrderStatusData = z.infer<typeof orderStatusSchema>
