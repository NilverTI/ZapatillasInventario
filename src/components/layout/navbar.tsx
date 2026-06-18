"use client"

import { useTheme } from "@/components/layout/theme-provider"
import { useSession, signOut } from "@/lib/supabase-session-provider"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Menu, Package, LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  CreditCard,
  BarChart3,
  Shield,
  UserCircle,
  Box,
  Truck,
  Receipt,
} from "lucide-react"

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

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <header className="md:hidden sticky top-0 z-40 border-b bg-background">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center h-16 px-6 border-b gap-2">
                  <img src="/img/Icono.webp" alt="Zapas Import Logo" className="h-8 w-8 object-contain rounded-md" />
                  <span className="font-bold text-lg">Zapas Import</span>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
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
                  {session?.user?.role === "ADMIN" && (
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
                </nav>
                <div className="p-4 border-t">
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
            </SheetContent>
          </Sheet>
          <img src="/img/Icono.webp" alt="Zapas Import Logo" className="h-6 w-6 object-contain rounded-md" />
          <span className="font-bold">Zapas Import</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden xs:block">
            {session?.user?.name}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
