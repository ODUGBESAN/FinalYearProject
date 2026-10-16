import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { isSupabaseConfigured, supabase } from "../Data/Supabase"

const AuthContext = createContext(null)

async function loadProfile(authUser) {
  if (!authUser || !supabase) return null
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, student_id, role, department_id, academic_level, department:departments(name)")
    .eq("id", authUser.id)
    .single()
  if (error) throw error
  return { ...data, email: authUser.email, department: data.department?.name ?? "" }
}

function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [setupError, setSetupError] = useState("")

  const refreshProfile = useCallback(async (authUser) => {
    const nextProfile = await loadProfile(authUser)
    setProfile(nextProfile)
    setSetupError("")
    return nextProfile
  }, [])

  useEffect(() => {
    if (!supabase) {
      const timer = setTimeout(() => {
        setLoading(false)
        setSetupError("Add the new Supabase project URL and publishable key to .env.local to enable sign-in.")
      }, 0)
      return () => clearTimeout(timer)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true)
      if (!session?.user) {
        setProfile(null)
        setLoading(false)
        return
      }
      setTimeout(() => {
        loadProfile(session.user)
          .then(setProfile)
          .catch((error) => setSetupError(error.message || "Could not load your MITC profile."))
          .finally(() => setLoading(false))
      }, 0)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error("Supabase is not configured yet. Add the new project URL and publishable key to .env.local.")
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
    try {
      return await refreshProfile(data.user)
    } catch {
      await supabase.auth.signOut()
      throw new Error("Your account is not set up in the MITC portal yet. Ask the administrator to check your profile.")
    }
  }, [refreshProfile])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const value = useMemo(() => ({ profile, loading, setupError, signIn, signOut, refreshProfile }), [profile, loading, setupError, signIn, signOut, refreshProfile])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export { AuthProvider, useAuth }
