"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { orderSchema, type OrderFormData } from "@/schemas/order-schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { createOrder, updateOrder } from "@/actions/order-actions"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Save, Calculator } from "lucide-react"
import Link from "next/link"

interface Props {
  order?: any
  clients?: { id: string; fullName: string }[]
}

const CATEGORIES = [
  { value: "RUNNING", label: "Running" },
  { value: "CASUAL", label: "Casual" },
  { value: "BASKETBALL", label: "Basketball" },
  { value: "FOOTBALL", label: "Fútbol" },
  { value: "SKATE", label: "Skate" },
  { value: "OTHER", label: "Otro" },
]

const STATUSES = [
  { value: "PENDING", label: "Pendiente" },
  { value: "PURCHASED", label: "Comprado" },
  { value: "IN_TRANSIT", label: "En tránsito" },
  { value: "CUSTOMS", label: "Aduanas" },
  { value: "ARRIVED", label: "Llegó al país" },
  { value: "READY_FOR_DELIVERY", label: "Listo para entregar" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
]

export function OrderForm({ order, clients: initialClients = [] }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditing = !!order
  const [clients] = useState(initialClients)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [remaining, setRemaining] = useState(0)
  const [profit, setProfit] = useState(0)

  const defaultClientId = searchParams.get("clientId") || order?.clientId || ""

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema) as any,
    defaultValues: order || {
      clientId: defaultClientId,
      quantity: 1,
      model: "",
      brand: "",
      category: "OTHER",
      color: "",
      size: "",
      importCountry: "",
      supplier: "",
      importCost: 0,
      salePrice: 0,
      advancePayment: 0,
      extraPayment: 0,
      status: "PENDING",
      estimatedArrival: "",
      deliveryDate: "",
      notes: "",
    },
  })

  const salePrice = watch("salePrice")
  const advancePayment = watch("advancePayment")
  const extraPayment = watch("extraPayment")
  const importCost = watch("importCost")

  useEffect(() => {
    const remainingVal = Number(salePrice || 0) - Number(advancePayment || 0) - Number(extraPayment || 0)
    setRemaining(Math.max(0, remainingVal))
    setProfit(Number(salePrice || 0) - Number(importCost || 0))
  }, [salePrice, advancePayment, extraPayment, importCost])

  async function onSubmit(data: OrderFormData) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value))
      }
    })
    const salePrice = data.salePrice
    const importCost = data.importCost

    const result = isEditing
      ? await updateOrder(order!.id, formData)
      : await createOrder(formData)

    if (result.success) {
      toast.success(isEditing ? "Pedido actualizado" : "Pedido creado")
      router.push("/orders")
      router.refresh()
    } else {
      toast.error(result.error || "Error al guardar")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? `Editar Pedido #${order.orderNumber}` : "Nuevo Pedido"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Actualiza los datos del pedido" : "Registra un nuevo pedido"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Información del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="clientId">Cliente *</Label>
                  <select
                    id="clientId"
                    {...register("clientId")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    onChange={(e) => {
                      const client = clients.find((c) => c.id === e.target.value)
                      setSelectedClient(client)
                    }}
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                  {errors.clientId && (
                    <p className="text-sm text-destructive">{errors.clientId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input id="model" {...register("model")} />
                  {errors.model && (
                    <p className="text-sm text-destructive">{errors.model.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca *</Label>
                  <Input id="brand" {...register("brand")} />
                  {errors.brand && (
                    <p className="text-sm text-destructive">{errors.brand.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    id="category"
                    options={CATEGORIES}
                    {...register("category")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input id="quantity" type="number" min={1} {...register("quantity", { valueAsNumber: true })} />
                  {errors.quantity && (
                    <p className="text-sm text-destructive">{errors.quantity.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" {...register("color")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Talla</Label>
                  <Input id="size" {...register("size")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="importCountry">País de Importación *</Label>
                  <Input id="importCountry" {...register("importCountry")} />
                  {errors.importCountry && (
                    <p className="text-sm text-destructive">{errors.importCountry.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Proveedor *</Label>
                  <Input id="supplier" {...register("supplier")} />
                  {errors.supplier && (
                    <p className="text-sm text-destructive">{errors.supplier.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    id="status"
                    options={STATUSES}
                    {...register("status")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedArrival">Fecha estimada de llegada</Label>
                  <Input id="estimatedArrival" type="date" {...register("estimatedArrival")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Fecha de entrega</Label>
                  <Input id="deliveryDate" type="date" {...register("deliveryDate")} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Notas internas</Label>
                  <Input id="notes" {...register("notes")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Finanzas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="importCost">Costo de Importación *</Label>
                  <Input
                    id="importCost"
                    type="number"
                    step="0.01"
                    {...register("importCost", { valueAsNumber: true })}
                  />
                  {errors.importCost && (
                    <p className="text-sm text-destructive">{errors.importCost.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Precio Vendido *</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    {...register("salePrice", { valueAsNumber: true })}
                  />
                  {errors.salePrice && (
                    <p className="text-sm text-destructive">{errors.salePrice.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advancePayment">Pago Adelantado</Label>
                  <Input
                    id="advancePayment"
                    type="number"
                    step="0.01"
                    {...register("advancePayment", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extraPayment">Pago Extra</Label>
                  <Input
                    id="extraPayment"
                    type="number"
                    step="0.01"
                    {...register("extraPayment", { valueAsNumber: true })}
                  />
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pago Restante</span>
                    <span className={remaining > 0 ? "text-destructive font-bold" : "text-green-600 font-bold"}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ganancia Estimada</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(profit)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" asChild>
            <Link href="/orders">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Pedido" : "Crear Pedido"}
          </Button>
        </div>
      </form>
    </div>
  )
}
