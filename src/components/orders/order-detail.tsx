"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/supabase-session-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStatusColor,
  getCategoryLabel,
  generateTrackingId,
} from "@/lib/utils"
import { updateOrderStatus, deleteOrder } from "@/actions/order-actions"
import { registerPayment } from "@/actions/payment-actions"
import { deleteAttachment } from "@/actions/attachment-actions"
import { toast } from "sonner"
import Link from "next/link"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  User,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Truck,
  DollarSign,
  CreditCard,
  Camera,
  FileText,
  History,
  Copy,
  Send,
  Upload,
  Image,
  FileWarning,
} from "lucide-react"

interface FullOrder {
  id: string
  orderNumber: number
  quantity: number
  clientId: string
  clientName: string
  clientPhone: string
  model: string
  brand: string
  category: string
  color: string | null
  size: string | null
  importCountry: string
  supplier: string
  importCost: any
  salePrice: any
  advancePayment: any
  extraPayment: any
  status: string
  orderDate: Date
  estimatedArrival: Date | null
  deliveryDate: Date | null
  notes: string | null
  createdBy: string
  client: {
    id: string
    fullName: string
    phone: string
    whatsapp: string | null
    address: string | null
    city: string | null
    country: string | null
    email: string | null
  }
  payments: {
    id: string
    amount: any
    type: string
    method: string
    reference: string | null
    date: Date
    notes: string | null
    user?: { name: string }
  }[]
  attachments: {
    id: string
    type: string
    filename: string
    url: string
  }[]
  history: {
    id: string
    status: string
    note: string | null
    createdAt: Date
    user: { name: string }
  }[]
}

interface Props {
  order: FullOrder
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "PURCHASED", label: "Comprado" },
  { value: "IN_TRANSIT", label: "En tránsito" },
  { value: "CUSTOMS", label: "Aduanas" },
  { value: "ARRIVED", label: "Llegó al país" },
  { value: "READY_FOR_DELIVERY", label: "Listo para entregar" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
]

export function OrderDetail({ order }: Props) {
  const router = useRouter()
  const [showPayment, setShowPayment] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("YAPE")
  const [paymentType, setPaymentType] = useState("REMAINING")
  const [paymentRef, setPaymentRef] = useState("")
  const [newStatus, setNewStatus] = useState(order.status)
  const [statusNote, setStatusNote] = useState("")
  const [uploading, setUploading] = useState(false)
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const remaining = Number(order.salePrice) - Number(order.advancePayment) - Number(order.extraPayment)
  const profit = Number(order.salePrice) - Number(order.importCost)
  const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("orderId", order.id)
        formData.append("type", file.type.startsWith("image/") ? "PHOTO" : "RECEIPT")
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) throw new Error(await res.text())
      }
      toast.success("Archivos subidos")
      router.refresh()
    } catch {
      toast.error("Error al subir archivos")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    if (!confirm("¿Eliminar este archivo?")) return
    const result = await deleteAttachment(attachmentId)
    if (result.success) {
      toast.success("Archivo eliminado")
      router.refresh()
    } else {
      toast.error(result.error || "Error al eliminar")
    }
  }

  async function handleStatusUpdate() {
    const formData = new FormData()
    formData.append("status", newStatus)
    formData.append("note", statusNote)
    const result = await updateOrderStatus(order.id, formData)
    if (result.success) {
      toast.success("Estado actualizado")
      setShowStatus(false)
      router.refresh()
    } else {
      toast.error(result.error || "Error al actualizar")
    }
  }

  async function handlePayment() {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Ingrese un monto válido")
      return
    }
    const formData = new FormData()
    formData.append("orderId", order.id)
    formData.append("amount", paymentAmount)
    formData.append("type", paymentType)
    formData.append("method", paymentMethod)
    formData.append("reference", paymentRef)
    const result = await registerPayment(formData)
    if (result.success) {
      toast.success("Pago registrado")
      setShowPayment(false)
      setPaymentAmount("")
      router.refresh()
    } else {
      toast.error(result.error || "Error al registrar pago")
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Estás seguro de eliminar el pedido #${order.orderNumber}?`)) return
    const result = await deleteOrder(order.id)
    if (result.success) {
      toast.success("Pedido eliminado")
      router.push("/orders")
    } else {
      toast.error(result.error || "Error al eliminar")
    }
  }

  function copyTrackingLink() {
    const url = `${window.location.origin}/tracking/${order.id}`
    navigator.clipboard.writeText(url)
    toast.success("Enlace de seguimiento copiado")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Pedido #{order.orderNumber}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className="text-muted-foreground">
              Creado el {formatDate(order.orderDate)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyTrackingLink} size="sm">
            <Send className="h-4 w-4 mr-2" />
            Enlace Seguimiento
          </Button>
          <Button variant="outline" onClick={() => setShowStatus(true)} size="sm">
            <Truck className="h-4 w-4 mr-2" />
            Actualizar Estado
          </Button>
          <Button variant="outline" onClick={() => setShowPayment(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
          {isAdmin && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/clients/${order.client.id}`} className="font-medium hover:text-primary block">
              {order.clientName}
            </Link>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {order.clientPhone}
            </div>
            {order.client.whatsapp && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-green-500" />
                {order.client.whatsapp}
              </div>
            )}
            {order.client.email && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">✉</span>
                {order.client.email}
              </div>
            )}
            {(order.client.address || order.client.city) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                {[order.client.address, order.client.city, order.client.country]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-4 w-4" />
              Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modelo</span>
              <span className="font-medium">{order.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Marca</span>
              <span>{order.brand}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoría</span>
              <span>{getCategoryLabel(order.category)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Color</span>
              <span>{order.color || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Talla</span>
              <span>{order.size || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cantidad</span>
              <span>{order.quantity}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Importación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">País</span>
              <span>{order.importCountry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proveedor</span>
              <span>{order.supplier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Costo</span>
              <span>{formatCurrency(order.importCost)}</span>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Llegada estimada</span>
                <span>{order.estimatedArrival ? formatDate(order.estimatedArrival) : "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Finanzas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Precio Vendido</span>
                <span className="font-bold">{formatCurrency(order.salePrice)}</span>
              </div>
              <div className="flex justify-between py-2 border-t">
                <span className="text-muted-foreground">Pago Adelantado</span>
                <span className="text-blue-600">{formatCurrency(order.advancePayment)}</span>
              </div>
              <div className="flex justify-between py-2 border-t">
                <span className="text-muted-foreground">Pago Extra</span>
                <span className="text-blue-600">{formatCurrency(order.extraPayment)}</span>
              </div>
              <div className="flex justify-between py-2 border-t font-medium">
                <span>Pago Restante</span>
                <span className={remaining > 0 ? "text-destructive" : "text-green-600"}>
                  {formatCurrency(remaining)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t">
                <span className="text-muted-foreground">Costo Importación</span>
                <span>{formatCurrency(order.importCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-t font-bold text-lg">
                <span>Ganancia</span>
                <span className="text-emerald-600">{formatCurrency(profit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pagos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No hay pagos registrados</p>
            ) : (
              <div className="space-y-3">
                {order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <div className="font-medium">{formatCurrency(payment.amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {payment.type === "ADVANCE"
                          ? "Adelantado"
                          : payment.type === "EXTRA"
                            ? "Extra"
                            : payment.type === "REMAINING"
                              ? "Restante"
                              : "Completo"}{" "}
                        · {payment.method}
                        {payment.reference && ` · Ref: ${payment.reference}`}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(payment.date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Adjuntos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="relative" disabled={uploading} asChild>
                <label className="cursor-pointer flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Subiendo..." : "Subir Archivos"}
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
              </Button>
              <span className="text-xs text-muted-foreground">Fotos, comprobantes, PDF</span>
            </div>
            {order.attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin archivos adjuntos</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {order.attachments.map((att) => (
                  <div key={att.id} className="relative group border rounded-lg p-2">
                    {att.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <a href={att.url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={att.url}
                          alt={att.filename}
                          className="w-full h-24 object-cover rounded"
                        />
                      </a>
                    ) : (
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 text-sm"
                      >
                        <FileWarning className="h-5 w-5 text-muted-foreground" />
                        <span className="truncate">{att.filename}</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial de Cambios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {order.history.map((entry, index) => (
              <div key={entry.id} className="flex gap-4 pb-4 relative">
                {index < order.history.length - 1 && (
                  <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
                )}
                <div className="flex flex-col items-center">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 ${getStatusColor(entry.status).split(" ")[0]} bg-background z-10`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{getStatusLabel(entry.status)}</span>
                    <span className="text-xs text-muted-foreground">
                      por {entry.user.name}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showStatus} onOpenChange={setShowStatus}>
        <DialogHeader>
          <DialogTitle>Actualizar Estado</DialogTitle>
          <DialogDescription>
            Cambia el estado del pedido #{order.orderNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nuevo Estado</Label>
            <Select
              options={STATUS_OPTIONS}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Nota (opcional)</Label>
            <Input
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Motivo del cambio..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowStatus(false)}>
            Cancelar
          </Button>
          <Button onClick={handleStatusUpdate}>Actualizar</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Pedido #{order.orderNumber} - Restante: {formatCurrency(remaining)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Monto</Label>
            <Input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Pago</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <option value="ADVANCE">Adelantado</option>
              <option value="EXTRA">Extra</option>
              <option value="REMAINING">Restante</option>
              <option value="FULL">Completo</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="CASH">Efectivo</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="YAPE">Yape</option>
              <option value="PLIN">Plin</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Referencia</Label>
            <Input
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="N° de operación..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowPayment(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePayment}>Registrar Pago</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
