"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  CreditCard,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  Package,
  Shield,
  UserCircle,
  Box,
  Truck,
  Receipt,
} from "lucide-react"
import { useTheme } from "@/components/layout/theme-provider"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "@/lib/supabase-session-provider"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/payments", label: "Pagos", icon: CreditCard },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/products", label: "Productos", icon: Box },
  { href: "/suppliers", label: "Proveedores", icon: Truck },
  { href: "/expenses", label: "Gastos", icon: Receipt },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
      <div className="flex flex-col flex-1 min-h-0 border-r bg-card">
        <div className="flex items-center h-16 px-6 border-b">
          <Package className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-lg">Zapas Import</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              href="/users"
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                pathname.startsWith("/users")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Shield className="h-4 w-4 mr-3 flex-shrink-0" />
              Usuarios
            </Link>
          )}
        </nav>
        <div className="border-t px-3 py-2">
          <Link
            href="/profile"
            className={cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
              pathname === "/profile"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <UserCircle className="h-4 w-4 mr-3 flex-shrink-0" />
            Mi Perfil
          </Link>
        </div>
        <div className="p-4 border-t space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 mr-2" />
            ) : (
              <Moon className="h-4 w-4 mr-2" />
            )}
            {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </aside>
  )
}
