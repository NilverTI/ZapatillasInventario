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
import { createClient } from "@/actions/client-actions"
import { deleteAttachment } from "@/actions/attachment-actions"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Save, Calculator, Camera, Trash2, Upload } from "lucide-react"
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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

function parseSize(sizeStr: string | null | undefined) {
  if (!sizeStr) return { value: "", type: "EUR" }
  const match = sizeStr.trim().match(/^([0-9.]+)\s*(EUR|US\s*W|US\s*M|US|UK|CM)$/i)
  if (match) {
    let type = match[2].toUpperCase()
    if (type === "US M") type = "US"
    return { value: match[1], type }
  }
  // Si es solo un número, por defecto asumimos EUR
  if (/^[0-9.]+$/.test(sizeStr.trim())) {
    return { value: sizeStr.trim(), type: "EUR" }
  }
  return { value: sizeStr, type: "EUR" }
}

export function OrderForm({ order, clients: initialClients = [] }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditing = !!order
  const [clients, setClients] = useState(initialClients)
  const [remaining, setRemaining] = useState(0)
  const [profit, setProfit] = useState(0)

  // Estados para la carga de imágenes
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [uploadingImage, setUploadingImage] = useState(false)

  // Estados para talla profesional (ej. 42 EUR, 9.5 US)
  const [sizeValue, setSizeValue] = useState("")
  const [sizeType, setSizeType] = useState("EUR")

  // Estados para Modal de Nuevo Cliente
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [creatingClient, setCreatingClient] = useState(false)

  useEffect(() => {
    if (order?.attachments) {
      const photo = order.attachments.find((att: any) => att.type === "PHOTO")
      if (photo) {
        setPreviewUrl(photo.url)
      }
    }
    if (order?.size) {
      const parsed = parseSize(order.size)
      setSizeValue(parsed.value)
      setSizeType(parsed.type)
    }
  }, [order])

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveImage = async () => {
    if (order) {
      const photo = order.attachments?.find((att: any) => att.type === "PHOTO")
      if (photo) {
        if (!confirm("¿Eliminar esta foto del servidor?")) return
        const res = await deleteAttachment(photo.id)
        if (res.success) {
          toast.success("Foto eliminada de la base de datos")
        } else {
          toast.error(res.error || "Error al eliminar la foto")
          return
        }
      }
    }
    setImageFile(null)
    setPreviewUrl("")
  }

  const handleCreateClient = async () => {
    if (!newClientName.trim() || newClientName.trim().length < 2) {
      toast.error("El nombre completo debe tener al menos 2 caracteres")
      return
    }
    if (!newClientPhone.trim() || newClientPhone.trim().length < 6) {
      toast.error("El teléfono debe tener al menos 6 caracteres")
      return
    }

    setCreatingClient(true)
    try {
      const formData = new FormData()
      formData.append("fullName", newClientName.trim())
      formData.append("phone", newClientPhone.trim())
      if (newClientEmail.trim()) {
        formData.append("email", newClientEmail.trim())
      }

      const result = await createClient(formData)
      if (result.success && result.client) {
        const newClient = { id: result.client.id, fullName: result.client.fullName }
        setClients((prev) => [newClient, ...prev])
        
        // Seleccionar el cliente recién creado
        setValue("clientId", result.client.id)
        
        toast.success(`Cliente ${result.client.fullName} creado`)
        
        // Resetear inputs del modal y cerrar
        setNewClientName("")
        setNewClientPhone("")
        setNewClientEmail("")
        setShowNewClientModal(false)
      } else {
        toast.error(result.error || "Error al crear el cliente")
      }
    } catch {
      toast.error("Ocurrió un error inesperado al registrar el cliente")
    } finally {
      setCreatingClient(false)
    }
  }

  async function onSubmit(data: OrderFormData) {
    const finalSize = sizeValue.trim() ? `${sizeValue.trim()} ${sizeType}` : ""
    data.size = finalSize

    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value))
      }
    })

    const result = isEditing
      ? await updateOrder(order!.id, formData)
      : await createOrder(formData)

    if (result.success) {
      // Subir la imagen si se seleccionó una nueva
      if (imageFile) {
        setUploadingImage(true)
        try {
          const uploadFormData = new FormData()
          uploadFormData.append("file", imageFile)
          uploadFormData.append("orderId", result.order.id)
          uploadFormData.append("type", "PHOTO")
          
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData
          })
          if (!uploadRes.ok) {
            toast.error("Error al subir la imagen")
          }
        } catch {
          toast.error("Error al subir la imagen")
        } finally {
          setUploadingImage(false)
        }
      }

      toast.success(isEditing ? "Pedido actualizado" : "Pedido creado")
      router.push("/orders")
      router.refresh()
    } else {
      toast.error(result.error || "Error al guardar")
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4">
      {/* Cabecera */}
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
          <p className="text-muted-foreground text-sm">
            {isEditing ? "Actualiza los datos del pedido" : "Registra un nuevo pedido"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Columna Principal - Formulario */}
          <div className="md:col-span-2 space-y-6">
            {/* Tarjeta 1: Producto y Cliente */}
            <Card className="border-muted-foreground/10 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Detalles del Producto y Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="clientId">Cliente *</Label>
                    <button
                      type="button"
                      onClick={() => setShowNewClientModal(true)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      + Nuevo Cliente
                    </button>
                  </div>
                  <select
                    id="clientId"
                    {...register("clientId")}
                    className="flex h-9 w-full rounded-md border border-input bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">Seleccionar cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                  {errors.clientId && (
                    <p className="text-xs text-destructive">{errors.clientId.message}</p>
                  )}
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca *</Label>
                    <Input id="brand" placeholder="Ej. Nike, Adidas..." {...register("brand")} />
                    {errors.brand && (
                      <p className="text-xs text-destructive">{errors.brand.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo *</Label>
                    <Input id="model" placeholder="Ej. Air Max, Forum..." {...register("model")} />
                    {errors.model && (
                      <p className="text-xs text-destructive">{errors.model.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      id="category"
                      options={CATEGORIES}
                      {...register("category")}
                    />
                  </div>
                  
                  {/* Selector Tallas */}
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="sizeValue">Talla *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="sizeValue"
                        placeholder="Ej. 42 o 9.5"
                        value={sizeValue}
                        onChange={(e) => setSizeValue(e.target.value)}
                        className="flex-1"
                        required
                      />
                      <select
                        value={sizeType}
                        onChange={(e) => setSizeType(e.target.value)}
                        className="w-24 h-9 rounded-md border border-input bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="EUR" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">EUR</option>
                        <option value="US" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">US (M)</option>
                        <option value="US W" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">US (W)</option>
                        <option value="UK" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">UK</option>
                        <option value="CM" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">CM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input id="quantity" type="number" min={1} {...register("quantity", { valueAsNumber: true })} />
                    {errors.quantity && (
                      <p className="text-xs text-destructive">{errors.quantity.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" placeholder="Ej. Negro/Blanco" {...register("color")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tarjeta 2: Logística e Importación */}
            <Card className="border-muted-foreground/10 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Información de Logística y Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Proveedor *</Label>
                    <Input id="supplier" placeholder="Ej. StockX, Agente China..." {...register("supplier")} />
                    {errors.supplier && (
                      <p className="text-xs text-destructive">{errors.supplier.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="importCountry">País de Importación *</Label>
                    <Input id="importCountry" placeholder="Ej. USA, China" {...register("importCountry")} />
                    {errors.importCountry && (
                      <p className="text-xs text-destructive">{errors.importCountry.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="status">Estado del Pedido</Label>
                    <Select
                      id="status"
                      options={STATUSES}
                      {...register("status")}
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="estimatedArrival">Llegada Estimada</Label>
                    <Input id="estimatedArrival" type="date" {...register("estimatedArrival")} />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="deliveryDate">Fecha de Entrega Real</Label>
                    <Input id="deliveryDate" type="date" {...register("deliveryDate")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas Internas</Label>
                  <Input id="notes" placeholder="Notas sobre el envío, empaque o cliente..." {...register("notes")} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha - Finanzas e Imagen */}
          <div className="space-y-6">
            {/* Tarjeta 3: Finanzas */}
            <Card className="border-muted-foreground/10 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-4.5 w-4.5 text-primary" />
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
                    placeholder="0.00"
                    {...register("importCost", { valueAsNumber: true })}
                  />
                  {errors.importCost && (
                    <p className="text-xs text-destructive">{errors.importCost.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Precio de Venta *</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("salePrice", { valueAsNumber: true })}
                  />
                  {errors.salePrice && (
                    <p className="text-xs text-destructive">{errors.salePrice.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advancePayment">Pago Adelantado</Label>
                  <Input
                    id="advancePayment"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("advancePayment", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extraPayment">Pago Extra</Label>
                  <Input
                    id="extraPayment"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("extraPayment", { valueAsNumber: true })}
                  />
                </div>

                <div className="pt-4 border-t border-muted-foreground/10 space-y-2">
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

            {/* Tarjeta 4: Foto de las Zapatillas */}
            <Card className="border-muted-foreground/10 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-4.5 w-4.5 text-primary" />
                  Imagen de Zapatillas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewUrl ? (
                  <div className="relative group rounded-lg overflow-hidden border border-muted-foreground/10 aspect-video max-h-48 bg-muted flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Vista previa de zapatillas"
                      className="max-h-full object-contain w-full"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow hover:bg-destructive/90 transition-colors"
                      title="Eliminar foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors rounded-lg p-6 cursor-pointer aspect-video bg-muted/10">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs font-semibold text-foreground">Subir imagen</span>
                    <span className="text-[10px] text-muted-foreground mt-1">Soporta JPG, PNG, WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botones de acción inferior */}
        <div className="flex justify-end gap-3 mt-6 border-t border-muted-foreground/10 pt-4">
          <Button variant="outline" type="button" asChild>
            <Link href="/orders">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || uploadingImage}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting || uploadingImage
              ? "Guardando..."
              : isEditing
              ? "Actualizar Pedido"
              : "Crear Pedido"}
          </Button>
        </div>
      </form>

      {/* Modal de Registro Rápido de Cliente */}
      <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Ingresa los datos para registrar un nuevo cliente en el sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newClientName">Nombre Completo *</Label>
            <Input
              id="newClientName"
              placeholder="Ej. Juan Pérez"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newClientPhone">Teléfono *</Label>
            <Input
              id="newClientPhone"
              placeholder="Ej. 987654321"
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newClientEmail">Email (Opcional)</Label>
            <Input
              id="newClientEmail"
              type="email"
              placeholder="ejemplo@correo.com"
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowNewClientModal(false)
              setNewClientName("")
              setNewClientPhone("")
              setNewClientEmail("")
            }}
            disabled={creatingClient}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCreateClient}
            disabled={creatingClient}
          >
            {creatingClient ? "Creando..." : "Guardar Cliente"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
