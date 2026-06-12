"use client"

import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"

export async function signOut(options?: { callbackUrl?: string }) {
  const supabase = createClient()
  await supabase.auth.signOut()
  if (options?.callbackUrl) {
    window.location.href = options.callbackUrl
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
  image: string | null
}

interface Session {
  user: User
}

interface SessionContextValue {
  data: Session | null
  status: "loading" | "authenticated" | "unauthenticated"
}

const SessionContext = createContext<SessionContextValue>({
  data: null,
  status: "loading",
})

export function useSession() {
  return useContext(SessionContext)
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function loadSession() {
      const supabase = createClient()
      const { data: { session: supabaseSession } } = await supabase.auth.getSession()

      if (supabaseSession?.user && !cancelled) {
        const userData = await fetchUserData()
        if (userData && !cancelled) {
          setSession({
            user: {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              image: userData.image ?? null,
            },
          })
          setStatus("authenticated")
          return
        }
      }

      if (!cancelled) {
        setSession(null)
        setStatus("unauthenticated")
      }
    }

    loadSession()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        if (supabaseSession?.user && !cancelled) {
          const userData = await fetchUserData()
          if (userData && !cancelled) {
            setSession({
              user: {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              image: userData.image ?? null,
              },
            })
            setStatus("authenticated")
          }
        } else if (!cancelled) {
          setSession(null)
          setStatus("unauthenticated")
        }
        router.refresh()
      },
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <SessionContext.Provider value={{ data: session, status }}>
      {children}
    </SessionContext.Provider>
  )
}

async function fetchUserData() {
  try {
    const response = await fetch("/api/user/me")
    if (response.ok) {
      return await response.json()
    }
  } catch {
    // Ignore fetch errors
  }
  return null
}
