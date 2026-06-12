import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-xl font-semibold">Página no encontrada</h2>
        <p className="text-muted-foreground">La página que buscas no existe o ha sido movida.</p>
        <Button asChild>
          <Link href="/dashboard">Volver al Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
