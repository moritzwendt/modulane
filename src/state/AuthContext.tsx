import type { Session, User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { supabase } from "../lib/supabase"

interface RegistrationInput {
  name: string
  email: string
  password: string
}

interface AuthResult {
  error: string | null
  confirmationRequired?: boolean
}

interface AuthContextValue {
  isAuthenticated: boolean
  loading: boolean
  session: Session | null
  user: User | null
  login(email: string, password: string): Promise<AuthResult>
  register(input: RegistrationInput): Promise<AuthResult>
  logout(): Promise<void>
  requestPasswordReset(email: string): Promise<AuthResult>
  updatePassword(password: string): Promise<AuthResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const messageForError = (message: string) => {
  const normalized = message.toLocaleLowerCase()
  if (normalized.includes("invalid login credentials")) return "E Mail Adresse oder Passwort ist nicht korrekt."
  if (normalized.includes("email not confirmed")) return "Bitte bestätige zuerst deine E Mail Adresse."
  if (normalized.includes("user already registered")) return "Für diese E Mail Adresse besteht bereits ein Konto."
  if (normalized.includes("password should be")) return "Das Passwort muss mindestens acht Zeichen haben."
  if (normalized.includes("rate limit")) return "Zu viele Versuche. Bitte warte kurz und versuche es erneut."
  return "Die Anfrage konnte nicht abgeschlossen werden. Bitte versuche es erneut."
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: Boolean(session),
    loading,
    session,
    user: session?.user ?? null,
    async login(email, password) {
      if (password.length < 8) return { error: "Das Passwort muss mindestens acht Zeichen haben." }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLocaleLowerCase(), password })
      return { error: error ? messageForError(error.message) : null }
    },
    async register(input) {
      if (input.name.trim().length < 2) return { error: "Bitte gib deinen vollständigen Namen ein." }
      if (!input.email.includes("@")) return { error: "Bitte gib eine gültige E Mail Adresse ein." }
      if (input.password.length < 8) return { error: "Das Passwort muss mindestens acht Zeichen haben." }
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim().toLocaleLowerCase(),
        password: input.password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: { full_name: input.name.trim() },
        },
      })
      return { error: error ? messageForError(error.message) : null, confirmationRequired: !data.session }
    },
    async logout() {
      await supabase.auth.signOut()
    },
    async requestPasswordReset(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLocaleLowerCase(), { redirectTo: `${window.location.origin}/update-password` })
      return { error: error ? messageForError(error.message) : null }
    },
    async updatePassword(password) {
      if (password.length < 8) return { error: "Das Passwort muss mindestens acht Zeichen haben." }
      const { error } = await supabase.auth.updateUser({ password })
      return { error: error ? messageForError(error.message) : null }
    },
  }), [loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth muss innerhalb des AuthProvider verwendet werden")
  return context
}
