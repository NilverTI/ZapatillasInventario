import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 })
  }

  const type = request.nextUrl.searchParams.get("type") || "orders-excel"
  const dateFrom = request.nextUrl.searchParams.get("dateFrom")
  const dateTo = request.nextUrl.searchParams.get("dateTo")

  function buildDateFilter() {
    const filter: any = {}
    if (dateFrom || dateTo) {
      filter.orderDate = {}
      if (dateFrom) filter.orderDate.gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        filter.orderDate.lte = end
      }
    }
    return filter
  }

  if (type === "expenses-excel") {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: {
        supplier: { select: { name: true } },
        order: { select: { orderNumber: true } },
      },
    })

    const data = expenses.map((e) => ({
      Descripción: e.description,
      Monto: Number(e.amount),
      Categoría: e.category,
      Fecha: e.date.toISOString().split("T")[0],
      Proveedor: e.supplier?.name || "",
      "N° Pedido": e.order?.orderNumber || "",
      Notas: e.notes || "",
    }))

    const xlsx = await import("xlsx")
    const workbook = xlsx.utils.book_new()
    const worksheet = xlsx.utils.json_to_sheet(data)
    xlsx.utils.book_append_sheet(workbook, worksheet, "Gastos")
    const excelBuffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new Response(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=reporte-gastos.xlsx",
      },
    })
  }

  const orders = await prisma.order.findMany({
    where: buildDateFilter(),
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { fullName: true } },
      payments: true,
    },
  })

  const data = orders.map((o) => ({
    "N° Pedido": o.orderNumber,
    Cliente: o.clientName,
    Celular: o.clientPhone,
    Modelo: o.model,
    Marca: o.brand,
    Categoría: o.category,
    Color: o.color || "",
    Talla: o.size || "",
    "País Importación": o.importCountry,
    Proveedor: o.supplier,
    "Costo Importación": Number(o.importCost),
    "Precio Venta": Number(o.salePrice),
    "Pago Adelantado": Number(o.advancePayment),
    "Pago Extra": Number(o.extraPayment),
    "Pago Restante": Number(o.salePrice) - Number(o.advancePayment) - Number(o.extraPayment),
    Ganancia: Number(o.salePrice) - Number(o.importCost),
    Estado: o.status,
    "Fecha Pedido": o.orderDate.toISOString().split("T")[0],
  }))

  const fmt = type.includes("csv") ? "csv" : type.includes("pdf") ? "pdf" : "excel"

  if (fmt === "csv") {
    const headers = Object.keys(data[0] || {})
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => {
          const val = String((row as any)[h] ?? "")
          return val.includes(",") ? `"${val}"` : val
        }).join(",")
      ),
    ]
    const csv = csvRows.join("\n")
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=reporte-pedidos.csv",
      },
    })
  }

  if (fmt === "pdf") {
    const { default: jsPDF } = await import("jspdf")
    await import("jspdf-autotable")
    const doc = new jsPDF()
    const headers = Object.keys(data[0] || {})
    const rows = data.map((row) => Object.values(row).map((v) => String(v ?? "")))

    doc.setFontSize(16)
    doc.text("Reporte de Pedidos - Zapas Import", 14, 20)
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleDateString("es-PE")}`, 14, 28)

    ;(doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 35,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=reporte-pedidos.pdf",
      },
    })
  }

  const xlsx = await import("xlsx")
  const workbook = xlsx.utils.book_new()
  const worksheet = xlsx.utils.json_to_sheet(data)
  xlsx.utils.book_append_sheet(workbook, worksheet, "Pedidos")
  const excelBuffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" })

  return new Response(excelBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=reporte-pedidos.xlsx",
    },
  })
}
