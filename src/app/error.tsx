"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-destructive">Error</h1>
        <h2 className="text-lg font-semibold">Algo salió mal</h2>
        <p className="text-muted-foreground max-w-md">
          {error.message || "Ocurrió un error inesperado. Intenta de nuevo."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
