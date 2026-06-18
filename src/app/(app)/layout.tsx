import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen">
      <Sidebar />
      <Navbar />
      <main className="md:pl-64 pt-16 md:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  )
}
