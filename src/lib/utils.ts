import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null) return "S/ 0.00"
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(num)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PURCHASED: "bg-blue-100 text-blue-800 border-blue-200",
    IN_TRANSIT: "bg-indigo-100 text-indigo-800 border-indigo-200",
    CUSTOMS: "bg-purple-100 text-purple-800 border-purple-200",
    ARRIVED: "bg-cyan-100 text-cyan-800 border-cyan-200",
    READY_FOR_DELIVERY: "bg-green-100 text-green-800 border-green-200",
    DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
  }
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-200"
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    PURCHASED: "Comprado",
    IN_TRANSIT: "En tránsito",
    CUSTOMS: "Aduanas",
    ARRIVED: "Llegó al país",
    READY_FOR_DELIVERY: "Listo para entregar",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  }
  return labels[status] || status
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    RUNNING: "Running",
    CASUAL: "Casual",
    BASKETBALL: "Basketball",
    FOOTBALL: "Fútbol",
    SKATE: "Skate",
    OTHER: "Otro",
  }
  return labels[category] || category
}

export function generateTrackingId(orderNumber: number): string {
  return `ZAP-${String(orderNumber).padStart(5, "0")}`
}
