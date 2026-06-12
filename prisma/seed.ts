import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@zapasimport.com" },
    update: {},
    create: {
      name: "Admin Principal",
      email: "admin@zapasimport.com",
      password: "",
      role: "ADMIN",
    },
  })

  const employee = await prisma.user.upsert({
    where: { email: "empleado@zapasimport.com" },
    update: {},
    create: {
      name: "Empleado Demo",
      email: "empleado@zapasimport.com",
      password: "",
      role: "EMPLOYEE",
    },
  })

  const client = await prisma.client.upsert({
    where: { id: "demo-client" },
    update: {},
    create: {
      id: "demo-client",
      fullName: "Carlos Mendoza",
      dni: "12345678",
      phone: "999888777",
      whatsapp: "999888777",
      address: "Av. Principal 123",
      city: "Lima",
      country: "Perú",
      email: "carlos@email.com",
      notes: "Cliente frecuente",
    },
  })

  const order = await prisma.order.create({
    data: {
      clientId: client.id,
      clientName: client.fullName,
      clientPhone: client.phone,
      quantity: 2,
      model: "Air Max 270",
      brand: "Nike",
      category: "CASUAL",
      color: "Blanco/Negro",
      size: "42",
      importCountry: "Estados Unidos",
      supplier: "StockX",
      importCost: 250,
      salePrice: 450,
      advancePayment: 100,
      extraPayment: 0,
      status: "IN_TRANSIT",
      estimatedArrival: new Date("2026-07-01"),
      createdBy: admin.id,
    },
  })

  await prisma.orderHistory.create({
    data: {
      orderId: order.id,
      status: "PENDING",
      userId: admin.id,
      note: "Pedido creado",
    },
  })

  await prisma.orderHistory.create({
    data: {
      orderId: order.id,
      status: "PURCHASED",
      userId: admin.id,
      note: "Producto comprado",
    },
  })

  await prisma.orderHistory.create({
    data: {
      orderId: order.id,
      status: "IN_TRANSIT",
      userId: admin.id,
      note: "Enviado desde USA",
    },
  })

  await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: 100,
      type: "ADVANCE",
      method: "YAPE",
      reference: "YAPE-123456",
      userId: admin.id,
    },
  })

  console.log("Seed completado")
  console.log("Crea los usuarios en Supabase Auth desde /register o Supabase Dashboard")
  console.log("Emails: admin@zapasimport.com / empleado@zapasimport.com")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
