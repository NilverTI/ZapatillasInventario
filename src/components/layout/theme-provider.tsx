"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "dark" | "light" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
}

const ThemeCtx = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
})

export const useTheme = () => useContext(ThemeCtx)

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
}: {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light")
  const [mounted, setMounted] = useState(false)

  const applyTheme = useCallback((t: "dark" | "light") => {
    const root = document.documentElement
    if (attribute === "class") {
      root.classList.remove("light", "dark")
      root.classList.add(t)
    } else {
      root.setAttribute("data-theme", t)
    }
    setResolvedTheme(t)
  }, [attribute])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try { localStorage.setItem("theme", t) } catch {}
    if (t === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      applyTheme(prefersDark ? "dark" : "light")
    } else {
      applyTheme(t)
    }
  }, [applyTheme])

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("theme") as Theme | null
    const initial = stored || defaultTheme
    setThemeState(initial)

    if (initial === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      applyTheme(prefersDark ? "dark" : "light")
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? "dark" : "light")
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    } else {
      applyTheme(initial as "dark" | "light")
    }
  }, [applyTheme, defaultTheme])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeCtx.Provider>
  )
}
